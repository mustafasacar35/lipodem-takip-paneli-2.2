-- ==========================================
-- SUPABASE: TEMPLATES TABLOSUNA DIET_TYPE EKLE
-- ==========================================

-- 1. templates tablosuna diet_type sütunu ekle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'templates' AND column_name = 'diet_type'
    ) THEN
        ALTER TABLE templates ADD COLUMN diet_type VARCHAR(100) DEFAULT NULL;
        CREATE INDEX IF NOT EXISTS idx_templates_diet_type ON templates(diet_type);
        RAISE NOTICE '✅ diet_type sütunu eklendi';
    ELSE
        RAISE NOTICE '⏭️ diet_type zaten mevcut';
    END IF;
END $$;

-- 2. Mevcut şablonlara varsayılan diyet türü ata (opsiyonel)
-- UYARI: Bu tüm mevcut şablonları 'ketojenik' olarak işaretler
-- Sadece gerekiyorsa çalıştırın!
-- UPDATE templates 
-- SET diet_type = 'ketojenik' 
-- WHERE diet_type IS NULL;

-- ==========================================
-- TAMAMLANDI! ✅
-- ==========================================
-- Şimdi şablonları kaydederken diet_type alanını da kaydedin:
-- 
-- const { data, error } = await supabase
--   .from('templates')
--   .insert({
--     name: 'Menü 1',
--     type: 'day',
--     diet_type: 'ketojenik',  // ← YENİ ALAN
--     ogunler: [...],
--     tags: ['custom', 'day']
--   });
-- ==========================================
