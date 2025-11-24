/**
 * 📸 Recipe Cards Migration Script
 * Migrates tarifler/list.json to Supabase app_settings table
 * 
 * Usage: node migrate_recipe_cards_to_supabase.js
 */

const fs = require('fs');
const path = require('path');

// Supabase config (from config.js)
const SUPABASE_URL = 'https://qvpeqxzaprgesgrgzmuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVxeHphcHJnZXNncmd6bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAzNjYsImV4cCI6MjA3OTAzNjM2Nn0.4Mo-9pgAk9vBHT48yVunuijSzqQX6cX07fCfDF48hLk';

async function migrateRecipeCards() {
    try {
        console.log('🚀 Starting recipe cards migration to Supabase...\n');

        // 1. Read tarifler/list.json
        console.log('📖 Reading tarifler/list.json...');
        const recipeCardsPath = path.join(__dirname, 'tarifler', 'list.json');
        
        if (!fs.existsSync(recipeCardsPath)) {
            throw new Error(`❌ File not found: ${recipeCardsPath}`);
        }

        const recipeCardsJson = JSON.parse(fs.readFileSync(recipeCardsPath, 'utf8'));
        console.log(`✅ Loaded ${recipeCardsJson.length} recipe cards\n`);

        // 2. Supabase'e upsert
        console.log('💾 Upserting to Supabase app_settings...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?setting_key=eq.recipe_cards`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                value: recipeCardsJson,
                description: 'Recipe cards list from tarifler/list.json',
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
        console.log(`   - Recipe cards: ${recipeCardsJson.length} items`);
        console.log(`   - Setting key: recipe_cards`);
        console.log(`   - Table: app_settings`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
migrateRecipeCards();
