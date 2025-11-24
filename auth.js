/**
 * 🔐 HASTA YÖNETİM SİSTEMİ - KİMLİK DOĞRULAMA
 * SHA-256 Hash + Session Yönetimi
 */

// 🔧 LOCAL DEVELOPMENT MODE
const IS_LOCAL_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const PatientAuth = {
    REPO_OWNER: 'mustafasacar35',
    REPO_NAME: 'lipodem-takip-paneli',
    PATIENTS_INDEX_PATH: 'hastalar/index.json',
    SESSION_STORAGE_KEY: 'patient_session',
    
    /**
     * Metni SHA-256 ile hashle
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    
    /**
     * ✅ SUPABASE: Hasta listesini DAL üzerinden yükle
     */
    async loadPatientIndex() {
        try {
            console.log('🔄 [PatientAuth] Supabase\'den hasta listesi yükleniyor...');
            const patients = await window.DAL.getPatientList();
            return { 
                version: 1, 
                lastUpdated: new Date().toISOString(), 
                patients: patients || [] 
            };
        } catch (error) {
            console.error('❌ [PatientAuth] Supabase hasta listesi hatası:', error);
            return { version: 1, lastUpdated: new Date().toISOString(), patients: [] };
        }
    },
    
    /**
     * ✅ SUPABASE: Hasta detaylarını DAL üzerinden yükle
     */
    async loadPatientDetails(patientId) {
        try {
            console.log('🔄 [PatientAuth] Supabase\'den hasta detayı yükleniyor:', patientId);
            const patient = await window.DAL.getPatient(patientId);
            if (!patient) {
                console.warn('⚠️ [PatientAuth] Hasta bulunamadı:', patientId);
                return null;
            }
            return patient;
        } catch (error) {
            console.error('❌ [PatientAuth] Supabase hasta detay hatası:', error);
            return null;
        }
    },
    
    /**
     * Kullanıcı adı ve şifre ile giriş yap
     */
    async login(username, password, rememberMe = false) {
        try {
            console.log('🔐 [PatientAuth] Login attempt:', username);
            
            // Hasta listesini yükle
            const index = await this.loadPatientIndex();
            
            // Kullanıcıyı bul - Supabase'den username ile
            let patient = index.patients.find(p => p.username && p.username.toLowerCase() === username.toLowerCase());
            
            if (!patient) {
                console.warn('⚠️ [PatientAuth] Kullanıcı bulunamadı:', username);
                return { success: false, error: 'Kullanıcı adı veya şifre hatalı' };
            }
            
            console.log('✅ [PatientAuth] Kullanıcı bulundu:', patient.username);
            
            // Hasta ID'sini normalize et (Supabase'den patient_id olarak gelir)
            const patientId = patient.patient_id || patient.id;
            if (!patientId) {
                console.error('❌ [PatientAuth] Hasta ID bulunamadı!');
                return { success: false, error: 'Hasta bilgisi hatalı' };
            }

            // Arşivlenmiş hasta kontrolü
            if (patient.status === 'archived') {
                return { success: false, error: 'Bu hesap arşivlenmiştir. Lütfen yöneticinizle iletişime geçin.' };
            }

            // 🔐 ŞİFRE KONTROLÜ - Supabase modunda password_hash direkt patient objesinde
            const passwordHash = await this.hashPassword(password);
            console.log('🔐 [PatientAuth] Şifre kontrolü yapılıyor...');
            console.log('   Girilen şifre hash:', passwordHash);
            console.log('   Beklenen hash:', patient.password_hash);
            
            // Şifre hash'ini patient objesinden al (Supabase'den geldi)
            const storedHash = patient.password_hash || patient.passwordHash || null;
            
            if (!storedHash) {
                console.error('❌ [PatientAuth] Hasta kaydında password_hash bulunamadı!');
                return { success: false, error: 'Şifre bilgisi bulunamadı. Lütfen yöneticinizle iletişime geçin.' };
            }

            if (passwordHash !== storedHash) {
                console.warn('⚠️ [PatientAuth] Şifre eşleşmedi');
                return { success: false, error: 'Kullanıcı adı veya şifre hatalı' };
            }
            
            console.log('✅ [PatientAuth] Şifre doğru!');

            // 🖥️ CİHAZ KONTROLÜ - Şifre doğru ama cihaz limiti var mı?
            let deviceCheckResult = null;
            let currentDeviceInfo = null;
            let ipInfo = null;

            try {
                if (window.DeviceManager) {
                    // Mevcut cihaz bilgisini al
                    currentDeviceInfo = await window.DeviceManager.getDeviceInfo();
                    console.log('🖥️ Cihaz bilgisi alındı:', currentDeviceInfo.deviceName);

                    // IP bilgisini al (şüpheli aktivite kontrolü için)
                    if (window.IPLogger) {
                        ipInfo = await window.IPLogger.getIPInfo();
                    }

                    // Hasta detaylarını yükle (cihaz limiti için gerekli)
                    const patientDetails = await this.loadPatientDetails(patientId);
                    if (patientDetails) {
                        // localStorage'a kaydet (cihaz kontrolü için gerekli)
                        const detailsKey = `patientDetails_${patientId}`;
                        if (!localStorage.getItem(detailsKey)) {
                            localStorage.setItem(detailsKey, JSON.stringify(patientDetails));
                        }
                    }

                    // Cihaz limiti kontrolü
                    deviceCheckResult = await window.DeviceManager.checkDeviceLimit(patientId, currentDeviceInfo);

                    if (!deviceCheckResult.allowed) {
                        // ❌ CİHAZ LİMİTİ AŞILDI - GİRİŞ ENGELLENDİ
                        console.warn(`❌ Cihaz limiti aşıldı: ${deviceCheckResult.currentDevices}/${deviceCheckResult.maxDevices}`);

                        // IP logu kaydet (status: blocked)
                        if (window.IPLogger && ipInfo) {
                            await window.IPLogger.logLogin(patientId, currentDeviceInfo.deviceId, ipInfo, 'blocked');
                        }

                        // Admin'e bildirim gönder
                        if (window.AdminNotifier) {
                            await window.AdminNotifier.sendDeviceLimitAlert({
                                patientId: patientId,
                                username: username,
                                deviceId: currentDeviceInfo.deviceId,
                                deviceInfo: `${currentDeviceInfo.deviceName} / ${currentDeviceInfo.browser}`,
                                currentDevices: deviceCheckResult.currentDevices,
                                maxDevices: deviceCheckResult.maxDevices,
                                ipInfo: ipInfo
                            });
                        }

                        return { 
                            success: false, 
                            error: deviceCheckResult.reason,
                            errorType: 'device_limit_exceeded'
                        };
                    }

                    // ✅ Cihaz limiti uygun, yeni cihazsa kaydet
                    if (deviceCheckResult.isNewDevice) {
                        await window.DeviceManager.registerDevice(patientId, currentDeviceInfo, ipInfo);
                        console.log(`✅ Yeni cihaz kaydedildi: ${currentDeviceInfo.deviceName}`);
                    }
                }
            } catch (deviceError) {
                console.error('❌ CİHAZ KONTROLÜ HATASI - GİRİŞ ENGELLENDİ:', deviceError);
                return {
                    success: false,
                    error: 'Cihaz doğrulama hatası. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
                    errorType: 'device_check_failed'
                };
            }
            
            // Hasta detaylarını yükle (isAdmin için gerekli)
            let isAdminUser = false;
            try {
                const patientDetails = await this.loadPatientDetails(patient.id);
                if (patientDetails && patientDetails.isAdmin === true) {
                    isAdminUser = true;
                    console.log('👑 Admin kullanıcı tespit edildi:', patient.username);
                }
            } catch (e) {
                console.warn('Hasta detayları isAdmin kontrolü başarısız:', e);
            }
            
            // Session oluştur
            const sessionData = {
                patientId: patientId,
                username: patient.username,
                name: patient.name || 'İsimsiz',
                surname: patient.surname || '',
                loginTime: new Date().toISOString(),
                expiresAt: this.calculateExpiry(patient.session_days || patient.sessionDays || 7),
                rememberMe: rememberMe,
                isAdmin: isAdminUser  // ✅ Admin yetkisi eklendi
            };

            // Session'ı kaydet
            localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionData));

            // � IP LOG: Login başarılı - IP ve konum bilgisini kaydet
            try {
                if (window.IPLogger) {
                    const ipInfo = await window.IPLogger.getIPInfo();
                    const deviceId = localStorage.getItem('device_id') || 'unknown';
                    await window.IPLogger.logLogin(patient.id, deviceId, ipInfo, 'success');
                    
                    // Şüpheli aktivite kontrolü
                    const suspiciousCheck = await window.IPLogger.checkSuspiciousActivity(patient.id, ipInfo);
                    if (suspiciousCheck.suspicious) {
                        console.warn('⚠️ ŞÜPHELİ AKTİVİTE:', suspiciousCheck.reason);
                        // Admin'e bildirim gönder (opsiyonel)
                        if (window.AdminNotifier) {
                            window.AdminNotifier.sendSecurityAlert({
                                patientId: patient.id,
                                username: username,
                                reason: suspiciousCheck.reason,
                                severity: suspiciousCheck.severity,
                                ipInfo: ipInfo
                            });
                        }
                    }
                }
            } catch (ipError) {
                console.warn('⚠️ IP log kaydı başarısız:', ipError);
                // IP log hatası login'i engellemez
            }

            // �🆕 Hasta detaylarını yükle ve localStorage'a kaydet
            try {
                const patientDetails = await this.loadPatientDetails(patient.id);
                if (patientDetails) {
                    const detailsKey = `patientDetails_${patient.id}`;
                    // Her login'de GitHub'dan gelen güncel data'yı localStorage'a kaydet
                    // (maxDevices, devices[], securityAlerts[] gibi alanlar admin tarafından güncellenebilir)
                    localStorage.setItem(detailsKey, JSON.stringify(patientDetails));
                    console.log('✅ Hasta detayları localStorage\'a güncellendi (GitHub source)');
                    
                    // alternativeCount varsa logla
                    if (patientDetails.alternativeCount) {
                        console.log(`📊 Hasta alternatif yemek sayısı: ${patientDetails.alternativeCount}`);
                    }
                }
            } catch (detailsError) {
                console.warn('⚠️ Hasta detayları yüklenemedi:', detailsError.message);
            }

            console.log('✅ Giriş başarılı:', username);
            return { success: true, patient: sessionData };        } catch (error) {
            console.error('❌ Giriş hatası:', error);
            return { success: false, error: 'Giriş sırasında bir hata oluştu' };
        }
    },
    
    /**
     * Session süresini hesapla
     */
    calculateExpiry(days) {
        const now = new Date();
        now.setDate(now.getDate() + days);
        return now.toISOString();
    },
    
    /**
     * Aktif session kontrolü
     */
    checkSession() {
        try {
            const sessionStr = localStorage.getItem(this.SESSION_STORAGE_KEY);
            if (!sessionStr) return null;
            
            const session = JSON.parse(sessionStr);
            const now = new Date();
            const expiresAt = new Date(session.expiresAt);
            
            // Süre dolmuş mu?
            if (now > expiresAt) {
                console.warn('⚠️ Session süresi doldu');
                this.logout();
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('❌ Session kontrolü hatası:', error);
            return null;
        }
    },

    /**
     * Aktif session'ı al (checkSession ile aynı)
     */
    getSession() {
        return this.checkSession();
    },
    
    /**
     * Çıkış yap
     */
    logout() {
        localStorage.removeItem(this.SESSION_STORAGE_KEY);
        console.log('✅ Çıkış yapıldı');
    },
    
    /**
     * Session süresini yenile (kullanıcı aktif olduğunda)
     */
    async refreshSession() {
        const session = this.checkSession();
        if (!session) return false;
        
        try {
            const index = await this.loadPatientIndex();
            const patient = index.patients.find(p => p.id === session.patientId);
            
            if (patient && patient.status === 'active') {
                session.expiresAt = this.calculateExpiry(patient.sessionDays);
                localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Session yenileme hatası:', error);
            return false;
        }
    },
    
    /**
     * Sayfa yüklendiğinde session kontrolü yap
     */
    requireAuth(redirectUrl = 'login.html') {
        const session = this.checkSession();
        if (!session) {
            window.location.href = redirectUrl;
            return null;
        }
        return session;
    }
};

// Global kullanım için export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatientAuth;
}
