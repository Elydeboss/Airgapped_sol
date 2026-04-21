import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from './providers/WalletProvider'
import { ChunkReloadProvider } from './providers/ChunkReloadProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OfflineSign - Air-gapped Solana SDK Demo',
  description: 'Non-custodial, air-gapped Solana SDK with zero vendor lock-in',
  keywords: ['Solana', 'air-gapped', 'offline signing', 'non-custodial', 'cold storage'],
  authors: [{ name: 'OfflineSign' }],
  openGraph: {
    title: 'OfflineSign - Air-gapped Solana SDK Demo',
    description: 'Non-custodial, air-gapped Solana SDK with zero vendor lock-in',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ChunkReloadProvider>
            <WalletProvider>{children}</WalletProvider>
          </ChunkReloadProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
