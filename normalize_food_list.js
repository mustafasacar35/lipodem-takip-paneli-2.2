/**
 * food_list.json Standartlaştırma Scripti
 * Eksik parametreleri default değerlerle tamamlar
 */

const fs = require('fs');

// food_list.json'u oku
const foodList = JSON.parse(fs.readFileSync('./food_list.json', 'utf8'));

console.log('\n🔧 FOOD_LIST.JSON STANDARTLAŞTIRMA BAŞLIYOR...\n');
console.log('=' .repeat(80));

// Standart şablon
const DEFAULTS = {
    minQuantity: 1,
    maxQuantity: 1,
    step: 0.5,
    multiplier: 1,
    keto: false,
    lowcarb: false,
    portionFixed: false,
    fillerLunch: false,
    fillerDinner: false,
    isReversedSeason: false,
    seasonRange: "[1,12]",
    tags: [],
    compatibilityTags: [],
    incompatibilityTags: [],
    dietTypes: [],
    notes: ""
};

let totalFixed = 0;
let missingFieldsFixed = {};

// Her kategoriyi işle
foodList.categories.forEach(category => {
    category.items.forEach(item => {
        let itemFixed = false;
        
        // Eksik parametreleri doldur
        Object.keys(DEFAULTS).forEach(field => {
            if (item[field] === undefined || item[field] === null) {
                item[field] = DEFAULTS[field];
                missingFieldsFixed[field] = (missingFieldsFixed[field] || 0) + 1;
                itemFixed = true;
            }
        });
        
        // Eski formatları temizle/düzelt
        if (item.min !== undefined) {
            item.minQuantity = item.min;
            delete item.min;
            itemFixed = true;
        }
        
        if (item.max !== undefined) {
            item.maxQuantity = item.max;
            delete item.max;
            itemFixed = true;
        }
        
        if (item.portion !== undefined) {
            delete item.portion;
            itemFixed = true;
        }
        
        if (item.fixedportion !== undefined) {
            item.portionFixed = item.fixedportion;
            delete item.fixedportion;
            itemFixed = true;
        }
        
        if (item.season !== undefined) {
            delete item.season;
            itemFixed = true;
        }
        
        if (item.dietType !== undefined && !item.dietTypes.length) {
            item.dietTypes = [item.dietType];
            delete item.dietType;
            itemFixed = true;
        }
        
        // dietTypes string içindeki değerleri normalize et
        if (item.ketojenik) {
            if (!item.dietTypes.includes('ketojenik')) {
                item.dietTypes.push('ketojenik');
            }
            delete item.ketojenik;
            itemFixed = true;
        }
        
        if (item.akdeniz) {
            if (!item.dietTypes.includes('akdeniz')) {
                item.dietTypes.push('akdeniz');
            }
            delete item.akdeniz;
            itemFixed = true;
        }
        
        if (item.dusukkarb) {
            if (!item.dietTypes.includes('dusukkarb')) {
                item.dietTypes.push('dusukkarb');
            }
            delete item.dusukkarb;
            itemFixed = true;
        }
        
        // Category yoksa veya küçük harfle yazılmışsa ekle/düzelt
        if (!item.category) {
            item.category = category.name;
            itemFixed = true;
        }
        
        // mealType array'i boşsa ve role varsa default ekle
        if (!item.mealType || !item.mealType.length) {
            if (item.role === 'breakfast' || category.name === 'KAHVALTI') {
                item.mealType = ['breakfast'];
            } else if (category.name.includes('ÖĞLEN') || category.name === 'OGLE') {
                item.mealType = ['lunch'];
            } else if (category.name.includes('AKŞAM') || category.name === 'AKSAM') {
                item.mealType = ['dinner'];
            } else if (item.role === 'snack') {
                item.mealType = ['snack'];
            } else {
                item.mealType = ['lunch', 'dinner']; // Default: öğle ve akşam
            }
            itemFixed = true;
        }
        
        // Role yoksa kategori ve isimden tahmin et
        if (!item.role) {
            if (item.name.includes('salata') || category.name === 'SALATALAR') {
                item.role = 'salad';
            } else if (item.name.includes('çorba') || category.name === 'ÇORBALAR') {
                item.role = 'soup';
            } else if (item.name.includes('tatlı') || category.name === 'TATLILAR') {
                item.role = 'dessert';
            } else if (item.name.includes('ekmek') || category.name === 'EKMEKLER') {
                item.role = 'bread';
            } else if (category.name === 'MEYVELER' || category.name === 'MEYVE') {
                item.role = 'fruit';
            } else if (category.name.includes('İÇECEK')) {
                item.role = 'drink';
            } else if (category.name.includes('ATIŞTIR') || category.name === 'APERATIF') {
                item.role = 'snack';
            } else {
                item.role = 'mainDish'; // Default
            }
            itemFixed = true;
        }
        
        if (itemFixed) {
            totalFixed++;
        }
    });
});

console.log(`✅ Toplam ${totalFixed} yemek düzeltildi\n`);
console.log('📊 Düzeltilen Alanlar:');
Object.entries(missingFieldsFixed)
    .sort((a, b) => b[1] - a[1])
    .forEach(([field, count]) => {
        console.log(`  ${field.padEnd(25)} : ${count.toString().padStart(5)} eklendi`);
    });

// Yeni dosyayı kaydet
fs.writeFileSync('./food_list_normalized.json', JSON.stringify(foodList, null, 2), 'utf8');

console.log('\n' + '=' .repeat(80));
console.log('✅ Standartlaştırma tamamlandı!');
console.log('📁 Yeni dosya: food_list_normalized.json');
console.log('=' .repeat(80) + '\n');
