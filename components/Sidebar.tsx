'use client'

import { Navigation } from '@shopify/polaris'
import { usePathname, useRouter } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          { label: 'Deportes', onClick: () => router.push('/sports') },
          { label: 'Categorías', onClick: () => router.push('/product-types') },
          { label: 'Productos', onClick: () => router.push('/products') },
          { label: 'Preguntas', onClick: () => router.push('/questions') },
          { label: 'Reglas de Cálculo', onClick: () => router.push('/rules') },
        ]}
      />
    </Navigation>
  )
}
