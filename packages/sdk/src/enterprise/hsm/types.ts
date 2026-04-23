import type { Keypair, VersionedTransaction } from '@solana/web3.js'

/**
 * Hardware Security Module (HSM) integration types
 */

export type HSMType = 'yubikey' | 'nitrokey' | 'tpm' | 'cloud' | 'software'

export interface HSMProvider {
  type: HSMType
  name: string
  version: string
  connected: boolean

  // Key management
  generateKey(): Promise<Keypair>
  importKey(keyData: Uint8Array): Promise<Keypair>
  exportKey(keyId: string): Promise<Uint8Array>
  deleteKey(keyId: string): Promise<void>
  listKeys(): Promise<HSMKey[]>

  // Signing operations
  sign(transaction: VersionedTransaction): Promise<VersionedTransaction>
  signMessage(message: Uint8Array): Promise<Uint8Array>

  // Connection management
  connect(): Promise<boolean>
  disconnect(): Promise<void>

  // Device info
  getDeviceInfo(): Promise<HSMDeviceInfo>
}

export interface HSMKey {
  id: string
  publicKey: Uint8Array
  algorithm: string
  createdAt: Date
  metadata?: Record<string, unknown>
}

export interface HSMDeviceInfo {
  manufacturer: string
  product: string
  serialNumber?: string
  firmwareVersion: string
  capabilities: string[]
}

export interface HSMConfig {
  type: HSMType
  pin?: string
  timeout?: number // Connection timeout in milliseconds
  retryAttempts?: number
}

export interface CloudHSMConfig extends HSMConfig {
  type: 'cloud'
  provider: 'aws' | 'azure' | 'gcp'
  region: string
  endpoint: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
}

export interface YubiKeyConfig extends HSMConfig {
  type: 'yubikey'
  deviceSerial?: string
  slot?: number // PIV slot (default: 9a)
}

export interface TPMConfig extends HSMConfig {
  type: 'tpm'
  tpmVersion?: '1.2' | '2.0'
  handle?: number // TPM key handle
}

/**
 * HSM error types
 */
export class HSMError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string
  ) {
    super(message)
    this.name = 'HSMError'
  }
}

export class HSMConnectionError extends HSMError {
  constructor(message: string, provider?: string) {
    super(message, 'CONNECTION_ERROR', provider)
    this.name = 'HSMConnectionError'
  }
}

export class HSMOperationError extends HSMError {
  constructor(message: string, provider?: string) {
    super(message, 'OPERATION_ERROR', provider)
    this.name = 'HSMOperationError'
  }
}

export class HSMNotSupportedError extends HSMError {
  constructor(feature: string, provider?: string) {
    super(`Feature not supported: ${feature}`, 'NOT_SUPPORTED', provider)
    this.name = 'HSMNotSupportedError'
  }
}
