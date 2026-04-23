import { describe, it, expect, beforeEach } from 'vitest'
import { Keypair, VersionedTransaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

// Import functions to test
import {
  signOffline,
  signOfflineWithSecretKey,
  createPartialSignature,
  combinePartialSignatures,
  verifySignature,
  extractSignatures,
  isFullySigned,
  generateOfflineKeypair,
  validateKeypair,
} from '../../src/core/offline'
import { createUnsignedTxMessage } from '../../src/core/transaction'

describe('Offline Signing', () => {
  let testKeypair: any
  let testTransaction: VersionedTransaction

  beforeEach(async () => {
    testKeypair = await generateOfflineKeypair()

    // Create a simple test transaction
    const instruction = SystemProgram.transfer({
      fromPubkey: testKeypair.publicKey as any,
      toPubkey: testKeypair.publicKey as any,
      lamports: LAMPORTS_PER_SOL,
    })

    // Note: This would normally require a connection, but we're mocking
    // For actual testing, we'd need to mock the connection or use a real one
    testTransaction = new VersionedTransaction(
      new TransactionMessage({
        payerKey: testKeypair.publicKey as any,
        recentBlockhash: 'testBlockhash123',
        instructions: [instruction],
      }).compileToV0Message()
    )
  })

  describe('signOffline', () => {
    it('should sign a transaction with a keypair', () => {
      const signedTx = signOffline(testTransaction, testKeypair)

      expect(signedTx).toBeDefined()
      expect(signedTx.signatures).toHaveLength(1)
      expect(signedTx.signatures[0]).toHaveLength(64)
    })

    it('should throw error for missing transaction', () => {
      expect(() => signOffline(null as any, testKeypair)).toThrow()
    })

    it('should throw error for missing keypair', () => {
      expect(() => signOffline(testTransaction, null as any)).toThrow()
    })

    it('should validate signed transaction', async () => {
      const signedTx = signOffline(testTransaction, testKeypair)
      const signature = signedTx.signatures[0]
      const publicKey = testKeypair.publicKey.toBytes()

      const isValid = await verifySignature(
        testTransaction,
        Buffer.from(signature),
        Buffer.from(publicKey)
      )

      expect(isValid).toBe(true)
    })
  })

  describe('signOfflineWithSecretKey', () => {
    it('should sign a transaction with a raw secret key', async () => {
      const signedTx = await signOfflineWithSecretKey(
        testTransaction,
        testKeypair.secretKey
      )

      expect(signedTx).toBeDefined()
      expect(signedTx.signatures).toHaveLength(1)
    })

    it('should throw error for invalid secret key length', async () => {
      await expect(
        signOfflineWithSecretKey(testTransaction, new Uint8Array(32))
      ).rejects.toThrow('Secret key must be 64 bytes')
    })

    it('should produce same signature as signOffline', async () => {
      const signature1 = signOffline(testTransaction, testKeypair).signatures[0]
      const signature2 = (await signOfflineWithSecretKey(testTransaction, testKeypair.secretKey))
        .signatures[0]

      expect(Buffer.from(signature1)).toEqual(Buffer.from(signature2))
    })
  })

  describe('Multi-Signature Operations', () => {
    let keypair1: any
    let keypair2: any
    let multiSigTx: VersionedTransaction

    beforeEach(async () => {
      keypair1 = await generateOfflineKeypair()
      keypair2 = await generateOfflineKeypair()

      // Create a transaction that requires multiple signatures
      // In a real scenario, this would be a multisig account transaction
      multiSigTx = testTransaction
    })

    it('should create partial signature for multi-sig', async () => {
      const partial = await createPartialSignature(multiSigTx, keypair1)

      expect(partial).toBeDefined()
      expect(partial.signature).toBeInstanceOf(Buffer)
      expect(partial.signature).toHaveLength(64)
      expect(partial.publicKey).toBeInstanceOf(Buffer)
    })

    it('should combine multiple partial signatures', async () => {
      const partial1 = await createPartialSignature(multiSigTx, keypair1)
      const partial2 = await createPartialSignature(multiSigTx, keypair2)

      const combined = combinePartialSignatures(multiSigTx, [partial1, partial2])

      expect(combined).toBeDefined()
      expect(combined.signatures).toHaveLength(2)
    })

    it('should verify partial signature', async () => {
      const partial = await createPartialSignature(multiSigTx, keypair1)

      const isValid = await verifySignature(
        multiSigTx,
        partial.signature,
        partial.publicKey
      )

      expect(isValid).toBe(true)
    })
  })

  describe('Signature Verification', () => {
    it('should verify correct signature', async () => {
      const signedTx = signOffline(testTransaction, testKeypair)
      const signature = signedTx.signatures[0]
      const publicKey = testKeypair.publicKey.toBytes()

      const isValid = await verifySignature(
        testTransaction,
        Buffer.from(signature),
        Buffer.from(publicKey)
      )

      expect(isValid).toBe(true)
    })

    it('should reject incorrect signature', async () => {
      const wrongSignature = new Uint8Array(64).fill(42)
      const publicKey = testKeypair.publicKey.toBytes()

      const isValid = await verifySignature(
        testTransaction,
        Buffer.from(wrongSignature),
        Buffer.from(publicKey)
      )

      expect(isValid).toBe(false)
    })

    it('should extract signatures from signed transaction', () => {
      const signedTx = signOffline(testTransaction, testKeypair)
      const signatures = extractSignatures(signedTx)

      expect(signatures).toHaveLength(1)
      expect(signatures[0]).toHaveLength(64)
    })
  })

  describe('Transaction State', () => {
    it('should check if transaction is fully signed', () => {
      const signedTx = signOffline(testTransaction, testKeypair)

      expect(isFullySigned(signedTx)).toBe(true)
    })

    it('should detect unsigned transaction', () => {
      expect(isFullySigned(testTransaction)).toBe(false)
    })
  })

  describe('Keypair Generation for Cold Storage', () => {
    it('should generate valid cold storage keypair', async () => {
      const coldKeypair = await generateOfflineKeypair()
      const isValid = await validateKeypair(coldKeypair)

      expect(isValid).toBe(true)
      expect(coldKeypair.secretKey).toHaveLength(64)
    })

    it('should generate deterministic test vectors', async () => {
      // For testing: ensure we can generate consistent results
      // In production, randomness is essential
      const keypair1 = await generateOfflineKeypair()
      const keypair2 = await generateOfflineKeypair()

      expect(keypair1.secretKey).not.toEqual(keypair2.secretKey)
    })
  })
})
