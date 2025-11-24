/**
 * food_list.json -> Supabase Migration Script
 * app_settings tablosuna food_list key'i ile kaydeder
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials - config.js'den al
const SUPABASE_URL = 'https://cmxibkbkxojpebzhusoc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteGlia2JreG9qcGViemh1c29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NjQ3NTAsImV4cCI6MjA0NzI0MDc1MH0.BnbEpU0EGjjnbIEEf3BpklVFQbPB7L4zQ5o9gIH9qQE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateFoodList() {
    try {
        console.log('\n🚀 FOOD_LIST.JSON -> SUPABASE MİGRASYON BAŞLIYOR...\n');
        console.log('=' .repeat(80));
        
        // 1. food_list.json'u oku
        console.log('📥 food_list.json okunuyor...');
        const foodList = JSON.parse(fs.readFileSync('./food_list.json', 'utf8'));
        console.log(`✅ ${foodList.categories.length} kategori, toplam ${foodList.categories.reduce((sum, cat) => sum + cat.items.length, 0)} yemek yüklendi`);
        
        // 2. Supabase'de kontrol et
        console.log('\n🔍 Supabase kontrol ediliyor...');
        const { data: existing, error: checkError } = await supabase
            .from('app_settings')
            .select('*')
            .eq('setting_key', 'food_list')
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
            throw checkError;
        }
        
        if (existing) {
            console.log('⚠️  food_list zaten mevcut - güncelleniyor...');
            
            const { error: updateError } = await supabase
                .from('app_settings')
                .update({
                    value: foodList,
                    updated_at: new Date().toISOString()
                })
                .eq('setting_key', 'food_list');
            
            if (updateError) throw updateError;
            console.log('✅ Güncelleme başarılı!');
            
        } else {
            console.log('➕ Yeni kayıt oluşturuluyor...');
            
            const { error: insertError } = await supabase
                .from('app_settings')
                .insert({
                    setting_key: 'food_list',
                    value: foodList,
                    description: 'Yemek veritabanı - tüm yemekler ve besin değerleri',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            
            if (insertError) throw insertError;
            console.log('✅ Kayıt başarılı!');
        }
        
        // 3. Doğrulama yap
        console.log('\n🔍 Doğrulama yapılıyor...');
        const { data: verify, error: verifyError } = await supabase
            .from('app_settings')
            .select('value')
            .eq('setting_key', 'food_list')
            .single();
        
        if (verifyError) throw verifyError;
        
        const verifyCount = verify.value.categories.reduce((sum, cat) => sum + cat.items.length, 0);
        console.log(`✅ Doğrulama başarılı: ${verifyCount} yemek Supabase'de`);
        
        console.log('\n' + '=' .repeat(80));
        console.log('✅ MİGRASYON TAMAMLANDI!');
        console.log('📊 Özet:');
        console.log(`  - Kategori sayısı: ${foodList.categories.length}`);
        console.log(`  - Toplam yemek: ${foodList.categories.reduce((sum, cat) => sum + cat.items.length, 0)}`);
        console.log(`  - Supabase key: food_list`);
        console.log('=' .repeat(80) + '\n');
        
    } catch (error) {
        console.error('\n❌ HATA:', error.message);
        console.error(error);
        process.exit(1);
    }
}

migrateFoodList();
