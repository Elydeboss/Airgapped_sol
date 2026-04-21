// Wallet hooks
export {
  useWallet,
  useWalletStatus,
  useWalletAddress,
  type ExtendedWalletState,
} from './useWallet.js'

// Connection hooks
export {
  useConnection,
  useSimpleConnection,
  useConnectionState,
} from './useConnection.js'

// Offline transaction hooks
export {
  useOfflineTx,
  useQRWorkflow,
} from './useOfflineTx.js'

// Create offline transaction hook
export {
  useCreateOfflineTx,
  useOfflineSigning,
  type TxBuilderState,
} from './useCreateOfflineTx.js'

// Scan partial signature hook
export {
  useScanPartialSignature,
  usePartialSignatures,
  type ScannedTxState,
  type ScanResult,
} from './useScanPartialSignature.js'

// Authentication hooks
export {
  useAuth,
  useWalletOnboarding,
} from './useAuth.js'

// Ika dWallet hooks
export {
  useIkaWallet,
  useIkaSigning,
  useHybridWallet,
  isIkaAvailable,
  getIkaVersion,
  type IkaWalletState,
  type IkaTransactionOptions,
} from './useIkaWallet.js'

// Re-export types from hooks
export type {
  WalletState,
  ConnectionState,
} from '../types/index.js'
