# @airgapped-priv/sdk

> **Non-custodial, air-gapped Solana SDK** — Sign transactions completely offline with zero vendor lock-in

[![NPM Version](https://img.shields.io/npm/v/@airgapped-priv/sdk)](https://www.npmjs.com/package/@airgapped-priv/sdk)
[![License: MIT](https://img.shields.io/badge/license-MIT-purple.svg)](https://github.com/airgapped-priv/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Features

- ✅ **True Non-custodial** — Native Solana keypairs, no server-side reconstruction
- 🔒 **Air-gapped Signing** — Create, export, and sign transactions completely offline via QR codes
- 🔌 **Wallet Adapter Ready** — Works with Phantom, Backpack, and all Solana wallets
- 📱 **QR Code Support** — Export transactions as optimized QR codes (base58 encoded)
- 🔐 **Secure by Default** — No key exposure, encrypted local storage options
- 🚀 **TypeScript First** — Full type safety with strict mode enabled
- 🎯 **Zero Lock-in** — MIT license, no recurring fees, no vendor dependencies

## 📦 Installation

```bash
# npm
npm install @airgapped-priv/sdk

# yarn
yarn add @airgapped-priv/sdk

# pnpm
pnpm add @airgapped-priv/sdk

# bun
bun add @airgapped-priv/sdk
```

## 🎯 Quick Start

### Basic Usage

```typescript
import {
  createUnsignedTxMessage,
  exportForCold,
  signOffline
} from '@airgapped-priv/sdk'
import { Keypair, Connection, SystemProgram } from '@solana/web3.js'

// Setup
const keypair = Keypair.generate()
const connection = new Connection('https://api.devnet.solana.com')

// Create unsigned transaction
const tx = await createUnsignedTxMessage(
  [SystemProgram.transfer({
    fromPubkey: keypair.publicKey,
    toPubkey: Keypair.generate().publicKey,
    lamports: 1_000_000 // 0.001 SOL
  })],
  connection,
  keypair.publicKey
)

// Export as QR code for cold storage
const qrData = await exportForCold(tx, 'qr')
console.log('QR Code data:', qrData.data)

// Sign completely offline (air-gapped)
const signedTx = signOffline(tx, keypair)

// Broadcast when online
const signature = await connection.sendTransaction(signedTx)
console.log('Signature:', signature)
```

### React Hooks

```typescript
import {
  useWallet,
  useCreateOfflineTx,
  useScanPartialSignature
} from '@airgapped-priv/sdk'

function MyComponent() {
  const { publicKey, connected } = useWallet()
  const { createTransaction, exportTransaction, qrCode } = useCreateOfflineTx()
  
  const handleCreateAndExport = async () => {
    await createTransaction()
    await exportTransaction('qr')
    // Display qrCode to user
  }
  
  return <div>...</div>
}
```

## 📚 API Reference

### Core Functions

#### `createUnsignedTxMessage(instructions, connection, payer, options?)`

Creates an unsigned `VersionedTransaction` for offline signing.

```typescript
import { createUnsignedTxMessage } from '@airgapped-priv/sdk'
import { SystemProgram } from '@solana/web3.js'

const tx = await createUnsignedTxMessage(
  instructions,      // TransactionInstruction[]
  connection,        // Connection
  payer,            // PublicKey
  { nonce }         // Optional: Durable nonce account
)
```

**Parameters:**
- `instructions`: Array of Solana instructions to include in the transaction
- `connection`: Solana RPC connection
- `payer`: Public key of the account paying for the transaction
- `options?`: Optional configuration
  - `nonce?: string` - Durable nonce account for time-delayed transactions
  - `blockhash?: string` - Recent blockhash (fetched if not provided)
  - `lastValidBlockHeight?: number` - Last valid block height (calculated if not provided)

**Returns:** `Promise<VersionedTransaction>` - Unsigned transaction ready for signing

---

#### `exportForCold(tx, format, options?)`

Exports transaction for cold storage (QR, base64, or file).

```typescript
import { exportForCold } from '@airgapped-priv/sdk'

const export = await exportForCold(tx, 'qr')
console.log('QR data:', export.data)
console.log('QR image:', export.qrCode) // Data URL for <img> tag
```

**Parameters:**
- `tx`: `VersionedTransaction` to export
- `format`: `'qr' | 'base64' | 'file'` - Export format
- `options?`: Optional configuration
  - `maxSize?: number` - Maximum QR code size in bytes (for QR format)
  - `includeMetadata?: boolean` - Include metadata like timestamp and network

**Returns:** `Promise<ColdTxExport & { qrCode?: string }>` - Export data with optional QR code data URL

---

#### `importFromCold(data, format)`

Imports transaction from cold storage.

```typescript
import { importFromCold } from '@airgapped-priv/sdk'

const tx = await importFromCold(qrData, 'qr')
```

**Parameters:**
- `data`: `string` - Serialized transaction data
- `format`: `'qr' | 'base64' | 'file'` - Format the data is in

**Returns:** `Promise<VersionedTransaction>` - Imported transaction

---

#### `signOffline(tx, keypair)`

Signs a transaction completely offline (air-gapped).

```typescript
import { signOffline } from '@airgapped-priv/sdk'

const signedTx = signOffline(unsignedTx, keypair)
```

**Parameters:**
- `tx`: `VersionedTransaction` to sign
- `keypair`: `Keypair` to sign with

**Returns:** `VersionedTransaction` - Signed transaction

---

### React Hooks

#### `useWallet()`

Extended wallet hook with OfflineSign utilities.

```typescript
import { useWallet } from '@airgapped-priv/sdk'

function WalletButton() {
  const { publicKey, connected, connect, disconnect, createOfflineTx } = useWallet()
  
  return (
    <button onClick={connected ? disconnect : connect}>
      {connected ? `${publicKey?.toBase58()!.slice(0, 4)}...` : 'Connect'}
    </button>
  )
}
```

**Returns:**
```typescript
{
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  select: (walletName: WalletName) => void
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>
  signAllTransactions: (txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>
  createOfflineTx: (instructions: TransactionInstruction[]) => Promise<VersionedTransaction>
  exportTransaction: (tx: VersionedTransaction, format: 'qr' | 'base64' | 'file') => Promise<ColdTxExport>
}
```

---

#### `useCreateOfflineTx()`

Enhanced transaction builder with export options.

```typescript
import { useCreateOfflineTx } from '@airgapped-priv/sdk'

function TxBuilder() {
  const {
    addInstruction,
    createTransaction,
    exportTransaction,
    transaction,
    qrCode
  } = useCreateOfflineTx()
  
  return (
    <div>
      <button onClick={() => addInstruction(instruction)}>
        Add Instruction
      </button>
      <button onClick={createTransaction}>
        Create Transaction
      </button>
      <button onClick={() => exportTransaction('qr')}>
        Export QR
      </button>
      {qrCode && <img src={qrCode} alt="QR Code" />}
    </div>
  )
}
```

**Returns:**
```typescript
{
  builder: TxBuilderState
  instructions: TransactionInstruction[]
  addInstruction: (instruction: TransactionInstruction) => void
  removeInstruction: (index: number) => void
  clearInstructions: () => void
  createTransaction: () => Promise<void>
  exportTransaction: (format: 'qr' | 'base64' | 'file') => Promise<ColdTxExport>
  transaction: VersionedTransaction | null
  qrCode: string | null
  loading: boolean
  error: Error | null
}
```

---

## 🔐 Security Best Practices

### ⚠️ Critical Security Notes

1. **Never expose private keys** in logs, error messages, or client-side storage in production
2. **Use durable nonces** for time-delayed air-gapped signing (blockhashes expire in ~2 min)
3. **Encrypt local storage** with user's password/passkey in production
4. **Validate all inputs** at system boundaries
5. **Use HTTPS only** for any network communication

### Key Storage

**Development (Demo):**
```typescript
// ⚠️ OK for development only
localStorage.setItem('keypair', JSON.stringify(keypair))
```

**Production:**
```typescript
// ✅ Use encrypted storage
import { storeEncryptedKeypair, loadEncryptedKeypair } from '@airgapped-priv/sdk'

// Store with encryption
await storeEncryptedKeypair(keypair, userId)

// Load with decryption
const keypair = await loadEncryptedKeypair(userId)
```

## 🎨 Wallet Adapter Integration

### With Next.js

```typescript
'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-wallets'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { useWallet, useConnection } from '@airgapped-priv/sdk'

const network = WalletAdapterNetwork.Devnet
const endpoint = 'https://api.devnet.solana.com'
const wallets = [new PhantomWalletAdapter()]

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
```

### With React

```typescript
import { useWallet } from '@airgapped-priv/sdk'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'

function App() {
  const { publicKey, signTransaction } = useWallet()
  
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[new PhantomWalletAdapter()]}>
        <YourApp />
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

## 🔄 Why OfflineSign vs Alternatives?

| Feature | OfflineSign | Privy | Magic.link | Coinbase Wallet |
|---------|-------------|-------|------------|-----------------|
| **Non-custodial** | ✅ True | ❌ Hybrid | ❌ Hybrid | ❌ Hybrid |
| **Air-gapped Support** | ✅ Native | ❌ No | ❌ No | ❌ No |
| **Recurring Fees** | ❌ None | ✅ Yes | ✅ Yes | ✅ Yes |
| **Open Source** | ✅ MIT | ❌ No | ❌ No | ❌ No |
| **Vendor Lock-in** | ❌ None | ✅ Yes | ✅ Yes | ✅ Yes |
| **QR Code Export** | ✅ Built-in | ❌ No | ❌ No | ❌ No |
| **Custom RPC** | ✅ Any | ❌ Limited | ❌ Limited | ❌ Limited |
| **TypeScript Types** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes |

## 📝 Advanced Usage

### Air-gapped Workflow

```typescript
import {
  createUnsignedTxMessage,
  exportForCold,
  signOffline,
  importFromCold
} from '@airgapped-priv/sdk'

// ONLINE DEVICE: Create transaction
const tx = await createUnsignedTxMessage(instructions, connection, payer)
const { data: qrData } = await exportForCold(tx, 'qr')

// Transfer QR to air-gapped device (USB, print, etc.)

// AIR-GAPPED DEVICE: Sign transaction
const signedTx = signOffline(tx, coldStorageKeypair)
const { data: signedQr } = await exportForCold(signedTx, 'qr')

// Transfer signed QR back to online device

// ONLINE DEVICE: Broadcast
const importedTx = await importFromCold(signedQr, 'qr')
const signature = await connection.sendTransaction(importedTx)
```

### Multi-Signature Transactions

```typescript
import { createPartialSignature, combinePartialSignatures } from '@airgapped-priv/sdk'

// Create partial signature from key 1
const partial1 = await createPartialSignature(tx, keypair1)

// Create partial signature from key 2
const partial2 = await createPartialSignature(tx, keypair2)

// Combine into fully-signed transaction
const fullySigned = combinePartialSignatures(tx, [partial1, partial2])
```

### Durable Transaction Nonces

For transactions that need to be valid for longer periods:

```typescript
import { createTxWithNonce } from '@airgapped-priv/sdk'

const txWithNonce = await createTxWithNonce(
  instructions,
  nonceAccountPubkey,
  payer,
  authority,
  connection
)

// This transaction won't expire due to blockhash!
```

## 🧪 Testing

```typescript
import { generateOfflineKeypair, validateKeypair } from '@airgapped-priv/sdk'

// Generate test keypair
const keypair = await generateOfflineKeypair()

// Validate keypair
const isValid = await validateKeypair(keypair)
console.log('Keypair valid:', isValid)
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **GitHub**: [github.com/airgapped-priv/sdk](https://github.com/airgapped-priv/sdk)
- **Documentation**: [docs.offlinesign.dev](https://docs.offlinesign.dev)
- **Demo**: [demo.offlinesign.dev](https://demo.offlinesign.dev)
- **Solana Docs**: [solana.com/docs](https://solana.com/docs)

---

**Built with ❤️ for the Solana ecosystem — No vendor lock-in, ever.**
