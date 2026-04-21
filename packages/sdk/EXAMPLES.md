# Usage Examples

This document provides comprehensive examples for integrating `@airgapped-priv/sdk` into various applications.

## Table of Contents

- [Basic Usage](#basic-usage)
- [React Integration](#react-integration)
- [Next.js Integration](#nextjs-integration)
- [Wallet Adapter](#wallet-adapter-integration)
- [Air-Gapped Workflow](#air-gapped-workflow)
- [Advanced Scenarios](#advanced-scenarios)

## Basic Usage

### Create and Sign Transaction Offline

```typescript
import {
  createUnsignedTxMessage,
  exportForCold,
  signOffline,
  importFromCold
} from '@airgapped-priv/sdk'
import { Keypair, Connection, SystemProgram } from '@solana/web3.js'

async function exampleBasicUsage() {
  // Setup
  const keypair = Keypair.generate()
  const connection = new Connection('https://api.devnet.solana.com')

  // Create unsigned transaction
  const tx = await createUnsignedTxMessage(
    [
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: Keypair.generate().publicKey,
        lamports: 1_000_000, // 0.001 SOL
      }),
    ],
    connection,
    keypair.publicKey
  )

  // Export as QR code for cold storage
  const { data: qrData, qrCode } = await exportForCold(tx, 'qr')
  console.log('Scan this QR code:', qrData)
  console.log('Or display this image:', qrCode)

  // Sign completely offline (air-gapped)
  const signedTx = signOffline(tx, keypair)

  // Broadcast when online
  const signature = await connection.sendTransaction(signedTx)
  console.log('Transaction signature:', signature)
}
```

## React Integration

### With Wallet Adapter

```typescript
'use client'

import { useWallet } from '@airgapped-priv/sdk'
import { useConnection } from '@airgapped-priv/sdk'
import { SystemProgram } from '@solana/web3.js'
import { Button } from '@/components/ui/button'

export function OfflineSignButton() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()

  const handleCreateOfflineTx = async () => {
    if (!publicKey || !connection) return

    // Create transaction
    const tx = await createUnsignedTxMessage(
      [SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: publicKey,
        lamports: 1_000_000,
      })],
      connection,
      publicKey
    )

    // Export as QR
    const { qrCode } = await exportForCold(tx, 'qr')

    // Display QR code
    setQrCode(qrCode)
  }

  return (
    <Button onClick={handleCreateOfflineTx} disabled={!connected}>
      Create Offline Transaction
    </Button>
  )
}
```

## Next.js Integration

### App Router Setup

```typescript
// app/providers/wallet-provider.tsx
'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-wallets'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets'

const network = WalletAdapterNetwork.Devnet
const endpoint = 'https://api.devnet.solana.com'
const wallets = [new PhantomWalletAdapter(), new BackpackWalletAdapter()]

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
```

### Page Component

```typescript
// app/page.tsx
'use client'

import { useCreateOfflineTx, useScanPartialSignature } from '@airgapped-priv/sdk'
import { SystemProgram } from '@solana/web3.js'
import { QrCode } from 'lucide-react'

export default function OfflineSignPage() {
  const { createTransaction, exportTransaction, qrCode } = useCreateOfflineTx()
  const { importFromData, broadcastTransaction, state } = useScanPartialSignature()

  const handleCreateAndExport = async () => {
    await createTransaction()
    await exportTransaction('qr')
  }

  return (
    <div>
      <button onClick={handleCreateAndExport}>Create Offline TX</button>

      {qrCode && (
        <div>
          <h3>Scan this QR code on your offline device:</h3>
          <img src={qrCode} alt="Transaction QR Code" />
        </div>
      )}

      {state.transaction && (
        <button onClick={() => broadcastTransaction()}>
          Broadcast Transaction
        </button>
      )}
    </div>
  )
}
```

## Wallet Adapter Integration

### Complete Example

```typescript
'use client'

import { useMemo } from 'react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-wallets'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets'
import { useWallet, useConnection } from '@airgapped-priv/sdk'

// RPC configuration
const getNetwork = () => {
  // Swap these for production
  return WalletAdapterNetwork.Devnet
}

const getEndpoint = () => {
  return 'https://api.devnet.solana.com'
}

// Wallet configuration
const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new BackpackWalletAdapter(),
  ],
  []
)

// Providers component
export function AppProviders({ children }: { children: React.ReactNode }) {
  const network = getNetwork()
  const endpoint = getEndpoint()

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

// Usage in component
function WalletConnection() {
  const { publicKey, connected, connect } = useWallet()
  const { connection, connected: rpcConnected } = useConnection()

  return (
    <div>
      <WalletMultiButton />
      {connected && (
        <div>
          <p>Connected: {publicKey?.toBase58()}</p>
          <p>RPC: {rpcConnected ? 'Connected' : 'Connecting...'}</p>
        </div>
      )}
    </div>
  )
}
```

## Air-Gapped Workflow

### Complete End-to-End Example

```typescript
import {
  createUnsignedTxMessage,
  exportForCold,
  signOffline,
  importFromCold
} from '@airgapped-priv/sdk'
import { Keypair, Connection, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

// ONLINE DEVICE: Create and export transaction
async function onlineWorkflow() {
  // Setup
  const keypair = Keypair.generate()
  const connection = new Connection('https://api.devnet.solana.com')

  // Get balance
  const balance = await connection.getBalance(keypair.publicKey)
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`)

  // Create transaction
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: '接收方地址示例PublicKey',
      lamports: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL
    }),
  ]

  const tx = await createUnsignedTxMessage(instructions, connection, keypair.publicKey)

  // Export for cold storage
  const { data: qrData, qrCode, size } = await exportForCold(tx, 'qr')
  console.log(`Transaction exported: ${size} bytes`)

  // Save QR code image or display to user
  // In production: Download or show QR code on screen

  // Transfer QR data to offline device via:
  // - USB drive
  // - Print and scan
  // - Manual entry (if small enough)

  return { qrData, qrCode }
}

// AIR-GAPPED DEVICE: Sign transaction
async function offlineWorkflow(qrData: string) {
  // This runs on a device with NO internet connection

  // Load your cold storage keypair
  const coldKeypair = loadColdStorageKeypair()

  // Import transaction from QR code
  const tx = await importFromCold(qrData, 'qr')

  // Sign transaction
  const signedTx = signOffline(tx, coldKeypair)

  // Export signed transaction
  const { data: signedQrData, qrCode: signedQr } = await exportForCold(signedTx, 'qr')

  // Transfer signed QR back to online device
  return { signedQrData, qrCode: signedQr }
}

// ONLINE DEVICE: Broadcast signed transaction
async function broadcastWorkflow(signedQrData: string) {
  const connection = new Connection('https://api.devnet.solana.com')

  // Import signed transaction
  const signedTx = await importFromCold(signedQrData, 'qr')

  // Broadcast to network
  const signature = await connection.sendTransaction(signedTx)
  console.log('Transaction signature:', signature)

  // Wait for confirmation
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  const confirmation = await connection.confirmTransaction(signature)

  console.log('Transaction confirmed:', confirmation)
}

// Example cold storage loader (you implement this)
function loadColdStorageKeypair(): Keypair {
  // Load from secure storage (USB key, encrypted file, etc.)
  // This is device-specific and depends on your security setup
  // Return your keypair
  return {} as Keypair
}
```

## Advanced Scenarios

### Multi-Signature Transaction

```typescript
import { createPartialSignature, combinePartialSignatures } from '@airgapped-priv/sdk'

async function multiSigExample() {
  // Create transaction requiring 2 signatures
  const tx = await createUnsignedTxMessage(instructions, connection, payer)

  // Party 1 signs
  const partial1 = await createPartialSignature(tx, keypair1)

  // Party 2 signs
  const partial2 = await createPartialSignature(tx, keypair2)

  // Combine signatures
  const fullySigned = combinePartialSignatures(tx, [partial1, partial2])

  // Broadcast
  const signature = await connection.sendTransaction(fullySigned)
}
```

### Durable Transaction Nonce

```typescript
import { createTxWithNonce } from '@airgapped-priv/sdk'

async function durableNonceExample() {
  // Create transaction that doesn't expire
  const tx = await createTxWithNonce(
    instructions,
    nonceAccountPubkey,
    payer,
    authority,
    connection
  )

  // This transaction is valid indefinitely!
  // Perfect for air-gapped workflows where signing might take hours/days
}
```

### Custom RPC with Helius

```typescript
import { createConnection, HELIUS_ENDPOINTS } from '@airgapped-priv/sdk'

const connection = createConnection(
  HELIUS_ENDPOINTS.devnet.replace('YOUR_API_KEY', process.env.HELIUS_API_KEY)
)
```

### Error Handling

```typescript
import { OfflineSignError, ErrorCode } from '@airgapped-priv/sdk'

async function exampleWithErrorHandling() {
  try {
    const tx = await createUnsignedTxMessage(instructions, connection, payer)
    const { data } = await exportForCold(tx, 'qr')
  } catch (error) {
    if (error instanceof OfflineSignError) {
      switch (error.code) {
        case ErrorCode.BLOCKHASH_EXPIRED:
          console.error('Transaction expired. Use durable nonce.')
          break
        case ErrorCode.INVALID_TRANSACTION:
          console.error('Invalid transaction format')
          break
        case ErrorCode.NETWORK_ERROR:
          console.error('Network connection failed')
          break
        default:
          console.error('Unknown error:', error.message)
      }
    }
  }
}
```

## TypeScript Best Practices

### Type Safety

```typescript
import type {
  ColdTxExport,
  TransactionInstruction,
  VersionedTransaction
} from '@airgapped-priv/sdk'

function typedExample(tx: VersionedTransaction): ColdTxExport {
  // Full type safety
  const export: ColdTxExport = {
    data: '...',
    format: 'qr',
    size: 100,
    timestamp: Date.now(),
  }

  return export
}
```

## Testing Examples

```typescript
import { generateOfflineKeypair, validateKeypair } from '@airgapped-priv/sdk'

async function testKeyGeneration() {
  // Generate test keypair
  const keypair = await generateOfflineKeypair()

  // Validate
  const isValid = await validateKeypair(keypair)
  console.assert(isValid, 'Keypair should be valid')

  return keypair
}
```

## More Examples

For additional examples and integration guides, see:
- [README.md](./README.md) - Main SDK documentation
- [GitHub Repository](https://github.com/airgapped-priv/sdk) - Source code
- [Demo Application](https://demo.offlinesign.dev) - Live demo

## Support

- **Issues**: [github.com/airgapped-priv/sdk/issues](https://github.com/airgapped-priv/sdk/issues)
- **Email**: support@offlinesign.dev
- **Documentation**: [docs.offlinesign.dev](https://docs.offlinesign.dev)
