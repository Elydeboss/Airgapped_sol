import {
  isWebAuthnAvailable,
  isSecureContext,
} from './keys.js'

/**
 * User authentication and session management
 */

/**
 * User session data (stored securely)
 */
export interface UserSession {
  userId: string
  email?: string
  username?: string
  credentialId?: string
  publicKey: string
  createdAt: number
  lastLoginAt: number
}

/**
 * Passkey registration options
 */
export interface PasskeyRegistrationOptions {
  username: string
  displayName?: string
  attestation?: 'none' | 'indirect' | 'direct'
  authenticatorAttachment?: 'platform' | 'cross-platform'
}

/**
 * Passkey authentication options
 */
export interface PasskeyAuthenticationOptions {
  userVerification?: 'required' | 'preferred' | 'discouraged'
}

/**
 * Register a new passkey (WebAuthn)
 */
export async function registerPasskey(
  options: PasskeyRegistrationOptions
): Promise<{
  success: boolean
  credentialId?: string
  error?: string
}> {
  if (!isWebAuthnAvailable()) {
    return {
      success: false,
      error: 'WebAuthn is not available in this browser',
    }
  }

  if (!isSecureContext()) {
    return {
      success: false,
      error: 'Passkeys require HTTPS (or localhost)',
    }
  }

  try {
    // Create user ID
    const userId = crypto.randomUUID()
    const challenge = crypto.getRandomValues(new Uint8Array(32))

    // Create credential
    const credential = await (navigator.credentials as any).create({
      publicKey: {
        challenge: challenge,
        rp: {
          name: 'OfflineSign',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: options.username,
          displayName: options.displayName || options.username,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: options.authenticatorAttachment || 'platform',
          userVerification: 'preferred',
          requireResidentKey: false,
        },
        attestation: options.attestation || 'none',
      },
    })

    if (!credential) {
      return {
        success: false,
        error: 'Failed to create credential',
      }
    }

    const response = credential.response as any
    const credentialId = bufferToBase64(response.getTransports() ? credential.rawId : response.credentialId)

    return {
      success: true,
      credentialId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register passkey',
    }
  }
}

/**
 * Authenticate with existing passkey
 */
export async function authenticateWithPasskey(
  options?: PasskeyAuthenticationOptions
): Promise<{
  success: boolean
  credentialId?: string
  error?: string
}> {
  if (!isWebAuthnAvailable()) {
    return {
      success: false,
      error: 'WebAuthn is not available in this browser',
    }
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))

    const credential = await (navigator.credentials as any).get({
      publicKey: {
        challenge: challenge,
        rpId: window.location.hostname,
        userVerification: options?.userVerification || 'preferred',
        allowCredentials: [], // Empty means any credential
      },
    })

    if (!credential) {
      return {
        success: false,
        error: 'Failed to authenticate',
      }
    }

    const credentialId = bufferToBase64(credential.rawId)

    return {
      success: true,
      credentialId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to authenticate',
    }
  }
}

/**
 * Create user session
 */
export function createUserSession(user: Omit<UserSession, 'createdAt' | 'lastLoginAt'>): UserSession {
  const now = Date.now()
  const session: UserSession = {
    ...user,
    createdAt: now,
    lastLoginAt: now,
  }

  // Store session data (without sensitive keys)
  localStorage.setItem(`offlinesign_session_${user.userId}`, JSON.stringify(session))

  return session
}

/**
 * Load user session
 */
export function loadUserSession(userId: string): UserSession | null {
  const stored = localStorage.getItem(`offlinesign_session_${userId}`)

  if (!stored) return null

  try {
    return JSON.parse(stored) as UserSession
  } catch {
    return null
  }
}

/**
 * Update session last login time
 */
export function updateSessionActivity(userId: string): void {
  const session = loadUserSession(userId)

  if (session) {
    session.lastLoginAt = Date.now()
    localStorage.setItem(`offlinesign_session_${userId}`, JSON.stringify(session))
  }
}

/**
 * Clear user session
 */
export function clearUserSession(userId: string): void {
  localStorage.removeItem(`offlinesign_session_${userId}`)
}

/**
 * Get active session (from current context)
 */
export function getActiveSession(): UserSession | null {
  // Check for session in localStorage
  const keys = Object.keys(localStorage)

  for (const key of keys) {
    if (key.startsWith('offlinesign_session_')) {
      try {
        const session = JSON.parse(localStorage.getItem(key)!) as UserSession

        // Check if session is recent (within 30 days)
        const sessionAge = Date.now() - session.lastLoginAt
        if (sessionAge < 30 * 24 * 60 * 60 * 1000) {
          return session
        }
      } catch {
        // Invalid session, skip
      }
    }
  }

  return null
}

/**
 * Sign out user
 */
export function signOut(userId: string): void {
  clearUserSession(userId)
  // Note: We don't delete the keypair - user can still sign transactions
}

/**
 * Utility: Convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }

  return btoa(binary)
}
