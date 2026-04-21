import { useMemo, useCallback, useState } from 'react'
import type { Commitment, Network } from '../types/index.js'
import type { Connection } from '@solana/web3.js'
import {
  createConnection as createSolanaConnection,
  createNetworkConnection,
  clearBlockhashCache,
  getBalance,
  getCurrentSlot,
} from '../core/connection.js'

/**
 * Connection state management hook
 * Provides Solana connection with automatic network switching
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { connection, network, setNetwork, connected } = useConnection()
 *
 *   return (
 *     <div>
 *       <select value={network} onChange={(e) => setNetwork(e.target.value as Network)}>
 *         <option value="devnet">Devnet</option>
 *         <option value="mainnet-beta">Mainnet</option>
 *       </select>
 *       <span>Status: {connected ? 'Connected' : 'Disconnected'}</span>
 *     </div>
 *   )
 * }
 * ```
 */
export function useConnection(
  initialEndpoint?: string,
  initialCommitment: Commitment = 'confirmed'
): {
  connection: Connection
  network: Network
  endpoint: string
  commitment: Commitment
  setNetwork: (network: Network) => void
  setEndpoint: (endpoint: string) => void
  setCommitment: (commitment: Commitment) => void
  connected: boolean
  getBalance: (publicKey: string) => Promise<number>
  getCurrentSlot: () => Promise<number>
  clearCache: () => void
} {
  const [network, setNetworkState] = useState<Network>('devnet')
  const [endpoint, setEndpointState] = useState<string>(
    initialEndpoint || 'https://api.devnet.solana.com'
  )
  const [commitment, setCommitmentState] = useState<Commitment>(initialCommitment)
  const [connected, setConnected] = useState(false)

  // Create connection (memoized to avoid recreating)
  const connection = useMemo(() => {
    return createSolanaConnection(endpoint, commitment)
  }, [endpoint, commitment])

  // Check connection status
  const checkConnection = useCallback(async () => {
    try {
      await connection.getVersion()
      setConnected(true)
    } catch {
      setConnected(false)
    }
  }, [connection])

  // Set network
  const setNetwork = useCallback(
    (newNetwork: Network) => {
      setNetworkState(newNetwork)
      setEndpointState(createNetworkConnection(newNetwork, commitment).rpcEndpoint)
      clearBlockhashCache(connection)
    },
    [connection, commitment]
  )

  // Set custom endpoint
  const setEndpoint = useCallback(
    (newEndpoint: string) => {
      setEndpointState(newEndpoint)
      setNetworkState(
        newEndpoint.includes('mainnet')
          ? 'mainnet-beta'
          : newEndpoint.includes('devnet')
            ? 'devnet'
            : newEndpoint.includes('testnet')
              ? 'testnet'
              : newEndpoint.includes('localhost')
                ? 'localnet'
                : 'custom'
      )
      clearBlockhashCache(connection)
    },
    [connection]
  )

  // Set commitment
  const setCommitment = useCallback((newCommitment: Commitment) => {
    setCommitmentState(newCommitment)
  }, [])

  // Get balance wrapper
  const getBalanceWrapper = useCallback(
    async (publicKey: string): Promise<number> => {
      return getBalance(connection, publicKey as unknown as Parameters<typeof getBalance>[1])
    },
    [connection]
  )

  // Get current slot wrapper
  const getCurrentSlotWrapper = useCallback(async (): Promise<number> => {
    return getCurrentSlot(connection)
  }, [connection])

  // Clear cache wrapper
  const clearCacheWrapper = useCallback(() => {
    clearBlockhashCache(connection)
  }, [connection])

  // Check connection on mount and when endpoint changes
  useState(() => {
    checkConnection()
  })

  return {
    connection,
    network,
    endpoint,
    commitment,
    setNetwork,
    setEndpoint,
    setCommitment,
    connected,
    getBalance: getBalanceWrapper,
    getCurrentSlot: getCurrentSlotWrapper,
    clearCache: clearCacheWrapper,
  }
}

/**
 * Simple connection hook for when you don't need full state management
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const connection = useSimpleConnection('mainnet-beta')
 *   // Use connection directly
 * }
 * ```
 */
export function useSimpleConnection(
  network: Network = 'devnet',
  commitment: Commitment = 'confirmed'
): Connection {
  return useMemo(() => createNetworkConnection(network, commitment), [network, commitment])
}

/**
 * Hook to manage connection state
 * Useful for showing connection status in UI
 */
export function useConnectionState(connection: Connection): {
  status: 'connected' | 'disconnected' | 'connecting'
  latency: number | null
} {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [latency, setLatency] = useState<number | null>(null)

  useState(() => {
    let mounted = true

    const checkStatus = async () => {
      const start = performance.now()
      try {
        await connection.getVersion()
        const end = performance.now()

        if (mounted) {
          setStatus('connected')
          setLatency(Math.round(end - start))
        }
      } catch {
        if (mounted) {
          setStatus('disconnected')
          setLatency(null)
        }
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30_000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  })

  return { status, latency }
}
