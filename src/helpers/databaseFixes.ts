import { supabase } from '@/integrations/supabase/client';

/**
 * Applies needed fixes to database RLS policies
 * This fixes the permission issues with orders and users tables
 */
export const applyDatabaseFixes = async (): Promise<{success: boolean, message: string}> => {
  try {
    console.log('Applying database fixes for RLS policies...');
    
    // SQL to fix RLS policies for orders table
    const fixOrdersRlsSql = `
      -- Fix permissions for orders table to allow drivers to view pending orders
      -- regardless of how driver role is stored (metadata or separate column)
      DROP POLICY IF EXISTS "Drivers can view pending UniSend orders" ON orders;
      
      CREATE POLICY "Drivers can view pending UniSend orders"
        ON orders FOR SELECT
        USING (
          service_type = 'unisend' AND 
          status = 'pending' AND 
          driver_id IS NULL AND
          (
            -- Check multiple possible ways a driver might be identified
            EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'driver')
            OR 
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'driver')
            OR
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND vehicle_info IS NOT NULL)
          )
        );
    `;
    
    // SQL to fix RLS policies for users table
    const fixUsersRlsSql = `
      -- Fix permissions for users table
      DROP POLICY IF EXISTS "Anyone can read users" ON users;
      
      CREATE POLICY "Anyone can read users"
        ON users FOR SELECT
        USING (true);
        
      -- Ensure RLS is enabled
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    `;
    
    // Apply the SQL fixes
    const { error: ordersFixError } = await supabase.rpc('exec_sql', { 
      sql: fixOrdersRlsSql 
    });
    
    if (ordersFixError) {
      console.error('Error applying orders RLS fixes:', ordersFixError);
      
      // Try direct SQL execution as fallback
      const { error } = await supabase.auth.getUser();
      if (error) {
        return {
          success: false, 
          message: `Authentication required: ${error.message}`
        };
      }
      
      // Return instructions for manual fix
      return {
        success: false,
        message: 'Please run the SQL fixes manually in the Supabase dashboard SQL editor.'
      };
    }
    
    const { error: usersFixError } = await supabase.rpc('exec_sql', { 
      sql: fixUsersRlsSql 
    });
    
    if (usersFixError) {
      console.error('Error applying users RLS fixes:', usersFixError);
      return {
        success: false,
        message: 'Fixed orders table but had an error with users table. Please check logs.'
      };
    }
    
    console.log('Successfully applied database RLS fixes');
    return {
      success: true,
      message: 'Successfully applied database permission fixes'
    };
  } catch (error) {
    console.error('Error applying database fixes:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Helper function to run this fix on app initialization
 */
export const initDatabaseFixes = () => {
  // Wait for the app to be fully loaded
  setTimeout(() => {
    applyDatabaseFixes().then(result => {
      if (result.success) {
        console.log('Database fixes applied successfully');
      } else {
        console.warn('Database fixes could not be applied:', result.message);
      }
    });
  }, 5000);
}; 