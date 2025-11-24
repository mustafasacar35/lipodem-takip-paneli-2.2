/**
 * 🛡️ NO-GITHUB GUARD
 * ==================
 * GitHub API çağrılarını engelleyen koruma katmanı
 * Tüm GitHub operasyonlarını local Supabase'e yönlendirir
 */

class NoGitHubGuard {
    constructor() {
        this.config = window.APP_CONFIG;
        this.blocked = [];
        this.redirected = [];
        
        console.log('🛡️ NoGitHubGuard initialized');
        
        // GitHub fonksiyonlarını engelle
        this.blockGitHubAPIs();
    }
    
    // GitHub API çağrılarını engelle
    blockGitHubAPIs() {
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = function(...args) {
            const url = args[0];
            
            // GitHub API URL'lerini kontrol et
            if (typeof url === 'string') {
                if (url.includes('github.com') || 
                    url.includes('githubusercontent.com') ||
                    url.includes('api.github.com')) {
                    
                    self.blocked.push({
                        url,
                        timestamp: new Date().toISOString(),
                        stack: new Error().stack
                    });
                    
                    console.warn('🛡️ GitHub API çağrısı ENGELLENDİ:', url);
                    console.log('💡 Bunun yerine local JSON veya Supabase kullan');
                    
                    // Reject et
                    return Promise.reject(new Error('GitHub API devre dışı! Local-only moddasınız.'));
                }
            }
            
            // Normal fetch devam etsin
            return originalFetch.apply(this, args);
        };
        
        console.log('✅ GitHub API guard aktif');
    }
    
    // Engellenen çağrıları göster
    showBlocked() {
        if (this.blocked.length === 0) {
            console.log('✅ Hiç GitHub çağrısı yapılmadı');
            return;
        }
        
        console.group('🛡️ Engellenen GitHub Çağrıları (' + this.blocked.length + ')');
        this.blocked.forEach((block, index) => {
            console.log(`${index + 1}. ${block.url}`);
            console.log('   Zaman:', block.timestamp);
        });
        console.groupEnd();
    }
    
    // Local JSON oku
    async readLocalJSON(filePath) {
        console.log('📄 Local JSON okunuyor:', filePath);
        
        try {
            // Cache kontrolü
            const cached = this._getFromCache(filePath);
            if (cached) {
                console.log('💨 Cache\'ten alındı');
                return cached;
            }
            
            // Fetch ile oku
            const response = await fetch(filePath + '?t=' + Date.now(), {
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache'e kaydet
            this._saveToCache(filePath, data);
            
            console.log('✅ Local JSON okundu:', filePath);
            return data;
            
        } catch (error) {
            console.error('❌ Local JSON okuma hatası:', error);
            throw error;
        }
    }
    
    // Local JSON yaz (Supabase'e)
    async writeLocalJSON(filePath, data) {
        console.log('💾 Veri kaydediliyor...');
        console.log('📍 Dosya:', filePath);
        
        // GitHub'a YAZMA
        console.warn('⚠️ GitHub devre dışı. Supabase\'e kaydediliyor...');
        
        try {
            // Supabase'e kaydet
            const saved = await this._saveToSupabase(filePath, data);
            
            if (saved) {
                console.log('✅ Supabase\'e kaydedildi');
                
                // Cache güncelle
                this._saveToCache(filePath, data);
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Kaydetme hatası:', error);
            throw error;
        }
    }
    
    // Supabase'e kaydet
    async _saveToSupabase(filePath, data) {
        if (!window.DAL) {
            console.error('❌ DataAccessLayer yüklü değil!');
            return false;
        }
        
        // Dosya tipine göre kaydet
        if (filePath.includes('hastalar/patient_')) {
            return await window.DAL.savePatient(data);
        } else if (filePath.includes('templates/day_')) {
            return await window.DAL.saveTemplate(data);
        } else if (filePath.includes('food_list.json')) {
            return await window.DAL.saveFoodList(data);
        }
        
        // Genel kayıt (JSONB olarak)
        return await window.DAL.saveGenericData(filePath, data);
    }
    
    // Cache yönetimi
    _getFromCache(key) {
        if (!this.config.storage.cache.enabled) return null;
        
        try {
            const cached = localStorage.getItem('cache_' + key);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            
            // TTL kontrolü
            if (age > this.config.storage.cache.ttl) {
                localStorage.removeItem('cache_' + key);
                return null;
            }
            
            return data;
        } catch (error) {
            return null;
        }
    }
    
    _saveToCache(key, data) {
        if (!this.config.storage.cache.enabled) return;
        
        try {
            const cached = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem('cache_' + key, JSON.stringify(cached));
        } catch (error) {
            console.warn('Cache kaydetme hatası:', error);
        }
    }
    
    // Cache temizle
    clearCache() {
        console.log('🧹 Cache temizleniyor...');
        
        const keys = Object.keys(localStorage);
        let cleared = 0;
        
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
                cleared++;
            }
        });
        
        console.log(`✅ ${cleared} cache entry temizlendi`);
    }
}

// Global instance
window.NoGitHub = new NoGitHubGuard();

// Helper fonksiyonlar
window.readJSON = (path) => window.NoGitHub.readLocalJSON(path);
window.writeJSON = (path, data) => window.NoGitHub.writeLocalJSON(path, data);

console.log('✅ NoGitHubGuard yüklendi');
console.log('💡 Kullanım:');
console.log('   await readJSON("./hastalar/patient_001.json")');
console.log('   await writeJSON("./hastalar/patient_001.json", data)');
console.log('   window.NoGitHub.showBlocked() - Engellenen çağrıları göster');
