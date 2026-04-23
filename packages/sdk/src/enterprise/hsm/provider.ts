import type {
  HSMProvider,
  HSMKey,
  HSMDeviceInfo,
  HSMConfig,
  HSMError,
} from './types.js'
import type { Keypair, VersionedTransaction } from '@solana/web3.js'

/**
 * Abstract base class for HSM providers
 */
export abstract class BaseHSMProvider implements HSMProvider {
  abstract type: HSMType
  abstract name: string
  abstract version: string
  connected: boolean = false

  abstract generateKey(): Promise<Keypair>
  abstract importKey(keyData: Uint8Array): Promise<Keypair>
  abstract exportKey(keyId: string): Promise<Uint8Array>
  abstract deleteKey(keyId: string): Promise<void>
  abstract listKeys(): Promise<HSMKey[]>

  abstract sign(transaction: VersionedTransaction): Promise<VersionedTransaction>
  abstract signMessage(message: Uint8Array): Promise<Uint8Array>

  abstract connect(): Promise<boolean>
  abstract disconnect(): Promise<void>

  abstract getDeviceInfo(): Promise<HSMDeviceInfo>

  /**
   * Check if provider is connected
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Ensure provider is connected before operation
   */
  protected ensureConnected(): void {
    if (!this.connected) {
      throw new Error(`${this.name} is not connected. Call connect() first.`)
    }
  }

  /**
   * Validate key ID format
   */
  protected validateKeyId(keyId: string): void {
    if (!keyId || typeof keyId !== 'string') {
      throw new Error('Invalid key ID')
    }
  }
}

/**
 * Software-based HSM provider for development/testing
 * Uses software crypto instead of hardware
 */
export class SoftwareHSMProvider extends BaseHSMProvider {
  type: HSMType = 'software'
  name = 'Software HSM'
  version = '1.0.0'
  private keys: Map<string, HSMKey> = new Map()
  private keypairs: Map<string, Keypair> = new Map()

  async connect(): Promise<boolean> {
    this.connected = true
    return true
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async generateKey(): Promise<Keypair> {
    this.ensureConnected()

    // Generate Solana keypair
    const keypair = Keypair.generate()
    const keyId = this.generateKeyId()

    const hsmKey: HSMKey = {
      id: keyId,
      publicKey: keypair.publicKey.toBytes(),
      algorithm: 'Ed25519',
      createdAt: new Date(),
    }

    this.keys.set(keyId, hsmKey)
    this.keypairs.set(keyId, keypair)

    return keypair
  }

  async importKey(keyData: Uint8Array): Promise<Keypair> {
    this.ensureConnected()

    // Create keypair from secret key
    const secretKey = keyData.slice(0, 32)
    const keypair = Keypair.fromSecretKey(secretKey)

    const keyId = this.generateKeyId()

    const hsmKey: HSMKey = {
      id: keyId,
      publicKey: keypair.publicKey.toBytes(),
      algorithm: 'Ed25519',
      createdAt: new Date(),
    }

    this.keys.set(keyId, hsmKey)
    this.keypairs.set(keyId, keypair)

    return keypair
  }

  async exportKey(keyId: string): Promise<Uint8Array> {
    this.ensureConnected()
    this.validateKeyId(keyId)

    const keypair = this.keypairs.get(keyId)
    if (!keypair) {
      throw new Error(`Key not found: ${keyId}`)
    }

    return keypair.secretKey
  }

  async deleteKey(keyId: string): Promise<void> {
    this.ensureConnected()
    this.validateKeyId(keyId)

    this.keys.delete(keyId)
    this.keypairs.delete(keyId)
  }

  async listKeys(): Promise<HSMKey[]> {
    this.ensureConnected()

    return Array.from(this.keys.values())
  }

  async sign(transaction: VersionedTransaction): Promise<VersionedTransaction> {
    this.ensureConnected()

    // For software HSM, sign with the first available key
    const keypair = this.keypairs.values().next().value
    if (!keypair) {
      throw new Error('No keys available for signing')
    }

    transaction.sign([keypair])
    return transaction
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    this.ensureConnected()

    const keypair = this.keypairs.values().next().value
    if (!keypair) {
      throw new Error('No keys available for signing')
    }

    // Sign message using the secret key
    const { ed25519 } = await import('@noble/ed25519')
    const signature = await ed25519.sign(message, keypair.secretKey.slice(0, 32))

    return Buffer.from(signature)
  }

  async getDeviceInfo(): Promise<HSMDeviceInfo> {
    return {
      manufacturer: 'Software',
      product: 'Software HSM (Development)',
      firmwareVersion: this.version,
      capabilities: ['generate', 'import', 'export', 'sign'],
    }
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clear all keys (useful for testing)
   */
  clearKeys(): void {
    this.keys.clear()
    this.keypairs.clear()
  }
}

/**
 * HSM provider factory
 */
export class HSMProviderFactory {
  private static providers: Map<HSMType, new () => HSMProvider> = new Map()

  static registerProvider(type: HSMType, provider: new () => HSMProvider): void {
    this.providers.set(type, provider)
  }

  static createProvider(config: HSMConfig): HSMProvider {
    const ProviderClass = this.providers.get(config.type)

    if (!ProviderClass) {
      throw new Error(`Unsupported HSM type: ${config.type}`)
    }

    return new ProviderClass()
  }

  static getSupportedTypes(): HSMType[] {
    return Array.from(this.providers.keys())
  }
}

/**
 * Register built-in providers
 */
HSMProviderFactory.registerProvider('software', SoftwareHSMProvider)
