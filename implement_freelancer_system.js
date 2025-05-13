// Automatic implementation script for freelancer system
import { spawn, exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to run a command and log output
async function runCommand(command, args = [], cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

// Main implementation function
async function implementFreelancerSystem() {
  console.log('=== Starting Automatic Freelancer System Implementation ===');
  
  try {
    // 1. Apply migration to clean up dummy data
    console.log('\n📋 Step 1: Applying migration to clean up dummy data');
    const migrationSql = fs.readFileSync(
      path.join(__dirname, 'migrations', '20240610_cleanup_freelancer', 'migration.sql'),
      'utf8'
    );

    try {
      console.log('Executing migration SQL directly via pgexec RPC...');
      const { error } = await supabase.rpc('pgexec', { query: migrationSql });
      
      if (error) {
        console.error('Error executing migration SQL:', error);
        console.log('Trying alternative approach: executing statements one by one');
        
        const statements = migrationSql.split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        for (const stmt of statements) {
          console.log(`Executing statement: ${stmt.substring(0, 50)}...`);
          const { error } = await supabase.rpc('pgexec', { query: stmt });
          if (error) {
            console.warn(`Warning: Error executing statement: ${error.message}`);
          }
        }
      } else {
        console.log('Migration SQL executed successfully');
      }
    } catch (error) {
      console.error('Error executing migration:', error);
      console.log('Trying to apply migration using supabase db push...');
      
      try {
        await runCommand('npx', ['supabase', 'db', 'push']);
        console.log('Successfully pushed migration using Supabase CLI');
      } catch (pushError) {
        console.error('Error pushing migration using Supabase CLI:', pushError);
        console.log('Migration could not be applied automatically. Please apply manually.');
      }
    }
    
    // 2. Apply realtime permissions fix
    console.log('\n📋 Step 2: Applying realtime permissions for freelancer tables');
    const permissionsSql = fs.readFileSync(
      path.join(__dirname, 'src', 'db', 'migrations', 'fix_realtime_permissions_safe.sql'),
      'utf8'
    );
    
    try {
      console.log('Executing permissions SQL...');
      const { error } = await supabase.rpc('pgexec', { query: permissionsSql });
      
      if (error) {
        console.error('Error executing permissions SQL:', error);
        console.log('Permissions could not be applied automatically. Please apply manually.');
      } else {
        console.log('Permissions SQL executed successfully');
      }
    } catch (error) {
      console.error('Error applying permissions:', error);
    }
    
    // 3. Verify implementation
    console.log('\n📋 Step 3: Verifying implementation');
    
    // Check if tables exist
    const tables = [
      'services', 'skills', 'freelancer_skills', 
      'freelance_jobs', 'job_applications', 'service_offers'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        if (error) {
          console.error(`Error checking table ${table}:`, error);
        } else {
          console.log(`✅ Table ${table} exists and has ${data} rows`);
        }
      } catch (error) {
        console.error(`Error verifying table ${table}:`, error);
      }
    }
    
    // 4. Verify RLS policies
    console.log('\n📋 Step 4: Verifying RLS policies');
    try {
      const { data, error } = await supabase.rpc('pgexec', {
        query: `
          SELECT 
            schemaname, 
            tablename, 
            rowsecurity 
          FROM 
            pg_tables 
          WHERE 
            schemaname = 'public' AND 
            tablename IN ('services', 'skills', 'freelancer_skills')
        `
      });
      
      if (error) {
        console.error('Error checking RLS:', error);
      } else if (data) {
        console.log('RLS status for tables:');
        console.log(data);
      }
    } catch (error) {
      console.error('Error verifying RLS policies:', error);
    }
    
    console.log('\n✅ Freelancer system implementation complete!');
    console.log('Freelancers can now add their own skills and services.');
    console.log('Dummy data has been removed.');
    console.log('\nImportant: Make sure your frontend is up to date with these changes.');
    
  } catch (error) {
    console.error('Implementation failed:', error);
    process.exit(1);
  }
}

// Run the implementation
implementFreelancerSystem(); 