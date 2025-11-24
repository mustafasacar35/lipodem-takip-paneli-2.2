const fs = require('fs');
const path = require('path');

const basePath = 'c:\\Users\\Mustafa\\Downloads\\v25___lipodem-takip-paneli-main_cihaz_sinir_OK_reset_OK_oto_planla_modalda ayarlar_takvim_vs_ok\\lipodem-takip-paneli-main';

const filesToFix = [
    'patient_nutrition.html',
    'data-access-layer.js',
    'device-manager.js',
    'admin_patients.html',
    'admin_settings.html',
    'eslestirme.html'
];

filesToFix.forEach(filename => {
    const filepath = path.join(basePath, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️ File not found: ${filename}`);
        return;
    }
    
    try {
        let content = fs.readFileSync(filepath, 'utf8');
        const originalContent = content;
        
        // Replace repo names
        content = content.replace(/mustafasacar35\/lipodem-takip-paneli\//g, 'mustafasacar35/lipodem-takip-paneli-2.2/');
        content = content.replace(/REPO_NAME = 'lipodem-takip-paneli'/g, "REPO_NAME = 'lipodem-takip-paneli-2.2'");
        content = content.replace(/repo: "lipodem-takip-paneli"/g, 'repo: "lipodem-takip-paneli-2.2"');
        content = content.replace(/repo: 'lipodem-takip-paneli'/g, "repo: 'lipodem-takip-paneli-2.2'");
        
        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✅ Updated repo names in ${filename}`);
        } else {
            console.log(`ℹ️ No changes needed in ${filename}`);
        }
    } catch (error) {
        console.log(`❌ Error processing ${filename}: ${error.message}`);
    }
});

console.log('\n🎉 Repo name updates complete!');
