-- ==========================================
-- 🍽️ FOODS TABLOSU - GENIŞLETILMIŞ VERSİYON
-- ==========================================
-- Bu SQL'i Supabase SQL Editor'de çalıştır
-- Mevcut foods tablosunu siler ve yenisini oluşturur

-- Eski tabloyu sil
DROP TABLE IF EXISTS foods CASCADE;

-- Yeni genişletilmiş foods tablosu
CREATE TABLE foods (
    id BIGSERIAL PRIMARY KEY,
    
    -- Temel Bilgiler
    name VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Besin Değerleri
    calories DECIMAL(6,2) DEFAULT 0,
    protein DECIMAL(6,2) DEFAULT 0,
    carbs DECIMAL(6,2) DEFAULT 0,
    fat DECIMAL(6,2) DEFAULT 0,
    
    -- Miktar Ayarları
    min_quantity DECIMAL(5,2) DEFAULT 0.5,
    max_quantity DECIMAL(5,2) DEFAULT 3,
    step DECIMAL(5,2) DEFAULT 0.5,
    multiplier DECIMAL(5,2) DEFAULT 1,
    
    -- Rol ve Tip
    role VARCHAR(50),
    meal_type JSONB, -- ["breakfast", "lunch", "dinner", "snack"]
    
    -- Diyet Tipleri
    diet_types JSONB, -- ["ketojenik", "düşük karbonhidrat", vb.]
    keto BOOLEAN DEFAULT false,
    lowcarb BOOLEAN DEFAULT false,
    
    -- Portion ve Filler
    portion_fixed BOOLEAN DEFAULT false,
    filler_lunch BOOLEAN DEFAULT false,
    filler_dinner BOOLEAN DEFAULT false,
    
    -- Etiketler
    tags JSONB, -- ["tag1", "tag2", ...]
    compatibility_tags JSONB,
    incompatibility_tags JSONB,
    
    -- Mevsimsellik
    season_range VARCHAR(20), -- "[1,12]" formatında
    is_reversed_season BOOLEAN DEFAULT false,
    
    -- Notlar
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_foods_role ON foods(role);
CREATE INDEX idx_foods_keto ON foods(keto);
CREATE INDEX idx_foods_lowcarb ON foods(lowcarb);

-- RLS
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON foods;
CREATE POLICY "Allow all operations" ON foods FOR ALL USING (true) WITH CHECK (true);

SELECT 'FOODS TABLOSU GÜNCELLENDİ!' as message;
