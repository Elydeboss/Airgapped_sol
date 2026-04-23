'use client'

import { useState } from 'react'
import {
  useWallet,
  useCreateOfflineTx,
  useScanPartialSignature,
  getBalance as sdkGetBalance,
  useAuth,
} from '@airgapped-priv/sdk'
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { WalletButton } from '@/components/WalletButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeSelector, ModeBadge } from '@/components/ModeSelector'
import { QRScanner } from '@/components/QRScanner'
import { FileImport } from '@/components/FileImport'
import { OnboardingFlow } from '@/components/OnboardingFlow'
import { Dashboard } from '@/components/Dashboard'
import {
  QrCode,
  Download,
  Shield,
  Zap,
  Lock,
  Send,
  CheckCircle,
  AlertCircle,
  LogOut,
} from 'lucide-react'

type Mode = 'online' | 'airgapped'
type ViewState = 'landing' | 'onboarding' | 'dashboard'

export default function Home() {
  const { user, isAuthenticated, register, loading: authLoading } = useAuth()
  const { publicKey, connected, getBalance } = useWallet()
  const {
    createTransaction,
    exportTransaction,
    transaction,
    qrCode,
    loading,
    error,
    reset,
  } = useCreateOfflineTx()
  const {
    importFromData,
    broadcastTransaction,
    state,
    isFullySigned,
    loading: scanLoading,
    error: scanError,
  } = useScanPartialSignature()

  const [mode, setMode] = useState<Mode>('airgapped')
  const [viewState, setViewState] = useState<ViewState>('landing')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [balance, setBalance] = useState<number>(0)

  const handleGetBalance = async () => {
    if (publicKey) {
      const bal = await sdkGetBalance(publicKey.toBase58())
      setBalance(bal / LAMPORTS_PER_SOL)
    }
  }

  const handleCreateOfflineTx = async () => {
    if (!publicKey) return

    const instruction = SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: publicKey,
      lamports: 1_000_000,
    })

    try {
      await createTransaction()
      await exportTransaction('qr')
    } catch (err) {
      console.error('Failed to create offline transaction:', err)
    }
  }

  const handleDownloadQR = () => {
    if (!qrCode) return

    const link = document.createElement('a')
    link.href = qrCode
    link.download = `offline-tx-${Date.now()}.png`
    link.click()
  }

  const handleDownloadOfflineSigner = () => {
    const link = document.createElement('a')
    link.href = '/offline-signer.html'
    link.download = 'offline-signer.html'
    link.click()
  }

  const handleImportSignedTx = async (data: string) => {
    const result = await importFromData(data, 'base64')
    if (result.success) {
      setShowSuccess(true)
    }
  }

  const handleBroadcast = async () => {
    const sig = await broadcastTransaction()
    if (sig) {
      setShowSuccess(true)
    }
  }

  const handleStartOnboarding = () => {
    setViewState('onboarding')
  }

  const handleCompleteOnboarding = (userId: string, publicKey: string) => {
    setViewState('dashboard')
  }

  const handleSignOffline = () => {
    handleCreateOfflineTx()
  }

  // Show onboarding if not authenticated
  if (viewState === 'onboarding') {
    return <OnboardingFlow onComplete={handleCompleteOnboarding} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold text-white">OfflineSign</span>
            <ModeBadge mode={mode} />
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <>
                <div className="text-sm text-gray-400">
                  Welcome, {user.username}
                </div>
                <a
                  href="/admin"
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Admin
                </a>
              </>
            )}
            <ModeSelector mode={mode} onModeChange={setMode} />
            <WalletButton />
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewState('landing')}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        {/* Landing Page */}
        {viewState === 'landing' && (
          <>
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-5xl font-bold text-white">
                Non-Custodial Air-Gapped Solana Wallet
              </h1>
              <p className="mb-6 text-xl text-gray-300">
                {mode === 'online'
                  ? 'Sign transactions online with your wallet'
                  : 'Create transactions, export as QR, and sign offline for maximum security'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleStartOnboarding}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Create Free Wallet
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => (window.location.href = '/pricing')}
                >
                  View Pricing
                </Button>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                    <Lock className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-white">Non-Custodial</CardTitle>
                  <CardDescription className="text-gray-400">
                    Native Solana keypairs. No server-side reconstruction. Ever.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                    <Shield className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-white">Air-Gapped Ready</CardTitle>
                  <CardDescription className="text-gray-400">
                    Export transactions as QR codes for offline signing on cold storage devices
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                    <Zap className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-white">Zero Lock-in</CardTitle>
                  <CardDescription className="text-gray-400">
                    Open source MIT license. No recurring fees. No vendor dependencies.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* CTA Section */}
            <div className="mt-12 text-center">
              <div className="mx-auto max-w-2xl rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-8">
                <h2 className="mb-4 text-3xl font-bold text-white">Get Started Today</h2>
                <p className="mb-6 text-gray-300">
                  Create your secure non-custodial wallet in minutes. No registration required.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={handleStartOnboarding}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    Create Wallet
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => {}}>
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Dashboard */}
        {viewState === 'dashboard' && (
          <Dashboard publicKey={user?.publicKey || ''} onSignOffline={handleSignOffline} />
        )}

        {connected && viewState === 'landing' && (
          <div className="mt-8">
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">
                  {mode === 'online' ? 'Online Actions' : 'Air-Gapped Workflow'}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connected: {publicKey?.toBase58().slice(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button onClick={handleGetBalance} variant="outline" className="flex-1">
                    Get Balance
                  </Button>
                  {mode === 'airgapped' && (
                    <Button
                      onClick={handleCreateOfflineTx}
                      disabled={loading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? 'Creating...' : 'Create Offline TX'}
                    </Button>
                  )}
                </div>

                {balance > 0 && (
                  <div className="rounded-lg bg-green-500/20 p-4">
                    <p className="text-center text-sm text-gray-300">Balance</p>
                    <p className="text-center text-2xl font-bold text-white">{balance} SOL</p>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-500/20 p-4">
                    <p className="text-center text-sm text-red-300">{error.message}</p>
                  </div>
                )}

                {mode === 'airgapped' && qrCode && transaction && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-purple-500/20 p-6">
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Step 1: Export Transaction
                      </h3>
                      <div className="flex items-center justify-center rounded-lg bg-white p-8">
                        <img src={qrCode} alt="QR Code" className="h-64 w-64" />
                      </div>
                      <div className="mt-4 flex gap-4">
                        <Button onClick={handleDownloadQR} className="flex-1">
                          <Download className="mr-2 h-4 w-4" />
                          Download QR
                        </Button>
                        <Button onClick={handleDownloadOfflineSigner} variant="outline" className="flex-1">
                          <Download className="mr-2 h-4 w-4" />
                          Download Offline Signer
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg bg-purple-500/20 p-6">
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Step 2: Import Signed Transaction
                      </h3>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <Button
                            onClick={() => setShowQRScanner(true)}
                            className="flex-1"
                            variant="outline"
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            Scan QR Code
                          </Button>
                        </div>

                        <div className="text-center text-sm text-gray-400">— OR —</div>

                        <FileImport onImport={handleImportSignedTx} />
                      </div>
                    </div>

                    {state.transaction && isFullySigned && (
                      <div className="rounded-lg bg-green-500/20 p-6">
                        <div className="mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <h3 className="text-lg font-semibold text-white">
                            Transaction Ready to Broadcast
                          </h3>
                        </div>
                        <Button onClick={handleBroadcast} className="w-full bg-green-600 hover:bg-green-700">
                          <Send className="mr-2 h-4 w-4" />
                          Broadcast Transaction
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!connected && viewState === 'landing' && (
          <div className="mt-8 text-center">
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardContent className="p-12">
                <QrCode className="mx-auto mb-4 h-16 w-16 text-purple-400" />
                <h3 className="mb-2 text-2xl font-bold text-white">Connect Your Wallet</h3>
                <p className="mb-6 text-gray-400">
                  Connect your Phantom wallet to start creating air-gapped transactions
                </p>
                <WalletButton />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Quick Links */}
          <a
            href="/security"
            className="block transition-transform hover:scale-105"
          >
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Shield className="mx-auto mb-3 h-8 w-8 text-purple-400" />
                <h3 className="mb-2 font-semibold text-white">Security</h3>
                <p className="text-sm text-gray-400">
                  Security audit and best practices
                </p>
              </CardContent>
            </Card>
          </a>

          <a
            href="https://github.com/airgapped-priv/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-transform hover:scale-105"
          >
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <svg className="mx-auto mb-3 h-8 w-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.627 5.373 10 12 10 5.627 0 10-5.373 10-12zm0-2c-5.523 0-10-4.477-10-10S6.477 2 12 2 5.523 4.477 10 10s-4.477 10-10 10zm-1-6a8 8 0 1 1-16 8 8 0 0 1 1 16z" />
                </svg>
                <h3 className="mb-2 font-semibold text-white">GitHub</h3>
                <p className="text-sm text-gray-400">
                  View source code on GitHub
                </p>
              </CardContent>
            </Card>
          </a>

          <a
            href="https://docs.offlinesign.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-transform hover:scale-105"
          >
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <svg className="mx-auto mb-3 h-8 w-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.32 0 9 1.418 9 3.138 0 1.803.765 2.622 1.824 6.837 0 5.836 3.96 7.731 9.386 1.658.323 2.71-.815.921-2.828 2.357-1.634.341-3.19 1.658-2.828 2.357-1.634.341-3.19 1.658-2.828 2.357-1.634.341-3.19 1.658-2.828 2.357-1.634.341-3.19C23.677 4.616 23 4.927 23 8.029v1.941c0 .966.332 1.551.761 2.573.828 3.98.08.898 2.55.138.818 4.093-.834 1.054-1.634.341-3.19 1.658-2.828 2.357-1.634.341-3.19 1.658-2.828 2.357-1.634.341-3.19z" />
                </svg>
                <h3 className="mb-2 font-semibold text-white">Documentation</h3>
                <p className="text-sm text-gray-400">
                  Full API documentation and examples
                </p>
              </CardContent>
            </Card>
          </a>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <a
              href="https://github.com/airgapped-priv/sdk"
              className="text-purple-400 hover:text-purple-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              @airgapped-priv/sdk
            </a>
          </p>
        </div>
      </main>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner onScan={handleImportSignedTx} onClose={() => setShowQRScanner(false)} />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-green-500/20 bg-black/40 backdrop-blur-md">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Success!</h3>
              <p className="mb-6 text-gray-300">
                {mode === 'airgapped'
                  ? 'Transaction broadcasted successfully'
                  : 'Operation completed successfully'}
              </p>
              <Button onClick={() => setShowSuccess(false)} variant="outline" className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
