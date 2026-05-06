// Tipos do sistema Pedidos Express

export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  image_url: string
  available: boolean
  created_at: string
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface Order {
  id: number
  customer_name: string
  status: OrderStatus
  total: number
  notes: string | null
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CreateOrderPayload {
  customer_name: string
  notes?: string
  items: {
    product_id: number
    quantity: number
  }[]
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning text-warning-foreground',
  preparing: 'bg-primary text-primary-foreground',
  ready: 'bg-success text-success-foreground',
  delivered: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
}
