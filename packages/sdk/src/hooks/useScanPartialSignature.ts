import { useState, useCallback, useRef } from 'react'
import type { VersionedTransaction, TransactionSignature } from '@solana/web3.js'
import { importFromCold } from '../core/index.js'
import { useConnection } from './useConnection.js'

/**
 * Scanned transaction state
 */
export interface ScannedTxState {
  transaction: VersionedTransaction | null
  signature: TransactionSignature | null
  isValid: boolean
  isPartiallySigned: boolean
  isFullySigned: boolean
}

/**
 * Result of scanning a QR code or importing a transaction
 */
export interface ScanResult {
  success: boolean
  data?: string
  error?: string
}

/**
 * Hook for scanning partial signatures and signed transactions
 * Supports QR code scanning, file import, and clipboard paste
 *
 * @example
 * ```typescript
 * function SignatureImporter() {
 *   const {
 *     scanQRCode,
 *     importFromData,
 *     importFromFile,
 *     broadcastTransaction,
 *     state,
 *     loading,
 *     error
 *   } = useScanPartialSignature()
 *
 *   return (
 *     <div>
 *       <button onClick={scanQRCode}>Scan QR</button>
 *       <input type="file" onChange={(e) => importFromFile(e.target.files[0])} />
 *       {state.transaction && <div>Transaction ready to broadcast!</div>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useScanPartialSignature() {
  const { connection } = useConnection()
  const [state, setState] = useState<ScannedTxState>({
    transaction: null,
    signature: null,
    isValid: false,
    isPartiallySigned: false,
    isFullySigned: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Validate if a transaction is properly signed
   */
  const validateTransaction = useCallback((tx: VersionedTransaction) => {
    const signatures = tx.signatures
    const requiredSigs = tx.message.staticAccountKeys.length

    // Count non-zero signatures
    const nonZeroSigs = signatures.filter((sig) => sig.length > 0).length

    return {
      isValid: nonZeroSigs > 0,
      isPartiallySigned: nonZeroSigs > 0 && nonZeroSigs < requiredSigs,
      isFullySigned: nonZeroSigs >= requiredSigs,
    }
  }, [])

  /**
   * Import transaction from string data (QR code, base64, etc.)
   */
  const importFromData = useCallback(
    async (data: string, format: 'qr' | 'base64' | 'file' = 'qr'): Promise<ScanResult> => {
      setLoading(true)
      setError(null)

      try {
        const tx = await importFromCold(data, format)
        const validation = validateTransaction(tx)

        setState({
          transaction: tx,
          signature: null,
          ...validation,
        })

        return {
          success: true,
          data,
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to import transaction'
        setError(new Error(errorMsg))

        return {
          success: false,
          error: errorMsg,
        }
      } finally {
        setLoading(false)
      }
    },
    [validateTransaction]
  )

  /**
   * Note: QR code scanning requires the html5-qrcode library
   * This feature should be implemented in the consuming application
   * Use the importFromData method with the scanned QR code data
   */

  /**
   * Import transaction from file
   */
  const importFromFile = useCallback(
    async (file: File): Promise<ScanResult> => {
      setLoading(true)
      setError(null)

      try {
        const text = await file.text()
        return await importFromData(text, 'file')
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to read file'
        setError(new Error(errorMsg))

        return {
          success: false,
          error: errorMsg,
        }
      } finally {
        setLoading(false)
      }
    },
    [importFromData]
  )

  /**
   * Import from clipboard
   */
  const importFromClipboard = useCallback(async (): Promise<ScanResult> => {
    setLoading(true)
    setError(null)

    try {
      const text = await navigator.clipboard.readText()
      return await importFromData(text, 'base64')
    } catch (err) {
      const errorMsg = 'Failed to read from clipboard. Please check permissions.'
      setError(new Error(errorMsg))

      return {
        success: false,
        error: errorMsg,
      }
    } finally {
      setLoading(false)
    }
  }, [importFromData])

  /**
   * Broadcast transaction to network
   */
  const broadcastTransaction = useCallback(async (): Promise<string | null> => {
    if (!state.transaction || !state.isFullySigned) {
      setError(new Error('Transaction must be fully signed before broadcasting'))
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const signature = await connection.sendTransaction(state.transaction)

      setState((prev) => ({
        ...prev,
        signature,
      }))

      return signature
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to broadcast transaction'
      setError(new Error(errorMsg))

      return null
    } finally {
      setLoading(false)
    }
  }, [state.transaction, state.isFullySigned, connection])

  /**
   * Simulate QR code scan (for testing without camera)
   */
  const simulateScan = useCallback((data: string): ScanResult => {
    importFromData(data, 'qr')
    return {
      success: true,
      data,
    }
  }, [importFromData])

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      transaction: null,
      signature: null,
      isValid: false,
      isPartiallySigned: false,
      isFullySigned: false,
    })
    setError(null)
  }, [])

  /**
   * Trigger file input click
   */
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    // State
    state,
    transaction: state.transaction,
    signature: state.signature,
    isValid: state.isValid,
    isPartiallySigned: state.isPartiallySigned,
    isFullySigned: state.isFullySigned,

    // Import methods
    importFromData,
    importFromFile,
    importFromClipboard,
    simulateScan,

    // Broadcast
    broadcastTransaction,

    // Utilities
    reset,
    triggerFileInput,
    fileInputRef,

    // Loading state
    loading,
    error,
  }
}

/**
 * Hook for managing multiple partial signatures (multi-sig)
 * Useful for future Ika dWallet integration
 */
export function usePartialSignatures() {
  const [partialSigs, setPartialSigs] = useState<Map<string, Uint8Array>>(new Map())
  const [loading] = useState(false)
  const [error] = useState<Error | null>(null)

  /**
   * Add a partial signature
   */
  const addPartialSignature = useCallback((publicKey: string, signature: Uint8Array) => {
    setPartialSigs((prev) => new Map(prev).set(publicKey, signature))
  }, [])

  /**
   * Remove a partial signature
   */
  const removePartialSignature = useCallback((publicKey: string) => {
    setPartialSigs((prev) => {
      const next = new Map(prev)
      next.delete(publicKey)
      return next
    })
  }, [])

  /**
   * Check if we have all required signatures
   */
  const hasAllSignatures = useCallback(
    (requiredSigners: string[]): boolean => {
      return requiredSigners.every((signer) => partialSigs.has(signer))
    },
    [partialSigs]
  )

  /**
   * Get missing signatures
   */
  const getMissingSignatures = useCallback(
    (requiredSigners: string[]): string[] => {
      return requiredSigners.filter((signer) => !partialSigs.has(signer))
    },
    [partialSigs]
  )

  /**
   * Clear all partial signatures
   */
  const clear = useCallback(() => {
    setPartialSigs(new Map())
  }, [])

  return {
    partialSigs,
    addPartialSignature,
    removePartialSignature,
    hasAllSignatures,
    getMissingSignatures,
    clear,
    loading,
    error,
  }
}
