'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Check, X, AlertTriangle, Lock, Key, Eye } from 'lucide-react'

interface SecurityItem {
  category: string
  item: string
  status: 'implemented' | 'pending' | 'review'
  description: string
}

export default function SecurityPage() {
  const checklist: SecurityItem[] = [
    // Key Management
    {
      category: 'Key Management',
      item: 'Non-custodial key generation',
      status: 'implemented',
      description: 'All keys are generated client-side using native Solana keypairs',
    },
    {
      category: 'Key Management',
      item: 'Encrypted local storage',
      status: 'implemented',
      description: 'AES-256-GCM encryption for keys stored locally',
    },
    {
      category: 'Key Management',
      item: 'PBKDF2 key derivation',
      status: 'implemented',
      description: '100,000 iterations for secure key derivation from credentials',
    },
    {
      category: 'Key Management',
      item: 'No server-side key reconstruction',
      status: 'implemented',
      description: 'Keys never leave the client device unencrypted',
    },
    {
      category: 'Key Management',
      item: 'Hardware wallet support',
      status: 'pending',
      description: 'Support for Ledger and other hardware wallets (Phase 5)',
    },

    // Air-Gapped Signing
    {
      category: 'Air-Gapped Signing',
      item: 'QR code export',
      status: 'implemented',
      description: 'Optimized base58 encoding for QR codes',
    },
    {
      category: 'Air-Gapped Signing',
      item: 'Durable transaction nonces',
      status: 'implemented',
      description: 'Support for time-delayed transactions',
    },
    {
      category: 'Air-Gapped Signing',
      item: 'Offline signer HTML bundle',
      status: 'implemented',
      description: 'Single-file HTML signer works 100% offline',
    },
    {
      category: 'Air-Gapped Signing',
      item: 'Partial signatures',
      status: 'implemented',
      description: 'Multi-sig transaction support',
    },

    // Authentication
    {
      category: 'Authentication',
      item: 'Passkey/WebAuthn support',
      status: 'implemented',
      description: 'Face ID, Touch ID, Windows Hello authentication',
    },
    {
      category: 'Authentication',
      item: 'Session management',
      status: 'implemented',
      description: 'Secure sessions with activity tracking',
    },
    {
      category: 'Authentication',
      item: 'Email authentication',
      status: 'pending',
      description: 'Traditional email/password support (Phase 5)',
    },

    // Code Security
    {
      category: 'Code Security',
      item: 'TypeScript strict mode',
      status: 'implemented',
      description: 'All TypeScript strict mode checks enabled',
    },
    {
      category: 'Code Security',
      item: 'No third-party key dependencies',
      status: 'implemented',
      description: 'Minimal dependencies, no external key services',
    },
    {
      category: 'Code Security',
      item: 'Open source code',
      status: 'implemented',
      description: 'MIT license, fully auditable codebase',
    },
    {
      category: 'Code Security',
      item: 'Third-party audit',
      status: 'pending',
      description: 'Professional security audit (planned)',
    },

    // Best Practices
    {
      category: 'Best Practices',
      item: 'HTTPS enforcement',
      status: 'implemented',
      description: 'Secure context detection for sensitive operations',
    },
    {
      category: 'Best Practices',
      item: 'Input validation',
      status: 'implemented',
      description: 'Validation at all system boundaries',
    },
    {
      category: 'Best Practices',
      item: 'Error message sanitization',
      status: 'implemented',
      description: 'No sensitive data in error messages',
    },
    {
      category: 'Best Practices',
      item: 'Rate limiting',
      status: 'pending',
      description: 'DDoS protection and rate limiting (Phase 5)',
    },
  ]

  const getStatusIcon = (status: SecurityItem['status']) => {
    switch (status) {
      case 'implemented':
        return <Check className="h-5 w-5 text-green-400" />
      case 'pending':
        return <X className="h-5 w-5 text-gray-400" />
      case 'review':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
    }
  }

  const categories = Array.from(new Set(checklist.map((item) => item.category)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold text-white">OfflineSign</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to Demo
            </a>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2">
            <Shield className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Security</span>
          </div>
          <h1 className="mb-4 text-5xl font-bold text-white">Security & Audit</h1>
          <p className="text-xl text-gray-300">
            Comprehensive security overview and audit checklist for OfflineSign SDK
          </p>
        </div>

        {/* Overview Cards */}
        <div className="mb-12 grid gap-6 md:grid-cols-3">
          <Card className="border-green-500/20 bg-green-500/10 backdrop-blur-sm">
            <CardHeader>
              <Lock className="mb-2 h-8 w-8 text-green-400" />
              <CardTitle className="text-white">Non-Custodial by Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                All keys are generated and stored locally. No server ever has access to your private keys. True self-custody.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/10 backdrop-blur-sm">
            <CardHeader>
              <Key className="mb-2 h-8 w-8 text-purple-400" />
              <CardTitle className="text-white">Military-Grade Encryption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                AES-256-GCM encryption for local key storage. PBKDF2 with 100,000 iterations for key derivation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/10 backdrop-blur-sm">
            <CardHeader>
              <Eye className="mb-2 h-8 w-8 text-blue-400" />
              <CardTitle className="text-white">Open Source & Auditable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                MIT license. All code is publicly available for review. No black boxes or proprietary algorithms.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Checklist by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-white">{category}</h2>
            <div className="space-y-3">
              {checklist
                .filter((item) => item.category === category)
                .map((item, index) => (
                  <Card
                    key={index}
                    className={`border backdrop-blur-sm ${
                      item.status === 'implemented'
                        ? 'border-green-500/20 bg-green-500/10'
                        : item.status === 'pending'
                          ? 'border-gray-500/20 bg-gray-500/10'
                          : 'border-yellow-500/20 bg-yellow-500/10'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                        <div className="flex-1">
                          <h3 className="mb-1 font-semibold text-white">{item.item}</h3>
                          <p className="text-sm text-gray-400">{item.description}</p>
                          <div className="mt-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                item.status === 'implemented'
                                  ? 'bg-green-500/20 text-green-300'
                                  : item.status === 'pending'
                                    ? 'bg-gray-500/20 text-gray-300'
                                    : 'bg-yellow-500/20 text-yellow-300'
                              }`}
                            >
                              {item.status === 'implemented' && '✓ Implemented'}
                              {item.status === 'pending' && 'Planned'}
                              {item.status === 'review' && 'Under Review'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}

        {/* Best Practices */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Security Best Practices</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">For Developers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Always validate inputs at system boundaries</li>
                  <li>• Use HTTPS in production</li>
                  <li>• Implement rate limiting for public APIs</li>
                  <li>• Sanitize error messages (no sensitive data)</li>
                  <li>• Keep dependencies up to date</li>
                  <li>• Use Content Security Policy headers</li>
                  <li>• Implement proper session management</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">For Production Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Enable all security headers (CSP, HSTS, etc.)</li>
                  <li>• Use encrypted connections only</li>
                  <li>• Implement proper logging (no keys in logs)</li>
                  <li>• Regular security audits</li>
                  <li>• Bug bounty program</li>
                  <li>• Incident response plan</li>
                  <li>• Regular dependency updates</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Known Limitations */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-white">Known Limitations</h2>
          <Card className="border-yellow-500/20 bg-yellow-500/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• <strong>Blockhash Expiration:</strong> Solana blockhashes expire in ~2 minutes. Use durable nonces for time-delayed transactions.</li>
                <li>• <strong>QR Code Size:</strong> Very large transactions may not fit in a single QR code. Use file export instead.</li>
                <li>• <strong>Browser Support:</strong> WebAuthn requires HTTPS and modern browsers with secure context support.</li>
                <li>• <strong>Storage:</strong> LocalStorage has size limits. For large-scale deployments, implement server-side encrypted storage.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Security Audit */}
        <div className="mt-12">
          <Card className="border-green-500/20 bg-green-500/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-green-400" />
              <h2 className="mb-4 text-2xl font-bold text-white">Security Audit Status</h2>
              <p className="mb-6 text-gray-300">
                OfflineSign is currently in active development. A professional security audit is planned for Q2 2026.
              </p>
              <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-gray-300">Internal Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm text-gray-300">External Audit (Planned)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bug Bounty */}
        <div className="mt-12">
          <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Lock className="mx-auto mb-4 h-12 w-12 text-purple-400" />
              <h2 className="mb-4 text-2xl font-bold text-white">Bug Bounty Program</h2>
              <p className="mb-6 text-gray-300">
                Found a security vulnerability? We want to hear about it. Join our bug bounty program and earn rewards.
              </p>
              <Button
                onClick={() => window.open('mailto:security@offlinesign.dev')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Report Vulnerability
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Security questions? Contact our security team at{' '}
            <a href="mailto:security@offlinesign.dev" className="text-purple-400 hover:text-purple-300">
              security@offlinesign.dev
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
