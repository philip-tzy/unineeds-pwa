
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Package, Truck, Users } from 'lucide-react';

interface DashboardStatsProps {
  refreshTrigger?: number;
  totalSales?: number;
  orderCount?: number;
  pendingOrders?: number;
  customerCount?: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  refreshTrigger = 0,
  totalSales: initialTotalSales,
  orderCount: initialOrderCount,
  pendingOrders: initialPendingOrders,
  customerCount: initialCustomerCount
}) => {
  const { user } = useAuth();
  const [todaySales, setTodaySales] = useState(initialTotalSales || 0);
  const [orders, setOrders] = useState(initialOrderCount || 0);
  const [toShip, setToShip] = useState(initialPendingOrders || 0);
  const [visitors, setVisitors] = useState(initialCustomerCount || 0);
  const [isLoading, setIsLoading] = useState(!initialTotalSales);

  useEffect(() => {
    // Only fetch data if we don't have initial values provided
    if (user && !initialTotalSales) {
      fetchDashboardStats();
      recordVisit();
    }
  }, [user, refreshTrigger, initialTotalSales]);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    
    try {
      // Get today's date in ISO format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's sales
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', user?.id)
        .eq('payment_status', 'completed')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (salesError) throw salesError;
      
      const totalSales = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      setTodaySales(totalSales);
      
      // Fetch total orders
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user?.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      
      if (ordersError) throw ordersError;
      setOrders(ordersCount || 0);
      
      // Fetch to ship orders
      const { count: toShipCount, error: toShipError } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user?.id)
        .eq('status', 'ready_to_ship');
      
      if (toShipError) throw toShipError;
      setToShip(toShipCount || 0);
      
      // Fetch visitors
      const { data: visitorData, error: visitorError } = await supabase
        .from('visitor_statistics')
        .select('visitor_count')
        .eq('user_id', user?.id)
        .eq('visit_date', today)
        .single();
      
      if (visitorError && visitorError.code !== 'PGRST116') {
        // Error that's not the "no rows returned" error
        throw visitorError;
      }
      
      setVisitors(visitorData?.visitor_count || 0);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordVisit = async () => {
    try {
      // Get today's date in ISO format
      const today = new Date().toISOString().split('T')[0];
      
      // First check if there's already a record for today
      const { data: existingData, error: checkError } = await supabase
        .from('visitor_statistics')
        .select('id, visitor_count')
        .eq('user_id', user?.id)
        .eq('visit_date', today)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('visitor_statistics')
          .update({ visitor_count: existingData.visitor_count + 1 })
          .eq('id', existingData.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('visitor_statistics')
          .insert({
            user_id: user?.id,
            visit_date: today,
            visitor_count: 1
          });
          
        if (insertError) throw insertError;
      }
      
      // Refresh the visitors count
      fetchDashboardStats();
    } catch (error) {
      console.error('Error recording visit:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <div className="flex items-center mb-1">
          <DollarSign size={14} className="text-[#003160] mr-1" />
          <span className="text-xs text-gray-500">Today's Sales</span>
        </div>
        <p className="text-lg font-bold">
          {isLoading ? "Loading..." : `$${todaySales.toFixed(2)}`}
        </p>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <div className="flex items-center mb-1">
          <Package size={14} className="text-[#003160] mr-1" />
          <span className="text-xs text-gray-500">Orders</span>
        </div>
        <p className="text-lg font-bold">
          {isLoading ? "Loading..." : orders}
        </p>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <div className="flex items-center mb-1">
          <Truck size={14} className="text-[#003160] mr-1" />
          <span className="text-xs text-gray-500">To Ship</span>
        </div>
        <p className="text-lg font-bold">
          {isLoading ? "Loading..." : toShip}
        </p>
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <div className="flex items-center mb-1">
          <Users size={14} className="text-[#003160] mr-1" />
          <span className="text-xs text-gray-500">Visitors</span>
        </div>
        <p className="text-lg font-bold">
          {isLoading ? "Loading..." : visitors}
        </p>
      </div>
    </div>
  );
};

export default DashboardStats;
