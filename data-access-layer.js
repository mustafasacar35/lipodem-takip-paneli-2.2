/**
 * 🗄️ DATA ACCESS LAYER (DAL)
 * 
 * Bu katman JSON ve Supabase arasında köprü görevi görür.
 * Environment'a göre otomatik olarak doğru data source'u kullanır.
 * 
 * KULLANIM:
 * const dal = new DataAccessLayer();
 * const patient = await dal.getPatient('patient_001');
 * await dal.savePatient(patientData);
 */

class DataAccessLayer {
    constructor() {
        // Config yükle
        this.config = window.APP_CONFIG || {
            environment: 'production',
            storage: { useJSON: false, useSupabase: true, dualMode: false }
        };
        
        this.supabaseClient = null;
        this.debug = this.config.debug || false;
        
        this.log('📦 DataAccessLayer initialized', {
            environment: this.config.environment,
            useJSON: this.config.storage.useJSON,
            useSupabase: this.config.storage.useSupabase,
            dualMode: this.config.storage.dualMode
        });
    }
    
    // 🖨️ Debug log
    log(...args) {
        if (this.debug) {
            console.log('[DAL]', ...args);
        }
    }
    
    // 📝 Normalize text (Türkçe karakterleri düzelt)
    normalizeText(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/ç/g, 'c')
            .replace(/ğ/g, 'g')
            .replace(/ı/g, 'i')
            .replace(/i̇/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ş/g, 's')
            .replace(/ü/g, 'u')
            .replace(/[^a-z0-9]/g, '');
    }
    
    // 🔌 Supabase client'ı başlat
    async initSupabase() {
        if (this.supabaseClient) return this.supabaseClient;
        
        if (!this.config.storage.useSupabase) {
            this.log('⏭️ Supabase disabled in config');
            return null;
        }
        
        try {
            // Check if Supabase client already initialized in HTML page
            if (window.supabase && typeof window.supabase === 'object' && window.supabase.from) {
                // It's already a client instance, reuse it
                this.supabaseClient = window.supabase;
                this.log('✅ Supabase client reused from window.supabase');
                return this.supabaseClient;
            }
            
            // Wait for Supabase to be initialized (ES Module might still be loading)
            this.log('⏳ Waiting for Supabase client to be initialized...');
            let retries = 0;
            const maxRetries = 200; // 2 saniye max bekleme (artırıldı)
            
            // Wait until window.supabase exists AND has the .from method (meaning it's the client, not just the factory)
            while ((!window.supabase || !window.supabase.from) && retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 10));
                retries++;
            }
            
            if (window.supabase && window.supabase.from) {
                this.supabaseClient = window.supabase;
                this.log('✅ Supabase client initialized after waiting');
                return this.supabaseClient;
            }
            
            // Fallback: Create client manually if window.supabase is missing but config is available
            if (window.CONFIG && window.CONFIG.supabase) {
                this.log('⚠️ Creating Supabase client manually in DAL fallback...');
                // Simple fetch-based client if official client is missing
                this.supabaseClient = {
                    from: (table) => ({
                        select: (cols) => ({
                            eq: (col, val) => ({
                                single: async () => {
                                    // Minimal implementation for auth check
                                    const url = `${window.CONFIG.supabase.url}/rest/v1/${table}?select=${cols}&${col}=eq.${val}`;
                                    const res = await fetch(url, {
                                        headers: {
                                            'apikey': window.CONFIG.supabase.anonKey,
                                            'Authorization': `Bearer ${window.CONFIG.supabase.anonKey}`
                                        }
                                    });
                                    const data = await res.json();
                                    return { data: data[0], error: null };
                                }
                            }),
                            async then(resolve) {
                                const url = `${window.CONFIG.supabase.url}/rest/v1/${table}?select=${cols}`;
                                const res = await fetch(url, {
                                    headers: {
                                        'apikey': window.CONFIG.supabase.anonKey,
                                        'Authorization': `Bearer ${window.CONFIG.supabase.anonKey}`
                                    }
                                });
                                const data = await res.json();
                                resolve({ data, error: null });
                            }
                        })
                    })
                };
                window.supabase = this.supabaseClient;
                return this.supabaseClient;
            }

            throw new Error('Supabase client not initialized after waiting. Make sure ES Module is loading properly.');
            
        } catch (error) {
            console.error('❌ Supabase init error:', error);
            return null;
        }
    }
    
    // ========================================
    // 👤 PATIENT OPERATIONS
    // ========================================
    
    /**
     * Hasta listesini getir
     */
    async getPatientList() {
        this.log('📋 getPatientList()');
        
        // JSON Mode
        if (this.config.storage.useJSON) {
            return this._getPatientListFromJSON();
        }
        
        // Supabase Mode
        if (this.config.storage.useSupabase) {
            return this._getPatientListFromSupabase();
        }
        
        // Dual Mode: Her ikisini de getir ve merge et
        if (this.config.storage.dualMode) {
            const [jsonData, supabaseData] = await Promise.all([
                this._getPatientListFromJSON(),
                this._getPatientListFromSupabase()
            ]);
            return this._mergePatientLists(jsonData, supabaseData);
        }
    }
    
    async _getPatientListFromJSON() {
        this.log('📄 Getting patients from JSON...');
        try {
            const response = await fetch(`./hastalar/index.json?t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await response.json();
            return data.patients || [];
        } catch (error) {
            console.error('❌ JSON fetch error:', error);
            return [];
        }
    }
    
    async _getPatientListFromSupabase() {
        this.log('🗄️ Getting patients from Supabase...');
        const client = await this.initSupabase();
        if (!client) {
            console.error('❌ Supabase client initialization failed');
            return [];
        }
        
        try {
            console.log('🔍 Supabase query starting: SELECT * FROM patients');
            const { data, error } = await client
                .from('patients')
                .select('*')
                .order('created_at', { ascending: false });
            
            console.log('📊 Supabase query result:', { 
                hasData: !!data, 
                count: data?.length || 0, 
                hasError: !!error,
                error: error 
            });
            
            if (error) {
                console.error('❌ Supabase query error:', error);
                throw error;
            }
            
            if (!data || data.length === 0) {
                console.warn('⚠️ Supabase patients table is EMPTY or returned no data');
                console.warn('⚠️ You need to migrate patient data to Supabase first!');
            } else {
                console.log(`✅ Found ${data.length} patients in Supabase`);
                console.log('📋 First patient sample:', data[0]);
            }
            
            return data || [];
        } catch (error) {
            console.error('❌ Supabase query error:', error);
            console.error('❌ Error details:', error.message, error.details);
            return [];
        }
    }
    
    _mergePatientLists(jsonData, supabaseData) {
        // JSON'dan gelen hastaları Supabase ile birleştir
        const merged = [...jsonData];
        const jsonIds = new Set(jsonData.map(p => p.id));
        
        supabaseData.forEach(patient => {
            if (!jsonIds.has(patient.patient_id)) {
                merged.push({
                    id: patient.patient_id,
                    ...patient
                });
            }
        });
        
        return merged;
    }
    
    /**
     * Tek bir hastanın detayını getir
     */
    async getPatient(patientId) {
        this.log('👤 getPatient():', patientId);
        
        if (this.config.storage.useJSON) {
            return this._getPatientFromJSON(patientId);
        }
        
        if (this.config.storage.useSupabase) {
            return this._getPatientFromSupabase(patientId);
        }
        
        if (this.config.storage.dualMode) {
            // Önce JSON'dan dene, yoksa Supabase'den al
            const jsonData = await this._getPatientFromJSON(patientId);
            if (jsonData) return jsonData;
            return this._getPatientFromSupabase(patientId);
        }
    }
    
    async _getPatientFromJSON(patientId) {
        this.log('📄 Getting patient from JSON:', patientId);
        try {
            const response = await fetch(`./hastalar/${patientId}.json?t=${Date.now()}`, {
                cache: 'no-store'
            });
            return await response.json();
        } catch (error) {
            console.error('❌ JSON fetch error:', error);
            return null;
        }
    }
    
    async _getPatientFromSupabase(patientId) {
        this.log('🗄️ Getting patient from Supabase:', patientId);
        const client = await this.initSupabase();
        if (!client) return null;

        // Bazı kayıtlarda "id" (numeric), bazılarında "patient_id" (string) olabilir.
        // Önce tipine göre uygun alanla dene; bulunamazsa diğer alanla tekrar dene.
        const isNumericId = typeof patientId === 'number' || (/^\d+$/.test(String(patientId)));

        const tryFetch = async (column, value) => {
            const result = await client
                .from('patients')
                .select('*')
                .eq(column, value)
                .single();
            return result;
        };

        try {
            let primaryColumn = isNumericId ? 'id' : 'patient_id';
            let secondaryColumn = isNumericId ? 'patient_id' : 'id';

            // 1) Primary dene
            let { data, error } = await tryFetch(primaryColumn, patientId);
            if (!error && data) {
                // JSONB kolonundan verileri merge et (data.data tercih edilir)
                const jsonbData = data.data || data.patient_data;
                if (jsonbData && typeof jsonbData === 'object') {
                    // data.patient_data kolonunu merge'den ÖNCE sil, çünkü eski/yanlış veri olabilir
                    const { patient_data, ...cleanData } = data;
                    
                    const merged = {
                        ...cleanData,
                        patient_data: {
                            personalInfo: jsonbData.personalInfo || {},
                            weeks: jsonbData.weeks || [],
                            isAdmin: jsonbData.isAdmin || false,
                            notes: jsonbData.notes || '',
                            ...jsonbData
                        }
                    };
                    // Snake_case kolonları camelCase'e normalize et
                    if (merged.max_devices !== undefined) merged.maxDevices = merged.max_devices;
                    if (merged.session_days !== undefined) merged.sessionDays = merged.session_days;
                    if (merged.password_hash !== undefined) merged.passwordHash = merged.password_hash;
                    return merged;
                }
                return data;
            }

            // 2) Eğer bulunamadıysa secondary ile dene
            ({ data, error } = await tryFetch(secondaryColumn, patientId));
            if (!error && data) {
                const jsonbData = data.data || data.patient_data;
                if (jsonbData && typeof jsonbData === 'object') {
                    // data.patient_data kolonunu merge'den ÖNCE sil
                    const { patient_data, ...cleanData } = data;
                    
                    const merged = {
                        ...cleanData,
                        patient_data: {
                            personalInfo: jsonbData.personalInfo || {},
                            weeks: jsonbData.weeks || [],
                            isAdmin: jsonbData.isAdmin || false,
                            notes: jsonbData.notes || '',
                            ...jsonbData
                        }
                    };
                    // Snake_case kolonları camelCase'e normalize et
                    if (merged.max_devices !== undefined) merged.maxDevices = merged.max_devices;
                    if (merged.session_days !== undefined) merged.sessionDays = merged.session_days;
                    if (merged.password_hash !== undefined) merged.passwordHash = merged.password_hash;
                    return merged;
                }
                return data;
            }

            // 3) Yine yoksa null dön
            if (error) {
                // PGRST116: 0 row; PGRST123: multiple rows vb.
                this.log('🔎 Patient not found with both columns', { primaryColumn, secondaryColumn, error });
            }
            return null;
        } catch (error) {
            console.error('❌ Supabase query error:', error);
            return null;
        }
    }
    
    /**
     * Hasta kaydet/güncelle
     */
    async savePatient(patientData) {
        // patient_id veya id'yi normalize et
        const patientId = patientData.patient_id || patientData.id;
        this.log('💾 savePatient():', patientId);
        
        if (this.config.storage.useJSON) {
            return this._savePatientToGitHub(patientData);
        }
        
        if (this.config.storage.useSupabase) {
            return this._savePatientToSupabase(patientData);
        }
        
        if (this.config.storage.dualMode) {
            // Her ikisine de kaydet
            const [githubResult, supabaseResult] = await Promise.all([
                this._savePatientToGitHub(patientData),
                this._savePatientToSupabase(patientData)
            ]);
            return githubResult && supabaseResult;
        }
    }
    
    async _savePatientToGitHub(patientData) {
        this.log('📤 Saving patient to GitHub:', patientData.id);
        
        // GitHub'a kaydetme kodu buraya gelecek
        // Şimdilik API endpoint'i çağır
        try {
            const response = await fetch('/api/update-patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData)
            });
            return response.ok;
        } catch (error) {
            console.error('❌ GitHub save error:', error);
            return false;
        }
    }
    
    async _savePatientToSupabase(patientData) {
        // patient_id'yi normalize et
        const patientId = patientData.patient_id || patientData.id;
        this.log('💾 Saving patient to Supabase:', patientId);
        
        const client = await this.initSupabase();
        if (!client) {
            console.error('❌ Supabase client yok!');
            return false;
        }
        
        try {
            // Hasta bilgilerini hazırla
            const firstName = patientData.name || 
                            patientData.firstName || 
                            patientData.personalInfo?.name || 
                            patientData.username || '';
            const lastName = patientData.surname ||
                           patientData.lastName || 
                           patientData.personalInfo?.surname || '';
            
            console.log('📝 Hasta kaydediliyor:', {
                patient_id: patientId,
                name: firstName,
                surname: lastName,
                hasData: !!patientData
            });
            
            // Upsert verisi hazırla
            const upsertData = {
                patient_id: patientId,
                name: firstName || 'İsimsiz',
                surname: lastName || '',
                updated_at: new Date().toISOString()
            };
            
            // Tüm hasta verisini 'data' JSONB alanına kaydet (patient_data değil!)
            // personalInfo, weeks, notes, ipLogs, devices, settings vb. tüm yapı
            upsertData.data = {
                id: patientId,
                personalInfo: patientData.personalInfo || patientData.patient_data?.personalInfo || {},
                weeks: patientData.weeks || patientData.patient_data?.weeks || [],
                notes: patientData.notes || patientData.patient_data?.notes || '',
                ipLogs: patientData.ipLogs || patientData.patient_data?.ipLogs || [],
                devices: patientData.devices || patientData.patient_data?.devices || {},
                settings: patientData.settings || patientData.patient_data?.settings || {},
                isAdmin: patientData.isAdmin || patientData.patient_data?.isAdmin || false,
                status: patientData.status || 'active'
            };
            
            // Şifre varsa ekle
            if (patientData.password_hash || patientData.passwordHash) {
                upsertData.password_hash = patientData.password_hash || patientData.passwordHash;
            }
            
            // Status, session_days, max_devices varsa ekle (hızlı erişim için kolon)
            if (patientData.status) upsertData.status = patientData.status;
            
            console.log('🔍 DAL Save - Before column mapping:');
            console.log('  patientData.session_days:', patientData.session_days);
            console.log('  patientData.sessionDays:', patientData.sessionDays);
            console.log('  patientData.max_devices:', patientData.max_devices);
            console.log('  patientData.maxDevices:', patientData.maxDevices);
            
            if (patientData.session_days || patientData.sessionDays) {
                upsertData.session_days = patientData.sessionDays || patientData.session_days;  // camelCase önce!
                console.log('  → upsertData.session_days:', upsertData.session_days);
            }
            if (patientData.max_devices || patientData.maxDevices) {
                upsertData.max_devices = patientData.maxDevices || patientData.max_devices;  // camelCase önce!
                console.log('  → upsertData.max_devices:', upsertData.max_devices);
            }
            // Role: isAdmin true ise admin, aksi halde var olan role ya da 'patient'
            if (typeof patientData.isAdmin === 'boolean') {
                upsertData.role = patientData.isAdmin ? 'admin' : (patientData.role || 'patient');
            } else if (patientData.role) {
                upsertData.role = patientData.role;
            }
            if (patientData.username) upsertData.username = patientData.username;
            
            console.log('🚨 GÜNCEL KOD ÇALIŞIYOR - upsertData.data var mı?:', !!upsertData.data);
            console.log('📦 Supabase\'e gönderilecek veri:', upsertData);
            
            // Önce mevcut kayıt var mı kontrol et
            const { data: existing, error: fetchError } = await client
                .from('patients')
                .select('id')
                .eq('patient_id', patientId)
                .maybeSingle();
            
            if (fetchError) {
                console.error('❌ Mevcut kayıt kontrol hatası:', fetchError);
                throw fetchError;
            }
            
            let result;
            if (existing) {
                // Mevcut kayıt var, UPDATE yap
                console.log('🔄 Mevcut kayıt bulundu (id:', existing.id, '), güncelleniyor...');
                const { data, error } = await client
                    .from('patients')
                    .update(upsertData)
                    .eq('patient_id', patientId)
                    .select();
                
                if (error) throw error;
                result = data;
            } else {
                // Yeni kayıt, INSERT yap
                console.log('➕ Yeni kayıt oluşturuluyor...');
                const { data, error } = await client
                    .from('patients')
                    .insert(upsertData)
                    .select();
                
                if (error) throw error;
                result = data;
            }
            
            console.log('✅ Patient saved to Supabase:', result);
            return true;
        } catch (error) {
            console.error('❌ Supabase save error:', error);
            console.error('Error details:', error.message, error.details, error.hint);
            return false;
        }
    }
    
    /**
     * Hasta sil
     */
    async deletePatient(patientId) {
        this.log('🗑️ deletePatient():', patientId);
        
        if (this.config.storage.useSupabase) {
            return this._deletePatientFromSupabase(patientId);
        }
        
        // JSON mode - API kullan
        if (this.config.storage.useJSON) {
            return this._deletePatientFromGitHub(patientId);
        }
    }
    
    async _deletePatientFromSupabase(patientId) {
        this.log('🗑️ Deleting patient from Supabase:', patientId);
        const client = await this.initSupabase();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('patients')
                .delete()
                .eq('patient_id', patientId);
            
            if (error) throw error;
            this.log('✅ Patient deleted from Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase delete error:', error);
            return false;
        }
    }
    
    async _deletePatientFromGitHub(patientId) {
        // GitHub'dan silme API'si - şimdilik false döndür
        this.log('⚠️ GitHub deletion not implemented');
        return false;
    }
    
    // ========================================
    // 🍽️ FOOD OPERATIONS
    // ========================================
    
    async getFoodList() {
        this.log('🍽️ getFoodList()');
        
        if (this.config.storage.useJSON) {
            return this._getFoodListFromJSON();
        }
        
        if (this.config.storage.useSupabase) {
            return this._getFoodListFromSupabase();
        }
    }
    
    async _getFoodListFromJSON() {
        try {
            const response = await fetch('./food_list.json?t=' + Date.now());
            return await response.json();
        } catch (error) {
            console.error('❌ Food list JSON error:', error);
            return { categories: [] };
        }
    }
    
    async _getFoodListFromSupabase() {
        const client = await this.initSupabase();
        if (!client) return { categories: [] };
        
        try {
            const { data, error } = await client
                .from('foods')
                .select('*');
            
            if (error) throw error;
            
            // Kategorilere göre grupla
            const categories = this._groupFoodsByCategory(data);
            return { categories };
        } catch (error) {
            console.error('❌ Supabase food list error:', error);
            return { categories: [] };
        }
    }
    
    _groupFoodsByCategory(foods) {
        const grouped = {};
        foods.forEach(food => {
            if (!grouped[food.category]) {
                grouped[food.category] = {
                    name: food.category,
                    items: []
                };
            }
            grouped[food.category].items.push(food);
        });
        return Object.values(grouped);
    }

    // ========================================
    // 🃏 RECIPE CARD OPERATIONS
    // ========================================

    async getRecipeCards() {
        this.log('🃏 getRecipeCards()');
        const client = await this.initSupabase();
        if (!client) return [];

        try {
            const { data, error } = await client
                .from('recipe_cards')
                .select('*')
                .order('display_name', { ascending: true });

            if (error) throw error;

            return (data || []).map(card => ({
                id: card.id,
                name: card.display_name || card.filename,
                file: card.filename,
                filename: card.filename,
                category: card.category,
                tags: card.tags || [],
                size_bytes: card.size_bytes,
                download_url: card.image_url || card.public_url || card.url,
                image_url: card.image_url || card.public_url || card.url,
                storage_bucket: card.bucket || card.storage_bucket || 'recipe-cards',
                updated_at: card.updated_at
            }));
        } catch (error) {
            console.error('❌ Supabase recipe cards load error:', error);
            return [];
        }
    }
    
    // ========================================
    // 📋 TEMPLATE OPERATIONS
    // ========================================
    
    /**
     * Tüm şablonları getir
     */
    async getTemplateList() {
        this.log('📋 getTemplateList()');
        
        if (this.config.storage.useJSON) {
            return this._getTemplateListFromJSON();
        }
        
        if (this.config.storage.useSupabase) {
            return this._getTemplateListFromSupabase();
        }
        
        if (this.config.storage.dualMode) {
            const [jsonData, supabaseData] = await Promise.all([
                this._getTemplateListFromJSON(),
                this._getTemplateListFromSupabase()
            ]);
            return this._mergeTemplateLists(jsonData, supabaseData);
        }
    }
    
    async _getTemplateListFromJSON() {
        this.log('📄 Getting templates from JSON...');
        try {
            const response = await fetch(`./templates/index.json?t=${Date.now()}`, {
                cache: 'no-store'
            });
            const data = await response.json();
            return data.templates || [];
        } catch (error) {
            console.error('❌ Template JSON fetch error:', error);
            return [];
        }
    }
    
    async _getTemplateListFromSupabase() {
        this.log('🗄️ Getting templates from Supabase...');
        const client = await this.initSupabase();
        if (!client) return [];
        
        try {
            const { data, error } = await client
                .from('templates')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Supabase template query error:', error);
            return [];
        }
    }
    
    _mergeTemplateLists(jsonData, supabaseData) {
        const merged = [...jsonData];
        const jsonIds = new Set(jsonData.map(t => t.id));
        
        supabaseData.forEach(template => {
            if (!jsonIds.has(template.template_id)) {
                merged.push({
                    id: template.template_id,
                    ...template
                });
            }
        });
        
        return merged;
    }
    
    /**
     * Tek bir şablonu getir
     */
    async getTemplate(templateId) {
        this.log('📋 getTemplate():', templateId);
        
        if (this.config.storage.useJSON) {
            return this._getTemplateFromJSON(templateId);
        }
        
        if (this.config.storage.useSupabase) {
            return this._getTemplateFromSupabase(templateId);
        }
        
        if (this.config.storage.dualMode) {
            const jsonData = await this._getTemplateFromJSON(templateId);
            if (jsonData) return jsonData;
            return this._getTemplateFromSupabase(templateId);
        }
    }
    
    async _getTemplateFromJSON(templateId) {
        try {
            const response = await fetch(`./templates/${templateId}.json?t=${Date.now()}`);
            return await response.json();
        } catch (error) {
            console.error('❌ Template JSON error:', error);
            return null;
        }
    }
    
    async _getTemplateFromSupabase(templateId) {
        const client = await this.initSupabase();
        if (!client) return null;
        
        try {
            const { data, error } = await client
                .from('templates')
                .select('*')
                .eq('template_id', templateId)
                .single();
            
            if (error) throw error;
            return data?.data || data || null;
        } catch (error) {
            console.error('❌ Supabase template error:', error);
            return null;
        }
    }
    
    /**
     * Şablon kaydet/güncelle
     */
    async saveTemplate(templateData) {
        this.log('💾 saveTemplate():', templateData.id);
        
        if (this.config.storage.useSupabase) {
            return this._saveTemplateToSupabase(templateData);
        }
        
        if (this.config.storage.dualMode) {
            // Her ikisine de kaydet
            const supabaseResult = await this._saveTemplateToSupabase(templateData);
            return supabaseResult;
        }
        
        return false;
    }
    
    async _saveTemplateToSupabase(templateData) {
        this.log('💾 Saving template to Supabase:', templateData.id);
        const client = await this.initSupabase();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('templates')
                .upsert({
                    template_id: templateData.id,
                    name: templateData.name || '',
                    type: templateData.type || '',
                    calories: templateData.calories || 0,
                    protein: templateData.protein || 0,
                    carbs: templateData.carbs || 0,
                    fat: templateData.fat || 0,
                    data: templateData,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            this.log('✅ Template saved to Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase template save error:', error);
            return false;
        }
    }
    
    /**
     * Şablon sil
     */
    async deleteTemplate(templateId) {
        this.log('🗑️ deleteTemplate():', templateId);
        
        if (this.config.storage.useSupabase) {
            return this._deleteTemplateFromSupabase(templateId);
        }
        
        return false;
    }
    
    async _deleteTemplateFromSupabase(templateId) {
        this.log('🗑️ Deleting template from Supabase:', templateId);
        const client = await this.initSupabase();
        if (!client) return false;
        
        try {
            const { error } = await client
                .from('templates')
                .delete()
                .eq('template_id', templateId);
            
            if (error) throw error;
            this.log('✅ Template deleted from Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase template delete error:', error);
            return false;
        }
    }
    
    // ============================================
    // 🔗 FOOD MATCHING METHODS
    // ============================================
    
    /**
     * Tüm yemek eşleştirmelerini getir
     */
    async getFoodMatchings() {
        this.log('🔗 getFoodMatchings()');
        
        if (this.config.storage.useSupabase) {
            return this._getFoodMatchingsFromSupabase();
        }
        
        if (this.config.storage.useJSON) {
            return this._getFoodMatchingsFromJSON();
        }
        
        return [];
    }
    
    async _getFoodMatchingsFromJSON() {
        try {
            const response = await fetch('data/manuel_eslestirmeler.json');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ JSON read error:', error);
            return { eslestirmeler: {} };
        }
    }
    
    async _getFoodMatchingsFromSupabase() {
        const client = await this.initSupabase();
        if (!client) return [];
        
        try {
            const { data, error } = await client
                .from('food_matchings')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Supabase query error:', error);
            return [];
        }
    }
    
    /**
     * Yemek eşleştirmesi kaydet
     */
    async saveFoodMatching(matchingData) {
        this.log('💾 saveFoodMatching():', matchingData);
        
        if (this.config.storage.useSupabase) {
            return this._saveFoodMatchingToSupabase(matchingData);
        }
        
        return false;
    }
    
    async _saveFoodMatchingToSupabase(matchingData) {
        const client = await this.initSupabase();
        if (!client) return false;
        
        try {
            const foodName = matchingData.food_name || matchingData.original_food || matchingData.food || '';
            const matchType = matchingData.source || matchingData.type || 'manuel';
            if (!foodName || !matchingData.matched_food) {
                console.error('❌ Eksik matching verisi:', matchingData);
                return false;
            }
            const payload = {
                food_name: foodName,
                matched_food: matchingData.matched_food,
                type: matchType,
                data: matchingData,
                updated_at: new Date().toISOString()
            };
            const { error } = await client
                .from('food_matchings')
                .upsert(payload);
            
            if (error) throw error;
            this.log('✅ Food matching saved to Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase matching save error:', error);
            return false;
        }
    }
    
    /**
     * Yasaklı eşleştirmeleri getir
     */
    async getFoodBlacklist() {
        this.log('🚫 getFoodBlacklist()');
        
        if (this.config.storage.useSupabase) {
            return this._getFoodBlacklistFromSupabase();
        }
        
        if (this.config.storage.useJSON) {
            return this._getFoodBlacklistFromJSON();
        }
        
        return [];
    }
    
    async _getFoodBlacklistFromJSON() {
        try {
            const response = await fetch('data/eslesmeme_kurallari.json');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ JSON read error:', error);
            return { kurallar: {} };
        }
    }
    
    async _getFoodBlacklistFromSupabase() {
        const client = await this.initSupabase();
        if (!client) return {};
        
        try {
            const { data, error } = await client
                .from('food_blacklist')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // 🔥 Array'i Object'e çevir (yemek adı → yasak kartlar)
            const blacklistObj = {};
            if (data && data.length > 0) {
                data.forEach(item => {
                    const foodName = item.food_name;
                    const blockedFood = item.blocked_food;
                    
                    if (!blacklistObj[foodName]) {
                        blacklistObj[foodName] = {
                            orijinalMetin: foodName,
                            yasakliKartlar: [],
                            eklemeTarihi: item.created_at
                        };
                    }
                    
                    // Duplike önleme
                    if (!blacklistObj[foodName].yasakliKartlar.includes(blockedFood)) {
                        blacklistObj[foodName].yasakliKartlar.push(blockedFood);
                    }
                });
            }
            
            return blacklistObj;
        } catch (error) {
            console.error('❌ Supabase query error:', error);
            return {};
        }
    }
    
    /**
     * Yasaklı eşleştirme kaydet
     */
    async saveFoodBlacklist(blacklistData) {
        this.log('💾 saveFoodBlacklist():', blacklistData);
        
        if (this.config.storage.useSupabase) {
            return this._saveFoodBlacklistToSupabase(blacklistData);
        }
        
        return false;
    }
    
    async _saveFoodBlacklistToSupabase(blacklistData) {
        const client = await this.initSupabase();
        if (!client) return false;
        
        try {
            const foodName = blacklistData.food_name || blacklistData.original_food || blacklistData.food || '';
            const blockedFood = blacklistData.blocked_food || blacklistData.blocked || blacklistData.target || '';
            const blacklistType = blacklistData.source || blacklistData.type || 'tarif_yasak';
            if (!foodName || !blockedFood) {
                console.error('❌ Eksik blacklist verisi:', blacklistData);
                return false;
            }
            const payload = {
                food_name: foodName,
                blocked_food: blockedFood,
                reason: blacklistData.reason || blacklistData.aciklama || '',
                type: blacklistType,
                data: blacklistData,
                updated_at: new Date().toISOString()
            };
            const { error } = await client
                .from('food_blacklist')
                .upsert(payload);
            
            if (error) throw error;
            this.log('✅ Food blacklist saved to Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase blacklist save error:', error);
            return false;
        }
    }

    // ==================== ALTERNATIVE BLACKLIST OPERATIONS ====================
    
    /**
     * Get alternative blacklist from Supabase
     * @returns {Promise<Array>} Array of alternative blacklist objects
     */
    async getAlternativeBlacklist() {
        this.log('🚫 getAlternativeBlacklist()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available for alternative blacklist');
            return [];
        }
        
        try {
            const { data, error } = await client
                .from('alternative_blacklist')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.log(`✅ Alternative blacklist loaded from Supabase: ${data?.length || 0} rules`);
            return data || [];
        } catch (error) {
            console.error('❌ Supabase alternative blacklist load error:', error);
            return [];
        }
    }
    
    /**
     * Save alternative blacklist rule to Supabase
     * @param {Object} rule - Alternative blacklist rule object
     * @returns {Promise<boolean>} Success status
     */
    async saveAlternativeBlacklist(rule) {
        this.log('💾 saveAlternativeBlacklist()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available for alternative blacklist save');
            return false;
        }
        
        try {
            const { error } = await client
                .from('alternative_blacklist')
                .upsert({
                    original_food: rule.orijinalYemek || rule.original_food,
                    blocked_alternative: rule.yasakliAlternatif || rule.blocked_alternative,
                    reason: rule.sebep || rule.reason || '',
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            this.log('✅ Alternative blacklist rule saved to Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase alternative blacklist save error:', error);
            return false;
        }
    }
    
    // ============================================================
    // ADMIN SETTINGS METHODS (settings/config.json replacement)
    // ============================================================
    
    /**
     * Get app settings from Supabase
     * @returns {Promise<Object>} Settings object
     */
    async getSettings() {
        this.log('📥 getSettings()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available, returning default settings');
            return this.getDefaultSettings();
        }
        
        try {
            const { data, error } = await client
                .from('app_settings')
                .select('*')
                .eq('id', '00000000-0000-0000-0000-000000000001')
                .single();
            
            if (error) throw error;
            this.log('✅ Settings loaded from Supabase');
            return data || this.getDefaultSettings();
        } catch (error) {
            console.error('❌ Supabase settings load error:', error);
            return this.getDefaultSettings();
        }
    }
    
    /**
     * Save app settings to Supabase
     * @param {Object} settings - Settings object
     * @returns {Promise<boolean>} Success status
     */
    async saveSettings(settings) {
        this.log('💾 saveSettings()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available for settings save');
            return false;
        }
        
        try {
            const { error} = await client
                .from('app_settings')
                .upsert({
                    id: '00000000-0000-0000-0000-000000000001',
                    ...settings,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            this.log('✅ Settings saved to Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase settings save error:', error);
            return false;
        }
    }
    
    /**
     * Get default settings (fallback)
     * @returns {Object} Default settings
     */
    getDefaultSettings() {
        return {
            default_alternatives: 4,
            enable_tag_filter: true,
            calorie_tolerance: 100,
            template_reuse_weeks: 4,
            diet_formulas: {
                keto: { carb: 0.3, protein: 0.8, fat: 1.2 },
                lowcarb: { carb: 0.6, protein: 0.8, fat: 1 },
                mediterranean: { carb: 0.6, protein: 0.8, fat: 1 }
            },
            activity_multipliers: {
                "1": 0.8,
                "2": 0.9,
                "3": 1.0,
                "4": 1.1,
                "5": 1.2
            },
            tag_exclusions: ['çorba', 'çorbası', 'ekmeği', 'ekmek', 'keto', 'lowcarb', 'salata', 'tatlı', 'yumurta'],
            tag_exemptions: {
                roles: ['bread', 'soup'],
                categories: ['TOSTLAR']
            },
            rotation_enabled: true,
            rotation_daily_alternatives: 4,
            rotation_reset_day: null,
            filter_criteria: {
                tarifKartiFiltresi: { userMode: 'zorunlu', initialState: 'aktif' },
                veritabaniFiltreleme: { userMode: 'opsiyonel', initialState: 'pasif' },
                tagFiltresi: { userMode: 'zorunlu', initialState: 'aktif' },
                kaloriFiltresi: { userMode: 'opsiyonel', initialState: 'pasif' },
                sablonFiltresi: { userMode: 'zorunlu', initialState: 'aktif' }
            },
            score_criteria: {
                protein: true,
                carbs: true,
                fat: true,
                calories: true
            },
            scoring_mode: 'simple',
            sensitivity_divider: 10,
            badge_visibility: {
                protein: true,
                carbs: true,
                fat: true,
                calories: true,
                category: true,
                tags: true
            },
            feature_visibility: {
                pdfButton: true
            }
        };
    }
    
    // ============================================================
    // ADMIN USERS METHODS (settings/admins.js replacement)
    // ============================================================
    
    /**
     * Get all admin users from Supabase
     * @returns {Promise<Array>} Array of admin users
     */
    async getAdmins() {
        this.log('📥 getAdmins()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available');
            return [];
        }
        
        try {
            const { data, error } = await client
                .from('admins')
                .select('*')
                .eq('is_active', true)
                .order('username');
            
            if (error) throw error;
            this.log(`✅ ${data.length} admins loaded from Supabase`);
            return data;
        } catch (error) {
            console.error('❌ Supabase admins load error:', error);
            return [];
        }
    }
    
    /**
     * Save admin user to Supabase
     * @param {Object} admin - Admin user object
     * @returns {Promise<boolean>} Success status
     */
    async saveAdmin(admin) {
        this.log('💾 saveAdmin()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available for admin save');
            return false;
        }
        
        try {
            const { error } = await client
                .from('admins')
                .upsert({
                    username: admin.username,
                    password_hash: admin.password_hash || admin.password,
                    roles: admin.roles || ['admin'],
                    is_active: admin.is_active !== false,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            this.log('✅ Admin saved to Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase admin save error:', error);
            return false;
        }
    }
    
    /**
     * Delete admin user from Supabase
     * @param {string} username - Admin username
     * @returns {Promise<boolean>} Success status
     */
    async deleteAdmin(username) {
        this.log('🗑️ deleteAdmin()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available for admin delete');
            return false;
        }
        
        try {
            const { error } = await client
                .from('admins')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('username', username);
            
            if (error) throw error;
            this.log('✅ Admin deleted from Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase admin delete error:', error);
            return false;
        }
    }
    
    /**
     * Get patient admins from Supabase
     * @returns {Promise<Array>} Array of patient usernames
     */
    async getPatientAdmins() {
        this.log('📥 getPatientAdmins()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available');
            return [];
        }
        
        try {
            const { data, error } = await client
                .from('patient_admins')
                .select('patient_username')
                .order('patient_username');
            
            if (error) throw error;
            this.log(`✅ ${data.length} patient admins loaded from Supabase`);
            return data.map(row => row.patient_username);
        } catch (error) {
            console.error('❌ Supabase patient admins load error:', error);
            return [];
        }
    }
    
    /**
     * Save patient admin to Supabase
     * @param {string} patientUsername - Patient username
     * @returns {Promise<boolean>} Success status
     */
    async savePatientAdmin(patientUsername) {
        this.log('💾 savePatientAdmin()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available for patient admin save');
            return false;
        }
        
        try {
            const { error } = await client
                .from('patient_admins')
                .upsert({
                    patient_username: patientUsername,
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            this.log('✅ Patient admin saved to Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase patient admin save error:', error);
            return false;
        }
    }
    
    /**
     * Delete patient admin from Supabase
     * @param {string} patientUsername - Patient username
     * @returns {Promise<boolean>} Success status
     */
    async deletePatientAdmin(patientUsername) {
        this.log('🗑️ deletePatientAdmin()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available for patient admin delete');
            return false;
        }
        
        try {
            const { error } = await client
                .from('patient_admins')
                .delete()
                .eq('patient_username', patientUsername);
            
            if (error) throw error;
            this.log('✅ Patient admin deleted from Supabase');
            return true;
        } catch (error) {
            console.error('❌ Supabase patient admin delete error:', error);
            return false;
        }
    }
    
    /**
     * Bulk save templates to Supabase (for file upload feature)
     * @param {Array} templates - Array of template objects
     * @returns {Promise<Object>} Result object with added/skipped counts
     */
    async bulkSaveTemplates(templates) {
        this.log('💾 bulkSaveTemplates()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available for bulk template save');
            return { added: 0, skipped: 0, errors: [] };
        }
        
        try {
            let added = 0;
            let skipped = 0;
            const errors = [];
            const total = templates.length;
            
            console.log(`🚀 Başlıyor: ${total} şablon yüklenecek...`);
            
            for (let i = 0; i < templates.length; i++) {
                const template = templates[i];
                
                // Her 50 şablonda bir progress göster
                if (i > 0 && i % 50 === 0) {
                    console.log(`📊 İlerleme: ${i}/${total} (${Math.round(i/total*100)}%) - Eklenen: ${added}, Atlanan: ${skipped}`);
                }
                
                try {
                    // Check if template already exists (use maybeSingle to avoid 406 error)
                    const { data: existing, error: checkError } = await client
                        .from('templates')
                        .select('id')
                        .eq('id', template.id)
                        .maybeSingle();
                    
                    if (existing) {
                        skipped++;
                        continue;
                    }
                    
                    // Insert new template
                    const { error } = await client
                        .from('templates')
                        .insert({
                            id: template.id,
                            name: template.name,
                            type: template.type || 'day',
                            gun_adi: template.gunAdi,
                            diet_type: template.dietType,
                            total_calories: template.totalCalories,
                            total_macros: template.totalMacros,
                            ogunler: template.ogunler || [],
                            tags: template.tags || [],
                            created_date: template.createdDate
                        });
                    
                    if (error) throw error;
                    added++;
                } catch (error) {
                    const errorDetail = {
                        template: template.name || template.id,
                        error: error.message,
                        hint: error.hint,
                        details: error.details,
                        code: error.code
                    };
                    errors.push(errorDetail);
                    
                    // İlk 3 hatayı detaylı logla
                    if (errors.length <= 3) {
                        console.error(`❌ Hata #${errors.length}:`, errorDetail);
                        console.log('Problematik template:', template);
                    }
                }
            }
            
            console.log(`✅ Tamamlandı! Toplam: ${total}, Eklenen: ${added}, Atlanan: ${skipped}, Hata: ${errors.length}`);
            
            this.log(`✅ Bulk template save: ${added} added, ${skipped} skipped`);
            return { added, skipped, errors };
        } catch (error) {
            console.error('❌ Supabase bulk template save error:', error);
            return { added: 0, skipped: 0, errors: [error.message] };
        }
    }

    /**
     * Get templates index (metadata summary)
     * @returns {Promise<Object>} {totalCount, templates: [...]}
     */
    async getTemplatesIndex() {
        this.log('📋 getTemplatesIndex()');
        const client = await this.initSupabase();
        if (!client) {
            this.log('⚠️ Supabase not available, returning empty index');
            return { totalCount: 0, templates: [] };
        }

        try {
            const { data, error } = await client
                .from('templates_index')
                .select('*')
                .single();

            if (error) throw error;

            return {
                totalCount: data.total_count || 0,
                templates: data.templates || []
            };
        } catch (error) {
            console.error('❌ Supabase templates index load error:', error);
            return { totalCount: 0, templates: [] };
        }
    }

    /**
     * Get single template by ID
     * @param {string} templateId - Template ID
     * @returns {Promise<Object|null>} Template object or null
     */
    async getTemplate(templateId) {
        this.log(`📄 getTemplate(${templateId})`);
        const client = await this.initSupabase();
        if (!client) return null;

        try {
            const { data, error } = await client
                .from('templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (error) throw error;

            // Reconstruct original format
            return {
                id: data.id,
                name: data.name,
                type: data.type,
                gunAdi: data.gun_adi,
                dietType: data.diet_type,
                totalCalories: data.total_calories,
                totalMacros: data.total_macros,
                ogunler: data.ogunler,
                tags: data.tags || [],
                createdDate: data.created_date
            };
        } catch (error) {
            console.error('❌ Supabase template load error:', error);
            return null;
        }
    }

    /**
     * Get multiple templates by IDs (BULK - FAST!)
     * Uses batching to avoid URL length limits (Supabase max ~8000 chars)
     * @param {string[]} templateIds - Array of template IDs
     * @returns {Promise<Object[]>} Array of template objects
     */
    async getTemplatesBulk(templateIds) {
        this.log(`📦 getTemplatesBulk(${templateIds.length} templates)`);
        const client = await this.initSupabase();
        if (!client) return [];

        // Batch size: 100 templates per request (safe for URL length)
        const BATCH_SIZE = 100;
        const allResults = [];

        try {
            // Split into batches
            for (let i = 0; i < templateIds.length; i += BATCH_SIZE) {
                const batch = templateIds.slice(i, i + BATCH_SIZE);
                this.log(`📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(templateIds.length / BATCH_SIZE)}: ${batch.length} templates`);

                const { data, error } = await client
                    .from('templates')
                    .select('*')
                    .in('id', batch);

                if (error) throw error;

                // Reconstruct original format and add to results
                const formatted = data.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    gunAdi: d.gun_adi,
                    dietType: d.diet_type,
                    totalCalories: d.total_calories,
                    totalMacros: d.total_macros,
                    ogunler: d.ogunler,
                    tags: d.tags || [],
                    createdDate: d.created_date,
                    filename: `${d.id}.json`
                }));

                allResults.push(...formatted);
            }

            this.log(`✅ Total loaded: ${allResults.length} templates`);
            return allResults;
        } catch (error) {
            console.error('❌ Supabase bulk template load error:', error);
            return [];
        }
    }

    /**
     * 📅 Gün şablonlarını Supabase'den yükle
     */
    async getDayTemplates() {
        try {
            this.log('📥 Loading day templates from Supabase...');
            const client = await this.initSupabase();
            
            if (!client) {
                console.warn('⚠️ Supabase not available, returning empty array');
                return [];
            }

            const { data, error } = await client
                .from('templates')
                .select('*')
                .eq('type', 'day')
                .order('name', { ascending: true });

            if (error) {
                console.error('❌ Supabase day templates error:', error);
                return [];
            }

            this.log(`✅ Loaded ${data.length} day templates from Supabase`);
            
            // 🔍 DEBUG: İlk şablonu kontrol et
            if (data.length > 0) {
                const first = data[0];
                console.log('🔍 İLK SUPABASE ŞABLON (HAM VERİ):', {
                    name: first.name,
                    kalori_hedefi: first.kalori_hedefi,
                    protein_hedefi: first.protein_hedefi,
                    ogunler: first.ogunler ? 'VAR' : 'YOK',
                    ogunSayisi: first.ogunler?.length,
                    ilkOgun: first.ogunler?.[0],
                    ilkYemek: first.ogunler?.[0]?.yemekler?.[0],
                    diet_type: first.diet_type
                });
            }
            
            // Format: Supabase JSONB alanlarını düzelt
            return data.map(t => {
                // ✅ Eğer kalori_hedefi boşsa, ogunler'den hesapla
                let kaloriHedefi = t.kalori_hedefi;
                let proteinHedefi = t.protein_hedefi;
                let karbonhidratHedefi = t.karbonhidrat_hedefi;
                let yagHedefi = t.yag_hedefi;
                
                // Eğer hedef alanlar null/undefined ve ogunler varsa, hesapla
                if (!kaloriHedefi && t.ogunler && Array.isArray(t.ogunler)) {
                    const totals = t.ogunler.reduce((sum, ogun) => {
                        if (ogun.yemekler && Array.isArray(ogun.yemekler)) {
                            ogun.yemekler.forEach(yemek => {
                                // ✅ Tüm olası field isimlerini dene
                                // Kalori: enerji, kalori, calories
                                sum.kalori += parseFloat(yemek.enerji || yemek.kalori || yemek.calories) || 0;
                                // Protein: protein
                                sum.protein += parseFloat(yemek.protein) || 0;
                                // Karbonhidrat: karbonhidrat, karb, carbs
                                sum.karb += parseFloat(yemek.karbonhidrat || yemek.karb || yemek.carbs) || 0;
                                // Yağ: yag, fat
                                sum.yag += parseFloat(yemek.yag || yemek.fat) || 0;
                            });
                        }
                        return sum;
                    }, { kalori: 0, protein: 0, karb: 0, yag: 0 });
                    
                    console.log(`🔍 HESAPLANAN MAKROLAR (${t.name}):`, totals);
                    
                    kaloriHedefi = totals.kalori;
                    proteinHedefi = totals.protein;
                    karbonhidratHedefi = totals.karb;
                    yagHedefi = totals.yag;
                }
                
                return {
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    dietType: t.diet_type,
                    tags: t.tags || [],
                    ogunler: t.ogunler || [],
                    kaloriHedefi: kaloriHedefi,
                    proteinHedefi: proteinHedefi,
                    karbonhidratHedefi: karbonhidratHedefi,
                    yagHedefi: yagHedefi,
                    createdDate: t.created_at,
                    filename: `${t.id}.json`
                };
            });
        } catch (error) {
            console.error('❌ getDayTemplates error:', error);
            return [];
        }
    }

    /**
     * 🍽️ Öğün şablonlarını Supabase'den yükle
     */
    async getMealTemplates() {
        try {
            this.log('📥 Loading meal templates from Supabase...');
            const client = await this.initSupabase();
            
            if (!client) {
                console.warn('⚠️ Supabase not available, returning empty array');
                return [];
            }

            const { data, error } = await client
                .from('templates')
                .select('*')
                .eq('type', 'meal')
                .order('name', { ascending: true });

            if (error) {
                console.error('❌ Supabase meal templates error:', error);
                return [];
            }

            this.log(`✅ Loaded ${data.length} meal templates from Supabase`);
            
            return data.map(t => ({
                id: t.id,
                name: t.name,
                ogunAdi: t.ogun_adi,
                dietType: t.diet_type, // ← YENİ: Diyet türü
                yemekler: t.yemekler || [],
                tags: t.tags || [],
                toplamKalori: t.toplam_kalori,
                toplamProtein: t.toplam_protein,
                toplamKarbonhidrat: t.toplam_karbonhidrat,
                toplamYag: t.toplam_yag,
                createdDate: t.created_at
            }));
        } catch (error) {
            console.error('❌ getMealTemplates error:', error);
            return [];
        }
    }

    /**
     * 🔥 YENİ: App Settings (config.json) - Supabase'den yükle
     */
    async getAppSettings() {
        try {
            console.log('[DAL] 📥 Loading app settings from Supabase...');
            const client = await this.initSupabase();
            
            if (!client) {
                console.warn('⚠️ Supabase not available for app settings');
                return null;
            }

            const { data, error } = await client
                .from('app_settings')
                .select('*')
                .eq('setting_key', 'config')
                .single();

            if (error) {
                console.error('❌ Supabase app_settings error:', error);
                return null;
            }

            if (!data) {
                console.warn('⚠️ Config not found in Supabase');
                return null;
            }

            console.log('✅ App settings loaded from Supabase');
            return data.value; // JSONB value
        } catch (error) {
            console.error('❌ getAppSettings error:', error);
            return null;
        }
    }

    /**
     * 🔥 YENİ: Food Mappings (manuel_eslestirmeler.json) - JSONB VERSION
     */
    async getFoodMappings() {
        try {
            console.log('[DAL] 📥 Loading food mappings from Supabase (JSONB)...');
            const client = await this.initSupabase();
            
            if (!client) return {};

            const { data, error } = await client
                .from('app_settings')
                .select('*')
                .eq('setting_key', 'manuel_eslestirmeler')
                .single();

            if (error) {
                console.error('❌ Supabase food_mappings error:', error);
                return {};
            }

            if (!data || !data.value) {
                console.warn('⚠️ Manuel eşleştirmeler bulunamadı');
                return {};
            }

            const mappings = data.value.eslestirmeler || data.value;
            console.log(`✅ Loaded ${Object.keys(mappings).length} food mappings`);
            return mappings;
        } catch (error) {
            console.error('❌ getFoodMappings error:', error);
            return {};
        }
    }

    /**
     * 🔥 YENİ: Food Restrictions (eslesmeme_kurallari.json) - JSONB VERSION
     */
    async getFoodRestrictions() {
        try {
            console.log('[DAL] 📥 Loading food restrictions from Supabase (JSONB)...');
            const client = await this.initSupabase();
            
            if (!client) return {};

            const { data, error } = await client
                .from('app_settings')
                .select('*')
                .eq('setting_key', 'eslesmeme_kurallari')
                .single();

            if (error) {
                console.error('❌ Supabase food_restrictions error:', error);
                return {};
            }

            if (!data || !data.value) {
                console.warn('⚠️ Yasak kurallar bulunamadı');
                return {};
            }

            const restrictions = data.value.kurallar?.eslesmemeKurallari || data.value.eslesmemeKurallari || data.value;
            console.log(`✅ Loaded ${Object.keys(restrictions).length} food restrictions`);
            return restrictions;
        } catch (error) {
            console.error('❌ getFoodRestrictions error:', error);
            return {};
        }
    }

    /**
     * 🔥 YENİ: Food Database Mappings (yemek_veritabani_eslestirme.json) - JSONB VERSION
     */
    async getFoodDatabaseMappings() {
        try {
            console.log('[DAL] 📥 Loading food database mappings from Supabase (JSONB)...');
            const client = await this.initSupabase();
            
            if (!client) return {};

            const { data, error } = await client
                .from('app_settings')
                .select('*')
                .eq('setting_key', 'yemek_veritabani_eslestirme')
                .single();

            if (error) {
                console.error('❌ Supabase food_database_mappings error:', error);
                return {};
            }

            if (!data || !data.value) {
                console.warn('⚠️ Yemek DB eşleştirmeleri bulunamadı');
                return {};
            }

            const dbMappings = data.value.eslestirmeler || data.value;
            console.log(`✅ Loaded ${Object.keys(dbMappings).length} food database mappings`);
            return dbMappings;
        } catch (error) {
            console.error('❌ getFoodDatabaseMappings error:', error);
            return {};
        }
    }

    /**
     * 🍽️ YENİ: Food List (food_list.json) - JSONB VERSION
     * Ana yemek veritabanı - tüm yemekler ve besin değerleri
     */
    async getFoodList() {
        try {
            console.log('[DAL] 📥 Loading food list from Supabase (JSONB)...');
            const client = await this.initSupabase();
            
            if (!client) {
                // Supabase yoksa local file'dan oku
                console.warn('⚠️ Supabase not available, loading from local file...');
                const response = await fetch('/food_list.json?t=' + Date.now());
                if (!response.ok) throw new Error('Failed to load food_list.json');
                return await response.json();
            }

            const { data, error } = await client
                .from('app_settings')
                .select('*')
                .eq('setting_key', 'food_list')
                .single();

            if (error) {
                console.error('❌ Supabase food_list error:', error);
                // Fallback to local file
                console.warn('⚠️ Falling back to local food_list.json...');
                const response = await fetch('/food_list.json?t=' + Date.now());
                if (!response.ok) throw new Error('Failed to load food_list.json');
                return await response.json();
            }

            if (!data || !data.value) {
                console.warn('⚠️ Food list bulunamadı, local file kullanılıyor...');
                const response = await fetch('/food_list.json?t=' + Date.now());
                if (!response.ok) throw new Error('Failed to load food_list.json');
                return await response.json();
            }

            const foodList = data.value;
            const totalFoods = foodList.categories.reduce((sum, cat) => sum + cat.items.length, 0);
            console.log(`✅ Loaded ${foodList.categories.length} categories with ${totalFoods} foods from Supabase`);
            return foodList;
        } catch (error) {
            console.error('❌ getFoodList error:', error);
            // Final fallback
            try {
                const response = await fetch('/food_list.json?t=' + Date.now());
                if (!response.ok) throw new Error('Failed to load food_list.json');
                return await response.json();
            } catch (fallbackError) {
                console.error('❌ Fallback food_list load failed:', fallbackError);
                return { version: '0.0', categories: [] };
            }
        }
    }

    /**
     * 📸 YENİ: Recipe Cards (tarifler/list.json) - JSONB VERSION
     * Tarif kartlarının listesi (resim dosyaları)
     * @returns {Promise<Array>} Recipe cards array: [{file: 'name.jpg', tags: []}]
     */
    async getRecipeCards() {
        try {
            console.log('[DAL] 📥 Loading recipe cards from Supabase (JSONB)...');
            const client = await this.initSupabase();
            
            if (!client) {
                // Supabase yoksa GitHub'dan oku
                console.warn('⚠️ Supabase not available, loading from GitHub...');
                const response = await fetch('https://raw.githubusercontent.com/mustafasacar35/lipodem-takip-paneli-2.2/main/tarifler/list.json');
                if (!response.ok) throw new Error('Failed to load tarifler/list.json');
                return await response.json();
            }

            const { data, error } = await client
                .from('app_settings')
                .select('*')
                .eq('setting_key', 'recipe_cards')
                .single();

            if (error) {
                console.error('❌ Supabase recipe_cards error:', error);
                // Fallback to GitHub
                console.warn('⚠️ Falling back to GitHub tarifler/list.json...');
                const response = await fetch('https://raw.githubusercontent.com/mustafasacar35/lipodem-takip-paneli-2.2/main/tarifler/list.json');
                if (!response.ok) throw new Error('Failed to load tarifler/list.json');
                return await response.json();
            }

            if (!data || !data.value) {
                console.warn('⚠️ Recipe cards bulunamadı, GitHub kullanılıyor...');
                const response = await fetch('https://raw.githubusercontent.com/mustafasacar35/lipodem-takip-paneli-2.2/main/tarifler/list.json');
                if (!response.ok) throw new Error('Failed to load tarifler/list.json');
                return await response.json();
            }

            const recipeCards = Array.isArray(data.value) ? data.value : [];
            console.log(`✅ Loaded ${recipeCards.length} recipe cards from Supabase`);
            return recipeCards;
        } catch (error) {
            console.error('❌ getRecipeCards error:', error);
            // Final fallback
            try {
                const response = await fetch('https://raw.githubusercontent.com/mustafasacar35/lipodem-takip-paneli-2.2/main/tarifler/list.json');
                if (!response.ok) throw new Error('Failed to load tarifler/list.json');
                return await response.json();
            } catch (fallbackError) {
                console.error('❌ Fallback recipe cards load failed:', fallbackError);
                return [];
            }
        }
    }

    /**
     * 🔥 Yemek veritabanı yasakları al (app_settings.food_database_prohibitions)
     * @returns {Promise<Object>} Veritabanı yasakları objesi
     */
    async getFoodDatabaseProhibitions() {
        try {
            await this.initSupabase();
            
            const { data, error } = await this.supabaseClient
                .from('app_settings')
                .select('value')
                .eq('setting_key', 'food_database_prohibitions')
                .maybeSingle();

            if (error) throw error;

            if (data?.value) {
                console.log(`✅ Veritabanı yasakları yüklendi (DAL): ${Object.keys(data.value.yasaklar || {}).length} adet`);
                return data.value;
            }

            throw new Error('Food database prohibitions not found in Supabase');

        } catch (error) {
            console.error('❌ getFoodDatabaseProhibitions error:', error);
            // Fallback: GitHub'dan yükle
            try {
                const response = await fetch('https://raw.githubusercontent.com/mustafasacar35/lipodem-takip-paneli-2.2/main/data/yemek_veritabani_yasaklar.json');
                if (!response.ok) throw new Error('Failed to load yemek_veritabani_yasaklar.json');
                const data = await response.json();
                console.warn('⚠️ Veritabanı yasakları GitHub fallback\'dan yüklendi');
                return data;
            } catch (fallbackError) {
                console.error('❌ Fallback db prohibitions load failed:', fallbackError);
                return { version: "1.0", yasaklar: {} };
            }
        }
    }

    // ============================================
    // 💾 SUPABASE WRITE (UPDATE) METHODS
    // ============================================

    /**
     * Update food list in Supabase
     * @param {Object} foodListData - Full food_list.json structure with categories
     * @returns {Promise<void>}
     */
    async updateFoodList(foodListData) {
        try {
            await this.initSupabase();
            
            console.log('🔍 [DAL] updateFoodList - foodListData categories sayısı:', foodListData?.categories?.length);
            console.log('🔍 [DAL] updateFoodList - foodListData sample:', {
                categoriesCount: foodListData?.categories?.length,
                lastUpdated: foodListData?.lastUpdated,
                firstCategory: foodListData?.categories?.[0]?.name,
                firstCategoryItemsCount: foodListData?.categories?.[0]?.items?.length
            });
            
            const upsertData = {
                setting_key: 'food_list',
                value: foodListData,
                updated_at: new Date().toISOString()
            };
            
            console.log('🔍 [DAL] Supabase UPSERT çağrılıyor...');
            console.log('🔍 [DAL] upsertData.value type:', typeof upsertData.value);
            console.log('🔍 [DAL] upsertData.value.categories:', upsertData.value?.categories?.length);
            
            const { data, error } = await this.supabaseClient
                .from('app_settings')
                .upsert(upsertData, {
                    onConflict: 'setting_key'
                })
                .select();  // ← EKLEME: Upsert sonucunu görmek için
            
            console.log('🔍 [DAL] Supabase UPSERT yanıtı - data:', data);
            console.log('🔍 [DAL] Supabase UPSERT yanıtı - error:', error);

            if (error) {
                console.error('❌ [DAL] Supabase UPSERT HATASI:', error);
                throw error;
            }
            
            console.log('✅ Food list updated in Supabase');
            
            // 🔍 DOĞRULAMA: Hemen geri oku ve kontrol et
            console.log('🔍 [DAL] DOĞRULAMA: Supabase\'den tekrar okuma...');
            const verification = await this.getFoodList();
            console.log('🔍 [DAL] DOĞRULAMA: Okunan categories sayısı:', verification?.categories?.length);
            console.log('🔍 [DAL] DOĞRULAMA: Okunan lastUpdated:', verification?.lastUpdated);
            
        } catch (error) {
            console.error('❌ updateFoodList error:', error);
            console.error('❌ Error stack:', error.stack);
            throw error;
        }
    }

    /**
     * Update food matchings in Supabase
     * @param {Object} matchingsData - Full manuel_eslestirmeler.json structure
     * @returns {Promise<void>}
     */
    async updateFoodMatchings(matchingsData) {
        try {
            await this.initSupabase();
            
            // matchingsData formatı: { eslestirmeler: { normalizedKey: { orijinalMetin, kartlar, eklemeTarihi } } }
            const eslestirmeler = matchingsData.eslestirmeler || {};
            
            // Önce bu yemek için mevcut tüm eşleştirmeleri sil
            // ✅ DÜZELTME: Normalize edilmiş key'e göre sil (Köfte vs köfte problemini çözer)
            const normalizedKeys = Object.keys(eslestirmeler);
            
            if (normalizedKeys.length > 0) {
                // Tüm mevcut kayıtları çek
                const { data: existingRows } = await this.supabaseClient
                    .from('food_matchings')
                    .select('*');
                
                // Normalize edilmiş key'e göre silinecekleri bul
                const idsToDelete = [];
                existingRows?.forEach(row => {
                    const normalizedFoodName = this.normalizeText(row.food_name);
                    if (normalizedKeys.includes(normalizedFoodName)) {
                        idsToDelete.push(row.id);
                    }
                });
                
                if (idsToDelete.length > 0) {
                    const { error: deleteError } = await this.supabaseClient
                        .from('food_matchings')
                        .delete()
                        .in('id', idsToDelete);
                    
                    if (deleteError) console.warn('⚠️ Eski eşleştirmeler silinirken hata:', deleteError);
                    else console.log(`🗑️ ${idsToDelete.length} eski eşleştirme silindi`);
                }
            }
            
            // Yeni eşleştirmeleri ekle (her kart için ayrı satır)
            const rows = [];
            for (const [key, value] of Object.entries(eslestirmeler)) {
                const foodName = value.orijinalMetin || key;
                const kartlar = value.kartlar || [];
                
                kartlar.forEach(kartAdi => {
                    rows.push({
                        food_name: foodName,
                        matched_food: kartAdi,
                        type: 'manuel',
                        data: {
                            normalized_key: key,
                            created_at: value.eklemeTarihi || new Date().toISOString()
                        },
                        created_at: value.eklemeTarihi || new Date().toISOString()
                    });
                });
            }
            
            if (rows.length > 0) {
                const { error: insertError } = await this.supabaseClient
                    .from('food_matchings')
                    .insert(rows);
                
                if (insertError) throw insertError;
                console.log(`✅ ${rows.length} manuel eşleştirme kaydedildi (food_matchings tablosu)`);
            }
        } catch (error) {
            console.error('❌ updateFoodMatchings error:', error);
            throw error;
        }
    }

    /**
     * Update food blacklist in Supabase
     * @param {Object} blacklistData - Full eslesmeme_kurallari.json structure
     * @returns {Promise<void>}
     */
    async updateFoodBlacklist(blacklistData) {
        try {
            await this.initSupabase();
            
            console.log('[DAL] 💾 updateFoodBlacklist() - Supabase food_blacklist tablosuna yazılıyor...');
            console.log('[DAL] 📦 Gönderilen veri:', blacklistData);
            
            // ÖNCELİKLE: Tüm mevcut kayıtları sil
            const { error: deleteError } = await this.supabaseClient
                .from('food_blacklist')
                .delete()
                .neq('id', 0); // Tüm kayıtları sil
            
            if (deleteError) {
                console.warn('[DAL] ⚠️ Eski kayıtlar silinirken uyarı:', deleteError);
            }
            
            // YENİ KAYITLARI EKLE
            const recordsToInsert = [];
            
            for (const [foodName, blacklistObj] of Object.entries(blacklistData)) {
                // Object formatı: {orijinalMetin, yasakliKartlar: [...], eklemeTarihi}
                const yasakliKartlar = blacklistObj.yasakliKartlar || blacklistObj.kartlar || [];
                
                yasakliKartlar.forEach(blockedCard => {
                    recordsToInsert.push({
                        food_name: foodName, // Normalize edilmiş key
                        blocked_food: blockedCard, // Yasak kart dosya adı
                        created_at: blacklistObj.eklemeTarihi || new Date().toISOString()
                    });
                });
            }
            
            if (recordsToInsert.length > 0) {
                const { error: insertError } = await this.supabaseClient
                    .from('food_blacklist')
                    .insert(recordsToInsert);
                
                if (insertError) throw insertError;
                console.log(`✅ Food blacklist updated: ${recordsToInsert.length} records inserted`);
            } else {
                console.log('✅ Food blacklist cleared (no records to insert)');
            }
            
        } catch (error) {
            console.error('❌ updateFoodBlacklist error:', error);
            throw error;
        }
    }

    /**
     * Update food database mappings in Supabase
     * @param {Object} mappingsData - Full yemek_veritabani_eslestirme.json structure
     * @returns {Promise<void>}
     */
    async updateFoodDatabaseMappings(mappingsData) {
        try {
            await this.initSupabase();
            
            console.log('[DAL] 💾 updateFoodDatabaseMappings() - Supabase\'e yazılıyor...');
            console.log('[DAL] 📦 Gönderilen veri:', mappingsData);
            
            // ✅ OKUMA ile AYNI KEY kullan: 'yemek_veritabani_eslestirme'
            const { error } = await this.supabaseClient
                .from('app_settings')
                .upsert({
                    setting_key: 'yemek_veritabani_eslestirme',
                    value: {
                        version: "1.0",
                        aciklama: "Şablonlardaki yemek adlarını food_list.json'daki yemeklerle manuel eşleştir",
                        sonGuncelleme: new Date().toISOString(),
                        eslestirmeler: mappingsData
                    },
                    description: 'Yemek veritabanı manuel eşleştirmeleri',
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'setting_key'
                });

            if (error) throw error;
            console.log('✅ Food database mappings updated in Supabase');
        } catch (error) {
            console.error('❌ updateFoodDatabaseMappings error:', error);
            throw error;
        }
    }

    /**
     * Update food database prohibitions in Supabase
     * @param {Object} prohibitionsData - Full yemek_veritabani_yasaklar.json structure
     * @returns {Promise<void>}
     */
    async updateFoodDatabaseProhibitions(prohibitionsData) {
        try {
            await this.initSupabase();
            
            const { error } = await this.supabaseClient
                .from('app_settings')
                .upsert({
                    setting_key: 'food_database_prohibitions',
                    value: prohibitionsData,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'setting_key'
                });

            if (error) throw error;
            console.log('✅ Food database prohibitions updated in Supabase');
        } catch (error) {
            console.error('❌ updateFoodDatabaseProhibitions error:', error);
            throw error;
        }
    }
}

// Global instance oluştur
window.DAL = new DataAccessLayer();

console.log('✅ DataAccessLayer loaded. Use window.DAL to access data.');




