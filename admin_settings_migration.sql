-- ============================================================
-- ADMIN SETTINGS MIGRATION TO SUPABASE
-- Tüm admin_settings.html fonksiyonlarını Supabase'e taşıma
-- ============================================================

-- 1️⃣ APP_SETTINGS TABLE (settings/config.json replacement)
-- Tüm uygulama parametrelerini saklar
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- General Settings
    default_alternatives INTEGER DEFAULT 4,
    enable_tag_filter BOOLEAN DEFAULT true,
    calorie_tolerance INTEGER DEFAULT 100,
    template_reuse_weeks INTEGER DEFAULT 4,
    
    -- Diet Formulas
    diet_formulas JSONB DEFAULT '{
        "keto": {"carb": 0.3, "protein": 0.8, "fat": 1.2},
        "lowcarb": {"carb": 0.6, "protein": 0.8, "fat": 1},
        "mediterranean": {"carb": 0.6, "protein": 0.8, "fat": 1}
    }'::jsonb,
    
    -- Activity Level Multipliers
    activity_multipliers JSONB DEFAULT '{
        "1": 0.8,
        "2": 0.9,
        "3": 1.0,
        "4": 1.1,
        "5": 1.2
    }'::jsonb,
    
    -- Tag Exclusions (array of strings)
    tag_exclusions TEXT[] DEFAULT ARRAY['çorba', 'çorbası', 'ekmeği', 'ekmek', 'keto', 'lowcarb', 'salata', 'tatlı', 'yumurta'],
    
    -- Tag Exemptions (roles and categories)
    tag_exemptions JSONB DEFAULT '{
        "roles": ["bread", "soup"],
        "categories": ["TOSTLAR"]
    }'::jsonb,
    
    -- Rotation Settings
    rotation_enabled BOOLEAN DEFAULT true,
    rotation_daily_alternatives INTEGER DEFAULT 4,
    rotation_reset_day INTEGER,
    
    -- Filter Criteria Configuration
    filter_criteria JSONB DEFAULT '{
        "tarifKartiFiltresi": {
            "userMode": "zorunlu",
            "initialState": "aktif"
        },
        "veritabaniFiltreleme": {
            "userMode": "opsiyonel",
            "initialState": "pasif"
        },
        "tagFiltresi": {
            "userMode": "zorunlu",
            "initialState": "aktif"
        },
        "kaloriFiltresi": {
            "userMode": "opsiyonel",
            "initialState": "pasif"
        },
        "sablonFiltresi": {
            "userMode": "zorunlu",
            "initialState": "aktif"
        }
    }'::jsonb,
    
    -- Similarity Score Criteria
    score_criteria JSONB DEFAULT '{
        "protein": true,
        "carbs": true,
        "fat": true,
        "calories": true
    }'::jsonb,
    
    -- Scoring Mode (simple or advanced)
    scoring_mode TEXT DEFAULT 'simple' CHECK (scoring_mode IN ('simple', 'advanced')),
    
    -- Sensitivity Divider (for advanced mode)
    sensitivity_divider INTEGER DEFAULT 10,
    
    -- Badge Visibility
    badge_visibility JSONB DEFAULT '{
        "protein": true,
        "carbs": true,
        "fat": true,
        "calories": true,
        "category": true,
        "tags": true
    }'::jsonb,
    
    -- Feature Visibility
    feature_visibility JSONB DEFAULT '{
        "pdfButton": true
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_updated_at();

