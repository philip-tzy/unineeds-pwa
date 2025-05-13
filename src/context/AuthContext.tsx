import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { userServices } from '@/services/api';

export type UserRole = 'driver' | 'seller' | 'freelancer' | 'customer';
export type SellerType = 'unishop' | 'unifood';
export type DriverType = 'unisend' | 'unimove';
export type FreelancerSkill = 'programming' | 'design' | 'writing' | 'other' | null;

export interface User {
  id: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: {
    avatar_url?: string;
    email?: string;
    email_verified?: boolean;
    full_name?: string;
    iss?: string;
    name?: string;
    picture?: string;
    provider_id?: string;
    sub?: string;
    // Fields from 'profiles' table
    role?: UserRole;
    seller_type?: SellerType | null;
    driver_type?: DriverType | null;
    // Tambahkan field lain dari tabel profiles yang relevan di sini
    // Misalnya: name, avatar_url jika Anda sinkronisasi dari profiles ke user object AuthContext
  };
  aud: string;
  confirmation_sent_at?: string;
  recovery_sent_at?: string;
  email_change_sent_at?: string;
  new_email?: string;
  invited_at?: string;
  action_link?: string;
  email?: string;
  phone?: string;
  created_at: string;
  confirmed_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  role_legacy?: string; // 'role' di Supabase Auth deprecated, gunakan dari tabel profiles
  updated_at?: string;
  // Ini adalah data dari tabel 'profiles' yang digabungkan
  // setelah user login dan data profile diambil.
  // Strukturnya mungkin sedikit berbeda tergantung bagaimana Anda mengambil dan menggabungkan data.
  // Contoh di atas mengasumsikan user_metadata juga bisa menyimpan info tambahan,
  // atau Anda memiliki user object yang lebih kaya di context.

