'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Order, OrderStatus, CreateOrderPayload, CartItem } from './types'
import { mockProducts } from './mock-data'

interface OrdersContextType {
  orders: Order[]
  addOrder: (payload: CreateOrderPayload, items: CartItem[]) => Order
  updateOrderStatus: (orderId: number, status: OrderStatus) => void
  getActiveOrders: () => Order[]
}

const OrdersContext = createContext<OrdersContextType | null>(null)

const STORAGE_KEY = 'pedidos-express-orders'

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Carregar pedidos do localStorage na inicialização
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Validar e corrigir dados antigos
        const validatedOrders = parsed.map((order: Order) => ({
          ...order,
          total: order.total ?? 0,
          items: order.items?.map((item) => ({
            ...item,
            product_name: item.product_name || item.product?.name || 'Produto',
            subtotal: item.subtotal ?? (item.unit_price * item.quantity) ?? 0,
          })) ?? [],
        }))
        setOrders(validatedOrders)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
        setOrders([])
      }
    }
    setIsHydrated(true)
  }, [])

  // Salvar pedidos no localStorage sempre que mudar
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    }
  }, [orders, isHydrated])

  const addOrder = useCallback((payload: CreateOrderPayload, items: CartItem[]): Order => {
    const now = new Date().toISOString()
    const newOrder: Order = {
      id: Date.now(),
      customer_name: payload.customer_name,
      status: 'pending',
      total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      notes: payload.notes,
      created_at: now,
      updated_at: now,
      items: items.map((item, index) => ({
        id: Date.now() + index,
        order_id: Date.now(),
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
        product: item.product,
      })),
    }

    setOrders((prev) => [newOrder, ...prev])
    return newOrder
  }, [])

  const updateOrderStatus = useCallback((orderId: number, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, updated_at: new Date().toISOString() }
          : order
      )
    )
  }, [])

  const getActiveOrders = useCallback(() => {
    return orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    )
  }, [orders])

  return (
    <OrdersContext.Provider
      value={{ orders, addOrder, updateOrderStatus, getActiveOrders }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }
  return context
}
