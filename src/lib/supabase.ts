import { createClient } from '@supabase/supabase-js';
// Hapus import database type yang tidak ada
// import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Tambahkan opsi untuk debugging dan konfigurasi yang lebih baik
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'unineeds-auth-storage-key',
    debug: true // membantu debugging masalah auth
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
});

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const checkUserRole = async (requiredRole: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error('Error checking user role:', error);
      // Fallback ke metadata auth jika tabel users tidak tersedia
      const role = user.user_metadata?.role;
      if (role === requiredRole) return user;
      throw new Error('Unauthorized');
    }
    
    if (data.role !== requiredRole) throw new Error('Unauthorized');
    
    return user;
  } catch (err) {
    console.error('Error in checkUserRole:', err);
    throw err;
  }
}; 