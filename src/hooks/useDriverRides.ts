import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Order, RideStatus } from '@/types/unimove';
import {
  getAvailableRides,
  acceptRide,
  updateRideStatus,
  completeRideTransaction
} from '@/services/unimove/api';

export const useDriverRides = (driverId: string | undefined) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<RideStatus>('searching');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Rest of the component code...
}; 