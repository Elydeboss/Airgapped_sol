import type {
  PartialSignature,
} from '../types/index.js'
import type {
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js'
import * as ed25519 from '@noble/ed25519'

/**
 * Sign a transaction completely offline (air-gapped)
 * No network connection required
 *
 * @param tx - VersionedTransaction to sign
 * @param keypair - Keypair to sign with
 * @returns Signed VersionedTransaction
 *
 * @example
 * ```typescript
 * const unsignedTx = await createUnsignedTxMessage(...)
 * const signedTx = signOffline(unsignedTx, myKeypair)
 * // Now can broadcast when online
 * ```
 */
export function signOffline(
  tx: VersionedTransaction,
  keypair: Keypair
): VersionedTransaction {
  // Validate inputs
  if (!tx || !keypair) {
    throw new Error('Transaction and keypair are required')
  }

  // Sign the transaction
  tx.sign([keypair])

  return tx
}

/**
 * Sign transaction with a raw private key (Buffer)
 * Alternative to keypair for different key storage formats
 *
 * @param tx - VersionedTransaction to sign
 * @param secretKey - 64-byte secret key (32-byte private + 32-byte public)
 * @returns Signed VersionedTransaction
 */
export async function signOfflineWithSecretKey(
  tx: VersionedTransaction,
  secretKey: Uint8Array
): Promise<VersionedTransaction> {
  if (secretKey.length !== 64) {
    throw new Error('Secret key must be 64 bytes (32-byte private + 32-byte public)')
  }

  const privateKey = secretKey.slice(0, 32)

  // Sign using noble-ed25519
  const message = tx.message.serialize()
  const signature = await ed25519.sign(message, privateKey)

  // Add signature to transaction
  tx.addSignature(keypairFromSecretKey(secretKey).publicKey, Buffer.from(signature))

  return tx
}

/**
 * Create a partial signature for multi-sig transactions
 * Useful for future Ika dWallet integration
 *
 * @param tx - VersionedTransaction
 * @param keypair - Keypair to sign with
 * @returns Partial signature
 *
 * @example
 * ```typescript
 * const partial = await createPartialSignature(tx, keypair1)
 * // Combine multiple partials later
 * ```
 */
export async function createPartialSignature(
  tx: VersionedTransaction,
  keypair: Keypair
): Promise<PartialSignature> {
  const message = tx.message.serialize()

  // Use noble-ed25519 for signing
  const signatureBytes = await ed25519.sign(message, keypair.secretKey.slice(0, 32))

  return {
    signature: Buffer.from(signatureBytes),
    publicKey: keypair.publicKey.toBuffer(),
  }
}

/**
 * Combine partial signatures into a single signed transaction
 * For multi-sig or future Ika dWallet workflows
 *
 * @param tx - VersionedTransaction
 * @param partials - Array of partial signatures
 * @returns Signed VersionedTransaction
 */
export function combinePartialSignatures(
  tx: VersionedTransaction,
  partials: PartialSignature[]
): VersionedTransaction {
  for (const partial of partials) {
    tx.addSignature(
      partial.publicKey as unknown as Parameters<typeof tx.addSignature>[0],
      partial.signature as unknown as Parameters<typeof tx.addSignature>[1]
    )
  }

  return tx
}

/**
 * Verify a signature on a transaction
 *
 * @param tx - VersionedTransaction
 * @param signature - Signature to verify
 * @param publicKey - Public key to verify against
 * @returns True if signature is valid
 */
export async function verifySignature(
  tx: VersionedTransaction,
  signature: Buffer,
  publicKey: Buffer
): Promise<boolean> {
  const message = tx.message.serialize()
  return await ed25519.verify(signature, message, publicKey)
}

/**
 * Extract signatures from a signed transaction
 *
 * @param tx - Signed VersionedTransaction
 * @returns Array of signatures
 */
export function extractSignatures(tx: VersionedTransaction): Uint8Array[] {
  return Array.from(tx.signatures)
}

/**
 * Check if transaction is fully signed
 *
 * @param tx - VersionedTransaction
 * @returns True if all required signatures present
 */
export function isFullySigned(tx: VersionedTransaction): boolean {
  // For simple transactions, one signature is enough
  // For multi-sig, check if all required signatures are present
  const requiredSigs = tx.message.staticAccountKeys.length
  const presentSigs = tx.signatures.filter((sig) => sig.length > 0).length

  return presentSigs >= requiredSigs
}

/**
 * Create a keypair from a raw secret key
 * Utility for different key storage formats
 *
 * @param secretKey - 64-byte secret key
 * @returns Keypair
 */
function keypairFromSecretKey(secretKey: Uint8Array): Keypair {
  return {
    publicKey: {
      toBuffer: () => secretKey.slice(32, 64) as unknown as Buffer,
      toBytes: () => secretKey.slice(32, 64),
      toString: () => Buffer.from(secretKey.slice(32, 64)).toString('base64'),
    } as Keypair['publicKey'],
    secretKey,
  } as Keypair
}

/**
 * Generate a new keypair for offline signing
 * Can be used to create cold storage wallets
 *
 * @returns New Keypair
 *
 * @example
 * ```typescript
 * const coldKeypair = await generateOfflineKeypair()
 * // Save securely - this is the only copy!
 * const secretKey = coldKeypair.secretKey
 * ```
 */
export async function generateOfflineKeypair(): Promise<Keypair> {
  // Generate private key
  const privateKey = ed25519.utils.randomPrivateKey()

  // Derive public key
  const publicKeyPoint = await ed25519.getPublicKey(privateKey)

  // Create full keypair (64 bytes: 32 private + 32 public)
  const secretKey = new Uint8Array(64)
  secretKey.set(privateKey)
  secretKey.set(publicKeyPoint, 32)

  return keypairFromSecretKey(secretKey)
}

/**
 * Validate a keypair
 *
 * @param keypair - Keypair to validate
 * @returns True if keypair is valid
 */
export async function validateKeypair(keypair: Keypair): Promise<boolean> {
  try {
    const privateKey = keypair.secretKey.slice(0, 32)
    const publicKey = keypair.publicKey.toBytes()

    const message = new Uint8Array([1, 2, 3])
    const signature = await ed25519.sign(message, privateKey)

    return await ed25519.verify(signature, message, publicKey)
  } catch {
    return false
  }
}
