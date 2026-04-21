import type { Keypair } from '@solana/web3.js'
import * as ed25519 from '@noble/ed25519'
import { sha256 } from '@noble/hashes/sha256'

/**
 * Encryption for local storage
 * Uses AES-GCM with Web Crypto API
 */

/**
 * Derive encryption key from user credential
 */
export async function deriveKeyFromCredential(
  credentialId: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(credentialId),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt data for storage
 */
export async function encryptData(
  data: Uint8Array,
  encryptionKey: CryptoKey
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; salt: Uint8Array }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    encryptionKey,
    data
  )

  return {
    ciphertext: new Uint8Array(encrypted),
    iv,
    salt,
  }
}

/**
 * Decrypt data from storage
 */
export async function decryptData(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  _salt: Uint8Array,
  encryptionKey: CryptoKey
): Promise<Uint8Array> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    encryptionKey,
    ciphertext
  )

  return new Uint8Array(decrypted)
}

/**
 * Generate a new keypair
 */
export async function generateKeypair(): Promise<Keypair> {
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKey = await ed25519.getPublicKey(privateKey)

  const secretKey = new Uint8Array(64)
  secretKey.set(privateKey)
  secretKey.set(publicKey, 32)

  return {
    publicKey: {
      toBytes: () => publicKey,
      toBuffer: () => Buffer.from(publicKey),
      toString: () => Buffer.from(publicKey).toString('base64'),
      toBase58: () => bs58Encode(publicKey),
    } as Keypair['publicKey'],
    secretKey,
  } as Keypair
}

/**
 * Derive keypair from passkey
 */
export async function deriveKeypairFromPasskey(
  credentialId: Uint8Array,
  publicKey: Uint8Array
): Promise<Keypair> {
  // Combine credential ID and public key to create seed
  const combined = new Uint8Array(credentialId.length + publicKey.length)
  combined.set(credentialId)
  combined.set(publicKey, credentialId.length)

  // Hash to create private key seed
  const seed = await sha256(combined)

  // Derive keypair from seed
  const privateKey = seed
  const derivedPublicKey = await ed25519.getPublicKey(privateKey)

  const secretKey = new Uint8Array(64)
  secretKey.set(privateKey)
  secretKey.set(derivedPublicKey, 32)

  return {
    publicKey: {
      toBytes: () => derivedPublicKey,
      toBuffer: () => Buffer.from(derivedPublicKey),
      toString: () => Buffer.from(derivedPublicKey).toString('base64'),
      toBase58: () => bs58Encode(derivedPublicKey),
    } as Keypair['publicKey'],
    secretKey,
  } as Keypair
}

/**
 * Store encrypted keypair
 */
export async function storeEncryptedKeypair(
  keypair: Keypair,
  userId: string
): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encryptionKey = await deriveKeyFromCredential(userId, salt)

  const secretKeyBytes = keypair.secretKey
  const { ciphertext, iv, salt: returnedSalt } = await encryptData(
    secretKeyBytes,
    encryptionKey
  )

  // Store in localStorage (in production, use more secure storage)
  const storage = {
    ciphertext: Array.from(ciphertext),
    iv: Array.from(iv),
    salt: Array.from(returnedSalt),
    userId,
    createdAt: Date.now(),
  }

  localStorage.setItem(`offlinesign_keypair_${userId}`, JSON.stringify(storage))
}

/**
 * Load and decrypt keypair
 */
export async function loadEncryptedKeypair(userId: string): Promise<Keypair | null> {
  const stored = localStorage.getItem(`offlinesign_keypair_${userId}`)

  if (!stored) return null

  try {
    const storage = JSON.parse(stored)
    const ciphertext = new Uint8Array(storage.ciphertext)
    const iv = new Uint8Array(storage.iv)
    const salt = new Uint8Array(storage.salt)

    const encryptionKey = await deriveKeyFromCredential(userId, salt)
    const secretKeyBytes = await decryptData(ciphertext, iv, salt, encryptionKey)

    const privateKey = secretKeyBytes.slice(0, 32)
    const publicKey = await ed25519.getPublicKey(privateKey)

    return {
      publicKey: {
        toBytes: () => publicKey,
        toBuffer: () => Buffer.from(publicKey),
        toString: () => Buffer.from(publicKey).toString('base64'),
        toBase58: () => bs58Encode(publicKey),
      } as Keypair['publicKey'],
      secretKey: secretKeyBytes,
    } as Keypair
  } catch (error) {
    console.error('Failed to load keypair:', error)
    return null
  }
}

/**
 * Delete stored keypair
 */
export function deleteKeypair(userId: string): void {
  localStorage.removeItem(`offlinesign_keypair_${userId}`)
}

/**
 * List all stored keypairs (user IDs only)
 */
export function listStoredKeypairs(): string[] {
  const keys: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('offlinesign_keypair_')) {
      const userId = key.replace('offlinesign_keypair_', '')
      keys.push(userId)
    }
  }

  return keys
}

/**
 * Base58 encoding (simplified - use bs58 library in production)
 */
function bs58Encode(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const digits = [0]

  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i]!
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j]! << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }

  let result = ''
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result += '1'
  }

  for (let i = digits.length - 1; i >= 0; i--) {
    result += alphabet[digits[i]!]
  }

  return result
}

/**
 * Check if WebAuthn is available
 */
export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    'credentials' in navigator &&
    typeof (navigator.credentials as any).create === 'function'
  )
}

/**
 * Check if secure context (HTTPS)
 */
export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext
}
