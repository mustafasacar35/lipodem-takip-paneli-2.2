/**
 * 🔗 Food Database Mappings Migration Script
 * Migrates data/yemek_veritabani_eslestirme.json to Supabase app_settings table
 * 
 * Usage: node migrate_food_db_mappings_to_supabase.js
 */

const fs = require('fs');
const path = require('path');

// Supabase config
const SUPABASE_URL = 'https://qvpeqxzaprgesgrgzmuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVxeHphcHJnZXNncmd6bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAzNjYsImV4cCI6MjA3OTAzNjM2Nn0.4Mo-9pgAk9vBHT48yVunuijSzqQX6cX07fCfDF48hLk';

async function migrateFoodDatabaseMappings() {
    try {
        console.log('🚀 Starting food database mappings migration to Supabase...\n');

        // Read data/yemek_veritabani_eslestirme.json
        console.log('📖 Reading data/yemek_veritabani_eslestirme.json...');
        const mappingsPath = path.join(__dirname, 'data', 'yemek_veritabani_eslestirme.json');
        
        if (!fs.existsSync(mappingsPath)) {
            throw new Error(`❌ File not found: ${mappingsPath}`);
        }

        const mappingsJson = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
        const mappingsCount = Object.keys(mappingsJson.eslestirmeler || {}).length;
        console.log(`✅ Loaded ${mappingsCount} database mappings\n`);

        // Supabase'e upsert
        console.log('💾 Upserting to Supabase app_settings...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?setting_key=eq.food_database_mappings`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                value: mappingsJson,
                description: 'Food database mappings from data/yemek_veritabani_eslestirme.json',
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
        console.log(`   - Database mappings: ${mappingsCount} items`);
        console.log(`   - Setting key: food_database_mappings`);
        console.log(`   - Table: app_settings`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrateFoodDatabaseMappings();
