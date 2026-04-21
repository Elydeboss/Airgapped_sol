'use client'

import { useWallet } from '@airgapped-priv/sdk'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from './ui/button'
import { Wallet, ChevronDown } from 'lucide-react'

export function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet()

  if (connected && publicKey) {
    const shortAddress = `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`

    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={disconnect} className="gap-2">
          <Wallet className="h-4 w-4" />
          {shortAddress}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90" />
}
