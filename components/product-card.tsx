'use client'

import { Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Product, CartItem } from '@/lib/types'

interface ProductCardProps {
  product: Product
  cartItem?: CartItem
  onAddToCart: (product: Product) => void
  onRemoveFromCart: (productId: number) => void
}

export function ProductCard({
  product,
  cartItem,
  onAddToCart,
  onRemoveFromCart,
}: ProductCardProps) {
  const quantity = cartItem?.quantity || 0

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="relative h-40 bg-muted flex items-center justify-center">
        <div className="text-4xl text-muted-foreground/50">
          {product.category === 'Lanches' && '🍔'}
          {product.category === 'Acompanhamentos' && '🍟'}
          {product.category === 'Bebidas' && '🥤'}
          {product.category === 'Sobremesas' && '🍨'}
        </div>
        {!product.available && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">
              Indisponível
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground leading-tight">
            {product.name}
          </h3>
          <span className="font-bold text-primary whitespace-nowrap">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          {quantity > 0 ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRemoveFromCart(product.id)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-foreground w-6 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onAddToCart(product)}
                disabled={!product.available}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => onAddToCart(product)}
              disabled={!product.available}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
