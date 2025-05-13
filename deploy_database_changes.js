// Script to deploy SQL changes to Supabase
// Usage: node deploy_database_changes.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Change these to match your Supabase project
const SUPABASE_URL = "https://otkhxrrbiqdutlgfkfdm.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''; // Get from Supabase dashboard

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is not set');
  console.error('Please set it to your Supabase service role key');
  console.error('You can find this in your Supabase dashboard under Project Settings > API');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Running SQL file: ${filePath}`);
    
    // Run the SQL query using Supabase's REST API directly
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error running SQL file ${filePath}:`, error);
      return false;
    }
    
    console.log(`Successfully executed SQL file: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error reading or executing SQL file ${filePath}:`, err);
    return false;
  }
}

async function createExecSqlFunction() {
  // First create the SQL execution function if it doesn't exist
  const createFunctionSql = `
    -- Create function to execute SQL (requires admin rights)
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT) RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Grant execute to authenticated users with service role
    GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
  `;
  
  try {
    // Using pg connection through REST API
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSql });
    
    if (error) {
      console.error('Error creating exec_sql function:', error);
      console.log('Trying to run changes directly...');
    } else {
      console.log('Successfully created exec_sql function');
    }
  } catch (err) {
    console.error('Error setting up exec_sql function:', err);
  }
}

async function deploySqlFiles() {
  // Create the exec_sql function first
  await createExecSqlFunction();
  
  // Find all SQL files in the migrations directory
  const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
  const functionsDir = path.join(__dirname, 'src', 'db', 'functions');
  
  try {
    // Create directories if they don't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    if (!fs.existsSync(functionsDir)) {
      fs.mkdirSync(functionsDir, { recursive: true });
    }
    
    // Process migrations first
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Process in alphabetical order
      
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        await runSqlFile(filePath);
      }
    }
    
    // Then process functions
    if (fs.existsSync(functionsDir)) {
      const functionFiles = fs.readdirSync(functionsDir)
        .filter(file => file.endsWith('.sql'));
      
      for (const file of functionFiles) {
        const filePath = path.join(functionsDir, file);
        await runSqlFile(filePath);
      }
    }
    
    // Finally trigger a schema reload
    console.log('Reloading schema cache...');
    await supabase.rpc('reload_schema_cache').catch(err => {
      console.error('Error reloading schema cache, but changes were applied:', err);
    });
    
    console.log('Database changes deployed successfully');
  } catch (err) {
    console.error('Error deploying SQL files:', err);
  }
}

// Run the deployment
deploySqlFiles(); 