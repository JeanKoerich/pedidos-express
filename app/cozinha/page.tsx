'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Header } from '@/components/header'
import { OrderCard } from '@/components/order-card'
import { Button } from '@/components/ui/button'
import { useOrders } from '@/lib/orders-context'
import type { OrderStatus } from '@/lib/types'

export default function KitchenPage() {
  const { orders, updateOrderStatus } = useOrders()
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsRefreshing(false)
  }

  const handleUpdateStatus = (orderId: number, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus)
  }

  const filteredOrders =
    filter === 'all'
      ? orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
      : orders.filter((o) => o.status === filter)

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const readyCount = orders.filter((o) => o.status === 'ready').length

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Painel da Cozinha
            </h2>
            <p className="text-muted-foreground">
              Gerencie os pedidos em tempo real
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg border text-center transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted'
            }`}
          >
            <p className="text-2xl font-bold">
              {pendingCount + preparingCount + readyCount}
            </p>
            <p className="text-sm">Ativos</p>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-lg border text-center transition-colors ${
              filter === 'pending'
                ? 'bg-warning text-warning-foreground border-warning'
                : 'bg-card hover:bg-muted'
            }`}
          >
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-sm">Pendentes</p>
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`p-4 rounded-lg border text-center transition-colors ${
              filter === 'preparing'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card hover:bg-muted'
            }`}
          >
            <p className="text-2xl font-bold">{preparingCount}</p>
            <p className="text-sm">Preparando</p>
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`p-4 rounded-lg border text-center transition-colors ${
              filter === 'ready'
                ? 'bg-success text-success-foreground border-success'
                : 'bg-card hover:bg-muted'
            }`}
          >
            <p className="text-2xl font-bold">{readyCount}</p>
            <p className="text-sm">Prontos</p>
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {filter === 'all'
                ? 'Nenhum pedido ativo no momento'
                : `Nenhum pedido com status "${filter}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showActions
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
