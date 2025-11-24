-- Foods tablosuna data kolonu ekle (tüm JSON verisi için)
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS data JSONB;

-- Mevcut verileri data kolonuna taşı (eğer varsa)
UPDATE foods 
SET data = jsonb_build_object(
    'name', name,
    'category', category,
    'calories', calories,
    'protein', protein,
    'carbs', carbs,
    'fat', fat
)
WHERE data IS NULL;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_foods_data ON foods USING GIN (data);

-- Yorum
COMMENT ON COLUMN foods.data IS 'Yemek detayları: minQuantity, maxQuantity, role, mealType, dietTypes, vs. (JSONB)';
