import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import UniMove from "./pages/UniMove";
import UniFood from "./pages/UniFood";
import QuickHire from "./pages/QuickHire";
import UniShop from "./pages/UniShop";
import UniSend from "./pages/UniSend";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverDashboard from "./pages/driver/Dashboard";
import DriverUniMove from "./pages/driver/UniMove";
import DriverUniSend from "./pages/driver/UniSend";
import DriverEarningsPage from "./pages/driver/Earnings";
import DriverProfilePage from "./pages/driver/Profile";
import UniShopSellerDashboard from "./pages/seller/unishop/Dashboard";
import UniFoodSellerDashboard from "./pages/seller/unifood/Dashboard";
import UniFoodMenu from "./pages/seller/unifood/Menu";
import FreelancerDashboard from "./pages/freelancer/Dashboard";
import FreelancerJobs from "./pages/freelancer/Jobs";
import FreelancerSkills from "./pages/freelancer/Skills";
import FreelancerOffers from "./pages/freelancer/Offers";
import ManageServicesPage from "./pages/freelancer/ManageServicesPage";
import CustomerPostedJobs from "./pages/customer/PostedJobs";
import Saved from "./pages/Saved";
import History from "./pages/History";
import Profile from "./pages/Profile";
import ProductsPage from "./pages/seller/unishop/ProductsPage"; 
import AddProduct from "./pages/seller/unishop/AddProduct";
import EditProduct from "./pages/seller/unishop/EditProduct";
import OrdersPage from "./pages/seller/orders";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NotificationProvider from "./context/NotificationContext";
import ServiceDetail from '@/pages/ServiceDetail';
import CustomerServiceOffers from '@/pages/customer/ServiceOffers';
import DriverRequestsPage from "./pages/driver/Requests";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const RoleRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode, 
  allowedRoles: string[] 
}) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  const renderIndex = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    switch (user.role) {
      case 'driver':
        return <Navigate to="/driver/dashboard" replace />;
      case 'seller':
        return <Navigate to="/seller/dashboard" replace />;
      case 'freelancer':
        return <Navigate to="/freelancer/dashboard" replace />;
      default:
        return <Index />;
    }
  };
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/seller-dashboard" element={
        <Navigate to="/seller/dashboard" replace />
      } />
      <Route path="/seller/dashboard" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['seller']}>
            <UniShopSellerDashboard />
          </RoleRoute>
        </ProtectedRoute>
      } />
      
      <Route path="/" element={renderIndex()} />
      
      {/* Customer Routes */}
      <Route path="/unimove" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['customer']}>
            <UniMove />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/unifood" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['customer']}>
            <UniFood />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/quickhire" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['customer']}>
            <QuickHire />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/customer/jobs" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['customer']}>
            <CustomerPostedJobs />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/unishop" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['customer']}>
            <UniShop />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/unisend" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['customer']}>
            <UniSend />
          </RoleRoute>
        </ProtectedRoute>
      } />
      
      {/* Driver Routes */}
      <Route path="/driver/dashboard" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/driver/requests" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['driver']}>
            <DriverRequestsPage />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/driver/earnings" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['driver']}>
            <DriverEarningsPage />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/driver/profile" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['driver']}>
            <DriverProfilePage />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/driver/unimove" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['driver']}>
            <DriverUniMove />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/driver/unisend" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['driver']}>
            <DriverUniSend />
          </RoleRoute>
        </ProtectedRoute>
      } />
      
      {/* Seller Routes */}
      <Route path="/seller/unishop/dashboard" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['seller']}>
            <UniShopSellerDashboard />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/seller/unishop/products" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['seller']}>
            <ProductsPage />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/seller/unishop/add-product" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['seller']}>
            <AddProduct />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/seller/unishop/edit-product/:id" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['seller']}>
            <EditProduct />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/seller/unifood/dashboard" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['seller']}>
            <UniFoodSellerDashboard />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/seller/unifood/menu" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['seller']}>
            <UniFoodMenu />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/seller/orders" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['seller']}>
            <OrdersPage />
          </RoleRoute>
        </ProtectedRoute>
      } />
      
      {/* Freelancer Routes */}
      <Route path="/freelancer/dashboard" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['freelancer']}>
            <FreelancerDashboard />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/freelancer/jobs" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['freelancer']}>
            <FreelancerJobs />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/freelancer/skills" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['freelancer']}>
            <FreelancerSkills />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/freelancer/services" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['freelancer']}>
            <ManageServicesPage />
          </RoleRoute>
        </ProtectedRoute>
      } />
      <Route path="/freelancer/offers" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['freelancer']}>
            <FreelancerOffers />
          </RoleRoute>
        </ProtectedRoute>
      } />
      
      {/* Common Routes */}
      <Route path="/saved" element={
        <ProtectedRoute>
          <Saved />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      <Route path="/service/:serviceId" element={<ServiceDetail />} />
      <Route path="/customer/offers" element={<CustomerServiceOffers />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
