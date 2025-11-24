-- Patients tablosuna patient_data JSONB kolonu ekle
-- Bu kolonda weeks, personalInfo, notes, progressLog gibi detaylı bilgiler saklanacak

DO $$ 
BEGIN
    -- patient_data JSONB kolonu ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' AND column_name = 'patient_data'
    ) THEN
        ALTER TABLE patients ADD COLUMN patient_data JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ patient_data kolonu eklendi';
    ELSE
        RAISE NOTICE '⏭️ patient_data kolonu zaten mevcut';
    END IF;

    -- Index ekle (JSONB sorgular için performans)
    CREATE INDEX IF NOT EXISTS idx_patients_patient_data_gin ON patients USING GIN (patient_data);
    RAISE NOTICE '✅ patient_data GIN index eklendi';

END $$;

-- Sonuç raporu
SELECT 
    'patients' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'patient_data';
