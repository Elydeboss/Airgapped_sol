import type {
  Commitment,
  BlockhashWithExpiryBlockHeight,
  Network,
} from '../types/index.js'
import type { Connection } from '@solana/web3.js'
import {
  Connection as SolanaConnection,
  PublicKey,
} from '@solana/web3.js'

/**
 * Default RPC endpoints by network
 */
const DEFAULT_ENDPOINTS: Record<Network, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  testnet: 'https://api.testnet.solana.com',
  devnet: 'https://api.devnet.solana.com',
  localnet: 'http://localhost:8899',
  custom: 'https://api.custom.endpoint.com',
}

/**
 * Helius endpoints (requires API key for production)
 * Sign up at: https://www.helius.dev/
 */
export const HELIUS_ENDPOINTS: Record<'mainnet' | 'devnet', string> = {
  mainnet: 'https://rpc.helius.xyz/?api-key=YOUR_API_KEY',
  devnet: 'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY',
}

/**
 * Blockhash cache to reduce RPC calls
 */
const blockhashCache = new Map<string, { blockhash: string; expiry: number }>()
const CACHE_TTL = 30_000 // 30 seconds

/**
 * Create Solana connection with Helius fallback
 *
 * @param endpoint - Custom endpoint or network name
 * @param commitment - Commitment level
 * @returns Connection instance
 *
 * @example
 * ```typescript
 * // Connect to devnet
 * const connection = createConnection('devnet')
 *
 * // Connect to custom endpoint
 * const connection = createConnection('https://custom.endpoint.com')
 *
 * // Connect to Helius
 * const connection = createConnection(HELIUS_ENDPOINTS.devnet)
 * ```
 */
export function createConnection(
  endpoint?: string,
  commitment: Commitment = 'confirmed'
): Connection {
  const url = endpoint || DEFAULT_ENDPOINTS.devnet

  return new SolanaConnection(url, {
    commitment,
    confirmTransactionInitialTimeout: 60_000,
  })
}

/**
 * Get recent blockhash with caching
 *
 * @param connection - Solana connection
 * @returns Blockhash with expiry
 *
 * @example
 * ```typescript
 * const { blockhash, lastValidBlockHeight } = await getRecentBlockhash(connection)
 * ```
 */
export async function getRecentBlockhash(
  connection: Connection
): Promise<BlockhashWithExpiryBlockHeight> {
  const endpoint = connection.rpcEndpoint

  // Check cache
  const cached = blockhashCache.get(endpoint)
  if (cached && cached.expiry > Date.now()) {
    return {
      blockhash: cached.blockhash,
      lastValidBlockHeight: Math.floor((cached.expiry - Date.now()) / 1000 / 2) * 150 + 100,
    }
  }

  // Fetch new blockhash
  const blockhashData = await connection.getLatestBlockhash('finalized')

  // Cache it
  blockhashCache.set(endpoint, {
    blockhash: blockhashData.blockhash,
    expiry: Date.now() + CACHE_TTL,
  })

  return blockhashData
}

/**
 * Clear blockhash cache for an endpoint
 *
 * @param connection - Connection to clear cache for
 */
export function clearBlockhashCache(connection?: Connection): void {
  if (connection) {
    blockhashCache.delete(connection.rpcEndpoint)
  } else {
    blockhashCache.clear()
  }
}

/**
 * Create connection for specific network
 *
 * @param network - Network name
 * @param commitment - Commitment level
 * @returns Connection instance
 */
export function createNetworkConnection(
  network: Network,
  commitment: Commitment = 'confirmed'
): Connection {
  return createConnection(DEFAULT_ENDPOINTS[network], commitment)
}

/**
 * Switch network on existing connection
 * Creates a new connection with the same commitment
 *
 * @param connection - Current connection
 * @param network - New network
 * @returns New connection
 */
