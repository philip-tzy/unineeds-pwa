// Script to deploy UniSend database changes to Supabase
// Usage: node deploy_unisend_database.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase project settings - Update these with your actual values
const SUPABASE_URL = "https://otkhxrrbiqdutlgfkfdm.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is not set');
  console.error('Please set it to your Supabase service role key');
  console.error('You can find this in your Supabase dashboard under Project Settings > API');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Run a SQL file
async function runSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Executing SQL file: ${filePath}`);
    
    // Execute SQL directly against the database
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error executing SQL from ${filePath}:`, error);
      return false;
    }
    
    console.log(`Successfully executed SQL file: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error processing SQL file ${filePath}:`, err);
    return false;
  }
}

// Create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT) RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSql });
    
    if (error && error.code !== '42883') { // Ignore "function does not exist" error
      console.error('Error creating exec_sql function:', error);
      
      // Try direct SQL approach as fallback
      const { error: rawError } = await supabase.from('_temp').select('*').limit(1);
      console.log('Status of direct connection:', rawError ? 'Error' : 'OK');
    } else {
      console.log('Successfully created or verified exec_sql function');
    }
  } catch (err) {
    console.error('Error setting up exec_sql function:', err);
  }
}

// Deploy the UniSend database schema
async function deployUniSendSchema() {
  try {
    // Step 1: Create the exec_sql function
    await createExecSqlFunction();
    
    // Step 2: Run the UniSend migration files
    const unisendMigrationPath = path.join(__dirname, 'src', 'db', 'migrations', '002_create_unisend_structure.sql');
    
    if (fs.existsSync(unisendMigrationPath)) {
      const success = await runSqlFile(unisendMigrationPath);
      
      if (success) {
        console.log('UniSend schema migration completed successfully');
      } else {
        console.error('UniSend schema migration failed');
      }
    } else {
      console.error(`Migration file not found: ${unisendMigrationPath}`);
    }
    
    // Step 3: Reload schema cache
    console.log('Reloading schema cache...');
    try {
      await supabase.rpc('reload_schema_cache');
      console.log('Schema cache reloaded successfully');
    } catch (error) {
      console.error('Error reloading schema cache:', error);
    }
    
    console.log('Schema deployment process completed');
  } catch (err) {
    console.error('Error deploying UniSend schema:', err);
  }
}

// Run the deployment
deployUniSendSchema(); 