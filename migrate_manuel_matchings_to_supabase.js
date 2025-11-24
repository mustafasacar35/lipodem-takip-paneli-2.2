/**
 * 🔗 Manuel Matchings Migration Script
 * Migrates data/manuel_eslestirmeler.json to Supabase app_settings table
 * 
 * Usage: node migrate_manuel_matchings_to_supabase.js
 */

const fs = require('fs');
const path = require('path');

// Supabase config (from config.js)
const SUPABASE_URL = 'https://qvpeqxzaprgesgrgzmuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVxeHphcHJnZXNncmd6bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAzNjYsImV4cCI6MjA3OTAzNjM2Nn0.4Mo-9pgAk9vBHT48yVunuijSzqQX6cX07fCfDF48hLk';

async function migrateManuelMatchings() {
    try {
        console.log('🚀 Starting manuel matchings migration to Supabase...\n');

        // 1. Read data/manuel_eslestirmeler.json
        console.log('📖 Reading data/manuel_eslestirmeler.json...');
        const manuelMatchingsPath = path.join(__dirname, 'data', 'manuel_eslestirmeler.json');
        
        if (!fs.existsSync(manuelMatchingsPath)) {
            throw new Error(`❌ File not found: ${manuelMatchingsPath}`);
        }

        const manuelMatchingsJson = JSON.parse(fs.readFileSync(manuelMatchingsPath, 'utf8'));
        const matchingsCount = Object.keys(manuelMatchingsJson.eslestirmeler || {}).length;
        console.log(`✅ Loaded ${matchingsCount} manuel matchings\n`);

        // 2. Supabase'e upsert
        console.log('💾 Upserting to Supabase app_settings...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?setting_key=eq.manuel_matchings`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                value: manuelMatchingsJson,
                description: 'Manuel food matchings from data/manuel_eslestirmeler.json',
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Supabase error (${response.status}): ${errorText}`);
        }

        const responseText = await response.text();
        console.log('✅ Successfully migrated to Supabase!');
        console.log('📊 Response:', responseText || '(empty - upsert successful)');

        console.log('\n🎉 Migration completed successfully!');
        console.log('📝 Summary:');
        console.log(`   - Manuel matchings: ${matchingsCount} items`);
        console.log(`   - Version: ${manuelMatchingsJson.version}`);
        console.log(`   - Last updated: ${manuelMatchingsJson.sonGuncelleme}`);
        console.log(`   - Setting key: manuel_matchings`);
        console.log(`   - Table: app_settings`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrateManuelMatchings();
