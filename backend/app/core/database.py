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
        # Dev-safe schema patch for owner profile fields on users.
        await conn.exec_driver_sql(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)"
        )
        await conn.exec_driver_sql(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255)"
        )
        await conn.exec_driver_sql(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(120)"
        )
        # Dev-safe schema patch for chat threads.
        await conn.exec_driver_sql(
            """
            CREATE TABLE IF NOT EXISTS chat_threads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
                title VARCHAR(120) NOT NULL DEFAULT 'New chat',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_message_at TIMESTAMPTZ DEFAULT NOW()
            )
            """
        )
        await conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_chat_threads_dog_id ON chat_threads (dog_id)"
        )
        await conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message_at ON chat_threads (dog_id, last_message_at DESC)"
        )
        await conn.exec_driver_sql(
            "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS thread_id UUID"
        )
        await conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages (thread_id)"
        )
        await conn.exec_driver_sql(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'fk_chat_messages_thread_id'
                ) THEN
                    ALTER TABLE chat_messages
                    ADD CONSTRAINT fk_chat_messages_thread_id
                    FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE;
                END IF;
            END $$;
            """
        )
        # Backfill old chat messages (without thread_id) into one legacy thread per dog.
        await conn.exec_driver_sql(
            """
            INSERT INTO chat_threads (id, dog_id, title, created_at, last_message_at)
            SELECT
                gen_random_uuid(),
                cm.dog_id,
                'Legacy chat',
                MIN(cm.created_at),
                MAX(cm.created_at)
            FROM chat_messages cm
            WHERE cm.thread_id IS NULL
              AND NOT EXISTS (
                SELECT 1 FROM chat_threads ct WHERE ct.dog_id = cm.dog_id
              )
            GROUP BY cm.dog_id
            """
        )
        await conn.exec_driver_sql(
            """
            UPDATE chat_messages cm
            SET thread_id = sub.thread_id
            FROM (
                SELECT DISTINCT ON (ct.dog_id)
                    ct.dog_id,
                    ct.id AS thread_id
                FROM chat_threads ct
                ORDER BY ct.dog_id, ct.created_at ASC, ct.id ASC
            ) sub
            WHERE cm.thread_id IS NULL
              AND cm.dog_id = sub.dog_id
            """
        )
        # Improve legacy/generic thread titles by using earliest meaningful user message in each thread.
        await conn.exec_driver_sql(
            """
            WITH normalized_messages AS (
                SELECT
                    cm.thread_id,
                    cm.created_at,
                    cm.id,
                    BTRIM(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(COALESCE(cm.content, ''), E'[\\n\\r\\t]+', ' ', 'g'),
                            E'\\s+',
                            ' ',
                            'g'
                        )
                    ) AS cleaned
                FROM chat_messages cm
                WHERE cm.thread_id IS NOT NULL
                  AND cm.role = 'user'
            ),
            ranked_candidates AS (
                SELECT
                    nm.thread_id,
                    nm.cleaned,
                    LOWER(nm.cleaned) AS lowered,
                    ROW_NUMBER() OVER (
                        PARTITION BY nm.thread_id
                        ORDER BY
                            CASE
                                WHEN nm.cleaned = '' THEN 2
                                WHEN LOWER(nm.cleaned) IN (
                                    'hi', 'hello', 'hey', 'yo', 'ok', 'okay',
                                    'thanks', 'thank you', 'new chat', 'legacy chat',
                                    'chat', 'conversation'
                                ) THEN 1
                                WHEN LENGTH(nm.cleaned) < 4 THEN 1
                                ELSE 0
                            END,
                            nm.created_at,
                            nm.id
                    ) AS rn
                FROM normalized_messages nm
            ),
            first_meaningful_message AS (
                SELECT
                    rc.thread_id,
                    LEFT(BTRIM(rc.cleaned, ' .,:;!?''"`()[]{}'), 120) AS proposed_title
                FROM ranked_candidates rc
                WHERE rc.rn = 1
                  AND rc.cleaned <> ''
                  AND rc.lowered NOT IN (
                      'hi', 'hello', 'hey', 'yo', 'ok', 'okay',
                      'thanks', 'thank you', 'new chat', 'legacy chat',
                      'chat', 'conversation'
                  )
                  AND LENGTH(rc.cleaned) >= 4
            )
            UPDATE chat_threads ct
            SET title = fmm.proposed_title
            FROM first_meaningful_message fmm
            WHERE ct.id = fmm.thread_id
              AND fmm.proposed_title IS NOT NULL
              AND fmm.proposed_title <> ''
              AND LOWER(BTRIM(ct.title)) IN (
                  '', 'new chat', 'new chat.', 'legacy chat',
                  'chat', 'conversation', 'untitled', 'general chat'
              )
            """
        )
        # If a legacy thread has no user message left, use a readable fallback title.
        await conn.exec_driver_sql(
            """
            UPDATE chat_threads ct
            SET title = LEFT(
                CONCAT(
                    COALESCE(NULLIF(BTRIM(d.name), ''), 'Dog'),
                    ' - chat ',
                    TO_CHAR(COALESCE(ct.last_message_at, ct.created_at), 'YYYY-MM-DD')
                ),
                120
            )
            FROM dogs d
            WHERE ct.dog_id = d.id
              AND LOWER(BTRIM(ct.title)) = 'legacy chat'
              AND NOT EXISTS (
                  SELECT 1
                  FROM chat_messages cm
                  WHERE cm.thread_id = ct.id
                    AND cm.role = 'user'
              )
            """
        )
