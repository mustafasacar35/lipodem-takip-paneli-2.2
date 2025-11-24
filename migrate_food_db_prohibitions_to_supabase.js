/**
 * 🔗 Food Database Prohibitions Migration Script
 * Migrates data/yemek_veritabani_yasaklar.json to Supabase app_settings table
 * 
 * Usage: node migrate_food_db_prohibitions_to_supabase.js
 */

const fs = require('fs');
const path = require('path');

// Supabase config
const SUPABASE_URL = 'https://qvpeqxzaprgesgrgzmuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVxeHphcHJnZXNncmd6bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAzNjYsImV4cCI6MjA3OTAzNjM2Nn0.4Mo-9pgAk9vBHT48yVunuijSzqQX6cX07fCfDF48hLk';

async function migrateFoodDatabaseProhibitions() {
    try {
        console.log('🚀 Starting food database prohibitions migration to Supabase...\n');

        // Read data/yemek_veritabani_yasaklar.json
        console.log('📖 Reading data/yemek_veritabani_yasaklar.json...');
        const prohibitionsPath = path.join(__dirname, 'data', 'yemek_veritabani_yasaklar.json');
        
        if (!fs.existsSync(prohibitionsPath)) {
            throw new Error(`❌ File not found: ${prohibitionsPath}`);
        }

        const prohibitionsJson = JSON.parse(fs.readFileSync(prohibitionsPath, 'utf8'));
        const prohibitionsCount = Object.keys(prohibitionsJson.yasaklar || {}).length;
        console.log(`✅ Loaded ${prohibitionsCount} database prohibitions\n`);

        // Supabase'e upsert
        console.log('💾 Upserting to Supabase app_settings...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/app_settings`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify({
                setting_key: 'food_database_prohibitions',
                value: prohibitionsJson,
                description: 'Food database prohibitions from data/yemek_veritabani_yasaklar.json',
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Supabase error (${response.status}): ${errorText}`);
        }

        console.log('✅ Successfully migrated to Supabase!');
        console.log('\n🎉 Migration completed successfully!');
        console.log('📝 Summary:');
        console.log(`   - Database prohibitions: ${prohibitionsCount} items`);
        console.log(`   - Setting key: food_database_prohibitions`);
        console.log(`   - Table: app_settings`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrateFoodDatabaseProhibitions();
