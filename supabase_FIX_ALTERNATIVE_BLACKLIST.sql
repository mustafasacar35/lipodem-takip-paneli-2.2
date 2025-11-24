-- ============================================
-- FIX ALTERNATIVE_BLACKLIST TABLE STRUCTURE
-- ============================================

-- Mevcut tabloyu sil
DROP TABLE IF EXISTS alternative_blacklist;

-- Doğru yapıyla yeniden oluştur
CREATE TABLE alternative_blacklist (
    id SERIAL PRIMARY KEY,
    original_food TEXT NOT NULL,
    blocked_alternative TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Her bir orijinal yemek için bir alternatif sadece bir kere yasaklanabilir
    UNIQUE(original_food, blocked_alternative)
);

-- İndeksler
CREATE INDEX idx_alternative_blacklist_original ON alternative_blacklist(original_food);
CREATE INDEX idx_alternative_blacklist_blocked ON alternative_blacklist(blocked_alternative);

-- Açıklama
COMMENT ON TABLE alternative_blacklist IS 'Alternatif yemek yasakları - Belirli bir yemek için hangi alternatiflerin gösterilmeyeceği';
COMMENT ON COLUMN alternative_blacklist.original_food IS 'Ana yemek adı';
COMMENT ON COLUMN alternative_blacklist.blocked_alternative IS 'Yasaklı alternatif yemek adı';
COMMENT ON COLUMN alternative_blacklist.reason IS 'Yasaklama sebebi/notu';

-- ✅ Tablo hazır, migration yapılabilir
