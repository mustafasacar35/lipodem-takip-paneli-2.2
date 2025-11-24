-- ============================================================================
-- TEMPLATES TABLE UPDATE
-- Templates tablosuna makro besin kolonları ekleme
-- ============================================================================

-- Mevcut templates tablosunu kontrol et
DO $$ 
BEGIN
    -- Eğer calories kolonu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'templates' AND column_name = 'calories'
    ) THEN
        ALTER TABLE templates ADD COLUMN calories DECIMAL(6,2) DEFAULT 0;
        RAISE NOTICE 'calories kolonu eklendi';
    END IF;

    -- Eğer protein kolonu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'templates' AND column_name = 'protein'
    ) THEN
        ALTER TABLE templates ADD COLUMN protein DECIMAL(6,2) DEFAULT 0;
        RAISE NOTICE 'protein kolonu eklendi';
    END IF;

    -- Eğer carbs kolonu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'templates' AND column_name = 'carbs'
    ) THEN
        ALTER TABLE templates ADD COLUMN carbs DECIMAL(6,2) DEFAULT 0;
        RAISE NOTICE 'carbs kolonu eklendi';
    END IF;

    -- Eğer fat kolonu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'templates' AND column_name = 'fat'
    ) THEN
        ALTER TABLE templates ADD COLUMN fat DECIMAL(6,2) DEFAULT 0;
        RAISE NOTICE 'fat kolonu eklendi';
    END IF;

    -- Eğer type kolonu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'templates' AND column_name = 'type'
    ) THEN
        ALTER TABLE templates ADD COLUMN type VARCHAR(50) DEFAULT 'day';
        RAISE NOTICE 'type kolonu eklendi';
    END IF;
END $$;

-- Index'leri ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_calories ON templates(calories);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);

-- Güncellenmiş tablo yapısını göster
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'templates'
ORDER BY ordinal_position;

-- BAŞARILI!
SELECT '✅ Templates tablosu güncellendi!' as status;
