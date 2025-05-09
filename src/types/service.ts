export interface Service {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  delivery_time: string;
  location?: string;
  whatsapp: string;
  portfolio_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewService {
  user_id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  delivery_time: string;
  location?: string;
  whatsapp: string;
  portfolio_url?: string;
}

export interface UpdatableServiceData {
  title?: string;
  category?: string;
  description?: string;
  price?: number;
  delivery_time?: string;
  location?: string;
  whatsapp?: string;
  portfolio_url?: string | null;
}

export interface ServiceOffer {
  id: string;
  service_id: string;
  customer_id: string;
  freelancer_id: string;
  message: string;
  price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  
  // Relations
  service?: Service;
  customer?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  freelancer?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface NewServiceOffer {
  service_id: string;
  freelancer_id: string;
  message: string;
  price: number;
} 