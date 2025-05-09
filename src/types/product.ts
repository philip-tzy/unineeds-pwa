
export interface Product {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  inventory: number | null;
  is_active: boolean;
}

export interface NewProduct {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  inventory?: number;
  is_active?: boolean;
}
