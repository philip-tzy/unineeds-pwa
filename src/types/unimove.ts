
export type RideStatus = 'searching' | 'accepting' | 'ongoing' | 'completed';

export interface Order {
  id: string;
  customer_id: string;
  driver_id: string | null;
  pickup_address: string | null;
  delivery_address: string | null;
  status: string | null;
  service_type: string;
  total_amount: number;
  created_at?: string;
  pickup_coordinates?: [number, number] | null;
  delivery_coordinates?: [number, number] | null;
  estimated_delivery_time?: string | null;
  actual_delivery_time?: string | null;
  payment_status?: string | null;
  notes?: string | null;
  seller_id?: string | null;
  updated_at?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  rating: number;
}

export interface Driver {
  id: string;
  name: string;
  is_available: boolean;
  rating: number;
  current_location?: [number, number];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
