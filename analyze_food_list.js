/**
 * food_list.json Analiz ve Standartlaştırma Scripti
 * Tüm parametreleri tespit edip eksik olanları default değerlerle tamamlar
 */

const fs = require('fs');

// food_list.json'u oku
const foodList = JSON.parse(fs.readFileSync('./food_list.json', 'utf8'));

// Tüm parametreleri topla
const allKeys = new Set();
const allCategories = new Set();
const allRoles = new Set();
const allDietTypes = new Set();
const allMealTypes = new Set();
const allTags = new Set();

let totalItems = 0;
let itemsWithMissingFields = 0;

// Her kategoriyi ve yemeği tara
foodList.categories.forEach(category => {
    allCategories.add(category.name);
    
    category.items.forEach(item => {
        totalItems++;
        
        // Tüm key'leri topla
        Object.keys(item).forEach(key => allKeys.add(key));
        
        // Role topla
        if (item.role) allRoles.add(item.role);
        
        // Diet types topla
        if (item.dietTypes && Array.isArray(item.dietTypes)) {
            item.dietTypes.forEach(dt => allDietTypes.add(dt));
        }
        
        // Meal types topla
        if (item.mealType && Array.isArray(item.mealType)) {
            item.mealType.forEach(mt => allMealTypes.add(mt));
        }
        
        // Tags topla
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => allTags.add(tag));
        }
    });
});

console.log('\n📊 FOOD_LIST.JSON ANALİZ RAPORU\n');
console.log('=' .repeat(80));
console.log(`📦 Toplam Kategori: ${allCategories.size}`);
console.log(`🍽️  Toplam Yemek: ${totalItems}`);
console.log('=' .repeat(80));

console.log('\n📋 TANIMLANAN TÜM PARAMETRELER:');
console.log(Array.from(allKeys).sort().map(k => `  - ${k}`).join('\n'));

console.log('\n\n🏷️  KATEGORİLER (' + allCategories.size + '):');
console.log(Array.from(allCategories).sort().map(c => `  - ${c}`).join('\n'));

console.log('\n\n🎭 ROLLER (' + allRoles.size + '):');
console.log(Array.from(allRoles).sort().map(r => `  - ${r}`).join('\n'));

console.log('\n\n🥗 DİYET TÜRLERİ (' + allDietTypes.size + '):');
console.log(Array.from(allDietTypes).sort().map(dt => `  - ${dt}`).join('\n'));

console.log('\n\n🍴 ÖĞÜN TÜRLERİ (' + allMealTypes.size + '):');
console.log(Array.from(allMealTypes).sort().map(mt => `  - ${mt}`).join('\n'));

console.log('\n\n🏷️  POPÜLER TAGLAR (ilk 50):');
const tagCounts = {};
foodList.categories.forEach(cat => {
    cat.items.forEach(item => {
        if (item.tags) {
            item.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
});
const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
console.log(sortedTags.map(([tag, count]) => `  - ${tag} (${count})`).join('\n'));

// Eksik parametreleri tespit et
console.log('\n\n⚠️  EKSİK PARAMETRE ANALİZİ:');
console.log('=' .repeat(80));

const requiredFields = [
    'name', 'category', 'calories', 'protein', 'carbs', 'fat',
    'minQuantity', 'maxQuantity', 'step', 'multiplier',
    'role', 'mealType', 'dietTypes',
    'keto', 'lowcarb', 'portionFixed',
    'fillerLunch', 'fillerDinner',
    'tags', 'compatibilityTags', 'incompatibilityTags',
    'seasonRange', 'isReversedSeason', 'notes'
];

const missingStats = {};
requiredFields.forEach(field => missingStats[field] = 0);

foodList.categories.forEach(category => {
    category.items.forEach(item => {
        let hasMissing = false;
        requiredFields.forEach(field => {
            if (item[field] === undefined || item[field] === null) {
                missingStats[field]++;
                hasMissing = true;
            }
        });
        if (hasMissing) itemsWithMissingFields++;
    });
});

console.log(`❌ Eksik parametreli yemek sayısı: ${itemsWithMissingFields} / ${totalItems} (%${((itemsWithMissingFields/totalItems)*100).toFixed(1)})\n`);

Object.entries(missingStats)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([field, count]) => {
        console.log(`  ${field.padEnd(25)} : ${count.toString().padStart(5)} eksik (%${((count/totalItems)*100).toFixed(1)})`);
    });

console.log('\n' + '=' .repeat(80));
console.log('✅ Analiz tamamlandı!\n');
