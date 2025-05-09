import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserPlus, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reset error message
    setErrorMessage('');
    
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Mohon isi semua field');
      toast({
        title: "Error",
        description: "Mohon isi semua field",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password tidak cocok');
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive",
      });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Format email tidak valid');
      toast({
        title: "Error",
        description: "Format email tidak valid",
        variant: "destructive",
      });
      return;
    }
    
    // Basic password strength validation
    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter');
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Registering user:', { name, email, role });
      await register(name, email, password, role);
      toast({
        title: "Berhasil",
        description: "Akun berhasil dibuat, Anda akan diarahkan ke halaman yang sesuai",
      });
      
      // User will be automatically redirected to the appropriate page based on their role
      // The redirect is handled in the AppRoutes component
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMsg = "Gagal membuat akun. Silakan coba lagi.";
      
      if (error.message?.includes('email already in use')) {
        errorMsg = "Email sudah digunakan. Silakan gunakan email lain.";
      } else if (error.message?.includes('password')) {
        errorMsg = "Password tidak memenuhi persyaratan keamanan. Gunakan kombinasi huruf dan angka.";
      }
      
      setErrorMessage(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          <h2 className="mt-2 text-xl font-bold">Buat Akun</h2>
          <p className="mt-2 text-sm text-gray-600">Daftar untuk mulai menggunakan layanan</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full"
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Saya ingin mendaftar sebagai</Label>
              <div className="mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-4">Pilih salah satu peran (Anda dapat mengubahnya nanti)</p>
                <RadioGroup 
                  value={role} 
                  onValueChange={(value) => setRole(value as UserRole)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer">Pelanggan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="driver" id="driver" />
                    <Label htmlFor="driver">Pengemudi</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="seller" id="seller" />
                    <Label htmlFor="seller">Penjual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="freelancer" id="freelancer" />
                    <Label htmlFor="freelancer">Penyedia Jasa Freelance</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-[#003160] hover:bg-[#002040] text-white"
              disabled={isSubmitting}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Membuat akun...' : 'Buat Akun'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-[#003160] hover:underline font-medium">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
