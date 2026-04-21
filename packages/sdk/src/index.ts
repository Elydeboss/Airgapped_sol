/**
 * @airgapped-priv/sdk
 *
 * Non-custodial, air-gapped Solana SDK with zero vendor lock-in
 *
 * @example
 * ```typescript
 * import {
 *   createUnsignedTxMessage,
 *   exportForCold,
 *   signOffline,
 *   useWallet
 * } from '@airgapped-priv/sdk'
 * ```
 */

// Core utilities
export * from './core/index.js'

// React hooks
export * from './hooks/index.js'

// Types
export * from './types/index.js'

// Version
export const VERSION = '0.1.0' as const

/**
 * SDK metadata
 */
export const metadata = {
  name: '@airgapped-priv/sdk',
  version: '0.1.0',
  description: 'Non-custodial, air-gapped Solana SDK',
  homepage: 'https://github.com/airgapped-priv/sdk',
  license: 'MIT',
} as const
