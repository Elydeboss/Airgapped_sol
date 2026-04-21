'use client'

import type { ReactNode } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { useMemo } from 'react'

require('@solana/wallet-adapter-react-ui/styles.css')

interface ProvidersProps {
  children: ReactNode
}

export function WalletProvider({ children }: ProvidersProps) {
  const network = 'devnet'
  const endpoint = useMemo(() => {
    switch (network) {
      case 'mainnet-beta':
        return 'https://rpc.helius.xyz/?api-key=YOUR_API_KEY' // Replace with your Helius API key
      case 'devnet':
        return 'https://api.devnet.solana.com'
      case 'testnet':
        return 'https://api.testnet.solana.com'
      default:
        return 'https://api.devnet.solana.com'
    }
  }, [network])

  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
