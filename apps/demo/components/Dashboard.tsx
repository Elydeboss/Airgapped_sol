'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import {
  Wallet,
  Shield,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Building2,
  FileCheck,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardProps {
  publicKey: string
  onSignOffline: () => void
}

export function Dashboard({ publicKey, onSignOffline }: DashboardProps) {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate balance loading
    const loadBalance = async () => {
      setLoading(true)
      // In real app, this would fetch from Solana RPC
      await new Promise(resolve => setTimeout(resolve, 1000))
      setBalance(1.5) // Demo balance
      setLoading(false)
    }

    loadBalance()
  }, [])

  const shortAddress = `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`

  return (
    <div className="space-y-6">
      {/* Enterprise Features Banner */}
      <div className="rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-purple-400" />
            <div>
              <h3 className="font-semibold text-white">Enterprise Features Enabled</h3>
              <p className="text-sm text-gray-400">
                Advanced security, compliance, and governance controls active
              </p>
            </div>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20">
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Enterprise Status Indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/20 bg-black/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                <FileCheck className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Compliance</p>
                <p className="text-xs text-gray-400">SOC 2 / ISO 27001 Ready</p>
              </div>
              <div className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                Active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-black/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Audit Logging</p>
                <p className="text-xs text-gray-400">Immutable trail enabled</p>
              </div>
              <div className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                Active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Policy Enforcement</p>
                <p className="text-xs text-gray-400">Governance rules active</p>
              </div>
              <div className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                Active
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Overview Card */}
      <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-white">Wallet Overview</CardTitle>
            </div>
            <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
              Active
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Address */}
            <div>
              <p className="mb-1 text-xs text-gray-400">Wallet Address</p>
              <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                <code className="font-mono text-sm text-white">{shortAddress}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(publicKey)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  📋
                </Button>
              </div>
            </div>

            {/* Balance */}
            <div>
              <p className="mb-1 text-xs text-gray-400">Balance</p>
              <div className="rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-6">
                {loading ? (
                  <div className="animate-pulse text-center text-white">Loading...</div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white">{balance} SOL</div>
                    <div className="mt-1 text-sm text-gray-400">
                      ≈ ${(balance * 150).toFixed(2)} USD
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Status */}
            <div className="flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-3">
              <Shield className="h-4 w-4 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-300">Secure & Non-Custodial</p>
                <p className="text-xs text-gray-400">Keys encrypted locally, never shared</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                <QrCode className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mb-1 font-semibold text-white">Cold Sign</h3>
              <p className="mb-4 text-xs text-gray-400">
                Sign transactions offline for maximum security
              </p>
              <Button
                onClick={onSignOffline}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                Sign Offline
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <ArrowDownLeft className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="mb-1 font-semibold text-white">Receive</h3>
              <p className="mb-4 text-xs text-gray-400">
                Get your unique QR code to receive SOL
              </p>
              <Button variant="outline" className="w-full">
                <QrCode className="mr-2 h-4 w-4" />
                Show QR
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                <ArrowUpRight className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="mb-1 font-semibold text-white">Send</h3>
              <p className="mb-4 text-xs text-gray-400">
                Send SOL to any address on the network
              </p>
              <Button variant="outline" className="w-full">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Send SOL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: 'receive', amount: '+2.5 SOL', from: '9xQD...Pw2k', time: '2 hours ago' },
              { type: 'send', amount: '-0.1 SOL', to: 'ABC1...XYZ9', time: '1 day ago' },
              { type: 'cold-sign', amount: 'Offline TX', status: 'Signed', time: '3 days ago' },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      activity.type === 'receive'
                        ? 'bg-green-500/20'
                        : activity.type === 'send'
                          ? 'bg-blue-500/20'
                          : 'bg-purple-500/20'
                    }`}
                  >
                    {activity.type === 'receive' && <ArrowDownLeft className="h-5 w-5 text-green-400" />}
                    {activity.type === 'send' && <ArrowUpRight className="h-5 w-5 text-blue-400" />}
                    {activity.type === 'cold-sign' && <QrCode className="h-5 w-5 text-purple-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.amount}</p>
                    <p className="text-xs text-gray-400">
                      {activity.from || activity.to || activity.status}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Security Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Your keys are encrypted with AES-256-GCM</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Keys stored locally, never sent to any server</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Air-gapped signing support enabled</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Non-custodial: You have full control</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
