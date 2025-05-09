export type UserRole = 'customer' | 'driver' | 'seller' | 'freelancer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  order_status: OrderStatus;
  service_type: 'unishop' | 'unifood';
  created_at: string;
}

export interface DeliveryTask {
  id: string;
  driver_id: string;
  order_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  service_type: 'unimove' | 'unisend';
  pickup_location: string;
  dropoff_location: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  seller_id: string;
  category: string;
  image_url?: string;
  service_type: 'unishop';
  created_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  description: string;
  seller_id: string;
  category: string;
  image_url?: string;
  service_type: 'unifood';
  created_at: string;
}

export interface FreelanceJob {
  id: string;
  title: string;
  description: string;
  budget: number;
  customer_id: string;
  freelancer_id?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  skills_required: string[];
  service_type: 'quickhire';
  created_at: string;
  updated_at: string;
}

export interface RideRequest {
  id: string;
  customer_id: string;
  driver_id?: string;
  pickup_location: string;
  dropoff_location: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  service_type: 'unimove';
  created_at: string;
  updated_at: string;
}

export interface DeliveryRequest {
  id: string;
  customer_id: string;
  driver_id?: string;
  pickup_location: string;
  dropoff_location: string;
  package_details: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  service_type: 'unisend';
  created_at: string;
  updated_at: string;
} 