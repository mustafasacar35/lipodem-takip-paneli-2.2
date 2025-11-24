# 🔧 DEVELOPMENT ORTAMI KURULUM KILAVUZU

Bu belge, production sistemini bozmadan development ortamında çalışmak için gerekli adımları açıklar.

---

## 🎯 HEDEF

- ✅ Production GitHub repository'sini **etkilemeden** çalışmak
- ✅ Production Supabase'i **bozmadan** test etmek  
- ✅ Vercel deployment'ını **değiştirmeden** geliştirme yapmak
- ✅ İzole bir development ortamı kurmak

---

## 📋 ÖN HAZIRLIK

### 1. Yeni Supabase Projesi Oluştur (DEV için)

1. https://supabase.com adresine git
2. **New Project** oluştur
   - İsim: `lipodem-dev` (veya istediğin isim)
   - Region: Yakın bir bölge seç
3. Project oluşturulduktan sonra:
   - **Settings → API** bölümüne git
   - **Project URL** ve **anon public** key'i kopyala
4. SQL Editor'e git ve şu SQL'i çalıştır:

```sql
-- Development Supabase için temel tablolar

-- Messages tablosu (mesajlaşma için)
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id VARCHAR(100) NOT NULL,
    receiver_id VARCHAR(100) NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    receiver_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    sender_admin VARCHAR(100),
    deleted_for_admin BOOLEAN DEFAULT FALSE,
    deleted_for_patient BOOLEAN DEFAULT FALSE
);

-- Patients tablosu (hasta listesi için)
CREATE TABLE IF NOT EXISTS patients (
    id BIGSERIAL PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200),
    data JSONB, -- Tüm hasta verisini JSON olarak sakla
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);

-- RLS (Row Level Security) - Herkese tam erişim (development için)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON messages;
CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON patients;
CREATE POLICY "Allow all operations" ON patients FOR ALL USING (true) WITH CHECK (true);
```

### 2. GitHub Repository Stratejisi (3 Seçenek)

#### SEÇENEK A: Farklı Branch Kullan (Önerilen) ⭐

```bash
# Mevcut workspace'de yeni branch oluştur
git checkout -b dev

# Bu branch'te çalış, production (main) etkilenmez
```

#### SEÇENEK B: Farklı Repository Kullan

```bash
# GitHub'da yeni repo oluştur: lipodem-takip-paneli-dev
# Mevcut dosyaları yeni repo'ya push et
git remote add dev https://github.com/mustafasacar35/lipodem-takip-paneli-dev.git
git push dev main
```

#### SEÇENEK C: Sadece Lokal Çalış (En Güvenli)

- Hiçbir GitHub push yapma
- Tüm değişiklikleri sadece local'de tut
- Production tamamen izole

---

## ⚙️ CONFIGURATION AYARLARI

### 1. config.js Dosyasını Düzenle

`config.example.js` dosyasını `config.js` olarak kopyala ve aşağıdaki değerleri değiştir:

```javascript
// 🌍 ORTAM TESPİTİ
const ENV = {
    isDevelopment: true // ✅ Development modunu aktif et
};

// 🗄️ SUPABASE CONFIGURATION
const SUPABASE_CONFIG = {
    development: {
        url: 'https://YOUR_DEV_PROJECT.supabase.co', // ✅ DEV Supabase URL
        anonKey: 'YOUR_DEV_ANON_KEY' // ✅ DEV Supabase Key
    }
};

// 📁 GITHUB CONFIGURATION
const GITHUB_CONFIG = {
    development: {
        owner: 'mustafasacar35',
        repo: 'lipodem-takip-paneli-dev', // ✅ DEV repo (veya aynı repo)
        branch: 'dev', // ✅ DEV branch
        token: '' // Local'de kullanılmayacak
    }
};
```

### 2. HTML Dosyalarına Config'i Ekle

Her HTML dosyasının `<head>` bölümüne ekle:

```html
<!-- 🔧 Configuration -->
<script src="./config.js"></script>
<script src="./data-access-layer.js"></script>
```

**Eklenecek dosyalar:**
- `admin_chat.html`
- `admin_patients.html`
- `admin_settings.html`
- `patient_nutrition.html`
- `index.html`
- vb.

---

## 🚀 KULLANIM

### Development Modunda Çalışma

1. **Local server başlat:**

```bash
# Python (basit HTTP server)
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000

# VS Code Live Server extension kullan
```

2. **Tarayıcıda aç:**

