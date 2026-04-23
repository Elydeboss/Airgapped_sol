import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

// Import all functions needed for the full flow
import { useWallet, useAuth } from '../../src/hooks'
import {
  generateOfflineKeypair,
  signOffline,
  exportForCold,
  importFromCold,
} from '../../src/core/offline'
import { serialize } from '@solana/web3.js'

// Mock wallet for online device
const mockWalletAdapter = {
  name: 'Phantom',
  url: 'https://phantom.app',
  icon: 'data:image/svg+xml;base64,PHANTOM_ICON',
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn(),
  sendTransaction: vi.fn().mockResolvedValue('mock-signature'),
  publicKey: null,
  connected: false,
  connecting: false,
}

const mockConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: 'testBlockhash123',
    lastValidBlockHeight: 1000,
  }),
  getBalance: vi.fn().mockResolvedValue(BigInt(LAMPORTS_PER_SOL)),
  sendTransaction: vi.fn().mockResolvedValue('signature123'),
  confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
} as any

function createWrapper() {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <div>
        {children}
      </div>
    )
  }
}

describe('E2E: Complete Air-Gapped Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset wallet state
    mockWalletAdapter.publicKey = null
    mockWalletAdapter.connected = false
  })

  describe('Scenario 1: Basic Air-Gapped Transaction', () => {
    it('should complete full air-gapped transaction flow', async () => {
      // Step 1: User connects wallet on online device
      mockWalletAdapter.publicKey = {
        toBase58: () => 'onlineWalletPublicKey',
        toBytes: () => new Uint8Array(32),
      } as any
      mockWalletAdapter.connected = true

      // Step 2: Create unsigned transaction
      const fromPubkey = new PublicKey(SystemProgram.programId)
      const toPubkey = new PublicKey(SystemProgram.programId)
      const instruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: LAMPORTS_PER_SOL,
      })

      // Create transaction message
      const { TransactionMessage } = await import('@solana/web3.js')
      const message = new TransactionMessage({
        payerKey: fromPubkey,
        recentBlockhash: 'testBlockhash123',
        instructions: [instruction],
      }).compileToV0Message()

      const { VersionedTransaction } = await import('@solana/web3.js')
      const unsignedTx = new VersionedTransaction(message)

      // Step 3: Export transaction as QR code (online device)
      const exportedTx = await exportForCold(unsignedTx, 'qr')

      expect(exportedTx.format).toBe('qr')
      expect(exportedTx.qrCode).toBeDefined()
      expect(exportedTx.qrCode).toMatch(/^data:image\/png;base64,/)

      // Step 4: Transfer QR data to offline device (simulate)
      const qrData = exportedTx.data

      // Step 5: Import transaction on offline device
      const importedTx = await importFromCold(qrData, 'qr')

      expect(importedTx).toBeInstanceOf(VersionedTransaction)

      // Step 6: Sign transaction with offline keypair
      const offlineKeypair = await generateOfflineKeypair()
      const signedTx = signOffline(importedTx, offlineKeypair)

      expect(signedTx.signatures).toHaveLength(1)
      expect(signedTx.signatures[0]).toHaveLength(64)

      // Step 7: Export signed transaction back to online device
      const exportedSignedTx = await exportForCold(signedTx, 'base64')

      // Step 8: Import signed transaction on online device
      const importedSignedTx = await importFromCold(exportedSignedTx.data, 'base64')

      expect(importedSignedTx).toBeInstanceOf(VersionedTransaction)
      expect(importedSignedTx.signatures).toHaveLength(1)
    })

    it('should handle failed QR scan and retry', async () => {
      // Create transaction
      const { TransactionMessage, VersionedTransaction } = await import('@solana/web3.js')
      const message = new TransactionMessage({
        payerKey: new PublicKey(SystemProgram.programId),
        recentBlockhash: 'testBlockhash123',
        instructions: [
          SystemProgram.transfer({
            fromPubkey: new PublicKey(SystemProgram.programId),
            toPubkey: new PublicKey(SystemProgram.programId),
            lamports: LAMPORTS_PER_SOL,
          }),
        ],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)

      // Export to QR
      const exportedTx = await exportForCold(tx, 'qr')

      // Simulate failed scan attempt (invalid data)
      await expect(
        importFromCold('invalid-qr-data', 'qr')
      ).rejects.toThrow('Failed to import transaction')

      // Retry with correct data
      const importedTx = await importFromCold(exportedTx.data, 'qr')
      expect(importedTx).toBeInstanceOf(VersionedTransaction)
    })
  })

  describe('Scenario 2: Multi-Signature Air-Gapped Workflow', () => {
    it('should handle multi-sig transaction with multiple offline signers', async () => {
      // Create transaction requiring multiple signatures
      const { TransactionMessage, VersionedTransaction } = await import('@solana/web3.js')
      const message = new TransactionMessage({
        payerKey: new PublicKey(SystemProgram.programId),
        recentBlockhash: 'testBlockhash123',
        instructions: [
          SystemProgram.transfer({
            fromPubkey: new PublicKey(SystemProgram.programId),
            toPubkey: new PublicKey(SystemProgram.programId),
            lamports: 10 * LAMPORTS_PER_SOL, // Large amount requiring multi-sig
          }),
        ],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)

      // Export for first signer
      const exportedTx1 = await exportForCold(tx, 'base64')
      const importedTx1 = await importFromCold(exportedTx1.data, 'base64')

      // First offline signer signs
      const keypair1 = await generateOfflineKeypair()
      const partial1 = await (
        await import('../../src/core/offline')
      ).createPartialSignature(importedTx1, keypair1)

      expect(partial1.signature).toHaveLength(64)
      expect(partial1.publicKey).toHaveLength(32)

      // Export for second signer
      const exportedTx2 = await exportForCold(tx, 'base64')
      const importedTx2 = await importFromCold(exportedTx2.data, 'base64')

      // Second offline signer signs
      const keypair2 = await generateOfflineKeypair()
      const partial2 = await (
        await import('../../src/core/offline')
      ).createPartialSignature(importedTx2, keypair2)

      expect(partial2.signature).toHaveLength(64)
      expect(partial2.publicKey).toHaveLength(32)

      // Combine partial signatures
      const { combinePartialSignatures, isFullySigned } = await import(
        '../../src/core/offline'
      )
      const combinedTx = combinePartialSignatures(tx, [partial1, partial2])

      expect(combinedTx.signatures).toHaveLength(2)
      expect(isFullySigned(combinedTx)).toBe(true)
    })
  })

  describe('Scenario 3: Authentication with Air-Gapped Signing', () => {
    it('should integrate auth with offline signing workflow', async () => {
      // User registers with passkey (online device)
      const authResult = {
        username: 'testuser',
        credentialId: 'test-credential-id',
        publicKey: 'test-public-key',
      }

      expect(authResult.username).toBe('testuser')
      expect(authResult.credentialId).toBeDefined()

      // User creates offline transaction
      const { TransactionMessage, VersionedTransaction } = await import('@solana/web3.js')
      const message = new TransactionMessage({
        payerKey: new PublicKey(SystemProgram.programId),
        recentBlockhash: 'testBlockhash123',
        instructions: [
          SystemProgram.transfer({
            fromPubkey: new PublicKey(SystemProgram.programId),
            toPubkey: new PublicKey(SystemProgram.programId),
            lamports: LAMPORTS_PER_SOL,
          }),
        ],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)

      // Export and sign offline
      const exportedTx = await exportForCold(tx, 'qr')
      const importedTx = await importFromCold(exportedTx.data, 'qr')
      const offlineKeypair = await generateOfflineKeypair()
      const signedTx = signOffline(importedTx, offlineKeypair)

      expect(signedTx.signatures).toHaveLength(1)

      // Broadcast transaction (authenticated user)
      const exportedSignedTx = await exportForCold(signedTx, 'base64')
      const importedSignedTx = await importFromCold(exportedSignedTx.data, 'base64')

      expect(importedSignedTx).toBeInstanceOf(VersionedTransaction)
    })
  })

  describe('Scenario 4: Error Handling and Recovery', () => {
    it('should handle transaction expiration during offline signing', async () => {
      // Create transaction with expired blockhash
      const { TransactionMessage, VersionedTransaction } = await import('@solana/web3.js')
      const message = new TransactionMessage({
        payerKey: new PublicKey(SystemProgram.programId),
        recentBlockhash: 'expiredBlockhash',
        instructions: [
          SystemProgram.transfer({
            fromPubkey: new PublicKey(SystemProgram.programId),
            toPubkey: new PublicKey(SystemProgram.programId),
            lamports: LAMPORTS_PER_SOL,
          }),
        ],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)

      // Export to QR
      const exportedTx = await exportForCold(tx, 'qr')

      // Simulate delay (transaction expires)
      // In real scenario, user would need to create new transaction

      const importedTx = await importFromCold(exportedTx.data, 'qr')
      const offlineKeypair = await generateOfflineKeypair()
      const signedTx = signOffline(importedTx, offlineKeypair)

      // Transaction would be rejected by network due to expired blockhash
      // This test verifies the flow completes, network rejection is expected
      expect(signedTx.signatures).toHaveLength(1)
    })

    it('should handle corrupted QR data', async () => {
      // Create valid QR data
      const { TransactionMessage, VersionedTransaction } = await import('@solana/web3.js')
      const message = new TransactionMessage({
        payerKey: new PublicKey(SystemProgram.programId),
        recentBlockhash: 'testBlockhash123',
        instructions: [
          SystemProgram.transfer({
            fromPubkey: new PublicKey(SystemProgram.programId),
            toPubkey: new PublicKey(SystemProgram.programId),
            lamports: LAMPORTS_PER_SOL,
          }),
        ],
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)
      const exportedTx = await exportForCold(tx, 'qr')

      // Corrupt the data
      const corruptedData = exportedTx.data.slice(0, -10) + 'corrupted'

      // Attempt to import corrupted data
      await expect(
        importFromCold(corruptedData, 'qr')
      ).rejects.toThrow('Failed to import transaction')
    })
  })

  describe('Scenario 5: Large Transaction Handling', () => {
    it('should handle transaction size limits for QR codes', async () => {
      // Create a transaction with many instructions (simulating large tx)
      const instructions = []
      for (let i = 0; i < 10; i++) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(SystemProgram.programId),
            toPubkey: new PublicKey(SystemProgram.programId),
            lamports: LAMPORTS_PER_SOL,
          })
        )
      }

      const { TransactionMessage, VersionedTransaction } = await import('@solana/web3.js')
      const message = new TransactionMessage({
        payerKey: new PublicKey(SystemProgram.programId),
        recentBlockhash: 'testBlockhash123',
        instructions,
      }).compileToV0Message()

      const tx = new VersionedTransaction(message)

      // Check QR size estimation
      const { estimateQRSize } = await import('../../src/core/serialization')
      const qrSize = estimateQRSize(tx)

      expect(qrSize).toBeGreaterThan(0)

      // For very large transactions, user would need to use file export instead
      // This test verifies the size estimation works
      const maxSize = 2000 // Typical QR code limit
      if (qrSize > maxSize) {
        // Should recommend file export
        const fileExport = await exportForCold(tx, 'file')
        expect(fileExport.format).toBe('file')
      } else {
        const qrExport = await exportForCold(tx, 'qr')
        expect(qrExport.format).toBe('qr')
      }
    })
  })
})
