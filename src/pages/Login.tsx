import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { login, isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (errorMessage.includes('koneksi')) {
        setErrorMessage('');
        toast({
          title: "Koneksi Dipulihkan",
          description: "Anda kembali online. Silakan coba login.",
        });
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setErrorMessage('Tidak ada koneksi internet. Pastikan Anda terhubung ke internet.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [errorMessage, toast]);

  useEffect(() => {
    // Clear any error messages when component mounts
    setErrorMessage('');
    
    // Check connection
    if (!navigator.onLine) {
      setIsOnline(false);
      setErrorMessage('Tidak ada koneksi internet. Pastikan Anda terhubung ke internet.');
    }
    
    // Print current auth state for debugging
    console.log('Auth state:', { isAuthenticated, user });
    
    if (isAuthenticated && user) {
      console.log('User authenticated, redirecting to:', user.role);
      switch (user.role) {
        case 'driver':
          navigate('/driver/dashboard', { replace: true });
          break;
        case 'seller':
          navigate('/seller/dashboard', { replace: true });
          break;
        case 'freelancer':
          navigate('/freelancer/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reset error message
    setErrorMessage('');
    
    // Add diagnostic logging
    console.log('=== LOGIN DIAGNOSTICS ===');
    console.log('Network status:', navigator.onLine ? 'Online' : 'Offline');
    console.log('Browser:', navigator.userAgent);
    console.log('Timestamp:', new Date().toString());
    console.log('Email input:', email);
    console.log('Password length:', password ? password.length : 0);
    
    // Check if online
    if (!navigator.onLine) {
      setIsOnline(false);
      setErrorMessage('Tidak ada koneksi internet. Pastikan Anda terhubung ke internet.');
      toast({
        title: "Error",
        description: "Tidak ada koneksi internet. Pastikan Anda terhubung ke internet.",
        variant: "destructive",
      });
      return;
    }
    
    if (!email || !password) {
      setErrorMessage('Mohon isi semua field');
      toast({
        title: "Error",
        description: "Mohon isi semua field",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Attempting login with email:', email);
      localStorage.setItem('lastLoginAttempt', new Date().toString());
      
      // Test Supabase connection
      let supabaseConnectionOk = false;
      try {
        console.log('Testing Supabase connection...');
        // Add this line to check if Supabase is reachable
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
          console.error('Supabase connection test failed:', error);
          if (error.message.includes('relation "users" does not exist')) {
            // This means we can connect to Supabase, but the table doesn't exist
            // This is actually okay for new installations
            supabaseConnectionOk = true;
            console.log('Users table does not exist, but connection is OK');
          }
        } else {
          console.log('Supabase connection test succeeded:', data);
          supabaseConnectionOk = true;
        }
      } catch (connError) {
        console.error('Error testing Supabase connection:', connError);
      }
      
      // Set a local timeout to prevent UI freezing if there's network issues
      const loginPromise = login(email, password);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('UI Timeout')), 18000)
      );
      
      // Race between login and local UI timeout
      await Promise.race([loginPromise, timeoutPromise]);
      
      console.log('Login successful');
      toast({
        title: "Berhasil",
        description: "Berhasil masuk",
      });
      
      // Reset retry count on success
      setRetryCount(0);
    } catch (error: any) {
      console.error('Login error:', error);
      setRetryCount(prev => prev + 1);
      
      // Create a more user-friendly error message
      let friendlyMessage = error.message || "Gagal login. Silakan periksa kredensial Anda.";
      
      // Special handling for timeout errors
      if (error.message?.includes('timeout') || error.message === 'UI Timeout') {
        friendlyMessage = 'Proses login terlalu lama. Mohon periksa koneksi internet Anda dan coba lagi.';
      }
      
      // Special handling for database connectivity issues
      if (error.message?.includes('database') || error.message?.includes('relation')) {
        friendlyMessage = 'Terjadi masalah dengan koneksi ke database. Silakan coba lagi nanti.';
      }
      
      // Add emergency login option for administrators
      const isAdminEmail = email.toLowerCase().includes('admin') || 
                          email.toLowerCase().includes('administrator');
      
      if (isAdminEmail && retryCount >= 1) {
        console.log('Showing emergency login option for admin');
        friendlyMessage += ' Jika Anda administrator, gunakan tombol "Emergency Login" di bawah.';
      }
      
      // Add debugging info if we've tried multiple times
      if (retryCount >= 2) {
        friendlyMessage += " Untuk bantuan teknis, hubungi admin dengan kode: L" + Date.now().toString().slice(-6);
        
        // Print detailed debug info to console
        console.error('Login debug info:', {
          retryCount: retryCount + 1,
          lastAttempt: localStorage.getItem('lastLoginAttempt'),
          browser: navigator.userAgent,
          online: navigator.onLine,
          timestamp: new Date().toString()
        });
      }
      
      setErrorMessage(friendlyMessage);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRetry = () => {
    // Clear any cached data that might be causing issues
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Clear service worker caches to force fresh data
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Reset error state
    setErrorMessage('');
    setRetryCount(0);
    
    toast({
      title: "Info",
      description: "Cache dibersihkan. Silakan coba login kembali.",
    });
  };

  // Add emergency login handler for admins
  const handleEmergencyLogin = () => {
    if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('administrator')) {
      console.log('Attempting emergency admin login');
      
      // Create a simple admin user object for emergency access
      const adminUser = {
        id: 'emergency-admin-' + Date.now(),
        name: 'Admin (Emergency Mode)',
        email: email,
        role: 'admin' as UserRole,
      };
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(adminUser));
      
      // Show success message
      toast({
        title: "Emergency Login",
        description: "Login darurat berhasil. Beberapa fitur mungkin tidak tersedia.",
      });
      
      // Navigate to admin page
      navigate('/admin/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            <span className="text-[#003160]">Uni</span>
            <span className="text-[#B10000]">Needs</span>
          </h1>
          <h2 className="mt-2 text-xl font-bold">Selamat Datang Kembali</h2>
          <p className="mt-2 text-sm text-gray-600">Masuk untuk melanjutkan ke akun Anda</p>
          
          {/* Connection status indicator */}
          <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span>{errorMessage}</span>
              <div className="mt-2 flex flex-col space-y-2">
                {(retryCount >= 2 || errorMessage.includes('timeout')) && (
                  <button 
                    onClick={handleRetry}
                    className="flex items-center text-sm text-red-600 hover:text-red-800"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Bersihkan cache dan coba lagi
                  </button>
                )}
                
                {/* Emergency login option for admins */}
                {(email.toLowerCase().includes('admin') || email.toLowerCase().includes('administrator')) && retryCount >= 1 && (
                  <button 
                    onClick={handleEmergencyLogin}
                    className="flex items-center text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200"
                  >
                    <LogIn className="h-3 w-3 mr-1" /> Emergency Login (Admin Only)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anda@contoh.com"
                  className="w-full"
                  disabled={!isOnline}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <div className="text-sm">
                  <a href="#" className="text-[#003160] hover:underline">
                    Lupa password?
                  </a>
                </div>
              </div>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full"
                  disabled={!isOnline}
                />
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-[#003160] hover:bg-[#002040] text-white"
              disabled={isSubmitting || !isOnline}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Sedang masuk...' : 'Masuk'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link to="/register" className="text-[#003160] hover:underline font-medium">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
