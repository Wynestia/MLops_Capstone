-- =============================================================================
-- PawMind Database Initialization Script
-- PostgreSQL 14+
-- Run: psql -U postgres -f init_db.sql
-- =============================================================================

-- ─── สร้าง Database ──────────────────────────────────────────────────────────
CREATE DATABASE pawmind
    WITH ENCODING 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE   = 'en_US.UTF-8'
    TEMPLATE template0;

-- เชื่อมต่อเข้า database
\c pawmind;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLE: users
-- =============================================================================
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    name          VARCHAR(100),
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- =============================================================================
-- TABLE: dogs
-- =============================================================================
CREATE TABLE dogs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(100) NOT NULL,
    breed        VARCHAR(100),
    birthday     DATE,
    sex          VARCHAR(10)  CHECK (sex IN ('Male', 'Female', 'Unknown')),
    weight_kg    NUMERIC(5,2),
    microchip    VARCHAR(50),
    emoji        VARCHAR(10)  DEFAULT '🐕',
    status       VARCHAR(20)  DEFAULT 'Relaxed'
                    CHECK (status IN ('Happy', 'Relaxed', 'Sad', 'Angry')),
    energy_level VARCHAR(10)  CHECK (energy_level IN ('Low', 'Medium', 'High')),
    notes        TEXT,
    created_at   TIMESTAMPTZ  DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX idx_dogs_user_id ON dogs (user_id);

-- =============================================================================
-- TABLE: mood_analyses  (ผล ML จากรูปภาพ)
-- =============================================================================
CREATE TABLE mood_analyses (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id        UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    image_url     TEXT,
    mood          VARCHAR(20) NOT NULL CHECK (mood IN ('Happy', 'Relaxed', 'Sad', 'Angry')),
    confidence    NUMERIC(5,2),                  -- 0.00 – 100.00
    scores        JSONB,                         -- {"Happy":92.1,"Relaxed":5.2,...}
    model_version VARCHAR(20) DEFAULT 'v1',
    analyzed_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mood_analyses_dog_id    ON mood_analyses (dog_id);
CREATE INDEX idx_mood_analyses_analyzed  ON mood_analyses (dog_id, analyzed_at DESC);

-- =============================================================================
-- TABLE: mood_logs  (บันทึก mood รายวัน — manual หรือจาก analysis)
-- =============================================================================
CREATE TABLE mood_logs (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id    UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    mood      VARCHAR(20) NOT NULL CHECK (mood IN ('Happy', 'Relaxed', 'Sad', 'Angry')),
    source    VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'analysis')),
    note      TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mood_logs_dog_id   ON mood_logs (dog_id);
CREATE INDEX idx_mood_logs_logged   ON mood_logs (dog_id, logged_at DESC);

-- =============================================================================
-- TABLE: weight_logs
-- =============================================================================
CREATE TABLE weight_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id      UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    weight_kg   NUMERIC(5,2) NOT NULL,
    recorded_at DATE        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weight_logs_dog_id ON weight_logs (dog_id);
CREATE INDEX idx_weight_logs_date   ON weight_logs (dog_id, recorded_at DESC);

-- =============================================================================
-- TABLE: journal_entries  (บันทึกรายวัน)
-- =============================================================================
CREATE TABLE journal_entries (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id      UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    content     TEXT,
    mood        VARCHAR(20) CHECK (mood IN ('Happy', 'Relaxed', 'Sad', 'Angry')),
    entry_date  DATE        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_dog_id ON journal_entries (dog_id);
CREATE INDEX idx_journal_date   ON journal_entries (dog_id, entry_date DESC);

-- =============================================================================
-- TABLE: medications
-- =============================================================================
CREATE TABLE medications (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id        UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    type          VARCHAR(100),
    dose          VARCHAR(100),
    frequency     VARCHAR(100),
    start_date    DATE,
    end_date      DATE,
    status        VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'discontinued')),
    prescribed_by VARCHAR(100),
    reason        TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medications_dog_id ON medications (dog_id);
CREATE INDEX idx_medications_status ON medications (dog_id, status);

-- =============================================================================
-- TABLE: health_records
-- =============================================================================
CREATE TABLE health_records (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id          UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    condition       VARCHAR(200) NOT NULL,
    severity        VARCHAR(10) DEFAULT 'medium'
                        CHECK (severity IN ('low', 'medium', 'high')),
    status          VARCHAR(20) DEFAULT 'ongoing'
                        CHECK (status IN ('ongoing', 'monitoring', 'resolved')),
    diagnosed_date  DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_records_dog_id ON health_records (dog_id);
CREATE INDEX idx_health_records_status ON health_records (dog_id, status);

-- =============================================================================
-- TABLE: vaccines
-- =============================================================================
CREATE TABLE vaccines (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id     UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    name       VARCHAR(200) NOT NULL,
    last_date  DATE,
    next_due   DATE,
    status     VARCHAR(20) DEFAULT 'current'
                   CHECK (status IN ('current', 'due-soon', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vaccines_dog_id  ON vaccines (dog_id);
CREATE INDEX idx_vaccines_due     ON vaccines (dog_id, next_due ASC);

-- =============================================================================
-- TABLE: activity_logs
-- =============================================================================
CREATE TABLE activity_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id      UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    logged_date DATE        NOT NULL,
    walk_min    INTEGER     DEFAULT 0 CHECK (walk_min  >= 0),
    play_min    INTEGER     DEFAULT 0 CHECK (play_min  >= 0),
    train_min   INTEGER     DEFAULT 0 CHECK (train_min >= 0),
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_dog_id ON activity_logs (dog_id);
CREATE INDEX idx_activity_date   ON activity_logs (dog_id, logged_date DESC);

-- =============================================================================
-- TABLE: chat_messages
-- =============================================================================
CREATE TABLE chat_messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dog_id      UUID        NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    analysis_id UUID        REFERENCES mood_analyses(id) ON DELETE SET NULL,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_dog_id ON chat_messages (dog_id);
CREATE INDEX idx_chat_messages_time   ON chat_messages (dog_id, created_at ASC);

-- =============================================================================
-- Auto-update `updated_at` trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_dogs_updated_at
    BEFORE UPDATE ON dogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_health_records_updated_at
    BEFORE UPDATE ON health_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Verify
-- =============================================================================
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
