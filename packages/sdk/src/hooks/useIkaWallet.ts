import { useState, useCallback } from 'react'

/**
 * Ika dWallet integration hooks (PRE-ALPHA)
 * These hooks are prepared for when Ika devnet launches (early Q2 2026)
 *
 * @see https://ika.xyz
 * @see https://docs.ika.xyz
 * @see https://github.com/dwallet-labs/encrypt-pre-alpha
 */

/**
 * Ika dWallet state
 */
export interface IkaWalletState {
  address: string | null
  isConnected: boolean
  isInitialized: boolean
}

/**
 * Ika transaction options
 */
export interface IkaTransactionOptions {
  network?: 'mainnet' | 'testnet' | 'devnet'
  nonce?: string
}

/**
 * Hook for Ika dWallet integration
 * This hook provides a future-proof interface for when Ika devnet launches
 *
 * @example
 * ```typescript
 * function IkaComponent() {
 *   const {
 *     address,
 *     isConnected,
 *     initializeWallet,
 *     createDWallet,
 *     signTransaction
 *   } = useIkaWallet()
 *
 *   // When Ika devnet is live, these will work
 *   return <div>{address || 'Not connected'}</div>
 * }
 * ```
 */
export function useIkaWallet() {
  const [state, setState] = useState<IkaWalletState>({
    address: null,
    isConnected: false,
    isInitialized: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Initialize Ika SDK
   *
   * TODO: When Ika devnet launches (early Q2 2026):
   * 1. Install: npm install @ika.xyz/sdk
   * 2. Import: import { IkaClient } from '@ika.xyz/sdk'
   * 3. Initialize: const client = new IkaClient({ apiKey: 'YOUR_KEY' })
   */
  const initializeWallet = useCallback(async (_config: { apiKey?: string } = {}) => {
    setLoading(true)
    setError(null)

    try {
      // Check if Ika SDK is available
      if (typeof window === 'undefined' || !(window as any).IkaClient) {
        setError(
          new Error(
            'Ika SDK not available. Install with: npm install @ika.xyz/sdk\n' +
              'Ika devnet expected early Q2 2026. See https://ika.xyz for updates.'
          )
        )
        return false
      }

      // TODO: When Ika SDK is available:
      // const IkaClient = (window as any).IkaClient
      // const client = new IkaClient(config)
      // const account = await client.initialize()
      // setState({ address: account.address, isConnected: true, isInitialized: true })

      setState((prev) => ({ ...prev, isInitialized: true }))
      return true
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to initialize Ika wallet')
      )
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Create a new dWallet
   *
   * TODO: When Ika devnet launches:
   * 1. Generate key shares using MPC
   * 2. Distribute shares to authorized devices
   * 3. Return dWallet address
   */
  const createDWallet = useCallback(
    async (_options: {
      threshold?: number
      shares?: number
      metadata?: Record<string, unknown>
    } = {}
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      // Check if Ika is initialized
      if (!state.isInitialized) {
        setError(new Error('Ika wallet not initialized. Call initializeWallet() first.'))
        return null
      }

      // TODO: When Ika SDK is available:
      // const client = getIkaClient()
      // const dWallet = await client.createDWallet(options)
      // setState((prev) => ({ ...prev, address: dWallet.address, isConnected: true }))
      // return dWallet.address

      // Placeholder for future implementation
      const placeholderAddress = generatePlaceholderDWalletAddress()
      setState((prev) => ({ ...prev, address: placeholderAddress, isConnected: true }))

      return placeholderAddress
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create dWallet'))
      return null
    } finally {
      setLoading(false)
    }
  }, [state.isInitialized])

  /**
   * Sign transaction with dWallet
   *
   * TODO: When Ika devnet launches:
   * 1. Collect threshold key shares
   * 2. Perform MPC signing operation
   * 3. Return combined signature
   */
  const signTransaction = useCallback(
    async (_transaction: unknown, _options: IkaTransactionOptions = {}): Promise<Uint8Array | null> => {
      setLoading(true)
      setError(null)

      try {
        // Check if wallet is connected
        if (!state.isConnected || !state.address) {
          setError(new Error('No dWallet connected. Create or connect a dWallet first.'))
          return null
        }

        // TODO: When Ika SDK is available:
        // const client = getIkaClient()
        // const signature = await client.signTransaction(transaction, options)
        // return signature

        // Placeholder signature (all zeros for now)
        const placeholderSignature = new Uint8Array(64)
        return placeholderSignature
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to sign transaction'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [state.isConnected, state.address]
  )

  /**
   * Disconnect dWallet
   */
  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isInitialized: false,
    })
  }, [])

  return {
    // State
    ...state,
    loading,
    error,

    // Actions
    initializeWallet,
    createDWallet,
    signTransaction,
    disconnect,
  }
}

/**
 * Hook for Ika dWallet transaction signing
 * Provides a clean interface for signing with dWallets
 */
export function useIkaSigning() {
  const { signTransaction, ...ikaWallet } = useIkaWallet()
  const [pendingTx, setPendingTx] = useState<unknown | null>(null)
  const [signature, setSignature] = useState<Uint8Array | null>(null)

  /**
   * Prepare transaction for signing
   */
  const prepareTransaction = useCallback((tx: unknown) => {
    setPendingTx(tx)
    setSignature(null)
  }, [])

  /**
   * Sign prepared transaction
   */
  const signPrepared = useCallback(
    async (options: IkaTransactionOptions = {}): Promise<Uint8Array | null> => {
      if (!pendingTx) {
        return null
      }

      const sig = await signTransaction(pendingTx, options)
      if (sig) {
        setSignature(sig)
      }

      return sig
    },
    [pendingTx, signTransaction]
  )

  /**
   * Clear pending transaction
   */
  const clear = useCallback(() => {
    setPendingTx(null)
    setSignature(null)
  }, [])

  return {
    ...ikaWallet,
    pendingTx,
    signature,
    prepareTransaction,
    signPrepared,
    clear,
  }
}

/**
 * Hook for hybrid wallet (Solana + Ika dWallet)
 * Allows seamless switching between native Solana keypairs and dWallets
 */
export function useHybridWallet() {
  const [useDWallet, setUseDWallet] = useState(false)
  const ikaWallet = useIkaWallet()
  const solanaWallet = useIkaSigning() // Reuse for now

  /**
   * Toggle between dWallet and native Solana
   */
  const toggleWalletType = useCallback(() => {
    setUseDWallet((prev) => !prev)
  }, [])

  /**
   * Get current wallet address
   */
  const getAddress = useCallback((): string | null => {
    return useDWallet ? ikaWallet.address : solanaWallet.address
  }, [useDWallet, ikaWallet.address, solanaWallet.address])

  /**
   * Sign transaction with current wallet type
   */
  const signWithCurrent = useCallback(
    async (tx: unknown): Promise<Uint8Array | null> => {
      if (useDWallet) {
        return ikaWallet.signTransaction(tx)
      } else {
        // For now, use Ika wallet signing
        // In production, this would use native Solana signing
        return ikaWallet.signTransaction(tx)
      }
    },
    [useDWallet, ikaWallet]
  )

  return {
    // State
    useDWallet,
    address: getAddress(),
    isReady: useDWallet ? ikaWallet.isInitialized : true,

    // Actions
    toggleWalletType,
    signWithCurrent,

    // Wallet-specific
    ikaWallet,
    solanaWallet,
  }
}

/**
 * Generate a placeholder dWallet address (for demo/testing)
 * This will be replaced with actual Ika addresses when devnet launches
 */
function generatePlaceholderDWalletAddress(): string {
  // Generate a Solana-like address for demo purposes
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''

  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `dWallet_${result}`
}

/**
 * Check if Ika devnet is available
 *
 * TODO: Remove this check when Ika devnet launches (early Q2 2026)
 * Check https://ika.xyz for launch updates
 */
export function isIkaAvailable(): boolean {
  return false // Will return true when Ika devnet is live
}

/**
 * Get Ika SDK version (when available)
 *
 * TODO: Return actual version when Ika SDK is installed
 */
export function getIkaVersion(): string {
  return 'Coming Q2 2026'
}
