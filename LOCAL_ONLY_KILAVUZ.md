# 🏠 LOCAL-ONLY DEVELOPMENT - HIZLI BAŞLANGIÇ

Bu kılavuz, **GitHub'a hiç dokunmadan** tamamen local ortamda çalışmanızı sağlar.

---

## ✅ ADIM 1: YENİ SUPABASE HESABI AÇ

### 1.1. Yeni Email ile Kayıt Ol

```
https://supabase.com
→ Sign Up
→ Yeni email kullan (örn: mustafa.dev@gmail.com)
```

**Neden yeni hesap?**
- ✅ Production Supabase'i korumak için
- ✅ Test verilerini izole etmek için
- ✅ Hata yapma riski yok

### 1.2. Yeni Proje Oluştur

```
Project Name: lipodem-dev
Database Password: [Güçlü şifre - kaydet!]
Region: Frankfurt (en yakın Türkiye'ye)
Pricing: Free tier
```

### 1.3. URL ve Key'i Kopyala

Proje oluştuktan sonra:

1. **Settings → API** bölümüne git
2. Şunları kopyala:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...` (uzun key)

---

## ✅ ADIM 2: SUPABASE TABLOLARINI OLUŞTUR

### 2.1. SQL Editor'ü Aç

```
Supabase Dashboard → SQL Editor → New Query
```

### 2.2. SQL Kodunu Yapıştır

`supabase_DEV_SETUP.sql` dosyasının **tüm içeriğini** kopyala ve SQL Editor'e yapıştır.

### 2.3. Çalıştır

```
Run butonuna tıkla (Ctrl+Enter)
```

**Beklenen sonuç:**
```
✅ SUPABASE DEV KURULUMU BAŞARILI!
```

9 tablo oluşturulacak:
- messages
- patients
- patient_weeks
- patient_days
- foods
- templates
- food_matches
- devices
- progress_log

---

## ✅ ADIM 3: CONFIG DOSYASINI HAZIRLA

### 3.1. config.local.js → config.js

1. `config.local.js` dosyasını aç
2. Aşağıdaki satırları bul ve **Supabase bilgilerini gir**:

```javascript
development: {
    url: 'https://YOUR_NEW_PROJECT.supabase.co',  // 👈 BURAYA YENİ URL
    anonKey: 'YOUR_NEW_ANON_KEY_HERE',            // 👈 BURAYA YENİ KEY
}
```

3. Dosyayı **`config.js`** olarak kaydet (workspace root'a)

### 3.2. .gitignore Kontrolü

`.gitignore` dosyasında `config.js` olmalı (zaten var):

```
config.js
```

Bu sayede yanlışlıkla GitHub'a push edilmez. ✅

---

## ✅ ADIM 4: TEST SAYFASINI AÇ

### 4.1. HTTP Server Başlat

**Seçenek 1: Python**
```bash
python -m http.server 8000
```

**Seçenek 2: Node.js**
```bash
npx http-server -p 8000
```

**Seçenek 3: VS Code Live Server**
- Extension yükle: "Live Server"
- Sağ tık → "Open with Live Server"

### 4.2. Tarayıcıda Aç

```
http://localhost:8000/dev-setup-wizard.html
```

### 4.3. Kurulum Kontrolü

Sihirbazda:
1. Supabase bilgilerini gir
2. **"Bağlantıyı Test Et"** → ✅ Başarılı olmalı
3. **"Kurulumu Kontrol Et"** → Tüm checkler ✅ olmalı

---

## ✅ ADIM 5: TEST ET

### 5.1. Console'u Aç

Tarayıcı console'unda (F12) şunu görmelisin:

```
🏠 LOCAL-ONLY DEVELOPMENT MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: development-local
🏠 Local Only: true
🗄️ Supabase URL: https://xxxxxxxx.supabase.co
📁 GitHub: ❌ Disabled
📊 Storage Strategy:
  - Local JSON: ✅
  - Supabase: ✅
  - GitHub: ❌
  - Dual Mode: ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ GitHub bağlantısı KAPALI. Hiçbir veri GitHub'a gitmeyecek.
✅ Supabase bağlantısı başarılı!
```

### 5.2. Bir HTML Dosyasını Aç

```
http://localhost:8000/index.html
```

veya

```
http://localhost:8000/patient_nutrition.html
```

### 5.3. Çalışıyor mu Kontrol Et

Console'da:
```javascript
// Config kontrolü
console.log(window.APP_CONFIG);

// DAL kontrolü
console.log(window.DAL);

// GitHub guard kontrolü
window.NoGitHub.showBlocked();
```

---

## 🛡️ GÜVENLİK KONTROLÜ

### Test: GitHub'a Yazılmıyor mu?

Console'da bu komutu çalıştır:

```javascript
// Bu HATA vermeli (GitHub engellendi)
fetch('https://api.github.com/repos/mustafasacar35/lipodem-takip-paneli/contents/test.json')
  .then(() => console.log('❌ SORUN VAR! GitHub bağlantısı çalışıyor!'))
  .catch(() => console.log('✅ DOĞRU! GitHub engellendi.'));
