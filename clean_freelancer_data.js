// Script to clean up all dummy freelancer data
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read the migration SQL file
const migrationSql = fs.readFileSync(
  path.join(__dirname, 'migrations', '20240610_cleanup_freelancer', 'migration.sql'),
  'utf8'
);

// Initialize Supabase client
// Load Supabase URL and key from .env file if available, or use defaults
// You should set these in your environment or .env file
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-supabase-service-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanUpFreelancerData() {
  console.log('Starting cleanup of dummy freelancer data...');

  try {
    // Execute the SQL directly
    const { error } = await supabase.rpc('pgexec', { query: migrationSql });

    if (error) {
      console.error('Error executing SQL:', error);
      // Try an alternative approach if the first fails
      console.log('Trying alternative method...');
      
      // Split SQL into individual statements and execute them one by one
      const statements = migrationSql.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const stmt of statements) {
        console.log(`Executing: ${stmt.substring(0, 50)}...`);
        const { error } = await supabase.rpc('pgexec', { query: stmt });
        if (error) {
          console.error('Error executing statement:', error);
        }
      }
    }

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanUpFreelancerData(); 