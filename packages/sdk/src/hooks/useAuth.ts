import { useState, useCallback, useEffect } from 'react'
import type { Keypair } from '@solana/web3.js'
import {
  generateKeypair,
  storeEncryptedKeypair,
  loadEncryptedKeypair,
  deleteKeypair,
  listStoredKeypairs,
  isWebAuthnAvailable,
  isSecureContext,
} from '../core/keys.js'
import {
  registerPasskey,
  authenticateWithPasskey,
  createUserSession,
  loadUserSession,
  updateSessionActivity,
  clearUserSession,
  getActiveSession,
  signOut as signOutUser,
  type UserSession,
} from '../core/auth.js'

/**
 * Authentication hook for passkey-based authentication
 *
 * @example
 * ```typescript
 * function App() {
 *   const {
 *     user,
 *     isAuthenticated,
 *     register,
 *     authenticate,
 *     signOut,
 *     loading
 *   } = useAuth()
 *
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <div>Welcome, {user.username}</div>
 *       ) : (
 *         <button onClick={authenticate}>Sign In</button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const session = getActiveSession()
    if (session) {
      setUser(session)
      setIsAuthenticated(true)
      updateSessionActivity(session.userId)
    }
  }, [])

  /**
   * Register a new user with passkey
   */
  const register = useCallback(
    async (options: {
      username: string
      email?: string
      displayName?: string
    }): Promise<boolean> => {
      setLoading(true)
      setError(null)

      try {
        // Register passkey
        const passkeyOptions: { username: string; displayName?: string } = {
          username: options.username,
        }
        if (options.displayName) passkeyOptions.displayName = options.displayName

        const passkeyResult = await registerPasskey(passkeyOptions)

        if (!passkeyResult.success) {
          setError(new Error(passkeyResult.error || 'Failed to register passkey'))
          return false
        }

        // Generate keypair
        const keypair = await generateKeypair()
        const userId = options.username // Use username as user ID for now

        // Store encrypted keypair
        await storeEncryptedKeypair(keypair, userId)

        // Create user session
        const sessionData: {
          userId: string
          username?: string
          email?: string
          credentialId?: string
          publicKey: string
        } = {
          userId,
          publicKey: Array.from(keypair.publicKey.toBytes()).join(','),
        }

        if (options.username) sessionData.username = options.username
        if (options.email) sessionData.email = options.email
        if (passkeyResult.credentialId) sessionData.credentialId = passkeyResult.credentialId

        const session = createUserSession(sessionData)

        setUser(session)
        setIsAuthenticated(true)

        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to register'))
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Authenticate with existing passkey
   */
  const authenticate = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      // Authenticate with passkey
      const passkeyResult = await authenticateWithPasskey()

      if (!passkeyResult.success) {
        setError(new Error(passkeyResult.error || 'Failed to authenticate'))
        return false
      }

      // Load user session by credential ID
      const storedKeys = listStoredKeypairs()

      for (const userId of storedKeys) {
        const session = loadUserSession(userId)
        if (session && session.credentialId === passkeyResult.credentialId) {
          setUser(session)
          setIsAuthenticated(true)
          updateSessionActivity(userId)
          return true
        }
      }

      // No matching session found
      setError(new Error('No account found for this passkey'))
      return false
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to authenticate'))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Load keypair for signing
   */
  const loadKeypair = useCallback(async (): Promise<Keypair | null> => {
    if (!user) return null

    try {
      return await loadEncryptedKeypair(user.userId)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load keypair'))
      return null
    }
  }, [user])

  /**
   * Sign out
   */
  const signOut = useCallback(() => {
    if (user) {
      signOutUser(user.userId)
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [user])

  /**
   * Delete account
   */
  const deleteAccount = useCallback(() => {
    if (user) {
      deleteKeypair(user.userId)
      clearUserSession(user.userId)
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [user])

  /**
   * Check if passkey is available
   */
  const canUsePasskey = useCallback(() => {
    return isWebAuthnAvailable() && isSecureContext()
  }, [])

  return {
    // User state
    user,
    isAuthenticated,
    loading,
    error,

    // Actions
    register,
    authenticate,
    signOut,
    deleteAccount,
    loadKeypair,
    canUsePasskey,
  }
}

/**
 * Hook for managing wallet creation and onboarding
 */
export function useWalletOnboarding() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [userData, setUserData] = useState<{
    username?: string
    email?: string
  }>({})
  const [keypair, setKeypair] = useState<Keypair | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Set username
   */
  const setUsername = useCallback((username: string) => {
    setUserData((prev) => ({ ...prev, username }))
  }, [])

  /**
   * Set email
   */
  const setEmail = useCallback((email: string) => {
    setUserData((prev) => ({ ...prev, email }))
  }, [])

  /**
   * Create wallet
   */
  const createWallet = useCallback(async () => {
    if (!userData.username) {
      setError(new Error('Username is required'))
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Generate keypair
      const newKeypair = await generateKeypair()
      setKeypair(newKeypair)

      // Store encrypted keypair
      const userId = userData.username
      await storeEncryptedKeypair(newKeypair, userId)

      // Create session
      const publicKey = Array.from(newKeypair.publicKey.toBytes()).join(',')
      const sessionData: {
        userId: string
        username?: string
        email?: string
        publicKey: string
      } = {
        userId,
        publicKey,
      }

      if (userData.username) sessionData.username = userData.username
      if (userData.email) sessionData.email = userData.email

      const session = createUserSession(sessionData)

      setStep(4)
      return { keypair: newKeypair, session }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create wallet'))
      return null
    } finally {
      setLoading(false)
    }
  }, [userData])

  /**
   * Register with passkey
   */
  const registerWithPasskey = useCallback(async () => {
    if (!userData.username) {
      setError(new Error('Username is required'))
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const passkeyResult = await registerPasskey({
        username: userData.username,
        displayName: userData.username,
      })

      if (!passkeyResult.success) {
        setError(new Error(passkeyResult.error || 'Failed to register passkey'))
        return false
      }

      // Proceed to create wallet
      await createWallet()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to register passkey'))
      return false
    } finally {
      setLoading(false)
    }
  }, [userData.username, createWallet])

  /**
   * Go to next step
   */
  const nextStep = useCallback(() => {
    setStep((prev) => {
      if (prev < 4) return (prev + 1) as 1 | 2 | 3 | 4
      return prev
    })
  }, [])

  /**
   * Go to previous step
   */
  const prevStep = useCallback(() => {
    setStep((prev) => {
      if (prev > 1) return (prev - 1) as 1 | 2 | 3 | 4
      return prev
    })
  }, [])

  /**
   * Reset onboarding
   */
  const reset = useCallback(() => {
    setStep(1)
    setUserData({})
    setKeypair(null)
    setError(null)
  }, [])

  return {
    // State
    step,
    userData,
    keypair,
    loading,
    error,

    // Actions
    setUsername,
    setEmail,
    createWallet,
    registerWithPasskey,
    nextStep,
    prevStep,
    reset,
  }
}