```
http://localhost:8000
```

3. **Console'da kontrol et:**

Tarayıcı console'unda şunu görmelisin:

```
🔧 CONFIG LOADED: {
  environment: 'development',
  isLocalhost: true,
  useJSON: true,
  useSupabase: false,
  supabaseUrl: 'https://YOUR_DEV_PROJECT.supabase.co'
}
```

### Data Access Layer Kullanımı

Artık her yerde `window.DAL` kullanabilirsin:

```javascript
// Hasta listesi getir
const patients = await window.DAL.getPatientList();

// Tek hasta getir
const patient = await window.DAL.getPatient('patient_001');

// Hasta kaydet (environment'a göre JSON veya Supabase)
await window.DAL.savePatient(patientData);

// Yemek listesi getir
const foodList = await window.DAL.getFoodList();
```

---

## 🔄 DEVELOPMENT → PRODUCTION GEÇİŞİ

### 1. Dual-Mode Aktif Et (Geçiş Dönemi)

`config.js` içinde:

```javascript
storage: {
    useJSON: true,        // JSON'dan okumaya devam et
    useSupabase: true,    // Supabase'e yazmaya başla
    dualMode: true        // ✅ Her ikisini de kullan
}
```

Bu sayede:
- Eski veriler JSON'dan okunur
- Yeni veriler Supabase'e yazılır
- Hiçbir veri kaybı olmaz

### 2. Test Et

- Tüm özellikler çalışıyor mu?
- Veriler doğru kaydediliyor mu?
- Production etkilendi mi? (HAYIR olmalı)

### 3. Tam Geçiş

```javascript
storage: {
    useJSON: false,       // JSON'ı kapat
    useSupabase: true,    // Sadece Supabase
    dualMode: false
}
```

---

## ⚠️ ÖNEMLİ UYARILAR

### ❌ YAPMA:

1. **Production config.js'i git'e commit etme**
   - `.gitignore` dosyasında `config.js` var
   - Sadece `config.example.js` commit edilmeli

2. **Production Supabase'i development'ta kullanma**
   - Ayrı development Supabase projesi oluştur

3. **Production GitHub'a development kodlarını push etme**
   - Farklı branch veya repo kullan

### ✅ YAP:

1. **Her zaman .gitignore kontrol et**
2. **Environment'ı console'dan doğrula**
3. **Dual-mode ile geçiş yap** (Anında değil)
4. **Yedek al** (Production JSON'ları)

---

## 🧪 TEST SENARYOLARI

### 1. İzolasyon Testi

```bash
# Development'ta bir hasta ekle
# Production hastalar listesini kontrol et
# Eklenen hasta OLMAMALI ✅
```

### 2. Dual-Mode Testi

```bash
# Dual-mode aktif et
# Bir hasta ekle
# JSON'a da Supabase'e de yazıldı mı kontrol et
```

### 3. Rollback Testi

```bash
# Supabase'den JSON'a geri dön
# Eski veriler çalışıyor mu?
```

---

## 📞 SORUN GİDERME

### "Config yüklenmiyor"

```javascript
// Console'da kontrol et:
console.log(window.APP_CONFIG);

// Çözüm: HTML'e <script src="./config.js"></script> ekle
```

### "Supabase bağlanamıyor"

```javascript
// Supabase URL ve key doğru mu?
console.log(window.APP_CONFIG.supabase);

// Supabase RLS açık mı?
// SQL Editor'de kontrol et: SELECT * FROM messages;
```

### "GitHub'a yazıyor hala"

```javascript
// isDevelopment: true olmalı
console.log(window.APP_CONFIG.environment);

// useJSON: true olmalı (development'ta)
console.log(window.APP_CONFIG.storage);
```

---

## 🎉 BAŞARILI KURULUM KONTROLÜ

Eğer aşağıdakileri görüyorsan, kurulum başarılı:

- ✅ Console'da "CONFIG LOADED: development"
- ✅ Supabase DEV projesine bağlanıyor
- ✅ Production GitHub'a push olmuyor
- ✅ Local'de tüm özellikler çalışıyor
- ✅ Production sistemi etkilenmiyor

---

## 📚 EK KAYNAKLAR

- Supabase Docs: https://supabase.com/docs
- GitHub Branching: https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging
- Environment Variables: https://vercel.com/docs/environment-variables

---

**SON GÜNCELLEme:** {{ current_date }}  
**YaZAR:** Mustafa Sacar  
**VERSİYON:** 1.0
