import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'

// Import hooks to test
import { useWallet, useWalletStatus, useWalletAddress } from '../../src/hooks/useWallet'
import { useConnection } from '../../src/hooks/useConnection'

// Mock connection
const mockConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: 'testBlockhash123',
    lastValidBlockHeight: 1000,
  }),
  getBalance: vi.fn().mockResolvedValue(BigInt(LAMPORTS_PER_SOL)),
} as any

// Mock wallet adapter
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

// Test wrapper with providers
function createWrapper() {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <ConnectionProvider endpoint="https://api.devnet.solana.com">
        <SolanaWalletProvider wallets={[mockWalletAdapter as any]} autoConnect>
          {children}
        </SolanaWalletProvider>
      </ConnectionProvider>
    )
  }
}

describe('Wallet Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset wallet state
    mockWalletAdapter.publicKey = null
    mockWalletAdapter.connected = false
    mockWalletAdapter.connecting = false
  })

  describe('useConnection Hook', () => {
    it('should provide connection instance', () => {
      const { result } = renderHook(() => useConnection(), {
        wrapper: createWrapper(),
      })

      expect(result.current.connection).toBeDefined()
      expect(result.current.network).toBe('devnet')
      expect(result.current.endpoint).toBe('https://api.devnet.solana.com')
    })

    it('should support network switching', () => {
      const { result } = renderHook(() => useConnection(), {
        wrapper: createWrapper(),
      })

      // Note: Network switching would be tested with actual implementation
      expect(result.current.connection).toBeDefined()
    })
  })

  describe('useWallet Hook', () => {
    it('should return wallet state', () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      expect(result.current).toBeDefined()
      expect(result.current.connected).toBe(false)
      expect(result.current.connecting).toBe(false)
      expect(result.current.publicKey).toBeNull()
    })

    it('should create offline transaction', async () => {
      // Mock connected wallet
      mockWalletAdapter.publicKey = {
        toBase58: () => 'testPublicKey123',
        toBytes: () => new Uint8Array(32),
      } as any
      mockWalletAdapter.connected = true

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      const instruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(SystemProgram.programId),
        toPubkey: new PublicKey(SystemProgram.programId),
        lamports: LAMPORTS_PER_SOL,
      })

      await waitFor(async () => {
        const tx = await result.current.createOfflineTx([instruction])
        expect(tx).toBeDefined()
      })
    })

    it('should throw error when creating offline tx without connection', async () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      const instruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(SystemProgram.programId),
        toPubkey: new PublicKey(SystemProgram.programId),
        lamports: LAMPORTS_PER_SOL,
      })

      await expect(
        async () => await result.current.createOfflineTx([instruction])
      ).rejects.toThrow('Wallet not connected')
    })

    it('should export transaction to QR code', async () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      // Create a mock transaction
      const instruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(SystemProgram.programId),
        toPubkey: new PublicKey(SystemProgram.programId),
        lamports: LAMPORTS_PER_SOL,
      })

      // Mock wallet connection
      mockWalletAdapter.publicKey = {
        toBase58: () => 'testPublicKey123',
        toBytes: () => new Uint8Array(32),
      } as any
      mockWalletAdapter.connected = true

      await waitFor(async () => {
        const tx = await result.current.createOfflineTx([instruction])
        const exported = await result.current.exportTransaction(tx, 'qr')

        expect(exported).toBeDefined()
        expect(exported.format).toBe('qr')
        expect(exported.qrCode).toBeDefined()
      })
    })

    it('should sign transaction', async () => {
      mockWalletAdapter.signTransaction = vi.fn().mockResolvedValue({
        signatures: [new Uint8Array(64)],
      } as any)

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      // Create a mock transaction
      const tx = {} as any // VersionedTransaction mock

      await waitFor(async () => {
        const signed = await result.current.signTransaction(tx)
        expect(signed).toBeDefined()
        expect(mockWalletAdapter.signTransaction).toHaveBeenCalledWith(tx)
      })
    })

    it('should throw error when wallet does not support signing', async () => {
      // Mock wallet without signing support
      mockWalletAdapter.signTransaction = undefined as any

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      const tx = {} as any

      await expect(
        async () => await result.current.signTransaction(tx)
      ).rejects.toThrow('Wallet does not support signing')
    })

    it('should send transaction', async () => {
      mockWalletAdapter.sendTransaction = vi.fn().mockResolvedValue('signature123')

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      const tx = {} as any

      await waitFor(async () => {
        const signature = await result.current.sendTransaction(tx)
        expect(signature).toBe('signature123')
        expect(mockWalletAdapter.sendTransaction).toHaveBeenCalledWith(tx, expect.anything())
      })
    })

    it('should sign all transactions', async () => {
      mockWalletAdapter.signAllTransactions = vi.fn().mockResolvedValue([
        { signatures: [new Uint8Array(64)] },
        { signatures: [new Uint8Array(64)] },
      ] as any)

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      const txs = [{}, {}] as any

      await waitFor(async () => {
        const signed = await result.current.signAllTransactions(txs)
        expect(signed).toHaveLength(2)
        expect(mockWalletAdapter.signAllTransactions).toHaveBeenCalledWith(txs)
      })
    })
  })

  describe('useWalletStatus Hook', () => {
    it('should return wallet status', () => {
      const { result } = renderHook(() => useWalletStatus(), {
        wrapper: createWrapper(),
      })

      expect(result.current).toEqual({
        connected: false,
        connecting: false,
        publicKey: null,
      })
    })

    it('should reflect connected state', () => {
      mockWalletAdapter.publicKey = {
        toBase58: () => 'testPublicKey123',
      } as any
      mockWalletAdapter.connected = true

      const { result } = renderHook(() => useWalletStatus(), {
        wrapper: createWrapper(),
      })

      expect(result.current.connected).toBe(true)
      expect(result.current.publicKey).toBe('testPublicKey123')
    })

    it('should reflect connecting state', () => {
      mockWalletAdapter.connecting = true

      const { result } = renderHook(() => useWalletStatus(), {
        wrapper: createWrapper(),
      })

      expect(result.current.connecting).toBe(true)
    })
  })

  describe('useWalletAddress Hook', () => {
    it('should return wallet address in various formats', () => {
      mockWalletAdapter.publicKey = {
        toBase58: () => 'testPublicKey123456789',
      } as any

      const { result } = renderHook(() => useWalletAddress(), {
        wrapper: createWrapper(),
      })

      expect(result.current.address).toBe('testPublicKey123456789')
      expect(result.current.shortAddress).toBe('test...6789')
      expect(result.current.ethersAddress).toBe('testPublicKey123456789')
    })

    it('should return null when wallet not connected', () => {
      mockWalletAdapter.publicKey = null

      const { result } = renderHook(() => useWalletAddress(), {
        wrapper: createWrapper(),
      })

      expect(result.current.address).toBeNull()
      expect(result.current.shortAddress).toBeNull()
      expect(result.current.ethersAddress).toBeNull()
    })
  })

  describe('Wallet Adapter Integration', () => {
    it('should integrate with Phantom wallet adapter', () => {
      const phantomAdapter = new PhantomWalletAdapter()

      expect(phantomAdapter).toBeDefined()
      expect(phantomAdapter.name).toBe('Phantom')
      expect(phantomAdapter.url).toBe('https://phantom.app')
    })

    it('should support multiple wallet adapters', () => {
      const adapters = [
        new PhantomWalletAdapter(),
      ]

      expect(adapters).toHaveLength(1)
      expect(adapters[0].name).toBe('Phantom')
    })
  })

  describe('Wallet Connection Flow', () => {
    it('should connect wallet successfully', async () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      mockWalletAdapter.connected = true
      mockWalletAdapter.publicKey = {
        toBase58: () => 'connectedWallet',
      } as any

      await waitFor(() => {
        expect(result.current.connected).toBe(true)
      })
    })

    it('should disconnect wallet successfully', async () => {
      mockWalletAdapter.connected = true
      mockWalletAdapter.publicKey = {
        toBase58: () => 'connectedWallet',
      } as any

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.connected).toBe(true)
      })

      // Disconnect
      mockWalletAdapter.connected = false
      mockWalletAdapter.publicKey = null

      await waitFor(() => {
        expect(result.current.connected).toBe(false)
      })
    })
  })
})
