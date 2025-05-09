import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'driver' | 'seller' | 'freelancer' | 'customer';
export type SellerType = 'unishop' | 'unifood' | null;
export type FreelancerSkill = 'programming' | 'design' | 'writing' | 'other' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  sellerType?: SellerType;
  freelancerSkill?: FreelancerSkill;
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
    try {
      // First check if user has metadata (including role) from Supabase
      const userMetadata = sessionUser.user_metadata;
      console.log('User metadata from Supabase:', userMetadata);
      
      // Try to get user data from database if it exists
      let dbUser = null;
      try {
        // Try profiles table first (preferred in Supabase)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching user from profiles:', profileError);
          
          // Fallback to users table if profiles doesn't work
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionUser.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user from database:', userError);
          } else {
            dbUser = userData;
          }
        } else {
          dbUser = profileData;
        }
      } catch (dbError) {
        console.error('Error getting user from database:', dbError);
      }
      
      // Then check if we have stored user data
      const storedUserJson = localStorage.getItem('user');
      const storedUser = storedUserJson ? JSON.parse(storedUserJson) : null;
      
      if (storedUser) {
        console.log('User data from localStorage:', storedUser);
      }
      
      // Create user object with correct priority for role: 
      // 1. Use role from Supabase metadata if available (most authoritative)
      // 2. Use role from database if available
      // 3. Use existing role from stored user if available
      // 4. Fall back to 'customer' as default only if no role information exists
      const role = userMetadata?.role || dbUser?.role || storedUser?.role || 'customer';
      console.log('Determined user role:', role);
      
      // Create the complete user object with all available data
      const userData: User = {
        id: sessionUser.id,
        name: userMetadata?.full_name || dbUser?.full_name || dbUser?.name || storedUser?.name || sessionUser.email?.split('@')[0] || 'User',
        email: sessionUser.email || '',
        role: role,
        avatar: dbUser?.avatar_url || storedUser?.avatar,
        sellerType: dbUser?.seller_type || storedUser?.sellerType,
        freelancerSkill: dbUser?.freelancer_skill || storedUser?.freelancerSkill
      };
      
      // Save the updated user data to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Updated user data in localStorage:', userData);
      
      return userData;
    } catch (error) {
      console.error('Error getting user data:', error);
      // Fallback to default user if there's an error
      return {
        id: sessionUser.id,
        name: sessionUser.email?.split('@')[0] || 'User',
        email: sessionUser.email || '',
        role: sessionUser.user_metadata?.role || 'customer',
      };
    }
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
          avatar_url: userData.avatar,
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

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const userData = await getUserData(session.user);
        setUser(userData);
      }
      setIsLoading(false);
    });

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
            
            // The auth listener will handle setting the user state,
            // but we can manually trigger user data setup here for immediate response
            console.log('Getting user data for:', data.user.id);
            const userData = await getUserData(data.user);
            console.log('User data returned:', userData);
            setUser(userData);
            
            // Ensure user exists in database
            console.log('Ensuring user exists in database');
            await ensureUserInDatabase(userData);
            
            console.log('User data set successfully:', userData);
            
            // If there's a role in metadata but not in local storage (or different),
            // update local storage to match
            const metadata = data.user.user_metadata;
            console.log('User metadata:', metadata);
            
            if (metadata && metadata.role) {
              const storedUserJson = localStorage.getItem('user');
              if (storedUserJson) {
                const storedUser = JSON.parse(storedUserJson);
                // Only update if different to avoid unnecessary writes
                if (storedUser.role !== metadata.role) {
                  storedUser.role = metadata.role;
                  localStorage.setItem('user', JSON.stringify(storedUser));
                  console.log('Updated user role in localStorage:', metadata.role);
                }
              }
            }
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
      // Register user with Supabase and include role in metadata
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Create user object with role
        const userData: User = {
          id: data.user.id,
          name,
          email,
          role,
        };
        
        // Save user data to state and localStorage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Also try to create/update user in the users table if you have one
        try {
          await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              name,
              email,
              role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        } catch (dbError) {
          console.error('Error creating user in database:', dbError);
          // Continue anyway since we have the auth record
        }
      }
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
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
    if (user) {
      try {
        // First update the role in Supabase user metadata
        await supabase.auth.updateUser({
          data: { role }
        });
        
        // Then update the local user object
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Optionally also update the role in the users table if you have one
        try {
          await supabase
            .from('users')
            .update({ role })
            .eq('id', user.id);
        } catch (dbError) {
          console.error('Error updating role in database:', dbError);
          // Continue anyway since we updated the auth metadata
        }
      } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
    }
  };

  const updateSellerType = (type: SellerType) => {
    if (user) {
      const updatedUser = { ...user, sellerType: type };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updateFreelancerSkill = (skill: FreelancerSkill) => {
    if (user) {
      const updatedUser = { ...user, freelancerSkill: skill };
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
