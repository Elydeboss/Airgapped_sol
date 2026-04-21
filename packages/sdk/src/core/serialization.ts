import type { ColdTxExport, ColdTxExportOptions, ColdTxFormat } from '../types/index.js'
import type { VersionedTransaction } from '@solana/web3.js'
import QRCode from 'qrcode'
import bs58 from 'bs58'

/**
 * Export transaction for cold storage (QR, base64, or file)
 * Uses base58 encoding for QR codes to minimize size
 *
 * @param tx - VersionedTransaction to export
 * @param format - Export format ('qr', 'base64', 'file')
 * @param options - Optional export configuration
 * @returns ColdTxExport with serialized data
 *
 * @example
 * ```typescript
 * // Export as QR code
 * const qrExport = await exportForCold(tx, 'qr')
 * console.log(qrExport.data) // base58 encoded string
 *
 * // Export as base64
 * const b64Export = await exportForCold(tx, 'base64')
 * console.log(b64Export.data) // base64 encoded string
 * ```
 */
export async function exportForCold(
  tx: VersionedTransaction,
  format: ColdTxFormat,
  options: ColdTxExportOptions = {}
): Promise<ColdTxExport & { qrCode?: string }> {
  const serialized = tx.serialize()
  const timestamp = Date.now() as unknown as number

  switch (format) {
    case 'qr': {
      // Use base58 for QR codes (smaller than base64)
      const base58Data = bs58.encode(serialized)

      // Verify QR code can be generated
      if (options.maxSize && base58Data.length > options.maxSize) {
        throw new Error(
          `Transaction too large for QR code: ${base58Data.length} bytes (max: ${options.maxSize})`
        )
      }

      // Generate QR code for verification
      const qrCode = await QRCode.toDataURL(base58Data, {
        errorCorrectionLevel: 'L', // Low error correction for max data
        type: 'image/png',
        margin: 1,
        scale: 4,
      })

      return {
        data: base58Data,
        format: 'qr',
        size: base58Data.length,
        timestamp,
        qrCode,
      }
    }

    case 'base64': {
      const base64Data = Buffer.from(serialized).toString('base64')
      return {
        data: base64Data,
        format: 'base64',
        size: serialized.length,
        timestamp,
      }
    }

    case 'file': {
      const base64Data = Buffer.from(serialized).toString('base64')
      return {
        data: base64Data,
        format: 'file',
        size: serialized.length,
        timestamp,
      }
    }

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Import transaction from cold storage
 *
 * @param data - Serialized transaction data
 * @param format - Format the data is in ('qr', 'base64', 'file')
 * @returns VersionedTransaction
 * @throws Error if deserialization fails
 *
 * @example
 * ```typescript
 * // Import from QR/base58
 * const tx1 = await importFromCold(qrData, 'qr')
 *
 * // Import from base64/file
 * const tx2 = await importFromCold(base64Data, 'base64')
 * ```
 */
export async function importFromCold(
  data: string,
  format: ColdTxFormat
): Promise<VersionedTransaction> {
  try {
    let buffer: Buffer

    switch (format) {
      case 'qr': {
        // Decode from base58
        buffer = Buffer.from(bs58.decode(data))
        break
      }

      case 'base64':
      case 'file': {
        // Decode from base64
        buffer = Buffer.from(data, 'base64')
        break
      }

      default:
        throw new Error(`Unsupported import format: ${format}`)
    }

    // Deserialize transaction (need value import)
    const { VersionedTransaction: VT } = await import('@solana/web3.js')
    return VT.deserialize(buffer)
  } catch (error) {
    throw new Error(
      `Failed to import transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate a QR code image from transaction data
 *
 * @param tx - VersionedTransaction to encode
 * @param options - QR code generation options
 * @returns Data URL of QR code image
 *
 * @example
 * ```typescript
 * const qrDataUrl = await generateQRCode(tx)
 * document.getElementById('qr').src = qrDataUrl
 * ```
 */
export async function generateQRCode(
  tx: VersionedTransaction,
  options: {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    scale?: number
    margin?: number
  } = {}
): Promise<string> {
  const serialized = tx.serialize()
  const base58Data = bs58.encode(serialized)

  return QRCode.toDataURL(base58Data, {
    errorCorrectionLevel: options.errorCorrectionLevel || 'L',
    type: 'image/png',
    margin: options.margin || 1,
    scale: options.scale || 4,
  })
}

/**
 * Estimate the size of a QR code for a transaction
 *
 * @param tx - VersionedTransaction to measure
 * @returns Estimated size in characters
 */
export function estimateQRSize(tx: VersionedTransaction): number {
  const serialized = tx.serialize()
  return bs58.encode(serialized).length
}

/**
 * Validate if data is a valid base58 string
 *
 * @param data - String to validate
 * @returns True if valid base58
 */
export function isValidBase58(data: string): boolean {
  try {
    bs58.decode(data)
    return true
  } catch {
    return false
  }
}

/**
 * Convert transaction to JSON-safe representation for storage/transmission
 *
 * @param tx - VersionedTransaction
 * @returns JSON-safe object
 */
export function transactionToJSON(tx: VersionedTransaction): {
  version: number | string
  data: string
  message: unknown
} {
  const serialized = tx.serialize()
  return {
    version: tx.version as number | string,
    data: Buffer.from(serialized).toString('base64'),
    message: tx.message,
  }
}

/**
 * Create transaction from JSON representation
 *
 * @param json - JSON object from transactionToJSON
 * @returns VersionedTransaction
 */
export async function transactionFromJSON(json: {
  version: number | string
  data: string
}): Promise<VersionedTransaction> {
  const buffer = Buffer.from(json.data, 'base64')
  const { VersionedTransaction: VT } = await import('@solana/web3.js')
  return VT.deserialize(buffer)
}
