# Supabase Template Migration - Manual Patch

## patient_nutrition.html değişiklikleri:

### 1️⃣ `loadTemplates()` fonksiyonunu bul (satır ~6461)

**ESKİ KOD:**
```javascript
async function loadTemplates() {
    try {
        console.log('📥 Şablon index\'i GitHub\'dan yükleniyor...');

        // Check if TemplateManager is loaded
        if (typeof TemplateManager === 'undefined') {
            // ... GitHub fallback kodu ...
        } else {
            const dayTemplateIndex = await TemplateManager.loadIndex();
            dayTemplates = dayTemplateIndex.templates || [];
        }
```

**YENİ KOD:**
```javascript
async function loadTemplates() {
    try {
        console.log('📥 Şablon index\'i Supabase\'den yükleniyor...');

        // Load from Supabase
        if (typeof window.DAL !== 'undefined') {
            const dayTemplateIndex = await window.DAL.getTemplatesIndex();
            dayTemplates = dayTemplateIndex.templates || [];
            console.log('✅ Supabase\'den', dayTemplateIndex.totalCount, 'şablon yüklendi');
        } else {
            console.error('❌ DAL tanımlı değil!');
            dayTemplates = [];
        }
```

### 2️⃣ Template detail loading'i bul (TemplateManager.loadTemplates kullanımları)

**Bul ve Değiştir:**
- `TemplateManager.loadTemplates(selectedTemplateFilenames)` → `await loadFullTemplatesFromSupabase(selectedTemplateFilenames)`

**Yeni yardımcı fonksiyon ekle:**
```javascript
// Supabase'den full template data yükle
async function loadFullTemplatesFromSupabase(templateIds) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) return [];
    
    const fullTemplates = [];
    for (const id of templateIds) {
        try {
            const template = await window.DAL.getTemplate(id);
            if (template) fullTemplates.push(template);
        } catch (error) {
            console.error(`Template yüklenemedi: ${id}`, error);
        }
    }
    return fullTemplates;
}
```

## Dosya Konumları:
- patient_nutrition.html (satır 6461+)

## Test:
1. patient_nutrition.html'i aç
2. F12 Console'a bak
3. Gün Ekle modalını aç
4. Şu mesajı görmeli: "✅ Supabase'den 999 şablon yüklendi"
5. Şablon seç ve kaydet
6. Öğünlerin düzgün görüntülendiğini doğrula
