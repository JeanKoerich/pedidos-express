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

interface OrdersContextType {
  orders: Order[]
  addOrder: (payload: CreateOrderPayload, items: CartItem[]) => Promise<Order | null>
  updateOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>
  getActiveOrders: () => Order[]
  refreshOrders: () => Promise<void>
}

const OrdersContext = createContext<OrdersContextType | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])

  const refreshOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos')
      }

      const data = await response.json()

      const normalizedOrders = data.map((order: any) => ({
        ...order,
        total: Number(order.total ?? 0),
        items: (order.items ?? []).map((item: any) => {
          const unitPrice = Number(
            item.unit_price ??
            item.price ??
            item.product?.price ??
            0
          )

          const quantity = Number(item.quantity ?? 0)

          return {
            ...item,
            product_name: item.product_name ?? item.product?.name ?? 'Produto',
            unit_price: unitPrice,
            subtotal: Number(item.subtotal ?? unitPrice * quantity),
            product: item.product ?? {
              id: item.product_id,
              name: item.product_name ?? 'Produto',
              price: unitPrice,
              description: '',
              category: '',
              image_url: '',
              available: true,
              created_at: '',
              updated_at: '',
            },
          }
        }),
      }))

      setOrders(normalizedOrders)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      setOrders([])
    }
  }, [])

  useEffect(() => {
    refreshOrders()
  }, [refreshOrders])

  const addOrder = useCallback(
    async (
      payload: CreateOrderPayload,
      items: CartItem[]
    ): Promise<Order | null> => {
      try {
        const total = items.reduce(
          (sum, item) => sum + Number(item.product.price) * item.quantity,
          0
        )

        const response = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_name: payload.customer_name,
            customer_phone: payload.customer_phone ?? '',
            notes: payload.notes ?? null,
            total,
            items: items.map((item) => ({
              product_id: item.product.id,
              quantity: item.quantity,
              price: Number(item.product.price),
            })),
          }),
        })

        if (!response.ok) {
          throw new Error('Erro ao criar pedido')
        }

        const newOrder = await response.json()

        await refreshOrders()

        return newOrder
      } catch (error) {
        console.error('Erro ao salvar pedido:', error)
        return null
      }
    },
    [refreshOrders]
  )

  const updateOrderStatus = useCallback(
    async (orderId: number, status: OrderStatus) => {
      try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        })

        if (!response.ok) {
          throw new Error('Erro ao atualizar status do pedido')
        }

        await refreshOrders()
      } catch (error) {
        console.error('Erro ao atualizar pedido:', error)
      }
    },
    [refreshOrders]
  )

  const getActiveOrders = useCallback(() => {
    return orders.filter(
      (order) => order.status !== 'delivered' && order.status !== 'cancelled'
    )
  }, [orders])

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        getActiveOrders,
        refreshOrders,
      }}
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