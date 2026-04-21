import { useState, useCallback } from 'react'
import type { VersionedTransaction, ColdTxExport } from '../types/index.js'
import type { TransactionInstruction } from '@solana/web3.js'
import {
  createUnsignedTxMessage,
  exportForCold,
  importFromCold,
} from '../core/index.js'
import { useWallet } from './useWallet.js'
import { useConnection } from './useConnection.js'

/**
 * Hook for creating and managing offline transactions
 * Provides full workflow for air-gapped signing
 *
 * @example
 * ```typescript
 * function OfflineTxCreator() {
 *   const {
 *     createTx,
 *     exportTx,
 *     importTx,
 *     tx,
 *     export,
 *     loading,
 *     error
 *   } = useOfflineTx()
 *
 *   const handleCreate = async () => {
 *     await createTx([instruction])
 *     await exportTx('qr')
 *   }
 *
 *   return <button onClick={handleCreate} disabled={loading}>
 *     {loading ? 'Creating...' : 'Create Offline TX'}
 *   </button>
 * }
 * ```
 */
export function useOfflineTx() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [tx, setTx] = useState<VersionedTransaction | null>(null)
  const [txExport, setTxExport] = useState<ColdTxExport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Create an unsigned transaction
   */
  const createTx = useCallback(
    async (instructions: TransactionInstruction[], options?: { nonce?: string }) => {
      if (!publicKey) {
        setError(new Error('Wallet not connected'))
        return
      }

      setLoading(true)
      setError(null)

      try {
        const transaction = await createUnsignedTxMessage(
          instructions,
          connection,
          publicKey,
          options
        )
        setTx(transaction)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create transaction'))
        setTx(null)
      } finally {
        setLoading(false)
      }
    },
    [connection, publicKey]
  )

  /**
   * Export transaction for cold storage
   */
  const exportTx = useCallback(
    async (format: 'qr' | 'base64' | 'file' = 'qr') => {
      if (!tx) {
        setError(new Error('No transaction to export'))
        return
      }

      setLoading(true)
      setError(null)

      try {
        const exported = await exportForCold(tx, format)
        setTxExport(exported)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to export transaction'))
        setTxExport(null)
      } finally {
        setLoading(false)
      }
    },
    [tx]
  )

  /**
   * Import transaction from cold storage
   */
  const importTx = useCallback(
    async (data: string, format: 'qr' | 'base64' | 'file' = 'qr') => {
      setLoading(true)
      setError(null)

      try {
        const transaction = await importFromCold(data, format)
        setTx(transaction)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to import transaction'))
        setTx(null)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setTx(null)
    setTxExport(null)
    setError(null)
  }, [])

  return {
    tx,
    export: txExport,
    loading,
    error,
    createTx,
    exportTx,
    importTx,
    reset,
  }
}

/**
 * Hook for QR code workflow
 * Simplified interface for QR-based air-gapped signing
 */
export function useQRWorkflow() {
  const { tx, export: txExport, loading, error, createTx, exportTx, importTx, reset } =
    useOfflineTx()

  /**
   * Create and export to QR in one step
   */
  const createAndExportQR = useCallback(
    async (instructions: TransactionInstruction[]) => {
      await createTx(instructions)
      await exportTx('qr')
    },
    [createTx, exportTx]
  )

  /**
   * Get QR code data URL (if available)
   */
  const getQRCodeDataURL = useCallback(() => {
    return txExport && 'qrCode' in txExport ? txExport.qrCode : null
  }, [txExport])

  return {
    tx,
    qrData: txExport?.data || null,
    qrCode: getQRCodeDataURL(),
    loading,
    error,
    createAndExportQR,
    importTx,
    reset,
  }
}
