# -*- coding: utf-8 -*-
import os

# Base path
base_path = r"c:\Users\Mustafa\Downloads\v25___lipodem-takip-paneli-main_cihaz_sinir_OK_reset_OK_oto_planla_modalda ayarlar_takvim_vs_ok\lipodem-takip-paneli-main"

# Files to fix
files_to_fix = [
    "patient_nutrition.html",
    "data-access-layer.js",
    "device-manager.js",
    "admin_patients.html",
    "admin_settings.html",
    "eslestirme.html"
]

# Fix repo names in all files
for filename in files_to_fix:
    filepath = os.path.join(base_path, filename)
    if not os.path.exists(filepath):
        print(f"⚠️ File not found: {filename}")
        continue
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace repo names
        original_content = content
        content = content.replace('mustafasacar35/lipodem-takip-paneli/', 'mustafasacar35/lipodem-takip-paneli-2.2/')
        content = content.replace("REPO_NAME = 'lipodem-takip-paneli'", "REPO_NAME = 'lipodem-takip-paneli-2.2'")
        content = content.replace('repo: "lipodem-takip-paneli"', 'repo: "lipodem-takip-paneli-2.2"')
        content = content.replace("repo: 'lipodem-takip-paneli'", "repo: 'lipodem-takip-paneli-2.2'")
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            print(f"✅ Updated repo names in {filename}")
        else:
            print(f"ℹ️ No changes needed in {filename}")
    except Exception as e:
        print(f"❌ Error processing {filename}: {e}")

print("\n🎉 Repo name updates complete!")
