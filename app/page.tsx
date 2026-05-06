'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { Cart } from '@/components/cart'
import { Badge } from '@/components/ui/badge'
import { mockProducts } from '@/lib/mock-data'
import { useOrders } from '@/lib/orders-context'
import type { Product, CartItem, CreateOrderPayload } from '@/lib/types'

const categories = ['Todos', 'Lanches', 'Acompanhamentos', 'Bebidas', 'Sobremesas']

export default function HomePage() {
  const { addOrder } = useOrders()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [orderSuccess, setOrderSuccess] = useState(false)

  const filteredProducts =
    selectedCategory === 'Todos'
      ? mockProducts
      : mockProducts.filter((p) => p.category === selectedCategory)

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId)
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      }
      return prev.filter((item) => item.product.id !== productId)
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const createOrder = useCallback(async (payload: CreateOrderPayload) => {
    addOrder(payload, cart)
    setCart([])
    setOrderSuccess(true)
    setTimeout(() => setOrderSuccess(false), 5000)
  }, [addOrder, cart])

  const getCartItem = (productId: number) =>
    cart.find((item) => item.product.id === productId)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {orderSuccess && (
          <div className="mb-6 p-4 bg-success/20 border border-success rounded-lg text-center">
            <p className="font-semibold text-success-foreground">
              Pedido enviado com sucesso! Acompanhe na tela da cozinha.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cardápio</h2>
            <p className="text-muted-foreground">
              Escolha seus itens e faça seu pedido
            </p>
          </div>
          <Cart
            items={cart}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onCreateOrder={createOrder}
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartItem={getCartItem(product.id)}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum produto encontrado nesta categoria.
          </div>
        )}
      </main>
    </div>
  )
}
