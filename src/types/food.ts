export interface FoodItem {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  preparation_time: number | null;
  is_available: boolean;
  stock?: number;
  location?: string;
}

export interface NewFoodItem {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  preparation_time?: number;
  is_available?: boolean;
  stock?: number;
  location?: string;
}

export interface FoodReview {
  id: string;
  food_item_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface FoodOrder {
  id: string;
  customer_id: string;
  seller_id: string;
  order_items: OrderItem[];
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  delivery_address: string;
}

export interface OrderItem {
  id: string;
  food_item_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}
