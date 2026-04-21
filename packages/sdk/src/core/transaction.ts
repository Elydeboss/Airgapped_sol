import type {
  Commitment,
  CreateTxOptions,
} from '../types/index.js'
import type {
  Connection,
  PublicKey,
} from '@solana/web3.js'
import {
  TransactionMessage,
  VersionedTransaction,
  type TransactionInstruction,
} from '@solana/web3.js'

/**
 * Creates an unsigned transaction message for offline signing
 * Handles blockhash expiration with durable nonce support
 *
 * @param instructions - Array of transaction instructions
 * @param connection - Solana connection
 * @param payer - Payer's public key
 * @param options - Optional configuration for nonce, blockhash
 * @returns Unsigned VersionedTransaction ready for offline signing
 *
 * @example
 * ```typescript
 * const tx = await createUnsignedTxMessage(
 *   [SystemProgram.transfer({ ... })],
 *   connection,
 *   myKeypair.publicKey
 * )
 * ```
 */
export async function createUnsignedTxMessage(
  instructions: TransactionInstruction[],
  connection: Connection,
  payer: PublicKey,
  options: CreateTxOptions = {}
): Promise<VersionedTransaction> {
  // Fetch recent blockhash if not provided
  let blockhash: string
  let lastValidBlockHeight: number

  if (options.blockhash && options.lastValidBlockHeight) {
    blockhash = options.blockhash
    lastValidBlockHeight = options.lastValidBlockHeight
  } else {
    const blockhashData = await connection.getLatestBlockhash('finalized' as Commitment)
    blockhash = blockhashData.blockhash
    lastValidBlockHeight = blockhashData.lastValidBlockHeight
  }

  // Create transaction message
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message()

  // Create versioned transaction (unsigned)
  const transaction = new VersionedTransaction(message)

  // Store metadata for later use (not in the transaction itself)
  ;(transaction as unknown as { __lastValidBlockHeight?: number }).__lastValidBlockHeight =
    lastValidBlockHeight

  return transaction
}

/**
 * Get the last valid block height from a transaction
 * Useful for checking if a transaction is still valid
 *
 * @param transaction - VersionedTransaction to check
 * @returns Last valid block height or undefined
 */
export function getLastValidBlockHeight(transaction: VersionedTransaction): number | undefined {
  return (transaction as unknown as { __lastValidBlockHeight?: number }).__lastValidBlockHeight
}

/**
 * Validates if a transaction is still valid given current block height
 *
 * @param transaction - VersionedTransaction to validate
 * @param currentBlockHeight - Current block height
 * @returns True if transaction is still valid
 */
export function isTransactionValid(
  transaction: VersionedTransaction,
  currentBlockHeight: number
): boolean {
  const lastValid = getLastValidBlockHeight(transaction)
  if (!lastValid) return false
  return currentBlockHeight <= lastValid
}

/**
 * Extracts the blockhash from a transaction
 *
 * @param transaction - VersionedTransaction
 * @returns The blockhash or undefined
 */
export function getBlockhash(transaction: VersionedTransaction): string | undefined {
  return transaction.message.recentBlockhash
}

/**
 * Creates a transaction with a durable nonce
 * This is useful for time-delayed air-gapped signing
 *
 * @param instructions - Transaction instructions
 * @param nonceAccountPubkey - Nonce account public key
 * @param payer - Payer public key
 * @param nonceAuthority - Nonce authority (usually payer)
 * @returns Transaction with durable nonce
 *
 * @example
 * ```typescript
 * const txWithNonce = await createTxWithNonce(
 *   [instruction],
 *   nonceAccountPubkey,
 *   myKeypair.publicKey,
 *   myKeypair.publicKey
 * )
 * // This transaction won't expire due to blockhash
 * ```
 */
export async function createTxWithNonce(
  instructions: TransactionInstruction[],
  nonceAccountPubkey: PublicKey,
  payer: PublicKey,
  _nonceAuthority: PublicKey,
  connection: Connection
): Promise<VersionedTransaction> {
  // Get nonce account data
  const nonceAccountInfo = await connection.getAccountInfo(nonceAccountPubkey)
  if (!nonceAccountInfo) {
    throw new Error('Nonce account not found')
  }

  // Extract nonce from account data
  // The nonce is stored in the account data
  const nonce = nonceAccountInfo.data.subarray(4, 36) // Skip version and take 32 bytes

  // Create transaction message with nonce as blockhash
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: Buffer.from(nonce).toString('base64'),
    instructions,
  }).compileToV0Message()

  return new VersionedTransaction(message)
}

/**
 * Prepares a transaction for offline signing by adding necessary metadata
 *
 * @param transaction - VersionedTransaction to prepare
 * @param options - Additional options
 * @returns Transaction with metadata attached
 */
export function prepareForOfflineSigning(
  transaction: VersionedTransaction,
  options: { network?: string; timestamp?: number } = {}
): VersionedTransaction {
  const metadata = {
    network: options.network || 'unknown',
    timestamp: options.timestamp || Date.now(),
  }

  // Attach metadata to transaction (not serialized, kept in memory)
  ;(transaction as unknown as { __metadata?: object }).__metadata = metadata

  return transaction
}

/**
 * Get metadata attached to a transaction
 *
 * @param transaction - VersionedTransaction
 * @returns Metadata or undefined
 */
export function getTransactionMetadata(
  transaction: VersionedTransaction
): object | undefined {
  return (transaction as unknown as { __metadata?: object }).__metadata
}
