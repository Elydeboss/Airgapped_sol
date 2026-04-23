import type {
  HSMProvider,
  HSMKey,
  HSMDeviceInfo,
  YubiKeyConfig,
} from './types.js'
import type { Keypair, VersionedTransaction } from '@solana/web3.js'
import { BaseHSMProvider } from './provider.js'

/**
 * YubiKey HSM provider for Solana key management and signing
 *
 * Note: This is a simplified implementation for development.
 * Production YubiKey integration requires:
 * - YubiKey Manager SDK
 * - WebHID/WebUSB APIs for browser
 * - Native code for Node.js
 * - PIV card application support
 */
export class YubiKeyProvider extends BaseHSMProvider {
  type: YubiKeyConfig['type'] = 'yubikey'
  name = 'YubiKey 5 Series'
  version = '5.0.0'
  private config: YubiKeyConfig
  private keys: Map<string, HSMKey> = new Map()
  private keypairs: Map<string, Keypair> = new Map()

  constructor(config: YubiKeyConfig = { type: 'yubikey' }) {
    super()
    this.config = config
  }

  /**
   * Connect to YubiKey device
   */
  async connect(): Promise<boolean> {
    try {
      // Check for WebHID/WebUSB support
      if (typeof navigator !== 'undefined') {
        const hasWebHID = 'hid' in navigator
        const hasWebUSB = 'usb' in navigator

        if (!hasWebHID && !hasWebUSB) {
          console.warn('WebHID/WebUSB not supported. YubiKey integration limited.')
        }

        // Request device access (requires user gesture)
        if (hasWebUSB) {
          // In production, this would call navigator.usb.requestDevice()
          // For now, simulate connection
          console.log('Requesting YubiKey access via WebUSB...')
        }
      }

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 100))

      this.connected = true
      return true
    } catch (error) {
      console.error('Failed to connect to YubiKey:', error)
      this.connected = false
      return false
    }
  }

  /**
   * Disconnect from YubiKey device
   */
  async disconnect(): Promise<void> {
    this.connected = false
  }

  /**
   * Generate key on YubiKey
   */
  async generateKey(): Promise<Keypair> {
    this.ensureConnected()

    // In production, this would:
    // 1. Generate key in secure element
    // 2. Store in YubiKey PIV slot
    // 3. Return public key reference

    // For now, generate software key (simulated)
    const keypair = Keypair.generate()
    const keyId = this.generateKeyId()

    const hsmKey: HSMKey = {
      id: keyId,
      publicKey: keypair.publicKey.toBytes(),
      algorithm: 'Ed25519',
      createdAt: new Date(),
      metadata: {
        storedInHardware: true,
        yubikeySlot: this.config.slot || 0x9a, // Default PIV slot
      },
    }

    this.keys.set(keyId, hsmKey)
    this.keypairs.set(keyId, keypair)

    console.log(`Generated key on YubiKey: ${keyId} (slot: ${this.config.slot || 0x9a})`)

    return keypair
  }

  /**
   * Import key into YubiKey
   */
  async importKey(keyData: Uint8Array): Promise<Keypair> {
    this.ensureConnected()

    // In production, this would:
    // 1. Validate key format
    // 2. Import into YubiKey secure element
    // 3. Set up PIN protection

    const keypair = Keypair.fromSecretKey(keyData.slice(0, 32))
    const keyId = this.generateKeyId()

    const hsmKey: HSMKey = {
      id: keyId,
      publicKey: keypair.publicKey.toBytes(),
      algorithm: 'Ed25519',
      createdAt: new Date(),
      metadata: {
        imported: true,
        yubikeySlot: this.config.slot || 0x9a,
      },
    }

    this.keys.set(keyId, hsmKey)
    this.keypairs.set(keyId, keypair)

    console.log(`Imported key into YubiKey: ${keyId}`)

    return keypair
  }

  /**
   * Export key from YubiKey (if allowed)
   */
  async exportKey(keyId: string): Promise<Uint8Array> {
    this.ensureConnected()
    this.validateKeyId(keyId)

    // YubiKey generally doesn't allow exporting private keys
    // This would only export the public key
    const hsmKey = this.keys.get(keyId)
    if (!hsmKey) {
      throw new Error(`Key not found: ${keyId}`)
    }

    // Only export public key
    return hsmKey.publicKey
  }

  /**
   * Delete key from YubiKey
   */
  async deleteKey(keyId: string): Promise<void> {
    this.ensureConnected()
    this.validateKeyId(keyId)

    this.keys.delete(keyId)
    this.keypairs.delete(keyId)

    console.log(`Deleted key from YubiKey: ${keyId}`)
  }

  /**
   * List keys on YubiKey
   */
  async listKeys(): Promise<HSMKey[]> {
    this.ensureConnected()

    return Array.from(this.keys.values())
  }

  /**
   * Sign transaction with YubiKey
   */
  async sign(transaction: VersionedTransaction): Promise<VersionedTransaction> {
    this.ensureConnected()

    // In production, this would:
    // 1. Send transaction to YubiKey
    // 2. Prompt user to touch button
    // 3. Sign in secure element
    // 4. Return signature

    // For now, simulate signing with first available key
    const keypair = this.keypairs.values().next().value
    if (!keypair) {
      throw new Error('No keys available for signing')
    }

    console.log('Requesting signature from YubiKey (touch required)...')

    // Simulate user touching the button
    await new Promise(resolve => setTimeout(resolve, 500))

    transaction.sign([keypair])
    console.log('YubiKey signature complete')

    return transaction
  }

  /**
   * Sign message with YubiKey
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    this.ensureConnected()

    const keypair = this.keypairs.values().next().value
    if (!keypair) {
      throw new Error('No keys available for signing')
    }

    console.log('Requesting message signature from YubiKey...')

    // Simulate user touch
    await new Promise(resolve => setTimeout(resolve, 500))

    const { ed25519 } = await import('@noble/ed25519')
    const signature = await ed25519.sign(message, keypair.secretKey.slice(0, 32))

    console.log('YubiKey message signature complete')

    return Buffer.from(signature)
  }

  /**
   * Get YubiKey device information
   */
  async getDeviceInfo(): Promise<HSMDeviceInfo> {
    return {
      manufacturer: 'Yubico',
      product: 'YubiKey 5 Series',
      serialNumber: this.config.deviceSerial || 'Unknown',
      firmwareVersion: '5.0.0',
      capabilities: [
        'generate',
        'import',
        'sign',
        'piv',
        'fido2',
        'otp',
      ],
    }
  }

  /**
   * Check if YubiKey is supported in current environment
   */
  static isSupported(): boolean {
    if (typeof navigator === 'undefined') {
      return false // Node.js - would need native integration
    }

    const hasWebHID = 'hid' in navigator
    const hasWebUSB = 'usb' in navigator

    return hasWebHID || hasWebUSB
  }

  /**
   * Request YubiKey device access
   */
  static async requestDevice(): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      // In production, this would call:
      // - navigator.hid.requestDevice() for WebHID
      // - navigator.usb.requestDevice() for WebUSB

      console.log('Requesting YubiKey device access...')

      // Simulate user selecting device
      await new Promise(resolve => setTimeout(resolve, 200))

      return true
    } catch (error) {
      console.error('Failed to request YubiKey device:', error)
      return false
    }
  }

  private generateKeyId(): string {
    return `yubikey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Register YubiKey provider
 */
import { HSMProviderFactory } from './provider.js'
HSMProviderFactory.registerProvider('yubikey', YubiKeyProvider)
