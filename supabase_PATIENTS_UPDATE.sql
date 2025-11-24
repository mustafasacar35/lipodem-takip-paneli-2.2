-- ============================================================================
-- PATIENTS TABLE UPDATE
-- Patients tablosuna eksik kolonları ekleme
-- ============================================================================

-- Mevcut patients tablosunu kontrol et ve eksik kolonları ekle
DO $$ 
BEGIN
    -- name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'name'
    ) THEN
        ALTER TABLE patients ADD COLUMN name VARCHAR(200);
        RAISE NOTICE 'name kolonu eklendi';
    END IF;

    -- email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'email'
    ) THEN
        ALTER TABLE patients ADD COLUMN email VARCHAR(200);
        RAISE NOTICE 'email kolonu eklendi';
    END IF;

    -- phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'phone'
    ) THEN
        ALTER TABLE patients ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE 'phone kolonu eklendi';
    END IF;

    -- start_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE patients ADD COLUMN start_date DATE;
        RAISE NOTICE 'start_date kolonu eklendi';
    END IF;

    -- target_weight
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'target_weight'
    ) THEN
        ALTER TABLE patients ADD COLUMN target_weight DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE 'target_weight kolonu eklendi';
    END IF;

    -- current_weight
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'current_weight'
    ) THEN
        ALTER TABLE patients ADD COLUMN current_weight DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE 'current_weight kolonu eklendi';
    END IF;

    -- height
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'height'
    ) THEN
        ALTER TABLE patients ADD COLUMN height INTEGER DEFAULT 0;
        RAISE NOTICE 'height kolonu eklendi';
    END IF;

    -- age
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'age'
    ) THEN
        ALTER TABLE patients ADD COLUMN age INTEGER DEFAULT 0;
        RAISE NOTICE 'age kolonu eklendi';
    END IF;

    -- gender
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'gender'
    ) THEN
        ALTER TABLE patients ADD COLUMN gender VARCHAR(20) DEFAULT 'female';
        RAISE NOTICE 'gender kolonu eklendi';
    END IF;

    -- diet_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'diet_type'
    ) THEN
        ALTER TABLE patients ADD COLUMN diet_type VARCHAR(100) DEFAULT 'ketojenik';
        RAISE NOTICE 'diet_type kolonu eklendi';
    END IF;

    -- activity_level
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'activity_level'
    ) THEN
        ALTER TABLE patients ADD COLUMN activity_level VARCHAR(50) DEFAULT 'sedentary';
        RAISE NOTICE 'activity_level kolonu eklendi';
    END IF;

    -- username kolonunu NULL yapılabilir hale getir
    ALTER TABLE patients ALTER COLUMN username DROP NOT NULL;
    RAISE NOTICE 'username kolonu NULL yapılabilir hale getirildi';

    -- password_hash kolonunu NULL yapılabilir hale getir
    ALTER TABLE patients ALTER COLUMN password_hash DROP NOT NULL;
    RAISE NOTICE 'password_hash kolonu NULL yapılabilir hale getirildi';

    -- medical_conditions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'medical_conditions'
    ) THEN
        ALTER TABLE patients ADD COLUMN medical_conditions JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'medical_conditions kolonu eklendi';
    END IF;

    -- allergies
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'allergies'
    ) THEN
        ALTER TABLE patients ADD COLUMN allergies JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'allergies kolonu eklendi';
    END IF;

    -- preferences
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE patients ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'preferences kolonu eklendi';
    END IF;

    -- restrictions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'restrictions'
    ) THEN
        ALTER TABLE patients ADD COLUMN restrictions JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'restrictions kolonu eklendi';
    END IF;

    -- goals
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'goals'
    ) THEN
        ALTER TABLE patients ADD COLUMN goals JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'goals kolonu eklendi';
    END IF;

    -- notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'notes'
    ) THEN
        ALTER TABLE patients ADD COLUMN notes TEXT DEFAULT '';
        RAISE NOTICE 'notes kolonu eklendi';
    END IF;
END $$;

-- Index'leri ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_patients_activity_level ON patients(activity_level);
CREATE INDEX IF NOT EXISTS idx_patients_diet_type ON patients(diet_type);

-- Güncellenmiş tablo yapısını göster
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- BAŞARILI!
SELECT '✅ Patients tablosu güncellendi!' as status;
