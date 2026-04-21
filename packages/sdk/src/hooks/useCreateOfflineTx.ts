import { useState, useCallback } from 'react'
import type { VersionedTransaction, TransactionInstruction } from '@solana/web3.js'
import { useWallet } from './useWallet.js'
import { useConnection } from './useConnection.js'
import { createUnsignedTxMessage, exportForCold, importFromCold } from '../core/index.js'

/**
 * Transaction builder state
 */
export interface TxBuilderState {
  instructions: TransactionInstruction[]
  memo?: string
  feePayer?: string
  recentBlockhash?: string
}

/**
 * Enhanced hook for creating offline transactions
 * Provides full transaction builder functionality with export options
 *
 * @example
 * ```typescript
 * function TxCreator() {
 *   const {
 *     builder,
 *     addInstruction,
 *     removeInstruction,
 *     clearInstructions,
 *     createTransaction,
 *     exportTransaction,
 *     transaction,
 *     qrCode,
 *     loading,
 *     error
 *   } = useCreateOfflineTx()
 *
 *   return (
 *     <div>
 *       <button onClick={() => addInstruction(instruction)}>Add Instruction</button>
 *       <button onClick={createTransaction}>Create TX</button>
 *       <button onClick={() => exportTransaction('qr')}>Export QR</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCreateOfflineTx() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [builder, setBuilder] = useState<TxBuilderState>({
    instructions: [],
  })
  const [transaction, setTransaction] = useState<VersionedTransaction | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Add an instruction to the transaction builder
   */
  const addInstruction = useCallback((instruction: TransactionInstruction) => {
    setBuilder((prev) => ({
      ...prev,
      instructions: [...prev.instructions, instruction],
    }))
  }, [])

  /**
   * Remove an instruction by index
   */
  const removeInstruction = useCallback((index: number) => {
    setBuilder((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }))
  }, [])

  /**
   * Clear all instructions
   */
  const clearInstructions = useCallback(() => {
    setBuilder({ instructions: [] })
  }, [])

  /**
   * Set the fee payer
   */
  const setFeePayer = useCallback((feePayer: string) => {
    setBuilder((prev) => ({ ...prev, feePayer }))
  }, [])

  /**
   * Set a memo (note) for the transaction
   */
  const setMemo = useCallback((memo: string) => {
    setBuilder((prev) => ({ ...prev, memo }))
  }, [])

  /**
   * Create an unsigned transaction from the builder state
   */
  const createTransaction = useCallback(
    async (options?: { blockhash?: string; lastValidBlockHeight?: number }) => {
      if (!publicKey) {
        setError(new Error('Wallet not connected'))
        return
      }

      if (builder.instructions.length === 0) {
        setError(new Error('No instructions to create transaction'))
        return
      }

      setLoading(true)
      setError(null)

      try {
        const txOptions: { blockhash?: string; lastValidBlockHeight?: number } = {}
        if (options?.blockhash) txOptions.blockhash = options.blockhash
        if (options?.lastValidBlockHeight) txOptions.lastValidBlockHeight = options.lastValidBlockHeight

        const tx = await createUnsignedTxMessage(
          builder.instructions,
          connection,
          publicKey,
          txOptions
        )
        setTransaction(tx)
        setQrCode(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create transaction'))
        setTransaction(null)
      } finally {
        setLoading(false)
      }
    },
    [builder.instructions, connection, publicKey]
  )

  /**
   * Export transaction for cold storage
   */
  const exportTransaction = useCallback(
    async (format: 'qr' | 'base64' | 'file' = 'qr') => {
      if (!transaction) {
        setError(new Error('No transaction to export'))
        return
      }

      setLoading(true)
      setError(null)

      try {
        const exported = await exportForCold(transaction, format)

        if (format === 'qr' && 'qrCode' in exported) {
          setQrCode(exported.qrCode || null)
        }

        return exported
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to export transaction'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [transaction]
  )

  /**
   * Import transaction from cold storage
   */
  const importTransaction = useCallback(
    async (data: string, format: 'qr' | 'base64' | 'file' = 'qr') => {
      setLoading(true)
      setError(null)

      try {
        const tx = await importFromCold(data, format)
        setTransaction(tx)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to import transaction'))
        setTransaction(null)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setBuilder({ instructions: [] })
    setTransaction(null)
    setQrCode(null)
    setError(null)
  }, [])

  return {
    // Builder state
    builder,
    instructions: builder.instructions,
    memo: builder.memo,
    feePayer: builder.feePayer,

    // Builder actions
    addInstruction,
    removeInstruction,
    clearInstructions,
    setFeePayer,
    setMemo,

    // Transaction actions
    createTransaction,
    exportTransaction,
    importTransaction,
    reset,

    // Current state
    transaction,
    qrCode,
    loading,
    error,
  }
}

/**
 * Hook for building and signing transactions offline
 * Combines useCreateOfflineTx with signing capabilities
 */
export function useOfflineSigning() {
  const {
    transaction,
    exportTransaction,
    importTransaction,
    reset,
    loading,
    error,
  } = useCreateOfflineTx()
  const [signedTx] = useState<Uint8Array | null>(null)
  const [, setError] = useState<Error | null>(null)
  const [, setLoading] = useState(false)

  /**
   * Sign transaction with wallet (online mode)
   */
  const signWithWallet = useCallback(async () => {
    if (!transaction) {
      setError(new Error('No transaction to sign'))
      return null
    }

    setLoading(true)

    try {
      // This would integrate with the wallet's signTransaction
      // For now, we'll export the unsigned transaction
      const exported = await exportTransaction('base64')
      return exported
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign transaction'))
      return null
    } finally {
      setLoading(false)
    }
  }, [transaction, exportTransaction])

  /**
   * Sign transaction offline (simulated - actual signing happens in offline signer)
   */
  const signOffline = useCallback(() => {
    if (!transaction) {
      setError(new Error('No transaction to sign'))
      return
    }

    // Export for offline signing
    exportTransaction('qr')
  }, [transaction, exportTransaction])

  /**
   * Import signed transaction
   */
  const importSigned = useCallback(
    async (data: string) => {
      setLoading(true)

      try {
        await importTransaction(data, 'base64')
        // Note: The actual transaction handling would be done by the hook
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to import signed transaction'))
      } finally {
        setLoading(false)
      }
    },
    [importTransaction]
  )

  return {
    transaction,
    exportTransaction,
    importTransaction,
    reset,
    signedTx,
    loading,
    error,
    signWithWallet,
    signOffline,
    importSigned,
  }
}
