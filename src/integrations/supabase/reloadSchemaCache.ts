import { supabase } from './client';

/**
 * Reloads the PostgREST schema cache
 * This helps when encountering schema cache errors in Supabase
 * 
 * @returns A promise that resolves when the reload command is sent
 */
export const reloadSchemaCache = async (): Promise<void> => {
  try {
    // This query sends a NOTIFY command to reload the PostgREST schema cache
    const { error } = await supabase.rpc('reload_schema_cache');
    
    if (error) {
      console.error('Error reloading schema cache:', error);
      
      // Fallback if the RPC doesn't exist
      const { error: sqlError } = await supabase.auth.getSession();
      
      if (!sqlError) {
        // Send a direct NOTIFY to reload PostgREST schema cache
        const { error: rawError } = await supabase
          .from('_postgrest_reload')
          .insert([{}]);
        
        if (rawError && rawError.code !== '42P01') {
          // If table doesn't exist, try the raw SQL approach
          await supabase.rpc('pg_notify', { 
            channel: 'pgrst', 
            payload: 'reload schema' 
          });
        }
      }
    }
    
    console.log('Schema cache reload request sent successfully');
  } catch (error) {
    console.error('Error sending schema cache reload request:', error);
  }
}; 