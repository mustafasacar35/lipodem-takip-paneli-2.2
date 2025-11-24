/**
 * 🔗 Food Blacklist Rules Migration Script
 * Migrates data/eslesmeme_kurallari.json to Supabase app_settings table
 * 
 * Usage: node migrate_food_blacklist_to_supabase.js
 */

const fs = require('fs');
const path = require('path');

// Supabase config
const SUPABASE_URL = 'https://qvpeqxzaprgesgrgzmuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVxeHphcHJnZXNncmd6bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAzNjYsImV4cCI6MjA3OTAzNjM2Nn0.4Mo-9pgAk9vBHT48yVunuijSzqQX6cX07fCfDF48hLk';

async function migrateFoodBlacklist() {
    try {
        console.log('🚀 Starting food blacklist migration to Supabase...\n');

        // Read data/eslesmeme_kurallari.json
        console.log('📖 Reading data/eslesmeme_kurallari.json...');
        const blacklistPath = path.join(__dirname, 'data', 'eslesmeme_kurallari.json');
        
        if (!fs.existsSync(blacklistPath)) {
            throw new Error(`❌ File not found: ${blacklistPath}`);
        }

        const blacklistJson = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
        const rulesCount = Object.keys(blacklistJson.kurallar?.eslesmemeKurallari || {}).length;
        console.log(`✅ Loaded ${rulesCount} blacklist rules\n`);

        // Supabase'e upsert
        console.log('💾 Upserting to Supabase app_settings...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?setting_key=eq.food_blacklist_rules`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                value: blacklistJson,
                description: 'Food blacklist rules from data/eslesmeme_kurallari.json',
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
        console.log(`   - Blacklist rules: ${rulesCount} items`);
        console.log(`   - Setting key: food_blacklist_rules`);
        console.log(`   - Table: app_settings`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrateFoodBlacklist();
