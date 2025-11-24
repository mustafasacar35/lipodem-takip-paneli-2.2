/**
 * 🔥 BROWSER CONSOLE İLE SUPABASE'E FOOD_LIST YÜKLEME
 * 
 * Bu komutu tarayıcı konsoluna yapıştırıp çalıştırın:
 */

// 1. food_list.json'u yükle
const foodListResponse = await fetch('/food_list.json?t=' + Date.now());
const foodList = await foodListResponse.json();

// 2. Supabase'e kaydet
const { data, error } = await window.supabase.from('app_settings').upsert({
    setting_key: 'food_list',
    value: foodList,
    description: 'Yemek veritabanı - tüm yemekler ve besin değerleri (normalized)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
}, {
    onConflict: 'setting_key'
});

if (error) {
    console.error('❌ Hata:', error);
} else {
    console.log('✅ food_list Supabase\'e yüklendi!');
    console.log(`📊 ${foodList.categories.length} kategori, ${foodList.categories.reduce((s,c)=>s+c.items.length,0)} yemek`);
}

// 3. Doğrulama yap
const verification = await window.supabase.from('app_settings').select('*').eq('setting_key', 'food_list').single();
if (verification.data) {
    const count = verification.data.value.categories.reduce((s,c)=>s+c.items.length,0);
    console.log(`✅ Doğrulama: ${count} yemek Supabase'de mevcut`);
}
