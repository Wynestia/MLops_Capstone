from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables (for dev/testing - use Alembic for production)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Dev-safe schema patch for existing databases created before dogs.status existed.
        await conn.exec_driver_sql(
            "ALTER TABLE dogs ADD COLUMN IF NOT EXISTS status VARCHAR(20)"
        )
        await conn.exec_driver_sql(
            "ALTER TABLE dogs ALTER COLUMN status SET DEFAULT 'Relaxed'"
        )
        await conn.exec_driver_sql(
            "UPDATE dogs SET status = 'Relaxed' WHERE status IS NULL"
        )
