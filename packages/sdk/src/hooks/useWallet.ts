import { useCallback } from 'react'
import type {
  VersionedTransaction,
} from '../types/index.js'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { useConnection } from './useConnection.js'
import { createUnsignedTxMessage, exportForCold } from '../core/index.js'
import { TransactionInstruction } from '@solana/web3.js'

/**
 * Extended wallet hook with OfflineSign utilities
 * Wraps Solana Wallet Adapter with additional air-gapped functionality
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const {
 *     publicKey,
 *     connected,
 *     connect,
 *     disconnect,
 *     createOfflineTx,
 *     exportTransaction
 *   } = useWallet()
 *
 *   return (
 *     <div>
 *       <button onClick={connected ? disconnect : connect}>
 *         {connected ? `${publicKey?.slice(0, 4)}...` : 'Connect Wallet'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWallet() {
  const wallet = useSolanaWallet()
  const { connection } = useConnection()

  /**
   * Create an unsigned transaction for offline signing
   */
  const createOfflineTx = useCallback(
    async (
      instructions: TransactionInstruction[],
      options?: { nonce?: string }
    ): Promise<VersionedTransaction> => {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      return createUnsignedTxMessage(instructions, connection, wallet.publicKey, options)
    },
    [connection, wallet.publicKey]
  )

  /**
   * Export transaction for cold storage (QR/base64)
   */
  const exportTransaction = useCallback(
    async (tx: VersionedTransaction, format: 'qr' | 'base64' | 'file' = 'qr') => {
      return exportForCold(tx, format)
    },
    []
  )

  /**
   * Sign transaction with wallet
   */
  const signTransaction = useCallback(
    async (tx: VersionedTransaction): Promise<VersionedTransaction> => {
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signing')
      }

      return wallet.signTransaction(tx)
    },
    [wallet.signTransaction]
  )

  /**
   * Sign multiple transactions
   */
  const signAllTransactions = useCallback(
    async (txs: VersionedTransaction[]): Promise<VersionedTransaction[]> => {
      if (!wallet.signAllTransactions) {
        throw new Error('Wallet does not support batch signing')
      }

      return wallet.signAllTransactions(txs)
    },
    [wallet.signAllTransactions]
  )

  /**
   * Send and confirm transaction
   */
  const sendTransaction = useCallback(
    async (tx: VersionedTransaction): Promise<string> => {
      if (!wallet.sendTransaction) {
        throw new Error('Wallet does not support sending transactions')
      }

      return wallet.sendTransaction(tx, connection)
    },
    [wallet.sendTransaction, connection]
  )

  return {
    ...wallet,
    createOfflineTx,
    exportTransaction,
    signTransaction,
    signAllTransactions,
    sendTransaction,
  }
}

/**
 * Type for the extended wallet state
 */
export type ExtendedWalletState = ReturnType<typeof useWallet>

/**
 * Hook to get wallet connection status only
 * Lightweight alternative when you only need to check connection
 */
export function useWalletStatus(): {
  connected: boolean
  connecting: boolean
  publicKey: string | null
} {
  const { connected, connecting, publicKey } = useSolanaWallet()

  return {
    connected,
    connecting,
    publicKey: publicKey?.toBase58() || null,
  }
}

/**
 * Hook to get wallet address in various formats
 */
export function useWalletAddress(): {
  address: string | null
  shortAddress: string | null
  ethersAddress: string | null
} {
  const { publicKey } = useSolanaWallet()

  const address = publicKey?.toBase58() || null
  const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null

  return {
    address,
    shortAddress,
    ethersAddress: address,
  }
}
