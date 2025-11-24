-- ==========================================
-- SUPABASE: CONFIG MIGRATION
-- ==========================================
-- Config.json verilerini Supabase'e taşıma
-- Manuel eşleştirmeler ve ayarlar için tablolar

-- ÖNCELİKLE ESKİ TABLOLARI KALDIR (eğer varsa)
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS food_mappings CASCADE;
DROP TABLE IF EXISTS food_restrictions CASCADE;
DROP TABLE IF EXISTS food_database_mappings CASCADE;

-- 1. APP_SETTINGS TABLOSU (config.json)
CREATE TABLE IF NOT EXISTS app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for all" ON app_settings;
CREATE POLICY "Allow read for all" 
ON app_settings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow update for admins" ON app_settings;
CREATE POLICY "Allow update for admins" 
ON app_settings FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Allow insert for admins" ON app_settings;
CREATE POLICY "Allow insert for admins" 
ON app_settings FOR INSERT 
WITH CHECK (true);

-- 2. MANUEL EŞLEŞTIRMELER TABLOSU
CREATE TABLE IF NOT EXISTS food_mappings (
    id BIGSERIAL PRIMARY KEY,
    original_name VARCHAR(500) NOT NULL,
    mapped_name VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    diet_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_food_mappings_original ON food_mappings(original_name);
CREATE INDEX IF NOT EXISTS idx_food_mappings_mapped ON food_mappings(mapped_name);

-- RLS
ALTER TABLE food_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON food_mappings;
CREATE POLICY "Allow all operations" 
ON food_mappings FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. YASAK KURALLAR TABLOSU
CREATE TABLE IF NOT EXISTS food_restrictions (
    id BIGSERIAL PRIMARY KEY,
    food_name VARCHAR(500) NOT NULL,
    restricted_food VARCHAR(500) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_food_restrictions_food ON food_restrictions(food_name);
CREATE INDEX IF NOT EXISTS idx_food_restrictions_restricted ON food_restrictions(restricted_food);

-- RLS
ALTER TABLE food_restrictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON food_restrictions;
CREATE POLICY "Allow all operations" 
ON food_restrictions FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. YEMEK VERİTABANI EŞLEŞTİRMELERİ
CREATE TABLE IF NOT EXISTS food_database_mappings (
    id BIGSERIAL PRIMARY KEY,
    recipe_name VARCHAR(500) NOT NULL,
    database_name VARCHAR(500) NOT NULL,
    confidence NUMERIC(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_food_db_recipe ON food_database_mappings(recipe_name);
CREATE INDEX IF NOT EXISTS idx_food_db_database ON food_database_mappings(database_name);

-- RLS
ALTER TABLE food_database_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON food_database_mappings;
CREATE POLICY "Allow all operations" 
ON food_database_mappings FOR ALL 
USING (true)
WITH CHECK (true);

-- ==========================================
-- ÖRNEK VERI EKLEME
-- ==========================================

-- Config.json ana ayarları (GitHub'dan taşınacak)
INSERT INTO app_settings (setting_key, value, description) VALUES
('config', '{
  "scoringMode": "advanced",
  "sensitivityDivider": 10,
  "badgeVisibility": {
    "role": false,
    "dietType": false,
    "category": false,
    "season": false,
    "mealType": false,
    "tags": false
  },
  "scoreCriteria": {
    "activeByDefault": ["protein", "fat"],
    "available": ["protein", "carbs", "fat", "calories", "fiber"],
    "weights": {
      "protein": 1.0,
      "carbs": 1.0,
      "fat": 1.0,
      "calories": 0.5,
      "fiber": 0.3
    }
  },
  "filterCriteria": {
    "role": {
      "visible": true,
      "mode": "required",
      "defaultState": "active"
    },
    "dietType": {
      "visible": true,
      "mode": "required",
      "defaultState": "active"
    },
    "category": {
      "visible": true,
      "mode": "optional",
      "defaultState": "active"
    },
    "season": {
      "visible": false,
      "mode": "optional",
      "defaultState": "inactive"
    },
    "mealType": {
      "visible": true,
      "mode": "optional",
      "defaultState": "active"
    }
  },
  "defaultAlternativeCount": 4,
  "enableTagFilter": true,
  "calorieTolerancePercent": 100,
  "dietFormulas": {
    "ketojenik": {
      "protein": 1.5,
      "carb": 0.5,
      "fat": 1.8
    },
    "eliminasyonlu_ketojenik": {
      "protein": 1.6,
      "carb": 0.3,
      "fat": 2.0
    },
    "dusuk_karb": {
      "protein": 1.3,
      "carb": 1.0,
      "fat": 1.2
    },
    "akdeniz": {
      "protein": 1.2,
      "carb": 2.0,
      "fat": 0.8
    },
    "activityMultipliers": {
      "1": 0.8,
      "2": 0.9,
      "3": 1.0,
      "4": 1.1,
      "5": 1.2
    }
  }
}'::jsonb, 'Ana uygulama ayarları');

-- ==========================================
-- 2. MANUEL EŞLEŞTIRMELER (manuel_eslestirmeler.json)
-- ==========================================
-- NOT: Gerçek veriyi Supabase Dashboard'dan UPDATE ile ekleyin
-- Bu sadece yapı örneğidir
INSERT INTO app_settings (setting_key, value, description) VALUES
('manuel_eslestirmeler', '{
  "version": "1.0",
  "sonGuncelleme": "2025-11-17T16:28:59.067Z",
  "eslestirmeler": {}
}'::jsonb, 'Manuel yemek-kart eşleştirmeleri (tarif kartları)');

-- ==========================================
-- 3. YASAKLI EŞLEŞTIRMELER (eslesmeme_kurallari.json)
-- ==========================================
INSERT INTO app_settings (setting_key, value, description) VALUES
('eslesmeme_kurallari', '{
  "version": "1.0",
  "sonGuncelleme": "2025-11-14T17:21:14.866Z",
  "kurallar": {
    "eslesmemeKurallari": {}
  }
}'::jsonb, 'Yasaklı yemek-kart eşleştirmeleri (anti-match kuralları)');

-- ==========================================
-- 4. YEMEK VERİTABANI EŞLEŞTİRMELERİ (yemek_veritabani_eslestirme.json)
-- ==========================================
INSERT INTO app_settings (setting_key, value, description) VALUES
('yemek_veritabani_eslestirme', '{
  "version": "1.0",
  "sonGuncelleme": "2025-11-14T15:12:24.416Z",
  "eslestirmeler": {}
}'::jsonb, 'Yemek veritabanı ad normalizasyonu');

-- ==========================================
-- TAMAMLANDI! ✅
-- ==========================================
-- Bu SQL dosyası:
-- ✅ Config tablolarını oluşturur
-- ✅ RLS politikalarını ayarlar
-- ✅ Örnek config.json verisini ekler
-- ✅ Manuel eşleştirmeler için tablolar hazırlar
-- ==========================================
