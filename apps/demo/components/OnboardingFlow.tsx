'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { UserPlus, Mail, Key, Shield, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

interface OnboardingFlowProps {
  onComplete: (userId: string, publicKey: string) => void
}

type Step = 1 | 2 | 3 | 4

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState({
    username: '',
    email: '',
  })
  const [usePasskey, setUsePasskey] = useState(false)

  const handleNext = async () => {
    setError(null)

    if (step === 1) {
      if (!userData.username.trim()) {
        setError('Please enter a username')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      setLoading(true)
      try {
        // Simulate wallet creation
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Generate a mock public key for demo
        const mockPublicKey = `DWallet_${Math.random().toString(36).substring(2, 15)}`

        onComplete(userData.username, mockPublicKey)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create wallet')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    setError(null)
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handlePasskeySetup = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if passkey is available
      const isAvailable = typeof window !== 'undefined' &&
                         'credentials' in navigator &&
                         typeof (navigator.credentials as any).create === 'function'

      if (!isAvailable) {
        setError('Passkeys are not available in this browser. Try another method.')
        setUsePasskey(false)
        return
      }

      // Simulate passkey registration
      await new Promise(resolve => setTimeout(resolve, 2000))
      setUsePasskey(true)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register passkey')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-lg border-purple-500/20 bg-black/40 backdrop-blur-md">
        <CardHeader>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-400" />
              <CardTitle className="text-white">
                {step === 1 && 'Create Your Wallet'}
                {step === 2 && 'Choose Security Method'}
                {step === 3 && 'Create Your Wallet'}
                {step === 4 && 'Wallet Created!'}
              </CardTitle>
            </div>
            <div className="text-sm text-gray-400">
              Step {step} of 4
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? 'bg-purple-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          {step < 4 && (
            <CardDescription className="text-gray-400">
              {step === 1 && 'Enter your details to get started with OfflineSign'}
              {step === 2 && 'Choose how you want to secure your wallet'}
              {step === 3 && 'Review and create your secure non-custodial wallet'}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Username *
                </label>
                <input
                  type="text"
                  value={userData.username}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                  placeholder="Enter username"
                  className="w-full rounded-lg border border-gray-600 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-gray-600 bg-black/50 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div
                onClick={() => setUsePasskey(true)}
                className={`cursor-pointer rounded-lg border-2 p-6 transition-colors ${
                  usePasskey
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 bg-black/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-purple-500/20 p-3">
                    <Key className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-white">Passkey (Recommended)</h3>
                    <p className="text-sm text-gray-400">
                      Use Face ID, Touch ID, or Windows Hello for secure, passwordless access
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                      <li>✓ Most secure option</li>
                      <li>✓ No passwords to remember</li>
                      <li>✓ Biometric protection</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setUsePasskey(false)}
                className={`cursor-pointer rounded-lg border-2 p-6 transition-colors ${
                  !usePasskey
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 bg-black/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-blue-500/20 p-3">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-white">Email Only</h3>
                    <p className="text-sm text-gray-400">
                      Traditional email-based authentication with encrypted local storage
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                      <li>✓ Simple setup</li>
                      <li>✓ Works everywhere</li>
                      <li>✓ Local encryption</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-purple-500/20 p-6">
                <h3 className="mb-4 font-semibold text-white">Wallet Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white">{userData.username}</span>
                  </div>
                  {userData.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{userData.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Security:</span>
                    <span className="text-white">{usePasskey ? 'Passkey' : 'Email'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-green-500/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  Security Features
                </div>
                <ul className="space-y-1 text-xs text-gray-400">
                  <li>✓ Non-custodial - You control your keys</li>
                  <li>✓ Encrypted local storage</li>
                  <li>✓ Air-gapped signing support</li>
                  <li>✓ No server-side key reconstruction</li>
                </ul>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>

              <div>
                <h3 className="mb-2 text-2xl font-bold text-white">Wallet Created!</h3>
                <p className="text-gray-400">
                  Your secure offline wallet has been created successfully
                </p>
              </div>

              <div className="rounded-lg bg-purple-500/20 p-4">
                <p className="mb-2 text-sm text-gray-400">Your Wallet Address</p>
                <p className="break-all font-mono text-sm text-white">
                  {usePasskey ? 'Passkey-Protected' : 'Email-Protected'}_Wallet
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <p>🔐 Your keys are encrypted and stored locally</p>
                <p>📱 Ready for air-gapped transactions</p>
                <p>🚀 No vendor lock-in - 100% yours</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/20 p-4 text-center">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {step < 4 && (
            <div className="flex gap-4">
              {step > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                onClick={step === 2 && usePasskey ? handlePasskeySetup : handleNext}
                className={`${step === 1 ? 'flex-1' : 'flex-1'} bg-purple-600 hover:bg-purple-700`}
                disabled={loading}
              >
                {loading ? 'Processing...' : step === 3 ? 'Create Wallet' : 'Continue'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
