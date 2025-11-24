-- ==========================================
-- 🔧 DEVELOPMENT SUPABASE SETUP
-- ==========================================
-- Bu SQL kodlarını YENİ Supabase projesinde çalıştır
-- Production Supabase'i KULLANMA!

-- ==========================================
-- 1. MESSAGES TABLOSU (Mesajlaşma)
-- ==========================================
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id VARCHAR(100) NOT NULL,
    receiver_id VARCHAR(100) NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- 'admin' veya 'patient'
    receiver_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    sender_admin VARCHAR(100), -- Hangi admin gönderdi
    deleted_for_admin BOOLEAN DEFAULT FALSE,
    deleted_for_patient BOOLEAN DEFAULT FALSE
);

-- Messages Index'leri
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- ==========================================
-- 2. PATIENTS TABLOSU (Hasta Bilgileri)
-- ==========================================
CREATE TABLE IF NOT EXISTS patients (
    id BIGSERIAL PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    
    -- Kişisel Bilgiler
    name VARCHAR(100),
    surname VARCHAR(100),
    age INTEGER,
    gender VARCHAR(20),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(5,2),
    
    -- Sistem Bilgileri
    session_days INTEGER DEFAULT 7,
    status VARCHAR(20) DEFAULT 'active',
    max_devices INTEGER DEFAULT 3,
    
    -- Notlar ve Kayıtlar
    notes TEXT,
    data JSONB, -- Tüm eski JSON verisini buraya sakla (geçiş için)
    
    -- Tarihler
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients Index'leri
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_username ON patients(username);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- ==========================================
-- 3. PATIENT_WEEKS TABLOSU (Haftalık Planlar)
-- ==========================================
CREATE TABLE IF NOT EXISTS patient_weeks (
    id BIGSERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    week_id BIGINT NOT NULL,
    name VARCHAR(100),
    week_number INTEGER,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_weeks_patient_id ON patient_weeks(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_weeks_start_date ON patient_weeks(start_date);

-- ==========================================
-- 4. PATIENT_DAYS TABLOSU (Günlük Planlar)
-- ==========================================
CREATE TABLE IF NOT EXISTS patient_days (
    id BIGSERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    week_id BIGINT NOT NULL,
    day_id BIGINT NOT NULL,
    gun_adi VARCHAR(20),
    date DATE,
    template_id VARCHAR(100),
    template_name VARCHAR(200),
    total_calories INTEGER,
    total_protein DECIMAL(6,2),
    total_carbs DECIMAL(6,2),
    total_fat DECIMAL(6,2),
    data JSONB -- Öğünler ve detaylar
);

CREATE INDEX IF NOT EXISTS idx_patient_days_patient_id ON patient_days(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_days_date ON patient_days(date);
CREATE INDEX IF NOT EXISTS idx_patient_days_template_id ON patient_days(template_id);

-- ==========================================
-- 5. FOODS TABLOSU (Yemek Veritabanı)
-- ==========================================
CREATE TABLE IF NOT EXISTS foods (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Besin Değerleri
    calories INTEGER,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fat DECIMAL(6,2),
    
    -- Miktar Ayarları
    min_quantity DECIMAL(5,2) DEFAULT 0.5,
    max_quantity DECIMAL(5,2) DEFAULT 3,
    step DECIMAL(5,2) DEFAULT 0.5,
    multiplier DECIMAL(5,2) DEFAULT 1,
    
    -- Diğer
    role VARCHAR(50),
    meal_types JSONB, -- ["KAHVALTI", "ARA ÖĞÜN", ...]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);

-- ==========================================
-- 6. TEMPLATES TABLOSU (Şablonlar)
-- ==========================================
CREATE TABLE IF NOT EXISTS templates (
    id BIGSERIAL PRIMARY KEY,
    template_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200),
    total_calories INTEGER,
    total_protein DECIMAL(6,2),
    total_carbs DECIMAL(6,2),
    total_fat DECIMAL(6,2),
    data JSONB, -- Tüm şablon verisi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_template_id ON templates(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);

-- ==========================================
-- 7. FOOD_MATCHES TABLOSU (Eşleştirmeler)
-- ==========================================
CREATE TABLE IF NOT EXISTS food_matches (
    id BIGSERIAL PRIMARY KEY,
    template_food_name VARCHAR(200) NOT NULL,
    matched_food_id BIGINT REFERENCES foods(id),
    match_type VARCHAR(20) NOT NULL, -- 'manual', 'auto', 'banned'
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. DEVICES TABLOSU (Cihaz Yönetimi)
-- ==========================================
CREATE TABLE IF NOT EXISTS devices (
    id BIGSERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    device_id VARCHAR(200) UNIQUE NOT NULL,
    device_info JSONB,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_patient_id ON devices(patient_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

-- ==========================================
-- 9. PROGRESS_LOG TABLOSU (İlerleme Kayıtları)
-- ==========================================
CREATE TABLE IF NOT EXISTS progress_log (
    id BIGSERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL(5,2),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_log_patient_id ON progress_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_log_date ON progress_log(date);

-- ==========================================
-- 10. RLS (ROW LEVEL SECURITY)
-- ==========================================
-- Development için herkese tam erişim ver

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_log ENABLE ROW LEVEL SECURITY;

-- Tüm tabloları için tam erişim policy'si
DO $$ 
DECLARE 
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('messages', 'patients', 'patient_weeks', 'patient_days', 'foods', 'templates', 'food_matches', 'devices', 'progress_log')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all operations" ON %I', tbl);
        EXECUTE format('CREATE POLICY "Allow all operations" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;

-- ==========================================
-- ✅ KURULUM TAMAMLANDI!
-- ==========================================

SELECT 'SUPABASE DEV KURULUMU BAŞARILI!' as message;
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
