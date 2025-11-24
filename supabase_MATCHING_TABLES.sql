-- ============================================
-- MATCHING TABLES (Eşleştirme Tabloları)
-- ============================================

-- 1. Manuel Eşleştirmeler
CREATE TABLE IF NOT EXISTS food_matchings (
    id SERIAL PRIMARY KEY,
    food_name TEXT NOT NULL,
    matched_food TEXT NOT NULL,
    type TEXT DEFAULT 'manuel', -- manuel, auto, db
    data JSONB, -- Tüm ek bilgiler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_food_matchings_food ON food_matchings(food_name);
CREATE INDEX idx_food_matchings_data ON food_matchings USING GIN (data);

COMMENT ON TABLE food_matchings IS 'Yemek eşleştirmeleri (manuel_eslestirmeler.json, yemek_veritabani_eslestirme.json)';

-- 2. Yasaklı Eşleştirmeler (Blacklist)
CREATE TABLE IF NOT EXISTS food_blacklist (
    id SERIAL PRIMARY KEY,
    food_name TEXT NOT NULL,
    blocked_food TEXT NOT NULL,
    reason TEXT,
    type TEXT DEFAULT 'manuel', -- manuel, auto, db
    data JSONB, -- Tüm ek bilgiler
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_food_blacklist_food ON food_blacklist(food_name);
CREATE INDEX idx_food_blacklist_data ON food_blacklist USING GIN (data);

COMMENT ON TABLE food_blacklist IS 'Yasaklı yemek eşleştirmeleri (eslesmeme_kurallari.json, yemek_veritabani_yasaklar.json)';

-- 3. Alternatif Blacklist
CREATE TABLE IF NOT EXISTS alternative_blacklist (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    data JSONB, -- Tüm veri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alternative_blacklist_item ON alternative_blacklist(item_name);
CREATE INDEX idx_alternative_blacklist_data ON alternative_blacklist USING GIN (data);

COMMENT ON TABLE alternative_blacklist IS 'Alternatif yasaklı öğeler (alternative_blacklist.json)';

-- ============================================
-- SAMPLE DATA VERIFICATION QUERIES
-- ============================================

-- Toplam eşleştirme sayısı
-- SELECT COUNT(*) as total_matchings FROM food_matchings;

-- Toplam yasak sayısı
-- SELECT COUNT(*) as total_blacklist FROM food_blacklist;

-- Type'a göre eşleştirmeler
-- SELECT type, COUNT(*) FROM food_matchings GROUP BY type;

-- Type'a göre yasaklar
-- SELECT type, COUNT(*) FROM food_blacklist GROUP BY type;
