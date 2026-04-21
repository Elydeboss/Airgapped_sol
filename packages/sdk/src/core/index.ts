// Core transaction utilities
export {
  createUnsignedTxMessage,
  getLastValidBlockHeight,
  isTransactionValid,
  getBlockhash,
  createTxWithNonce,
  prepareForOfflineSigning,
  getTransactionMetadata,
} from './transaction.js'

// Serialization utilities
export {
  exportForCold,
  importFromCold,
  generateQRCode,
  estimateQRSize,
  isValidBase58,
  transactionToJSON,
  transactionFromJSON,
} from './serialization.js'

// Offline signing utilities
export {
  signOffline,
  signOfflineWithSecretKey,
  createPartialSignature,
  combinePartialSignatures,
  verifySignature,
  extractSignatures,
  isFullySigned,
  generateOfflineKeypair,
  validateKeypair,
} from './offline.js'

// Connection utilities
export {
  createConnection,
  getRecentBlockhash,
  clearBlockhashCache,
  createNetworkConnection,
  switchNetwork,
  getBalance,
  getAccountInfo,
  accountExists,
  getCurrentSlot,
  waitForConfirmation,
  sendAndConfirm,
  estimateFee,
  getEndpoint,
  validateEndpoint,
  getNetworkFromEndpoint,
  HELIUS_ENDPOINTS,
} from './connection.js'

// Key management utilities
export {
  generateKeypair,
  deriveKeypairFromPasskey,
  storeEncryptedKeypair,
  loadEncryptedKeypair,
  deleteKeypair,
  listStoredKeypairs,
  encryptData,
  decryptData,
  isWebAuthnAvailable,
  isSecureContext,
} from './keys.js'

// Authentication utilities
export {
  registerPasskey,
  authenticateWithPasskey,
  createUserSession,
  loadUserSession,
  updateSessionActivity,
  clearUserSession,
  getActiveSession,
  signOut as signOutUser,
} from './auth.js'

// Re-export types from core
export type {
  ColdTxExport,
  ColdTxExportOptions,
  ColdTxFormat,
  CreateTxOptions,
  PartialSignature,
  WalletState,
  ConnectionState,
  Commitment,
  Network,
  RpcEndpoint,
  TransactionResult,
  BlockhashWithExpiryBlockHeight,
} from '../types/index.js'

// Re-export authentication types
export type {
  UserSession,
  PasskeyRegistrationOptions,
  PasskeyAuthenticationOptions,
} from './auth.js'

// Re-export error types
export { OfflineSignError, ErrorCode } from '../types/index.js'
