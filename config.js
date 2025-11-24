/**
 * 🔧 ENVIRONMENT CONFIGURATION
 * Production ve Development ortamlarını ayıran config
 * 
 * KULLANIM:
 * - Production: config.example.js'yi config.js olarak kopyala ve PRODUCTION değerlerini gir
 * - Development: Bu dosya development ayarlarını içerir
 */

// 🌍 ORTAM TESPİTİ
const ENV = {
    // Localhost kontrolü
    isLocalhost: window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1',
    
    // GitHub Pages kontrolü
    isGitHubPages: window.location.hostname.includes('github.io'),
    
    // Vercel kontrolü
    isVercel: window.location.hostname.includes('vercel.app'),
    
    // Development mode (manuel olarak ayarlanabilir)
    isDevelopment: true // ✅ DEV modunda çalışmak için true yap
};

// 🗄️ SUPABASE CONFIGURATION
const SUPABASE_CONFIG = {
    production: {
        url: 'https://rorkccxpjndllxemsmlo.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvcmtjY3hwam5kbGx4ZW1zbWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTQxNTIsImV4cCI6MjA3NzkzMDE1Mn0.dVuUrVvBigxo2rMpUQcHKoemD7ovqejupi2OkkrxE7c'
    },
    development: {
        // 🆕 YENİ SUPABASE BİLGİLERİ
        url: 'https://qvpeqxzaprgesgrgzmuo.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVxeHphcHJnZXNncmd6bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAzNjYsImV4cCI6MjA3OTAzNjM2Nn0.4Mo-9pgAk9vBHT48yVunuijSzqQX6cX07fCfDF48hLk'
    }
};

// 📁 GITHUB CONFIGURATION (DEVRE DIŞI!)
const GITHUB_CONFIG = {
    production: {
        owner: 'mustafasacar35',
        repo: 'lipodem-takip-paneli',
        branch: 'main',
        token: '',
        enabled: false // ❌ GitHub KAPALI
    },
    development: {
        owner: '',
        repo: '',
        branch: '',
        token: '',
        enabled: false // ❌ GitHub KAPALI
    }
};

// 🔔 ONESIGNAL CONFIGURATION
const ONESIGNAL_CONFIG = {
    production: {
        githubPages: '45686db4-9813-42ef-939d-1402fe1622f7',
        vercel: '109f129c-cd73-4708-ba9a-b3c8103c52dc'
    },
    development: {
        // 🆕 DEV OneSignal App ID'leri (opsiyonel - production kullanabilirsin)
        githubPages: '45686db4-9813-42ef-939d-1402fe1622f7', // Aynı veya farklı
        vercel: '109f129c-cd73-4708-ba9a-b3c8103c52dc'
    }
};

// 🎯 ACTIVE CONFIGURATION
const CONFIG = {
    // Ortam bilgisi
    environment: 'development-local',
    isLocalOnly: true,
    
    // Supabase (YENİ HESAP!)
    supabase: SUPABASE_CONFIG.development,
    SUPABASE_URL: SUPABASE_CONFIG.development.url,
    SUPABASE_ANON_KEY: SUPABASE_CONFIG.development.anonKey,
    
    // GitHub (DEVRE DIŞI!)
    github: {
        enabled: false,
        message: 'GitHub kullanımı kapalı. Tüm veriler local dosyalarda.'
    },
    
    // OneSignal
    onesignal: ONESIGNAL_CONFIG.development,
    
    // Data Storage Strategy
    storage: {
    // Local JSON dosyaları kullanma
    useLocalJSON: false, // ❌ JSON mod kapalı, tüm okuma Supabase'ten
        
    // Supabase kullan (tek kaynak)
    useSupabase: true, // ✅ Tüm CRUD Supabase'te
        
        // GitHub KULLANMA
        useGitHub: false, // ❌ GitHub'a YAZMA
        
    // Dual-mode: Hem JSON hem Supabase
    dualMode: false, // ❌ Sadece Supabase
        
        // Cache stratejisi
        cache: {
            enabled: true,
            ttl: 300000, // 5 dakika
            storage: 'localStorage'
        }
    },
    
    // Debug
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

// Export - hem CONFIG hem APP_CONFIG olarak (uyumluluk için)
window.CONFIG = CONFIG;
window.APP_CONFIG = CONFIG;
