'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Utensils, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Utensils className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground leading-none">
              Pedidos Express
            </h1>
            <p className="text-xs text-muted-foreground">Sistema de Pedidos</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Button
            variant={pathname === '/' ? 'default' : 'ghost'}
            asChild
            size="sm"
          >
            <Link href="/" className={cn('flex items-center gap-2')}>
              <Utensils className="h-4 w-4" />
              Cardápio
            </Link>
          </Button>
          <Button
            variant={pathname === '/cozinha' ? 'default' : 'ghost'}
            asChild
            size="sm"
          >
            <Link href="/cozinha" className={cn('flex items-center gap-2')}>
              <ChefHat className="h-4 w-4" />
              Cozinha
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
