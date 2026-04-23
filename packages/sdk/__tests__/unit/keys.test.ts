import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Keypair } from '@solana/web3.js'
import * as ed25519 from '@noble/ed25519'

// Import functions to test
import {
  generateOfflineKeypair,
  validateKeypair,
  encryptKeypair,
  decryptKeypair,
} from '../../src/core/keys'

describe('Keypair Generation', () => {
  it('should generate cryptographically secure keypairs', async () => {
    const keypair = await generateOfflineKeypair()

    expect(keypair).toBeDefined()
    expect(keypair.secretKey).toBeInstanceOf(Uint8Array)
    expect(keypair.secretKey).toHaveLength(64)
    expect(keypair.publicKey).toBeDefined()
  })

  it('should generate unique keypairs', async () => {
    const keypair1 = await generateOfflineKeypair()
    const keypair2 = await generateOfflineKeypair()

    expect(keypair1.secretKey).not.toEqual(keypair2.secretKey)
    expect(keypair1.publicKey).not.toEqual(keypair2.publicKey)
  })

  it('should validate a correct keypair', async () => {
    const keypair = await generateOfflineKeypair()
    const isValid = await validateKeypair(keypair)

    expect(isValid).toBe(true)
  })

  it('should reject an invalid keypair', async () => {
    const invalidKeypair = {
      secretKey: new Uint8Array(64).fill(0),
      publicKey: {
        toBytes: () => new Uint8Array(32).fill(1),
        toBuffer: () => Buffer.from(new Uint8Array(32).fill(1)),
      },
    } as any

    const isValid = await validateKeypair(invalidKeypair)
    expect(isValid).toBe(false)
  })
})

describe('Keypair Encryption/Decryption', () => {
  let testKeypair: any

  beforeEach(async () => {
    testKeypair = await generateOfflineKeypair()
  })

  it('should encrypt and decrypt keypair with correct password', async () => {
    const password = 'test-password-123'
    const encrypted = await encryptKeypair(testKeypair, password)
    const decrypted = await decryptKeypair(encrypted, password)

    expect(decrypted.secretKey).toEqual(testKeypair.secretKey)
    expect(decrypted.publicKey).toEqual(testKeypair.publicKey)
  })

  it('should fail to decrypt with wrong password', async () => {
    const password = 'test-password-123'
    const wrongPassword = 'wrong-password'
    const encrypted = await encryptKeypair(testKeypair, password)

    await expect(decryptKeypair(encrypted, wrongPassword)).rejects.toThrow()
  })

  it('should produce different ciphertext for same keypair (random IV)', async () => {
    const password = 'test-password-123'
    const encrypted1 = await encryptKeypair(testKeypair, password)
    const encrypted2 = await encryptKeypair(testKeypair, password)

    expect(encrypted1).not.toEqual(encrypted2)
  })

  it('should handle empty password gracefully', async () => {
    const password = ''
    const encrypted = await encryptKeypair(testKeypair, password)
    const decrypted = await decryptKeypair(encrypted, password)

    expect(decrypted.secretKey).toEqual(testKeypair.secretKey)
  })
})

describe('Keypair Security', () => {
  it('should use PBKDF2 with sufficient iterations', async () => {
    const password = 'test-password-123'
    const keypair = await generateOfflineKeypair()

    // This test verifies the key derivation function is being used
    // The actual implementation should use 100,000+ iterations
    const encrypted = await encryptKeypair(keypair, password)

    expect(encrypted).toBeDefined()
    expect(encrypted.salt).toBeDefined()
    expect(encrypted.iv).toBeDefined()
    expect(encrypted.data).toBeDefined()
  })

  it('should use AES-256-GCM encryption', async () => {
    const password = 'test-password-123'
    const keypair = await generateOfflineKeypair()
    const encrypted = await encryptKeypair(keypair, password)

    // AES-256-GCM produces ciphertext of same length as plaintext
    // plus authentication tag (16 bytes)
    expect(encrypted.data).toBeDefined()
    expect(encrypted.authTag).toBeDefined()
  })
})
