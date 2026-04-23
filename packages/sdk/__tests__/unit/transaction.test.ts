import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'

// Import functions to test
import {
  createUnsignedTxMessage,
  getLastValidBlockHeight,
  isTransactionValid,
  getBlockhash,
  createTxWithNonce,
  prepareForOfflineSigning,
  getTransactionMetadata,
} from '../../src/core/transaction'

// Mock Connection
const mockConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: 'testBlockhash123',
    lastValidBlockHeight: 1000,
  }),
  getAccountInfo: vi.fn().mockResolvedValue({
    data: Buffer.from([
      0, 0, 0, 0, // version
      ...new Uint8Array(32).fill(1), // nonce
    ]),
  }),
} as any

describe('Transaction Creation', () => {
  let testPayer: PublicKey

  beforeEach(() => {
    testPayer = new PublicKey(SystemProgram.programId)
  })

  describe('createUnsignedTxMessage', () => {
    it('should create unsigned transaction with blockhash', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer
      )

      expect(tx).toBeInstanceOf(VersionedTransaction)
      expect(getBlockhash(tx)).toBe('testBlockhash123')
      expect(getLastValidBlockHeight(tx)).toBe(1000)
    })

    it('should use provided blockhash when given', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const customBlockhash = 'customBlockhash'
      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer,
        {
          blockhash: customBlockhash,
          lastValidBlockHeight: 2000,
        }
      )

      expect(getBlockhash(tx)).toBe(customBlockhash)
      expect(getLastValidBlockHeight(tx)).toBe(2000)
    })

    it('should handle multiple instructions', async () => {
      const instructions = [
        SystemProgram.transfer({
          fromPubkey: testPayer,
          toPubkey: testPayer,
          lamports: LAMPORTS_PER_SOL,
        }),
        SystemProgram.transfer({
          fromPubkey: testPayer,
          toPubkey: testPayer,
          lamports: 2 * LAMPORTS_PER_SOL,
        }),
      ]

      const tx = await createUnsignedTxMessage(
        instructions,
        mockConnection,
        testPayer
      )

      expect(tx).toBeInstanceOf(VersionedTransaction)
      expect(tx.message.compiledInstructions).toHaveLength(2)
    })

    it('should store last valid block height metadata', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer
      )

      expect(getLastValidBlockHeight(tx)).toBeDefined()
      expect(typeof getLastValidBlockHeight(tx)).toBe('number')
    })
  })

  describe('Transaction Validation', () => {
    it('should validate transaction within block height', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer
      )

      const isValid = isTransactionValid(tx, 500)
      expect(isValid).toBe(true)
    })

    it('should invalidate transaction past block height', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer
      )

      const isValid = isTransactionValid(tx, 1500)
      expect(isValid).toBe(false)
    })

    it('should return undefined for transaction without metadata', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer
      )

      // Remove metadata
      delete (tx as any).__lastValidBlockHeight

      expect(getLastValidBlockHeight(tx)).toBeUndefined()
    })
  })

  describe('Durable Nonce Transactions', () => {
    it('should create transaction with durable nonce', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const nonceAccount = new PublicKey(SystemProgram.programId)

      const tx = await createTxWithNonce(
        [instruction],
        nonceAccount,
        testPayer,
        testPayer,
        mockConnection
      )

      expect(tx).toBeInstanceOf(VersionedTransaction)
      expect(getBlockhash(tx)).toBeDefined()
    })

    it('should throw error for non-existent nonce account', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      // Mock no account info
      vi.spyOn(mockConnection, 'getAccountInfo').mockResolvedValueOnce(null)

      const nonceAccount = new PublicKey(SystemProgram.programId)

      await expect(
        createTxWithNonce(
          [instruction],
          nonceAccount,
          testPayer,
          testPayer,
          mockConnection
        )
      ).rejects.toThrow('Nonce account not found')
    })
  })

  describe('Transaction Metadata', () => {
    it('should attach metadata to transaction', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer
      )

      const metadata = {
        network: 'mainnet-beta',
        timestamp: Date.now(),
      }

      const preparedTx = prepareForOfflineSigning(tx, metadata)

      expect(getTransactionMetadata(preparedTx)).toEqual(metadata)
    })

    it('should use default metadata when none provided', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer
      )

      const preparedTx = prepareForOfflineSigning(tx)

      const metadata = getTransactionMetadata(preparedTx)
      expect(metadata).toBeDefined()
      expect(metadata?.network).toBe('unknown')
      expect(typeof metadata?.timestamp).toBe('number')
    })

    it('should return undefined for transaction without metadata', () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const message = new TransactionMessage({
        payerKey: testPayer,
        recentBlockhash: 'test',
        instructions: [instruction],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)

      expect(getTransactionMetadata(tx)).toBeUndefined()
    })
  })

  describe('Blockhash Operations', () => {
    it('should extract blockhash from transaction', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const tx = await createUnsignedTxMessage(
        [instruction],
        mockConnection,
        testPayer
      )

      const blockhash = getBlockhash(tx)
      expect(blockhash).toBe('testBlockhash123')
    })

    it('should return undefined for transaction without blockhash', () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: testPayer,
        toPubkey: testPayer,
        lamports: LAMPORTS_PER_SOL,
      })

      const message = new TransactionMessage({
        payerKey: testPayer,
        recentBlockhash: '',
        instructions: [instruction],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)

      expect(getBlockhash(tx)).toBeUndefined()
    })
  })
})
