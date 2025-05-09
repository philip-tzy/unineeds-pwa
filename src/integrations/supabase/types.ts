export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      drivers: {
        Row: {
          created_at: string | null
          current_location: unknown | null
          id: string
          is_available: boolean | null
          name: string | null
          rating: number | null
          total_rides: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_location?: unknown | null
          id: string
          is_available?: boolean | null
          name?: string | null
          rating?: number | null
          total_rides?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_location?: unknown | null
          id?: string
          is_available?: boolean | null
          name?: string | null
          rating?: number | null
          total_rides?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          preparation_time: number | null
          price: number
          stock: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          preparation_time?: number | null
          price: number
          stock?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          preparation_time?: number | null
          price?: number
          stock?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          food_item_id: string | null
          id: string
          notes: string | null
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          service_id: string | null
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          food_item_id?: string | null
          id?: string
          notes?: string | null
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
          service_id?: string | null
          subtotal: number
        }
        Update: {
          created_at?: string | null
          food_item_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          service_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_item_fk"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_fk"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking: {
        Row: {
          created_at: string | null
          current_coordinates: unknown | null
          driver_id: string
          estimated_arrival: string | null
          id: string
          order_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_coordinates?: unknown | null
          driver_id: string
          estimated_arrival?: string | null
          id?: string
          order_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_coordinates?: unknown | null
          driver_id?: string
          estimated_arrival?: string | null
          id?: string
          order_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_time: string | null
          created_at: string | null
          customer_id: string
          delivery_address: string | null
          delivery_coordinates: unknown | null
          driver_id: string | null
          estimated_delivery_time: string | null
          id: string
          notes: string | null
          payment_status: string | null
          pickup_address: string | null
          pickup_coordinates: unknown | null
          seller_id: string | null
          service_type: string
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          actual_delivery_time?: string | null
          created_at?: string | null
          customer_id: string
          delivery_address?: string | null
          delivery_coordinates?: unknown | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          pickup_address?: string | null
          pickup_coordinates?: unknown | null
          seller_id?: string | null
          service_type: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          actual_delivery_time?: string | null
          created_at?: string | null
          customer_id?: string
          delivery_address?: string | null
          delivery_coordinates?: unknown | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          pickup_address?: string | null
          pickup_coordinates?: unknown | null
          seller_id?: string | null
          service_type?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      package_deliveries: {
        Row: {
          created_at: string
          customer_id: string
          delivery_time: string | null
          driver_id: string | null
          estimated_price: number
          id: string
          item_type: string
          notes: string | null
          pickup_time: string | null
          rating: number | null
          recipient_address: string
          recipient_coordinates: unknown | null
          recipient_name: string
          recipient_phone: string
          review: string | null
          sender_address: string
          sender_coordinates: unknown | null
          sender_name: string
          sender_phone: string
          status: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_time?: string | null
          driver_id?: string | null
          estimated_price: number
          id?: string
          item_type: string
          notes?: string | null
          pickup_time?: string | null
          rating?: number | null
          recipient_address: string
          recipient_coordinates?: unknown | null
          recipient_name: string
          recipient_phone: string
          review?: string | null
          sender_address: string
          sender_coordinates?: unknown | null
          sender_name: string
          sender_phone: string
          status?: string
          updated_at?: string
          weight: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_time?: string | null
          driver_id?: string | null
          estimated_price?: number
          id?: string
          item_type?: string
          notes?: string | null
          pickup_time?: string | null
          rating?: number | null
          recipient_address?: string
          recipient_coordinates?: unknown | null
          recipient_name?: string
          recipient_phone?: string
          review?: string | null
          sender_address?: string
          sender_coordinates?: unknown | null
          sender_name?: string
          sender_phone?: string
          status?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          inventory: number | null
          is_active: boolean | null
          name: string
          orders_to_ship: number | null
          price: number
          total_orders: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          inventory?: number | null
          is_active?: boolean | null
          name: string
          orders_to_ship?: number | null
          price: number
          total_orders?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          inventory?: number | null
          is_active?: boolean | null
          name?: string
          orders_to_ship?: number | null
          price?: number
          total_orders?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rides: {
        Row: {
          created_at: string
          customer_id: string
          destination_coordinates: unknown
          destination_location: string
          driver_id: string | null
          estimated_price: number
          id: string
          pickup_coordinates: unknown
          pickup_location: string
          rating: number | null
          review: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          destination_coordinates: unknown
          destination_location: string
          driver_id?: string | null
          estimated_price: number
          id?: string
          pickup_coordinates: unknown
          pickup_location: string
          rating?: number | null
          review?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          destination_coordinates?: unknown
          destination_location?: string
          driver_id?: string | null
          estimated_price?: number
          id?: string
          pickup_coordinates?: unknown
          pickup_location?: string
          rating?: number | null
          review?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          hourly_rate: number
          id: string
          image_url: string | null
          is_available: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          hourly_rate: number
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          hourly_rate?: number
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          customer_id: string
          customer_name: string
          destination: Json
          distance: number
          driver_id: string | null
          driver_name: string | null
          driver_notes: string | null
          estimated_arrival: string | null
          id: string
          pickup: Json
          price: number
          rating: number | null
          rating_comment: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_name: string
          destination: Json
          distance: number
          driver_id?: string | null
          driver_name?: string | null
          driver_notes?: string | null
          estimated_arrival?: string | null
          id?: string
          pickup: Json
          price: number
          rating?: number | null
          rating_comment?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_name?: string
          destination?: Json
          distance?: number
          driver_id?: string | null
          driver_name?: string | null
          driver_notes?: string | null
          estimated_arrival?: string | null
          id?: string
          pickup?: Json
          price?: number
          rating?: number | null
          rating_comment?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      unifood_chat_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          order_id: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          order_id: string
          sender_id: string
          sender_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          order_id?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "unifood_chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "unifood_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      unifood_orders: {
        Row: {
          created_at: string | null
          customer_id: string
          customer_name: string
          id: string
          items: Json
          notes: string | null
          seller_id: string
          seller_name: string
          status: string
          total_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          customer_name: string
          id?: string
          items: Json
          notes?: string | null
          seller_id: string
          seller_name: string
          status: string
          total_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          customer_name?: string
          id?: string
          items?: Json
          notes?: string | null
          seller_id?: string
          seller_name?: string
          status?: string
          total_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      visitor_statistics: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          visit_date: string
          visitor_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          visit_date?: string
          visitor_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          visit_date?: string
          visitor_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_driver_rides: {
        Args: { driver_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
