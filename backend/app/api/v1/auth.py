from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from app.models.user import User
from app.schemas.auth import (
    OwnerProfileIn,
    OwnerProfileOut,
    TokenOut,
    UserLogin,
    UserOut,
    UserRegister,
)

router = APIRouter(prefix="/auth", tags=["Auth"])

REFRESH_COOKIE = "refresh_token"


def _clean_optional(value: str | None, limit: int) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    if len(text) > limit:
        text = text[:limit].rstrip()
    return text


def _owner_profile_out(user: User) -> OwnerProfileOut:
    return OwnerProfileOut(
        name=user.name,
        phone=user.phone,
        email=user.email,
        address=user.address,
        emergency_contact=user.emergency_contact,
    )


async def _apply_owner_profile(user: User, body: OwnerProfileIn, db: AsyncSession) -> User:
    next_email = str(body.email).strip().lower()
    if not next_email:
        raise HTTPException(status_code=400, detail="Email is required")

    if next_email != str(user.email).strip().lower():
        exists_result = await db.execute(
            select(User).where(User.email == next_email, User.id != user.id)
        )
        if exists_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

    user.email = next_email
    user.name = _clean_optional(body.name, 100)
    user.phone = _clean_optional(body.phone, 50)
    user.address = _clean_optional(body.address, 255)
    user.emergency_contact = _clean_optional(body.emergency_contact, 120)
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/register", response_model=TokenOut, status_code=201)
async def register(body: UserRegister, response: Response, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        password_hash=get_password_hash(body.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=False,   # True in production (HTTPS)
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )

    return TokenOut(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
async def login(body: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )

    return TokenOut(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=dict)
async def refresh_token(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=REFRESH_COOKIE)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.get("/owner-profile", response_model=OwnerProfileOut)
async def get_owner_profile(current_user: User = Depends(get_current_user)):
    return _owner_profile_out(current_user)


@router.post("/owner-profile", response_model=OwnerProfileOut, status_code=201)
async def create_owner_profile(
    body: OwnerProfileIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await _apply_owner_profile(current_user, body, db)
    return _owner_profile_out(user)


@router.put("/owner-profile", response_model=OwnerProfileOut)
async def update_owner_profile(
    body: OwnerProfileIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await _apply_owner_profile(current_user, body, db)
    return _owner_profile_out(user)


@router.delete("/owner-profile", response_model=OwnerProfileOut)
async def delete_owner_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.name = None
    current_user.phone = None
    current_user.address = None
    current_user.emergency_contact = None
    await db.flush()
    await db.refresh(current_user)
    return _owner_profile_out(current_user)