```

**Beklenen sonuç:**
```
🛡️ GitHub API çağrısı ENGELLENDİ: https://api.github.com/...
💡 Bunun yerine local JSON veya Supabase kullan
✅ DOĞRU! GitHub engellendi.
```

---

## 📂 DOSYA YÖNETİMİ

### Local JSON Okuma

```javascript
// Hasta bilgisini local'den oku
const patient = await readJSON('./hastalar/patient_001.json');
console.log(patient);
```

### Supabase'e Yazma

```javascript
// Hasta bilgisini Supabase'e kaydet
await window.DAL.savePatient(patient);
```

### Dual-Mode (Önerilen)

```javascript
// Local'den oku, Supabase'e yaz
const patient = await readJSON('./hastalar/patient_001.json');
patient.notes = 'Güncellendi';
await window.DAL.savePatient(patient); // Supabase'e kaydedilir
```

---

## 🔧 HTML DOSYALARINI GÜNCELLE

Her HTML dosyasının `<head>` bölümüne ekle:

```html
<!-- 🔧 Local-Only Configuration -->
<script src="./config.js"></script>
<script src="./data-access-layer.js"></script>
<script src="./no-github-guard.js"></script>

<!-- Supabase (zaten var) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Eklenecek dosyalar:**
- ✅ admin_chat.html (mesajlar zaten Supabase'de)
- ✅ admin_patients.html
- ✅ admin_settings.html
- ✅ patient_nutrition.html
- ✅ index.html

---

## 🚀 KULLANIM ÖRNEKLERİ

### Hasta Listesi Getir

```javascript
// Local JSON'dan
const patients = await readJSON('./hastalar/index.json');
console.log(patients);

// veya DAL ile (otomatik)
const patients = await window.DAL.getPatientList();
```

### Hasta Kaydet

```javascript
const patientData = {
    id: 'patient_001',
    name: 'Test',
    surname: 'Hasta',
    // ... diğer bilgiler
};

// Supabase'e kaydet (GitHub'a GİTMEZ)
await window.DAL.savePatient(patientData);
```

### Yemek Listesi

```javascript
// Local JSON'dan
const foodList = await readJSON('./food_list.json');

// veya DAL ile
const foodList = await window.DAL.getFoodList();
```

---

## 📊 VERİ AKIŞI

```
┌──────────────┐
│ Local JSON   │ ← Mevcut veriler (okuma)
│ (hastalar/*) │
└──────┬───────┘
       │ readJSON()
       ↓
┌──────────────┐
│ DATA ACCESS  │ ← Akıllı köprü
│ LAYER (DAL)  │
└──────┬───────┘
       │ savePatient()
       ↓
┌──────────────┐
│ SUPABASE     │ ← Yeni veriler (yazma)
│ (DEV)        │
└──────────────┘

❌ GitHub → KAPALI (no-github-guard.js)
```

---

## ⚠️ ÖNEMLİ NOTLAR

### ✅ YAPILACAKLAR:

1. **Her değişikliği Supabase'e kaydet**
2. **Local JSON'ları yedekle** (düzenli)
3. **config.js'i GİT'E EKLEME** (.gitignore'da var)
4. **Supabase şifresini kaydet** (unutma!)

### ❌ YAPILMAYACAKLAR:

1. **Production Supabase kullanma**
2. **GitHub'a push yapma** (no-github-guard engelleyecek)
3. **config.js'i paylaşma** (gizli bilgiler var)
4. **Production verileri değiştirme**

---

## 🔍 SORUN GİDERME

### "Supabase bağlanamıyor"

```javascript
// Console'da kontrol et
console.log(window.APP_CONFIG.supabase);

// Manuel test
const { createClient } = supabase;
const client = createClient('https://xxx.supabase.co', 'eyJhbGci...');
const { data } = await client.from('messages').select('count');
console.log(data); // Çalışmalı
```

**Çözüm:**
- URL ve key doğru mu?
- SQL tablolarını oluşturdun mu?
- RLS açık mı? (SQL'de var)

### "GitHub'a yazıyor hala"

```javascript
// Guard aktif mi?
console.log(window.NoGitHub);

// Engellenen çağrılar
window.NoGitHub.showBlocked();
```

**Çözüm:**
- `no-github-guard.js` yüklü mü?
- HTML'e `<script src="./no-github-guard.js"></script>` ekle

### "Local JSON okumuyor"

```javascript
// HTTP server çalışıyor mu?
// File:// protokolü ÇALIŞMAZ!
// http://localhost:8000 olmalı
```

---

## 🎉 BAŞARILI KURULUM

Eğer bunları görüyorsan, BAŞARILI! 🎉

- ✅ Console'da "LOCAL-ONLY DEVELOPMENT MODE"
- ✅ "GitHub: ❌ Disabled"
- ✅ "Supabase bağlantısı başarılı!"
- ✅ `window.NoGitHub.showBlocked()` → "Hiç GitHub çağrısı yapılmadı"

Artık **production'ı etkilemeden** çalışabilirsin! 🚀

---

**SON GÜNCELLEME:** 18 Kasım 2025  
**YAZAR:** Mustafa Sacar  
**VERSİYON:** 1.0 - Local Only