  // Jika user object Anda langsung dari getCurrentUser() di api.ts:
  // id: string;
  // name?: string;
  // avatar_url?: string;
  // role: UserRole;
  // seller_type?: SellerType | null;
  // driver_type?: DriverType | null;
  // email?: string; // dari auth.user()
  // ...dan field lain dari profiles
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  updateSellerType: (type: SellerType) => void;
  updateFreelancerSkill: (skill: FreelancerSkill) => void;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get user data from Supabase and localStorage
  const getUserData = async (sessionUser: any) => {
    console.log('=== GET USER DATA DIAGNOSTICS ===');
    console.log('Getting user data for session user:', sessionUser);
    
    // Initialize with default role
    let userRole: UserRole = 'customer';
    let sellerType: SellerType | null = null;
    let driverType: DriverType | null = null;
    let freelancerSkill: FreelancerSkill = null;
    
    // Try to get role from auth metadata first
    if (sessionUser?.user_metadata?.role) {
      userRole = sessionUser.user_metadata.role;
      console.log('Found role in user_metadata:', userRole);
    }
    
    // Try to get from profiles table (more authoritative)
    try {
      console.log('Fetching profile data for user:', sessionUser?.id);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role, seller_type, driver_type, freelancer_skill')
        .eq('id', sessionUser?.id)
        .single();
        
      console.log('Profile data from database:', profileData);
      console.log('Profile error:', error);
      
      if (!error && profileData) {
        // Only override role if it's set in the database
        if (profileData.role) {
          userRole = profileData.role;
          console.log('Set role from profile data:', userRole);
        }
        
        // Get additional role-specific data
        sellerType = profileData.seller_type;
        driverType = profileData.driver_type;
        freelancerSkill = profileData.freelancer_skill;
        
        console.log('Role-specific data:', { 
          sellerType, 
          driverType, 
          freelancerSkill 
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    
    // Build user object with all the data we've gathered
    const user: User = {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
      full_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
      role: userRole,
      seller_type: sellerType,
      driver_type: driverType,
      freelancer_skill: freelancerSkill,
      aud: sessionUser.aud,
      created_at: sessionUser.created_at,
      app_metadata: sessionUser.app_metadata || {},
      user_metadata: sessionUser.user_metadata || {}
    };
    
    console.log('Final user object with role:', user);
    return user;
  };

  // Helper function to ensure user exists in database
  const ensureUserInDatabase = async (userData: User) => {
    try {
      console.log('Checking if user exists in database:', userData.id);
      
      // Try to upsert to profiles table first
      console.log('Upserting to profiles table');
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.id,
          full_name: userData.name,
          role: userData.role,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.error('Error upserting to profiles table:', profileError);
        
        // If profiles fails, fallback to users table
        if (profileError.message.includes('relation "profiles" does not exist')) {
          console.log('Profiles table does not exist, trying users table instead');
          
          // Check if user already exists in users table
          const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userData.id)
            .maybeSingle();
          
          if (userCheckError) {
            console.error('Error checking if user exists in users table:', userCheckError);
          }
          
          if (!existingUser) {
            console.log('User does not exist in users table, creating:', userData.id);
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error('Error creating user in users table:', insertError);
            } else {
              console.log('Successfully created user in users table');
            }
          } else {
            console.log('User exists in users table, updating if needed');
            if (existingUser.role !== userData.role) {
              console.log('Updating user role in users table from', existingUser.role, 'to', userData.role);
              const { error: updateError } = await supabase
                .from('users')
                .update({ 
                  role: userData.role,
                  updated_at: new Date().toISOString() 
                })
                .eq('id', userData.id);
              
              if (updateError) {
                console.error('Error updating user role in users table:', updateError);
              } else {
                console.log('Successfully updated user role in users table');
              }
            }
          }
        }
      } else {
        console.log('Successfully upserted to profiles table');
      }
    } catch (error) {
      console.error('Error in ensureUserInDatabase:', error);
      // Don't throw error, just log it - we can still proceed with authentication
    }
  };

  useEffect(() => {
    const setData = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        setIsLoading(false);
        return;
      }
      setSession(session);
      if (session?.user) {
        try {
          // Ambil data profil tambahan dari tabel 'profiles'
          const profileData = await userServices.getCurrentUser();
          // Gabungkan data auth user dengan data profile
          // Pastikan field `role`, `seller_type`, `driver_type` diambil dari `profileData`
          const enrichedUser = {
            ...session.user, // Data dari Supabase Auth (seperti email, id)
            ...profileData    // Data dari tabel profiles (role, seller_type, driver_type, name, dll.)
          };
          setUser(enrichedUser as User); // Pastikan casting ini aman atau definisikan tipe enrichedUser
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError);
          setUser(session.user as User); // Fallback ke user dari session jika profile gagal diambil
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    setData();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const userData = await getUserData(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Add diagnostic logging
    console.log('=== AUTH CONTEXT LOGIN DIAGNOSTICS ===');
    console.log('Starting login process for email:', email);
    console.log('Current session:', session);
    console.log('Current user:', user);
    console.log('Local storage user data:', localStorage.getItem('user'));
    
    // Clear existing user data to start fresh
    localStorage.removeItem('user');
    
    // Menggunakan Promise.race untuk menangani timeout dengan lebih elegan
    try {
      console.log('Attempting login for:', email);
      
      const loginPromise = new Promise(async (resolve, reject) => {
        try {
          console.log('Calling supabase.auth.signInWithPassword...');
          const { error, data } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            console.error('Login error from Supabase:', error);
            reject(error);
            return;
          }
          
          console.log('Login successful, user data:', data.user);
          console.log('Session data:', data.session);
          
          // Get the user's metadata to ensure correct role
          if (data.user) {
            // Set session explicitly to ensure auth state is updated
            setSession(data.session);
            
            // First, try to get profile data from database
            let dbRole = null;
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role, driver_type, seller_type')
                .eq('id', data.user.id)
                .single();
                
              if (!profileError && profileData) {
                dbRole = profileData.role;
                console.log('Found role in database:', dbRole);
                console.log('Found profile data:', profileData);
              }
            } catch (dbError) {
              console.error('Error fetching profile from database:', dbError);
            }
            
            // The auth listener will handle setting the user state,
            // but we can manually trigger user data setup here for immediate response
            console.log('Getting user data for:', data.user.id);
            const userData = await getUserData(data.user);
            
            // Override with database role if available (most authoritative)
            if (dbRole) {
              userData.role = dbRole;
              console.log('Using database role:', dbRole);
            }
            
            console.log('User data with final role:', userData);
            setUser(userData);
            
            // Ensure user exists in database
            console.log('Ensuring user exists in database');
            await ensureUserInDatabase(userData);
            
            console.log('User data set successfully:', userData);
            
            // Make sure the role in localStorage matches the one we determined
            const userForStorage = {
              ...userData,
              role: userData.role // Ensure role is explicitly set
            };
            localStorage.setItem('user', JSON.stringify(userForStorage));
            console.log('Updated localStorage with user data including role:', userData.role);
            
            resolve(data);
          } else {
            console.error('Login successful but no user data returned');
            reject(new Error('Data user tidak ditemukan. Silakan coba lagi.'));
          }
        } catch (error) {
          reject(error);
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('Login timeout after 15 seconds');
          reject(new Error('Login timeout. Koneksi lambat atau server tidak merespon. Silakan coba lagi nanti.'));
        }, 15000); // Meningkatkan timeout menjadi 15 detik
      });
      
      // Race between login dan timeout
      await Promise.race([loginPromise, timeoutPromise]);
      
    } catch (error: any) {
      console.error('Error logging in:', error);
      // Provide more specific error messages to help troubleshoot
      if (error.message?.includes('timeout')) {
        throw new Error('Login timeout. Koneksi lambat atau server tidak merespon. Silakan coba lagi nanti.');
      } else if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Email atau password salah. Silakan coba lagi.');
      } else if (error.message?.includes('Email not confirmed')) {
        throw new Error('Email belum dikonfirmasi. Silakan cek email Anda.');
      } else if (error.message?.includes('rate limit')) {
        throw new Error('Terlalu banyak percobaan login. Silakan tunggu beberapa saat dan coba lagi.');
      } else {
        throw new Error(`Gagal login: ${error.message || 'Terjadi kesalahan pada server'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      console.log('Starting manual registration process for:', email, 'with role:', role);
      
      // WORKAROUND: Use a two-step approach to avoid database trigger issues
      
      // Step 1: Create user in auth.users directly
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role
          },
          // IMPORTANT: Set emailRedirectTo to prevent auto-confirmation emails
          // which can cause timing issues with the database operation
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        throw signUpError;
      }
      
      if (!data.user) {
        console.error('No user data returned from auth signup');
        throw new Error('Failed to create user account. Please try again.');
      }

      console.log('Auth signup successful, got user ID:', data.user.id);
      
      // Step 2: Create or update the profile with the correct role
      try {
        console.log('Creating user profile with role:', role);
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: name,
            role: role,
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Continue anyway since we can fall back on auth metadata
        } else {
          console.log('Successfully created profile with role:', role);
        }
      } catch (profileErr) {
        console.error('Error in profile creation:', profileErr);
        // Continue with authentication
      }
      
      // Store the user in local state
      const userData = {
        id: data.user.id,
        email: email,
        name: name,
        role: role,
        user_metadata: {
          full_name: name,
          role: role
        },
        created_at: new Date().toISOString()
      } as unknown as User;
      
      setUser(userData);
      
      // Make sure role is explicitly set in localStorage
      const userForStorage = {
        id: data.user.id,
        email: email,
        name: name,
        role: role,  // Explicitly set role
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(userForStorage));
      console.log('Registration successful! User saved to localStorage with role:', role);
      
      return;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('already in use')) {
        throw new Error('Email sudah digunakan. Silakan gunakan email lain.');
      } else if (error.message?.includes('password')) {
        throw new Error('Password tidak memenuhi persyaratan keamanan.');
      } else if (error.message?.includes('Database error')) {
        // This is the specific error we're seeing
        throw new Error('Terjadi masalah pada sistem database. Tim kami sedang mengatasi masalah ini.');
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateUserRole = async (role: UserRole) => {
    try {
      if (!user || !user.id) {
        console.error('No user logged in');
        return;
      }

      console.log(`Updating user role to: ${role}`);
      
      // Update in Supabase profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error updating role in profiles table:', profileError);
        throw profileError;
      }
      
      // Ensure the user table is updated as well for consistency 
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          role: role,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
      
      if (userError) {
        console.error('Error updating role in users table:', userError);
        // Continue anyway since profiles is more important
      }
      
      // Update the user in context
      const updatedUser: User = { ...user, role };
      setUser(updatedUser);
      
      // Also update in local storage 
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('Role updated successfully to:', role);
      
      // Redirect to the appropriate page based on new role
      if (role === 'seller') {
        // For seller, redirect to seller profile
        window.location.href = '/seller/profile';
      } else if (role === 'driver') {
        // For driver, redirect to driver profile
        window.location.href = '/driver/profile';
      } else if (role === 'freelancer') {
        // For freelancer, redirect to freelancer dashboard
        window.location.href = '/freelancer/dashboard';
      } else {
        // For customer, redirect to main dashboard
        window.location.href = '/';
      }
      
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  const updateSellerType = (type: SellerType) => {
    if (user) {
      const updatedUser = { ...user, seller_type: type };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updateFreelancerSkill = (skill: FreelancerSkill) => {
    if (user) {
      const updatedUser = { ...user, freelancer_skill: skill };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUserRole,
      updateSellerType,
      updateFreelancerSkill,
      session
    }}>
      {children}
    </AuthContext.Provider>
  );
};
