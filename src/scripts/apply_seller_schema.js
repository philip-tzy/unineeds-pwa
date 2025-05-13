const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY; // Use service key for database migrations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const applySchemaChanges = async () => {
  try {
    console.log('Reading SQL file...');
    const sqlFilePath = path.join(__dirname, '..', 'db', 'update_seller_schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into separate statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
      } else {
        console.log(`Successfully executed statement ${i + 1}`);
      }
    }
    
    console.log('Schema changes applied successfully!');
  } catch (error) {
    console.error('Error applying schema changes:', error);
    process.exit(1);
  }
};

// Run the migration
applySchemaChanges(); 