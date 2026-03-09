from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str | None
    phone: str | None = None
    address: str | None = None
    emergency_contact: str | None = Field(default=None, alias="emergencyContact")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class OwnerProfileIn(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: EmailStr
    address: str | None = None
    emergency_contact: str | None = Field(default=None, alias="emergencyContact")

    model_config = ConfigDict(populate_by_name=True)


class OwnerProfileOut(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str
    address: str | None = None
    emergency_contact: str | None = Field(default=None, alias="emergencyContact")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
