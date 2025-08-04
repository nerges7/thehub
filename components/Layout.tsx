'use client'

import { Frame } from '@shopify/polaris'
import { Sidebar } from './Sidebar'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Frame navigation={<Sidebar />}>
      {children}
    </Frame>
  )
}
