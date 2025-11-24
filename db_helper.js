/**
 * ============================================================================
 * SUPABASE DATABASE HELPER
 * Tüm veritabanı işlemlerini yöneten merkezi dosya
 * ============================================================================
 */

// Supabase client'ı başlat
let supabaseClient = null;

function initSupabase() {
    const CONFIG = window.CONFIG || window.APP_CONFIG;
    if (!CONFIG || !CONFIG.supabase) {
        throw new Error('Supabase config bulunamadı!');
    }
    
    if (!window.supabase) {
        throw new Error('Supabase library yüklenmedi!');
    }
    
    supabaseClient = window.supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
    );
    
    return supabaseClient;
}

// ============================================================================
// PATIENT (HASTA) İŞLEMLERİ
// ============================================================================

/**
 * Tüm hastaları getir
 * @returns {Promise<Array>} Hasta listesi
 */
async function getAllPatients() {
    if (!supabaseClient) initSupabase();
    
    const { data, error } = await supabaseClient
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
}

/**
 * Tek bir hastayı getir
 * @param {string} patientId - Hasta ID
 * @returns {Promise<Object>} Hasta verisi
 */
async function getPatient(patientId) {
    if (!supabaseClient) initSupabase();
    
    const { data, error } = await supabaseClient
        .from('patients')
        .select('*')
        .eq('patient_id', patientId)
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Yeni hasta ekle veya mevcut hastayı güncelle
 * @param {string} patientId - Hasta ID
 * @param {Object} patientData - Hasta verisi
 * @returns {Promise<Object>} Kaydedilen hasta
 */
async function savePatient(patientId, patientData) {
    if (!supabaseClient) initSupabase();
    
    // Önce hasta var mı kontrol et
    const { data: existing } = await supabaseClient
        .from('patients')
        .select('patient_id')
        .eq('patient_id', patientId)
        .single();
    
    if (existing) {
        // Güncelleme
        const { data, error } = await supabaseClient
            .from('patients')
            .update({
                name: patientData.name || '',
                email: patientData.email || '',
                phone: patientData.phone || '',
                start_date: patientData.startDate || new Date().toISOString().split('T')[0],
                target_weight: patientData.targetWeight || 0,
                current_weight: patientData.currentWeight || 0,
                height: patientData.height || 0,
                age: patientData.age || 0,
                gender: patientData.gender || 'female',
                diet_type: patientData.dietType || 'ketojenik',
                activity_level: patientData.activityLevel || 'sedentary',
                medical_conditions: patientData.medicalConditions || [],
                allergies: patientData.allergies || [],
                preferences: patientData.preferences || {},
                restrictions: patientData.restrictions || [],
                goals: patientData.goals || [],
                notes: patientData.notes || '',
                data: patientData,
                updated_at: new Date().toISOString()
            })
            .eq('patient_id', patientId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        // Yeni kayıt
        const { data, error } = await supabaseClient
            .from('patients')
            .insert({
                patient_id: patientId,
                name: patientData.name || '',
                email: patientData.email || '',
                phone: patientData.phone || '',
                start_date: patientData.startDate || new Date().toISOString().split('T')[0],
                target_weight: patientData.targetWeight || 0,
                current_weight: patientData.currentWeight || 0,
                height: patientData.height || 0,
                age: patientData.age || 0,
                gender: patientData.gender || 'female',
                diet_type: patientData.dietType || 'ketojenik',
                activity_level: patientData.activityLevel || 'sedentary',
                medical_conditions: patientData.medicalConditions || [],
                allergies: patientData.allergies || [],
                preferences: patientData.preferences || {},
                restrictions: patientData.restrictions || [],
                goals: patientData.goals || [],
                notes: patientData.notes || '',
                data: patientData
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
}

/**
 * Hastayı sil
 * @param {string} patientId - Hasta ID
 * @returns {Promise<boolean>} Başarılı ise true
 */
async function deletePatient(patientId) {
    if (!supabaseClient) initSupabase();
    
    const { error } = await supabaseClient
        .from('patients')
        .delete()
        .eq('patient_id', patientId);
    
    if (error) throw error;
    return true;
}

// ============================================================================
// TEMPLATE (ŞABLON) İŞLEMLERİ
// ============================================================================

/**
 * Tüm şablonları getir
 * @returns {Promise<Array>} Şablon listesi
 */
async function getAllTemplates() {
    if (!supabaseClient) initSupabase();
    
    const { data, error } = await supabaseClient
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
}

/**
 * Tek bir şablonu getir
 * @param {string} templateId - Şablon ID
 * @returns {Promise<Object>} Şablon verisi
 */
async function getTemplate(templateId) {
    if (!supabaseClient) initSupabase();
    
    const { data, error } = await supabaseClient
        .from('templates')
        .select('*')
        .eq('template_id', templateId)
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Yeni şablon ekle veya mevcut şablonu güncelle
 * @param {string} templateId - Şablon ID
 * @param {Object} templateData - Şablon verisi
 * @returns {Promise<Object>} Kaydedilen şablon
 */
async function saveTemplate(templateId, templateData) {
    if (!supabaseClient) initSupabase();
    
    // Önce şablon var mı kontrol et
    const { data: existing } = await supabaseClient
        .from('templates')
        .select('template_id')
        .eq('template_id', templateId)
        .single();
    
    if (existing) {
        // Güncelleme
        const { data, error } = await supabaseClient
            .from('templates')
            .update({
                name: templateData.name || '',
                type: templateData.type || '',
                calories: templateData.calories || 0,
                protein: templateData.protein || 0,
                carbs: templateData.carbs || 0,
                fat: templateData.fat || 0,
                data: templateData,
                updated_at: new Date().toISOString()
            })
            .eq('template_id', templateId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        // Yeni kayıt
        const { data, error } = await supabaseClient
            .from('templates')
            .insert({
                template_id: templateId,
                name: templateData.name || '',
                type: templateData.type || '',
                calories: templateData.calories || 0,
                protein: templateData.protein || 0,
                carbs: templateData.carbs || 0,
                fat: templateData.fat || 0,
                data: templateData
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
}

/**
 * Şablonu sil
 * @param {string} templateId - Şablon ID
 * @returns {Promise<boolean>} Başarılı ise true
 */
async function deleteTemplate(templateId) {
    if (!supabaseClient) initSupabase();
    
    const { error } = await supabaseClient
        .from('templates')
        .delete()
        .eq('template_id', templateId);
    
    if (error) throw error;
    return true;
}

// ============================================================================
// FOOD (YEMEK) İŞLEMLERİ
// ============================================================================

/**
 * Tüm yemekleri getir
 * @returns {Promise<Array>} Yemek listesi
 */
async function getAllFoods() {
    if (!supabaseClient) initSupabase();
    
    const { data, error } = await supabaseClient
        .from('foods')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
}

/**
 * Tek bir yemek getir
 * @param {string} foodId - Yemek ID
 * @returns {Promise<Object>} Yemek verisi
 */
async function getFood(foodId) {
    if (!supabaseClient) initSupabase();
    
    const { data, error } = await supabaseClient
        .from('foods')
        .select('*')
        .eq('food_id', foodId)
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Yemek kaydet
 * @param {string} foodId - Yemek ID
 * @param {Object} foodData - Yemek verisi
 * @returns {Promise<Object>} Kaydedilen yemek
 */
async function saveFood(foodId, foodData) {
    if (!supabaseClient) initSupabase();
    
    const { data: existing } = await supabaseClient
        .from('foods')
        .select('food_id')
        .eq('food_id', foodId)
        .single();
    
    if (existing) {
        const { data, error } = await supabaseClient
            .from('foods')
            .update({
                name: foodData.name || '',
                category: foodData.category || '',
                calories: foodData.calories || 0,
                protein: foodData.protein || 0,
                carbs: foodData.carbs || 0,
                fat: foodData.fat || 0,
                data: foodData,
                updated_at: new Date().toISOString()
            })
            .eq('food_id', foodId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabaseClient
            .from('foods')
            .insert({
                food_id: foodId,
                name: foodData.name || '',
                category: foodData.category || '',
                calories: foodData.calories || 0,
                protein: foodData.protein || 0,
                carbs: foodData.carbs || 0,
                fat: foodData.fat || 0,
                data: foodData
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
}

/**
 * Yemek sil
 * @param {string} foodId - Yemek ID
 * @returns {Promise<boolean>} Başarılı ise true
 */
async function deleteFood(foodId) {
    if (!supabaseClient) initSupabase();
    
    const { error } = await supabaseClient
        .from('foods')
        .delete()
        .eq('food_id', foodId);
    
    if (error) throw error;
    return true;
}

// Global scope'a ekle
window.DB = {
    initSupabase,
    // Patients
    getAllPatients,
    getPatient,
    savePatient,
    deletePatient,
    // Templates
    getAllTemplates,
    getTemplate,
    saveTemplate,
    deleteTemplate,
    // Foods
    getAllFoods,
    getFood,
    saveFood,
    deleteFood
};

console.log('✅ DB Helper yüklendi');