-- Insert default settings (single row - app uses only one settings record)
INSERT INTO app_settings (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================

-- 2️⃣ ADMINS TABLE (settings/admins.js replacement)
-- Admin kullanıcıları ve rolleri
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    roles TEXT[] DEFAULT ARRAY['admin'],
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_admins_updated_at();

-- Create indexes
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_is_active ON admins(is_active);

-- ============================================================

-- 3️⃣ PATIENT_ADMINS TABLE (patientAdmins in admins.js)
-- Hasta bazlı admin yetkileri
CREATE TABLE IF NOT EXISTS patient_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_username TEXT UNIQUE NOT NULL,
    assigned_admin_username TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_patient_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patient_admins_updated_at
    BEFORE UPDATE ON patient_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_admins_updated_at();

-- Create indexes
CREATE INDEX idx_patient_admins_patient ON patient_admins(patient_username);

-- ============================================================

-- 4️⃣ TEMPLATES TABLE (templates/ klasörü replacement)
-- Gün şablonları
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'day' CHECK (type IN ('day', 'week', 'meal')),
    gun_adi TEXT,
    diet_type TEXT,
    total_calories NUMERIC(10,2),
    total_macros JSONB,
    ogunler JSONB NOT NULL,
    tags TEXT[],
    created_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_templates_updated_at();

-- Create indexes
CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_gun_adi ON templates(gun_adi);
CREATE INDEX idx_templates_diet_type ON templates(diet_type);

-- Templates index view (templates/index.json replacement)
-- Otomatik olarak templates tablosundan özet oluşturur
CREATE OR REPLACE VIEW templates_index AS
SELECT 
    (SELECT COUNT(*)::INTEGER FROM templates) as total_count,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'gunAdi', gun_adi,
                'dietType', diet_type,
                'totalMacros', total_macros,
                'filename', id || '.json'
            ) ORDER BY 
                CASE gun_adi
                    WHEN 'PAZARTESI' THEN 1
                    WHEN 'SALI' THEN 2
                    WHEN 'ÇARŞAMBA' THEN 3
                    WHEN 'PERŞEMBE' THEN 4
                    WHEN 'CUMA' THEN 5
                    WHEN 'CUMARTESİ' THEN 6
                    WHEN 'PAZAR' THEN 7
                    ELSE 8
                END,
                name
        ), '[]'::jsonb
    ) as templates
FROM templates;

-- ============================================================

-- 5️⃣ RLS POLICIES (Row Level Security)
-- Admin tabloları için güvenlik

-- App Settings RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App settings are viewable by everyone"
ON app_settings FOR SELECT
USING (true);

CREATE POLICY "App settings are insertable by everyone"
ON app_settings FOR INSERT
WITH CHECK (true);

CREATE POLICY "App settings are updatable by everyone"
ON app_settings FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "App settings are deletable by everyone"
ON app_settings FOR DELETE
USING (true);

-- Admins RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins are viewable by everyone"
ON admins FOR SELECT
USING (true);

CREATE POLICY "Admins are editable by everyone"
ON admins FOR ALL
USING (true)
WITH CHECK (true);

-- Patient Admins RLS
ALTER TABLE patient_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient admins are viewable by everyone"
ON patient_admins FOR SELECT
USING (true);

CREATE POLICY "Patient admins are editable by everyone"
ON patient_admins FOR ALL
USING (true)
WITH CHECK (true);

-- Templates RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone"
ON templates FOR SELECT
USING (true);

CREATE POLICY "Templates are editable by everyone"
ON templates FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================

-- 5️⃣ HELPER FUNCTIONS

-- Get all settings as JSON
CREATE OR REPLACE FUNCTION get_app_settings()
RETURNS JSONB AS $$
DECLARE
    settings_json JSONB;
BEGIN
    SELECT row_to_json(app_settings.*)::jsonb INTO settings_json
    FROM app_settings
    WHERE id = '00000000-0000-0000-0000-000000000001';
    
    RETURN settings_json;
END;
$$ LANGUAGE plpgsql;

-- Get all admins with roles
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS JSONB AS $$
DECLARE
    admins_json JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'username', username,
            'roles', roles,
            'isActive', is_active,
            'createdAt', created_at
        )
    ) INTO admins_json
    FROM admins
    WHERE is_active = true
    ORDER BY username;
    
    RETURN COALESCE(admins_json, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Get all patient admins
CREATE OR REPLACE FUNCTION get_all_patient_admins()
RETURNS TEXT[] AS $$
DECLARE
    patient_list TEXT[];
BEGIN
    SELECT array_agg(patient_username ORDER BY patient_username) INTO patient_list
    FROM patient_admins;
    
    RETURN COALESCE(patient_list, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- ============================================================

COMMENT ON TABLE app_settings IS 'Uygulama ayarları (settings/config.json replacement)';
COMMENT ON TABLE admins IS 'Admin kullanıcıları (settings/admins.js replacement)';
COMMENT ON TABLE patient_admins IS 'Hasta bazlı admin yetkileri (patientAdmins array replacement)';
COMMENT ON TABLE templates IS 'Gün şablonları (templates/ klasörü replacement)';
