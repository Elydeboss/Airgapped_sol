import { describe, it, expect, beforeEach } from 'vitest'
import {
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'

// Import functions to test
import {
  exportForCold,
  importFromCold,
  generateQRCode,
  estimateQRSize,
  isValidBase58,
  transactionToJSON,
  transactionFromJSON,
} from '../../src/core/serialization'

describe('Transaction Serialization', () => {
  let testTransaction: VersionedTransaction
  let testPayer: PublicKey

  beforeEach(() => {
    testPayer = new PublicKey(SystemProgram.programId)

    const instruction = SystemProgram.transfer({
      fromPubkey: testPayer,
      toPubkey: testPayer,
      lamports: LAMPORTS_PER_SOL,
    })

    const message = new TransactionMessage({
      payerKey: testPayer,
      recentBlockhash: 'testBlockhash123',
      instructions: [instruction],
    }).compileToV0Message()

    testTransaction = new VersionedTransaction(message)
  })

  describe('exportForCold', () => {
    it('should export transaction as QR code', async () => {
      const result = await exportForCold(testTransaction, 'qr')

      expect(result).toBeDefined()
      expect(result.format).toBe('qr')
      expect(result.data).toBeDefined()
      expect(result.size).toBeGreaterThan(0)
      expect(result.timestamp).toBeDefined()
      expect(result.qrCode).toBeDefined()
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/)
    })

    it('should export transaction as base64', async () => {
      const result = await exportForCold(testTransaction, 'base64')

      expect(result).toBeDefined()
      expect(result.format).toBe('base64')
      expect(result.data).toBeDefined()
      expect(result.size).toBeGreaterThan(0)
    })

    it('should export transaction as file', async () => {
      const result = await exportForCold(testTransaction, 'file')

      expect(result).toBeDefined()
      expect(result.format).toBe('file')
      expect(result.data).toBeDefined()
    })

    it('should throw error for unsupported format', async () => {
      await expect(
        exportForCold(testTransaction, 'invalid' as any)
      ).rejects.toThrow('Unsupported export format')
    })

    it('should enforce maximum size for QR codes', async () => {
      const maxSize = 100

      await expect(
        exportForCold(testTransaction, 'qr', { maxSize })
      ).rejects.toThrow('Transaction too large')
    })
  })

  describe('importFromCold', () => {
    it('should import transaction from QR/base58 format', async () => {
      const exported = await exportForCold(testTransaction, 'qr')
      const imported = await importFromCold(exported.data, 'qr')

      expect(imported).toBeInstanceOf(VersionedTransaction)
      expect(imported.version).toBe(testTransaction.version)
    })

    it('should import transaction from base64 format', async () => {
      const exported = await exportForCold(testTransaction, 'base64')
      const imported = await importFromCold(exported.data, 'base64')

      expect(imported).toBeInstanceOf(VersionedTransaction)
    })

    it('should import transaction from file format', async () => {
      const exported = await exportForCold(testTransaction, 'file')
      const imported = await importFromCold(exported.data, 'file')

      expect(imported).toBeInstanceOf(VersionedTransaction)
    })

    it('should throw error for invalid base58 data', async () => {
      await expect(
        importFromCold('invalid-base58!!!', 'qr')
      ).rejects.toThrow('Failed to import transaction')
    })

    it('should throw error for invalid base64 data', async () => {
      await expect(
        importFromCold('invalid-base64!!!', 'base64')
      ).rejects.toThrow('Failed to import transaction')
    })

    it('should throw error for unsupported format', async () => {
      await expect(
        importFromCold('data', 'invalid' as any)
      ).rejects.toThrow('Unsupported import format')
    })

    it('should round-trip transaction correctly', async () => {
      const exported = await exportForCold(testTransaction, 'qr')
      const imported = await importFromCold(exported.data, 'qr')

      expect(imported.version).toBe(testTransaction.version)
      expect(imported.message).toBeDefined()
    })
  })

  describe('generateQRCode', () => {
    it('should generate QR code data URL', async () => {
      const qrDataUrl = await generateQRCode(testTransaction)

      expect(qrDataUrl).toMatch(/^data:image\/png;base64,/)
    })

    it('should use default options when none provided', async () => {
      const qrDataUrl = await generateQRCode(testTransaction)

      expect(qrDataUrl).toBeDefined()
    })

    it('should accept custom QR code options', async () => {
      const qrDataUrl = await generateQRCode(testTransaction, {
        errorCorrectionLevel: 'H',
        scale: 8,
        margin: 2,
      })

      expect(qrDataUrl).toBeDefined()
    })
  })

  describe('estimateQRSize', () => {
    it('should estimate QR code size', () => {
      const size = estimateQRSize(testTransaction)

      expect(size).toBeGreaterThan(0)
      expect(typeof size).toBe('number')
    })

    it('should return consistent size for same transaction', () => {
      const size1 = estimateQRSize(testTransaction)
      const size2 = estimateQRSize(testTransaction)

      expect(size1).toBe(size2)
    })
  })

  describe('isValidBase58', () => {
    it('should validate correct base58 string', () => {
      const validBase58 = '3v1cgEH3HuUmJzphMBRPg7textbEgLf8T1KqYTqxQfFE'
      expect(isValidBase58(validBase58)).toBe(true)
    })

    it('should reject invalid base58 string', () => {
      const invalidBase58 = 'invalid-base58!!!0OI'
      expect(isValidBase58(invalidBase58)).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidBase58('')).toBe(false)
    })

    it('should reject string with invalid characters', () => {
      const invalid = '3v1cgEH3HuUmJzphMBRPg7textbEgLf8T1KqYTqxQfFE!!!'
      expect(isValidBase58(invalid)).toBe(false)
    })
  })

  describe('JSON Serialization', () => {
    it('should convert transaction to JSON', () => {
      const json = transactionToJSON(testTransaction)

      expect(json).toBeDefined()
      expect(json.version).toBeDefined()
      expect(json.data).toBeDefined()
      expect(json.message).toBeDefined()
      expect(typeof json.data).toBe('string')
    })

    it('should convert JSON back to transaction', async () => {
      const json = transactionToJSON(testTransaction)
      const restored = await transactionFromJSON(json)

      expect(restored).toBeInstanceOf(VersionedTransaction)
      expect(restored.version).toBe(testTransaction.version)
    })

    it('should round-trip transaction through JSON', async () => {
      const json = transactionToJSON(testTransaction)
      const restored = await transactionFromJSON(json)

      expect(restored.message).toBeDefined()
    })

    it('should handle invalid JSON gracefully', async () => {
      const invalidJSON = {
        version: 'legacy',
        data: 'invalid-base64!!!',
      }

      await expect(
        transactionFromJSON(invalidJSON as any)
      ).rejects.toThrow()
    })
  })

  describe('Base58 Encoding Properties', () => {
    it('should produce shorter base58 than base64', async () => {
      const qrExport = await exportForCold(testTransaction, 'qr')
      const base64Export = await exportForCold(testTransaction, 'base64')

      // Base58 should be more compact than base64
      expect(qrExport.data.length).toBeLessThan(base64Export.data.length)
    })

    it('should use only valid base58 characters', async () => {
      const qrExport = await exportForCold(testTransaction, 'qr')

      // Base58 character set: 1-9, A-H, J-N, P-Z, a-k, m-z
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
      expect(qrExport.data).toMatch(base58Regex)
    })
  })
})
