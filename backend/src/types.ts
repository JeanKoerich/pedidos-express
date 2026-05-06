export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  available: boolean;
  created_at: Date;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  customer_name: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreateOrderRequest {
  customer_name: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}
