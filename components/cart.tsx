'use client'

import { useState } from 'react'
import { ShoppingCart, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { CartItem, CreateOrderPayload } from '@/lib/types'

interface CartProps {
  items: CartItem[]
  onRemoveItem: (productId: number) => void
  onClearCart: () => void
  onCreateOrder: (payload: CreateOrderPayload) => Promise<void>
}

export function Cart({ items, onRemoveItem, onClearCart, onCreateOrder }: CartProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
  const totalPrice = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  )

  const handleSubmit = async () => {
    if (!customerName.trim() || items.length === 0) return

    setIsSubmitting(true)
    try {
      await onCreateOrder({
        customer_name: customerName.trim(),
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      })
      setCustomerName('')
      setNotes('')
      setIsOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Seu Pedido
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Seu carrinho está vazio
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x R${' '}
                      {item.product.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    R${' '}
                    {(item.product.price * item.quantity)
                      .toFixed(2)
                      .replace('.', ',')}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveItem(item.product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Seu Nome</Label>
                  <Input
                    id="customer-name"
                    placeholder="Digite seu nome"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ex: Sem cebola, bem passado..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <SheetFooter className="flex-col gap-2 sm:flex-col">
              <Button
                className="w-full"
                size="lg"
                disabled={!customerName.trim() || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Pedido'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onClearCart}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Carrinho
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
