import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY; // Use service key for database migrations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const applyItemServiceTypeChanges = async () => {
  try {
    console.log('Reading SQL file...');
    const sqlFilePath = path.join(__dirname, '..', 'db', 'update_item_service_type.sql');
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
    
    console.log('Item service type changes applied successfully!');
  } catch (error) {
    console.error('Error applying item service type changes:', error);
    process.exit(1);
  }
};

// Run the migration
applyItemServiceTypeChanges(); 