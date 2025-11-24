-- ==========================================
-- SUPABASE: GERÇEK JSON VERİLERİNİ YÜKLEME
-- ==========================================
-- NOT: Bu dosyayı Supabase SQL Editor'de 3 kez çalıştırın
-- Her seferinde sadece 1 UPDATE komutunu uncomment edin
-- ==========================================

-- ==========================================
-- ADIM 1: MANUEL EŞLEŞTİRMELER (1393 satır)
-- ==========================================
-- Supabase SQL Editor'a gidin:
-- 1. data/manuel_eslestirmeler.json dosyasını açın
-- 2. Tüm içeriği kopyalayın (Ctrl+A, Ctrl+C)
-- 3. Aşağıdaki komutu çalıştırın ama önce '<<JSON_BURAYA>>' yerine JSON yapıştırın

/*
UPDATE app_settings 
SET value = '<<JSON_BURAYA>>'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'manuel_eslestirmeler';
*/

-- ==========================================
-- ADIM 2: YASAKLI EŞLEŞTIRMELER
-- ==========================================
-- Supabase SQL Editor'a gidin:
-- 1. data/eslesmeme_kurallari.json dosyasını açın
-- 2. Tüm içeriği kopyalayın
-- 3. Aşağıdaki komutu çalıştırın ama önce '<<JSON_BURAYA>>' yerine JSON yapıştırın

/*
UPDATE app_settings 
SET value = '<<JSON_BURAYA>>'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'eslesmeme_kurallari';
*/

-- ==========================================
-- ADIM 3: YEMEK VERİTABANI EŞLEŞTİRMELERİ
-- ==========================================
-- Supabase SQL Editor'a gidin:
-- 1. data/yemek_veritabani_eslestirme.json dosyasını açın
-- 2. Tüm içeriği kopyalayın
-- 3. Aşağıdaki komutu çalıştırın ama önce '<<JSON_BURAYA>>' yerine JSON yapıştırın

/*
UPDATE app_settings 
SET value = '<<JSON_BURAYA>>'::jsonb,
    updated_at = NOW()
WHERE setting_key = 'yemek_veritabani_eslestirme';
*/

-- ==========================================
-- DOĞRULAMA SORGUSU (Hepsini yükledikten sonra)
-- ==========================================
-- Tüm JSON verilerinin yüklendiğini kontrol edin:

SELECT 
    setting_key,
    jsonb_typeof(value) as data_type,
    CASE 
        WHEN setting_key = 'config' THEN 'Config ayarları'
        WHEN setting_key = 'manuel_eslestirmeler' THEN 
            (value->'eslestirmeler')::jsonb || ' eşleştirme'
        WHEN setting_key = 'eslesmeme_kurallari' THEN 
            (value->'kurallar'->'eslesmemeKurallari')::jsonb || ' yasak kuralı'
        WHEN setting_key = 'yemek_veritabani_eslestirme' THEN 
            (value->'eslestirmeler')::jsonb || ' yemek eşleştirmesi'
    END as data_count,
    updated_at
FROM app_settings
ORDER BY setting_key;

-- ==========================================
-- TAMAMLANDI! ✅
-- ==========================================
