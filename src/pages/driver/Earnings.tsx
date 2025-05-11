import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import DriverBottomNavigation from '@/components/driver/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  total: number;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  order_type: string;
  customer_name: string;
  order_id: string;
}

const DriverEarningsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsSummary>({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    if (!user?.id) return;

    const fetchEarnings = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, you would fetch this data from the backend
        // For now, using mock data
        const mockEarnings = {
          today: 35.75,
          week: 247.50,
          month: 1250.25,
          total: 3680.75
        };

        // Simulating API call delay
        setTimeout(() => {
          setEarnings(mockEarnings);
          
          // Mock transactions
          const mockTransactions = [
            {
              id: '1',
              amount: 12.50,
              status: 'completed',
              created_at: new Date().toISOString(),
              order_type: 'unimove',
              customer_name: 'John Doe',
              order_id: 'ORD-12345'
            },
            {
              id: '2',
              amount: 8.75,
              status: 'completed',
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              order_type: 'unimove',
              customer_name: 'Sarah Miller',
              order_id: 'ORD-12346'
            },
            {
              id: '3',
              amount: 14.50,
              status: 'completed',
              created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              order_type: 'unisend',
              customer_name: 'Mike Johnson',
              order_id: 'ORD-12347'
            }
          ];
          
          setTransactions(mockTransactions);
          setLoading(false);
        }, 1000);

        // In a real implementation, you would fetch from Supabase like this:
        /*
        const { data, error } = await supabase
          .from('driver_earnings')
          .select('*')
          .eq('driver_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setEarnings({
            today: data.today_earnings || 0,
            week: data.weekly_earnings || 0,
            month: data.monthly_earnings || 0,
            total: data.total_earnings || 0
          });
        }
        
        // Fetch recent transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('driver_transactions')
          .select('*')
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (transactionsError) throw transactionsError;
        
        if (transactionsData) {
          setTransactions(transactionsData);
        }
        */
        
      } catch (error) {
        console.error('Error fetching earnings data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* App Bar */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold">
          <span className="text-[#003160]">Earnings</span>
        </h1>
      </div>
      
      {/* Main Content */}
      <div className="p-4">
        {/* Earnings Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Earnings Summary</h2>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar size={16} className="mr-1" />
                <span>{period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}</span>
                <ChevronDown size={16} className="ml-1" />
              </div>
            </div>
            
            <div className="flex justify-center my-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#003160]">
                  ${earnings[period].toFixed(2)}
                </div>
                <p className="text-sm text-gray-500 mt-1">Current Earnings</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div 
                className={`p-3 rounded-lg ${period === 'today' ? 'bg-blue-50 text-[#003160] font-medium' : ''}`}
                onClick={() => setPeriod('today')}
              >
                <p className="text-sm">Today</p>
                <p className="font-semibold">${earnings.today.toFixed(2)}</p>
              </div>
              <div 
                className={`p-3 rounded-lg ${period === 'week' ? 'bg-blue-50 text-[#003160] font-medium' : ''}`}
                onClick={() => setPeriod('week')}
              >
                <p className="text-sm">This Week</p>
                <p className="font-semibold">${earnings.week.toFixed(2)}</p>
              </div>
              <div 
                className={`p-3 rounded-lg ${period === 'month' ? 'bg-blue-50 text-[#003160] font-medium' : ''}`}
                onClick={() => setPeriod('month')}
              >
                <p className="text-sm">This Month</p>
                <p className="font-semibold">${earnings.month.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-xl font-semibold">${earnings.total.toFixed(2)}</p>
                </div>
                <Button variant="outline" className="text-[#003160] border-[#003160]">
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Transactions */}
        <h2 className="text-lg font-medium mb-3">Recent Transactions</h2>
        
        {loading ? (
          <div className="text-center py-10">
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div>
            {transactions.map(transaction => (
              <div key={transaction.id} className="bg-white rounded-lg shadow-sm p-4 mb-3 border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{transaction.customer_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleString()} • {transaction.order_id}
                    </p>
                    <p className="text-xs mt-1 capitalize">
                      {transaction.order_type === 'unimove' ? 'Ride' : 'Delivery'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+${transaction.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-3">
              See All Transactions
            </Button>
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm">
            <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No transactions to display</p>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <DriverBottomNavigation />
    </div>
  );
};

export default DriverEarningsPage; 