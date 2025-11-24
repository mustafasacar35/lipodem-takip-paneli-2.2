/**
 * 🏠 LOCAL-ONLY CONFIGURATION
 * ================================
 * Bu config SADECE local development için!
 * GitHub bağlantısı YOK
 * Tüm veriler local dosyalarda
 * 
 * KURULUM:
 * 1. Yeni Supabase hesabı aç (DEV için)
 * 2. supabase_DEV_SETUP.sql'i çalıştır
 * 3. Aşağıdaki bilgileri güncelle
 * 4. Bu dosyayı config.js olarak kaydet
 */

// 🌍 ORTAM TESPİTİ
var ENV = {
    // Localhost kontrolü
    isLocalhost: window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1',
    
    // GitHub Pages kontrolü (devre dışı)
    isGitHubPages: false,
    
    // Vercel kontrolü (devre dışı)
    isVercel: false,
    
    // Development mode (HER ZAMAN TRUE)
    isDevelopment: true,
    
    // Local-only mode (GitHub bağlantısı yok)
    localOnly: true
};

// 🗄️ SUPABASE CONFIGURATION
var SUPABASE_CONFIG = {
    // Production (KULLANMA!)
    production: {
        url: 'https://rorkccxpjndllxemsmlo.supabase.co',
        anonKey: 'PRODUCTION_KEY_BURADA_DEGIL'
    },
    
    // Development (YENİ HESAP!)
    development: {
        // 👇 YENİ SUPABASE BİLGİLERİ
        url: 'https://qvpeqxzaprgesgrgzmuo.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVxeHphcHJnZXNncmd6bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAzNjYsImV4cCI6MjA3OTAzNjM2Nn0.4Mo-9pgAk9vBHT48yVunuijSzqQX6cX07fCfDF48hLk',
        
        // Bağlantı testi için
        testQuery: 'SELECT COUNT(*) FROM messages'
    }
};

// 📁 GITHUB CONFIGURATION (DEVRE DIŞI!)
var GITHUB_CONFIG = {
    // Production - KULLANMA
    production: {
        owner: 'mustafasacar35',
        repo: 'lipodem-takip-paneli',
        branch: 'main',
        token: '',
        enabled: false // ❌ GitHub KAPALI
    },
    
    // Development - KULLANMA
    development: {
        owner: '',
        repo: '',
        branch: '',
        token: '',
        enabled: false // ❌ GitHub KAPALI
    }
};

// 🔔 ONESIGNAL CONFIGURATION (Opsiyonel)
var ONESIGNAL_CONFIG = {
    production: {
        githubPages: '45686db4-9813-42ef-939d-1402fe1622f7',
        vercel: '109f129c-cd73-4708-ba9a-b3c8103c52dc'
    },
    development: {
        // Aynı kullanabilirsin veya yeni hesap aç
        githubPages: '45686db4-9813-42ef-939d-1402fe1622f7',
        vercel: '109f129c-cd73-4708-ba9a-b3c8103c52dc'
    }
};

// 🎯 ACTIVE CONFIGURATION
var CONFIG = {
    // Ortam bilgisi
    environment: 'development-local',
    isLocalOnly: true,
    
    // Supabase (YENİ HESAP!)
    supabase: SUPABASE_CONFIG.development,
    
    // GitHub (DEVRE DIŞI!)
    github: {
        enabled: false,
        message: 'GitHub kullanımı kapalı. Tüm veriler local dosyalarda.'
    },
    
    // OneSignal
    onesignal: ONESIGNAL_CONFIG.development,
    
    // 🔧 DATA STORAGE STRATEGY
    storage: {
    // Local JSON dosyaları kullanma
    useLocalJSON: false, // ❌ JSON mod kapalı
        
    // Supabase kullan (tek kaynak)
    useSupabase: true, // ✅ Tüm okuma/yazma Supabase'te
        
        // GitHub KULLANMA
        useGitHub: false, // ❌ GitHub'a YAZMA
        
    // Dual-mode: Hem JSON hem Supabase
    dualMode: false, // ❌ Tek kaynak Supabase
        
        // Cache stratejisi
        cache: {
            enabled: true,
            ttl: 300000, // 5 dakika
            storage: 'localStorage'
        }
    },
    
    // 🖥️ LOCAL FILE PATHS
    localPaths: {
        patients: './hastalar/',
        templates: './templates/',
        foodList: './food_list.json',
        data: './data/'
    },
    
    // 🔐 API ENDPOINTS (Devre dışı)
    api: {
        enabled: false, // ❌ Vercel API'lerini kullanma
        baseUrl: '',
        endpoints: {
            updatePatient: '/api/update-patient', // KAPALI
            updateFoodList: '/api/update-food-list', // KAPALI
            updateDevices: '/api/update-devices' // KAPALI
        }
    },
    
    // 🐛 DEBUG SETTINGS
    debug: true,
    logLevel: 'verbose',
    showWarnings: true,
    
    // ⚠️ WARNINGS
    warnings: {
        githubDisabled: true,
        localOnly: true,
        noBackup: true
    }
};

