-- Patients tablosuna eksik kolonları ekle
-- Bu script güvenlidir, mevcut verilere zarar vermez

DO $$ 
BEGIN
    -- username kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'username'
    ) THEN
        ALTER TABLE patients ADD COLUMN username VARCHAR(100);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_username ON patients(username);
        RAISE NOTICE '✅ username kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ username kolonu zaten mevcut';
    END IF;

    -- password_hash kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE patients ADD COLUMN password_hash VARCHAR(200);
        RAISE NOTICE '✅ password_hash kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ password_hash kolonu zaten mevcut';
    END IF;

    -- surname kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'surname'
    ) THEN
        ALTER TABLE patients ADD COLUMN surname VARCHAR(200);
        RAISE NOTICE '✅ surname kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ surname kolonu zaten mevcut';
    END IF;

    -- status kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'status'
    ) THEN
        ALTER TABLE patients ADD COLUMN status VARCHAR(50) DEFAULT 'active';
        RAISE NOTICE '✅ status kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ status kolonu zaten mevcut';
    END IF;

    -- session_days kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'session_days'
    ) THEN
        ALTER TABLE patients ADD COLUMN session_days INTEGER DEFAULT 7;
        RAISE NOTICE '✅ session_days kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ session_days kolonu zaten mevcut';
    END IF;

    -- max_devices kolonu ekle (cihaz limiti için)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'max_devices'
    ) THEN
        ALTER TABLE patients ADD COLUMN max_devices INTEGER DEFAULT 3;
        RAISE NOTICE '✅ max_devices kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ max_devices kolonu zaten mevcut';
    END IF;

    -- role kolonu ekle (admin/patient ayrımı için)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'role'
    ) THEN
        ALTER TABLE patients ADD COLUMN role VARCHAR(50) DEFAULT 'patient';
        RAISE NOTICE '✅ role kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ role kolonu zaten mevcut';
    END IF;

    -- updated_at kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE patients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ updated_at kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ updated_at kolonu zaten mevcut';
    END IF;

END $$;

-- Index'leri oluştur
CREATE INDEX IF NOT EXISTS idx_patients_username ON patients(username);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_role ON patients(role);

-- RLS politikalarını güncelle (mevcut verileri etkilemez)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON patients;
CREATE POLICY "Allow all operations" 
ON patients FOR ALL 
USING (true)
WITH CHECK (true);

-- Sonuç raporu
SELECT 
    'patients' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients'
ORDER BY ordinal_position;
