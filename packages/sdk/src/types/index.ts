import type {
  TransactionInstruction,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js'

// Re-export commonly used types
export type { TransactionInstruction, TransactionSignature, VersionedTransaction }

/**
 * Export format for cold storage
 */
export type ColdTxFormat = 'qr' | 'base64' | 'file'

/**
 * Transaction export for cold storage
 */
export interface ColdTxExport {
  /** The serialized transaction data */
  data: string
  /** The export format used */
  format: ColdTxFormat
  /** Size in bytes */
  size: number
  /** Timestamp when exported */
  timestamp: number
}

/**
 * Options for exporting transactions to cold storage
 */
export interface ColdTxExportOptions {
  /** Maximum QR code size in bytes (for QR format) */
  maxSize?: number
  /** Include metadata like timestamp and network */
  includeMetadata?: boolean
}

/**
 * Blockhash with expiry information
 */
export interface BlockhashWithExpiryBlockHeight {
  blockhash: string
  lastValidBlockHeight: number
}

/**
 * Commitment level for Solana RPC calls
 */
export type Commitment = 'processed' | 'confirmed' | 'finalized'

/**
 * Options for creating unsigned transactions
 */
export interface CreateTxOptions {
  /** Optional durable nonce account for time-delayed transactions */
  nonce?: string
  /** Recent blockhash (will fetch if not provided) */
  blockhash?: string
  /** Last valid block height (calculated if not provided) */
  lastValidBlockHeight?: number
}

/**
 * Partial signature for multi-sig transactions
 */
export interface PartialSignature {
  signature: Buffer
  publicKey: Buffer
}

/**
 * Wallet state for useWallet hook
 */
export interface WalletState {
  publicKey: string | null
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  signTransaction: ((tx: VersionedTransaction) => Promise<VersionedTransaction>) | null
  signAllTransactions: ((txs: VersionedTransaction[]) => Promise<VersionedTransaction[]>) | null
}

/**
 * Connection state for useConnection hook
 */
export interface ConnectionState {
  endpoint: string
  commitment: Commitment
  connected: boolean
}

/**
 * Error types for SDK operations
 */
export class OfflineSignError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.name = 'OfflineSignError'
    this.code = code
  }
}

/**
 * Specific error codes
 */
export enum ErrorCode {
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  SERIALIZATION_FAILED = 'SERIALIZATION_FAILED',
  DESERIALIZATION_FAILED = 'DESERIALIZATION_FAILED',
  SIGNATURE_FAILED = 'SIGNATURE_FAILED',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  BLOCKHASH_EXPIRED = 'BLOCKHASH_EXPIRED',
  INVALID_KEYPAIR = 'INVALID_KEYPAIR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * Network configuration
 */
export type Network = 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet' | 'custom'

/**
 * RPC endpoint configuration
 */
export interface RpcEndpoint {
  network: Network
  url: string
  commitment?: Commitment
}

/**
 * Transaction result
 */
export interface TransactionResult {
  signature: TransactionSignature
  confirmations?: number
  error?: string
}