// 🖨️ Başlangıç Mesajları
if (CONFIG.debug) {
    console.log('%c🏠 LOCAL-ONLY DEVELOPMENT MODE', 'background: #10b981; color: white; padding: 10px; font-weight: bold; font-size: 14px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981;');
    console.log('📍 Environment:', CONFIG.environment);
    console.log('🏠 Local Only:', CONFIG.isLocalOnly);
    console.log('🗄️ Supabase URL:', CONFIG.supabase.url);
    console.log('📁 GitHub:', CONFIG.github.enabled ? '✅ Enabled' : '❌ Disabled');
    console.log('📊 Storage Strategy:');
    console.log('  - Local JSON:', CONFIG.storage.useLocalJSON ? '✅' : '❌');
    console.log('  - Supabase:', CONFIG.storage.useSupabase ? '✅' : '❌');
    console.log('  - GitHub:', CONFIG.storage.useGitHub ? '✅' : '❌');
    console.log('  - Dual Mode:', CONFIG.storage.dualMode ? '✅' : '❌');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #10b981;');
    
    // Uyarılar
    if (CONFIG.warnings.githubDisabled) {
        console.warn('⚠️ GitHub bağlantısı KAPALI. Hiçbir veri GitHub\'a gitmeyecek.');
    }
    if (CONFIG.warnings.localOnly) {
        console.warn('⚠️ Local-only mode. Tüm veriler bu bilgisayarda kalacak.');
    }
    if (CONFIG.warnings.noBackup) {
        console.warn('⚠️ Düzenli yedekleme yapmanız önerilir.');
    }
}

// Supabase bağlantı kontrolü - ES Module tarafından oluşturulacak
if (CONFIG.storage.useSupabase) {
    console.log('🔌 Supabase bağlantısı kontrol ediliyor...');
    console.log('💡 Supabase client ES Module tarafından oluşturulacak');
    // ES Module (type="module" script) client'ı oluşturacak
    
    // Sayfa yüklendikten sonra bağlantı testi yap
    window.addEventListener('DOMContentLoaded', async () => {
        // Wait for Supabase client to be ready (it might be just the factory initially)
        let retries = 0;
        while ((!window.supabase || !window.supabase.from) && retries < 50) {
            await new Promise(r => setTimeout(r, 100));
            retries++;
        }

        if (!window.supabase || !window.supabase.from) {
            console.error('❌ window.supabase client hazır değil (timeout)!');
            return;
        }
        
        try {
            // Bağlantı testi
            const { data, error } = await window.supabase.from('messages').select('count');
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (OK)
                console.error('❌ Supabase bağlantı hatası:', error.message);
                console.log('💡 supabase_DEV_SETUP.sql dosyasını çalıştırdın mı?');
            } else {
                console.log('✅ Supabase bağlantısı başarılı!');
            }
        } catch (err) {
            console.error('❌ Bağlantı testi hatası:', err);
        }
    });
}

// 🌐 Export
window.APP_CONFIG = CONFIG;

// Helper Functions
window.CONFIG_HELPERS = {
    // GitHub'ın kapalı olduğunu kontrol et
    isGitHubDisabled() {
        return !CONFIG.github.enabled;
    },
    
    // Local JSON kullanılıyor mu?
    shouldUseLocalJSON() {
        return CONFIG.storage.useLocalJSON;
    },
    
    // Supabase kullanılıyor mu?
    shouldUseSupabase() {
        return CONFIG.storage.useSupabase;
    },
    
    // Dual-mode aktif mi?
    isDualMode() {
        return CONFIG.storage.dualMode;
    },
    
    // Local dosya yolu al
    getLocalPath(type) {
        return CONFIG.localPaths[type] || './';
    }
};

console.log('✅ Local-only config yüklendi. Use window.APP_CONFIG');
