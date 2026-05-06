'use client'

import { Clock, ChefHat, CheckCircle, Truck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Order, OrderStatus } from '@/lib/types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface OrderCardProps {
  order: Order
  showActions?: boolean
  onUpdateStatus?: (orderId: number, status: OrderStatus) => void
}

const StatusIcon = ({ status }: { status: OrderStatus }) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />
    case 'preparing':
      return <ChefHat className="h-4 w-4" />
    case 'ready':
      return <CheckCircle className="h-4 w-4" />
    case 'delivered':
      return <Truck className="h-4 w-4" />
    case 'cancelled':
      return <XCircle className="h-4 w-4" />
  }
}

function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Agora'
  if (diffMins < 60) return `${diffMins}min atrás`
  const diffHours = Math.floor(diffMins / 60)
  return `${diffHours}h atrás`
}

export function OrderCard({ order, showActions, onUpdateStatus }: OrderCardProps) {
  const nextStatus: Record<OrderStatus, OrderStatus | null> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
    delivered: null,
    cancelled: null,
  }

  const nextStatusLabel: Record<OrderStatus, string> = {
    pending: 'Iniciar Preparo',
    preparing: 'Marcar Pronto',
    ready: 'Entregar',
    delivered: '',
    cancelled: '',
  }

  return (
    <Card
      className={cn(
        'transition-all',
        order.status === 'ready' && 'ring-2 ring-success',
        order.status === 'pending' && 'ring-2 ring-warning'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">#{order.id}</span>
            <Badge className={cn('gap-1', ORDER_STATUS_COLORS[order.status])}>
              <StatusIcon status={order.status} />
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {getTimeAgo(order.created_at)}
          </span>
        </div>
        <p className="font-medium text-foreground">{order.customer_name}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {order.items.map((item) => {
            const productName = item.product_name || (item as any).product?.name || 'Produto'
            const subtotal = item.subtotal ?? (item.unit_price * item.quantity) ?? 0
            return (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">
                  {item.quantity}x {productName}
                </span>
                <span className="text-muted-foreground">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )
          })}
        </div>

        {order.notes && (
          <div className="p-2 bg-warning/20 rounded-md">
            <p className="text-sm text-warning-foreground">
              <strong>Obs:</strong> {order.notes}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-primary">
            R$ {(order.total ?? 0).toFixed(2).replace('.', ',')}
          </span>
        </div>

        {showActions && nextStatus[order.status] && onUpdateStatus && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() =>
                onUpdateStatus(order.id, nextStatus[order.status]!)
              }
            >
              {nextStatusLabel[order.status]}
            </Button>
            {order.status === 'pending' && (
              <Button
                variant="destructive"
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
              >
                Cancelar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
