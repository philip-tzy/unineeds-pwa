import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, 
  BarChart3, 
  DollarSign, 
  Clock, 
  Users, 
  Star, 
  Plus,
  MessageSquare,
  Calendar,
  Handshake,
  Bell,
  ListChecks,
  Layers,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';
import { 
  getFreelancerMetrics, 
  subscribeToFreelancerMetrics,
  FreelancerMetrics,
  initializeFreelancerMetrics
} from '@/services/freelancerMetrics';
import { formatCurrency } from '@/lib/utils';

const FreelancerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FreelancerMetrics | null>(null);
  
  useEffect(() => {
    if (user?.id) {
      // Initial fetch of metrics
      fetchMetrics();
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToFreelancerMetrics(user.id, (updatedMetrics) => {
        setMetrics(updatedMetrics);
        setLoading(false);
      });
      
      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [user]);
  
  const fetchMetrics = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Try to fetch existing metrics
      const metricsData = await getFreelancerMetrics(user.id);
      
      if (!metricsData) {
        // If no metrics exist, initialize them
        console.log('No metrics found, initializing...');
        await initializeFreelancerMetrics(user.id);
        
        // Try fetching again
        const retriedMetrics = await getFreelancerMetrics(user.id);
        setMetrics(retriedMetrics);
      } else {
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error fetching freelancer metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Freelancer Dashboard</h1>
            <p className="text-sm opacity-80">Welcome back, {user?.name}</p>
          </div>
          <div className="flex">
            <button className="bg-[#004180] p-2 rounded-full mr-2">
              <Bell size={20} />
            </button>
            <button className="bg-[#004180] p-2 rounded-full">
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Stats */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Available Balance</p>
              {loading ? (
                <div className="flex justify-center items-center h-8">
                  <Loader2 size={20} className="animate-spin text-[#003160]" />
                </div>
              ) : (
                <p className="text-xl font-bold text-[#003160]">
                  {formatCurrency(metrics?.available_balance || 0)}
                </p>
              )}
            </div>
            <Button className="bg-[#003160] text-white hover:bg-[#002040]">
              Withdraw
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1">
              <Briefcase size={16} className="text-[#003160] mr-1" />
              <span className="text-xs text-gray-500">Active Jobs</span>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-7">
                <Loader2 size={16} className="animate-spin text-[#003160]" />
              </div>
            ) : (
              <p className="text-lg font-bold">{metrics?.active_jobs || 0}</p>
            )}
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign size={16} className="text-[#003160] mr-1" />
              <span className="text-xs text-gray-500">Earnings</span>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-7">
                <Loader2 size={16} className="animate-spin text-[#003160]" />
              </div>
            ) : (
              <p className="text-lg font-bold">{formatCurrency(metrics?.total_earnings || 0)}</p>
            )}
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1">
              <Star size={16} className="text-[#003160] mr-1" />
              <span className="text-xs text-gray-500">Rating</span>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-7">
                <Loader2 size={16} className="animate-spin text-[#003160]" />
              </div>
            ) : (
              <p className="text-lg font-bold">
                {metrics?.total_reviews ? metrics.average_rating.toFixed(1) : '-'}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 mt-2">
        <div className="grid grid-cols-3 gap-3 text-center">
          <button 
            onClick={() => navigate('/freelancer/jobs')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <Briefcase size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Jobs</span>
          </button>

          <button 
            onClick={() => navigate('/freelancer/skills')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <ListChecks size={20} className="text-green-700" />
            </div>
            <span className="text-xs">My Skills</span>
          </button>

          <button 
            onClick={() => navigate('/freelancer/services')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <Layers size={20} className="text-purple-700" />
            </div>
            <span className="text-xs">My Services</span>
          </button>
        </div>
      </div>
      
      {/* Current Projects */}
      <div className="p-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Current Projects</h2>
          <button className="text-[#003160] text-sm">View All</button>
        </div>
        
        <div className="space-y-3">
          {/* Empty state for Current Projects */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No active projects</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your current projects will appear here when customers accept your proposals.
            </p>
            <Button 
              onClick={() => navigate('/freelancer/jobs')}
              className="bg-[#003160] text-white hover:bg-[#002040]">
              Find Jobs
            </Button>
          </div>
        </div>
      </div>
      
      {/* New Job Requests */}
      <div className="p-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">New Job Requests</h2>
          <button className="text-[#003160] text-sm">View All</button>
        </div>
        
        <div className="space-y-3">
          {/* Empty state for Job Requests */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Handshake size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No job requests yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              New job requests from customers will appear here.
            </p>
            <Button 
              onClick={() => navigate('/freelancer/services')}
              className="bg-[#003160] text-white hover:bg-[#002040]">
              Create Services
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <FreelancerBottomNavigation />
    </div>
  );
};

export default FreelancerDashboard;
