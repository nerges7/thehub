'use client'

import '@shopify/polaris/build/esm/styles.css'
import { AppProvider as PolarisAppProvider } from '@shopify/polaris'
import { Layout } from '@/components/Layout'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <PolarisAppProvider i18n={{}}>
          <Layout>{children}</Layout>
        </PolarisAppProvider>
      </body>
    </html>
  )
}