export function switchNetwork(
  connection: Connection,
  network: Network
): Connection {
  return createNetworkConnection(network, connection.commitment as Commitment)
}

/**
 * Get account balance
 *
 * @param connection - Solana connection
 * @param publicKey - Account public key
 * @returns Balance in lamports
 */
export async function getBalance(
  connection: Connection,
  publicKey: string
): Promise<number> {
  return connection.getBalance(new PublicKey(publicKey))
}

/**
 * Get account info with error handling
 *
 * @param connection - Solana connection
 * @param publicKey - Account public key
 * @returns Account info or null
 */
export async function getAccountInfo(
  connection: Connection,
  publicKey: PublicKey
): Promise<unknown | null> {
  try {
    return await connection.getAccountInfo(publicKey)
  } catch {
    return null
  }
}

/**
 * Check if account exists
 *
 * @param connection - Solana connection
 * @param publicKey - Account public key
 * @returns True if account exists
 */
export async function accountExists(
  connection: Connection,
  publicKey: PublicKey
): Promise<boolean> {
  const info = await getAccountInfo(connection, publicKey)
  return info !== null
}

/**
 * Get current slot (block height)
 *
 * @param connection - Solana connection
 * @returns Current slot
 */
export async function getCurrentSlot(connection: Connection): Promise<number> {
  return connection.getSlot()
}

/**
 * Wait for transaction confirmation
 *
 * @param connection - Solana connection
 * @param signature - Transaction signature
 * @param commitment - Commitment level
 * @returns Confirmation result
 */
export async function waitForConfirmation(
  connection: Connection,
  signature: string,
  commitment: Commitment = 'confirmed'
): Promise<{ value: { err: unknown | null } }> {
  return connection.confirmTransaction(signature, commitment)
}

/**
 * Send and confirm transaction
 *
 * @param connection - Solana connection
 * @param transaction - Signed transaction
 * @param commitment - Commitment level
 * @returns Transaction signature
 */
export async function sendAndConfirm(
  connection: Connection,
  transaction: Uint8Array,
  commitment: Commitment = 'confirmed'
): Promise<string> {
  const { VersionedTransaction } = await import('@solana/web3.js')
  const tx = VersionedTransaction.deserialize(transaction)
  const signature = await connection.sendTransaction(tx)
  await waitForConfirmation(connection, signature, commitment)
  return signature
}

/**
 * Estimate transaction fee
 *
 * @param connection - Solana connection
 * @param transaction - Transaction to estimate
 * @returns Fee in lamports
 */
export async function estimateFee(
  connection: Connection,
  transaction: Uint8Array
): Promise<number> {
  const { VersionedTransaction } = await import('@solana/web3.js')
  const tx = VersionedTransaction.deserialize(transaction)
  return connection.getFeeForMessage(
    tx.message,
    connection.commitment || 'confirmed'
  ).then((fee) => fee.value || 0)
}

/**
 * Get RPC endpoint URL from connection
 *
 * @param connection - Connection instance
 * @returns RPC endpoint URL
 */
export function getEndpoint(connection: Connection): string {
  return connection.rpcEndpoint
}

/**
 * Validate RPC endpoint
 *
 * @param endpoint - Endpoint to validate
 * @returns True if endpoint is valid
 */
export async function validateEndpoint(endpoint: string): Promise<boolean> {
  try {
    const connection = createConnection(endpoint)
    await connection.getVersion()
    return true
  } catch {
    return false
  }
}

/**
 * Get network from endpoint
 *
 * @param endpoint - RPC endpoint
 * @returns Network name or 'custom'
 */
export function getNetworkFromEndpoint(endpoint: string): Network | 'custom' {
  if (endpoint.includes('mainnet')) return 'mainnet-beta'
  if (endpoint.includes('devnet')) return 'devnet'
  if (endpoint.includes('testnet')) return 'testnet'
  if (endpoint.includes('localhost')) return 'localnet'
  return 'custom'
}
