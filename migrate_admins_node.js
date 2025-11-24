const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read config manually since it's a JS file with window/const issues in Node
const configContent = fs.readFileSync('config.local.js', 'utf8');

// Extract Development Config
const devConfigMatch = configContent.match(/development:\s*{[^}]*url:\s*'([^']+)'[^}]*anonKey:\s*'([^']+)'/s);

let SUPABASE_URL, SUPABASE_KEY;

if (devConfigMatch) {
    SUPABASE_URL = devConfigMatch[1];
    SUPABASE_KEY = devConfigMatch[2];
} else {
    // Fallback: Hardcoded from previous read if regex fails
    SUPABASE_URL = 'https://qvpeqxzaprgesgrgzmuo.supabase.co';
    SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cGVxeHphcHJnZXNncmd6bXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjAzNjYsImV4cCI6MjA3OTAzNjM2Nn0.4Mo-9pgAk9vBHT48yVunuijSzqQX6cX07fCfDF48hLk';
}

console.log('Connecting to Supabase:', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read admins.js
const adminsContent = fs.readFileSync('settings/admins.js', 'utf8');
// Extract JSON object
const jsonMatch = adminsContent.match(/window\.GH_ADMINS\s*=\s*({[\s\S]*?});/);

if (!jsonMatch) {
    console.error('Could not parse settings/admins.js');
    process.exit(1);
}

const ghAdmins = JSON.parse(jsonMatch[1]);
const admins = ghAdmins.admins;

async function migrate() {
    console.log(`Found ${admins.length} admins to migrate.`);

    for (const admin of admins) {
        console.log(`Migrating admin: ${admin.username}...`);
        
        const { data, error } = await supabase.from('admins').upsert({
            username: admin.username,
            password_hash: admin.passwordHash,
            roles: admin.roles,
            is_active: true,
            created_by: 'migration_script_node'
        }, { onConflict: 'username' });

        if (error) {
            console.error(`❌ Failed to migrate ${admin.username}:`, error);
        } else {
            console.log(`✅ Successfully migrated ${admin.username}`);
        }
    }
    
    // Migrate Patient Admins
    if (ghAdmins.patientAdmins) {
        console.log(`Found ${ghAdmins.patientAdmins.length} patient admins.`);
        for (const patientUsername of ghAdmins.patientAdmins) {
            console.log(`Migrating patient admin: ${patientUsername}...`);
            const { data, error } = await supabase.from('patient_admins').upsert({
                patient_username: patientUsername,
                assigned_admin_username: 'admin' // Default assignment
            }, { onConflict: 'patient_username' });
            
            if (error) {
                console.error(`❌ Failed to migrate patient admin ${patientUsername}:`, error);
            } else {
                console.log(`✅ Successfully migrated patient admin ${patientUsername}`);
            }
        }
    }
}

migrate();
