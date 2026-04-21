'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Zap, Shield, Crown, Building2, ArrowRight } from 'lucide-react'

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  const tiers: PricingTier[] = [
    {
      name: 'Community',
      price: annual ? 'Free' : 'Free',
      description: 'Perfect for individuals and small projects',
      features: [
        'Core SDK functionality',
        'QR code export',
        'Offline signing',
        'Community support',
        'MIT license',
        'Unlimited transactions',
      ],
      cta: 'Get Started',
    },
    {
      name: 'Pro',
      price: annual ? '$49/mo' : '$59/mo',
      description: 'For growing teams and production apps',
      features: [
        'Everything in Community',
        'Priority support',
        'Advanced security features',
        'Custom RPC endpoints',
        'Analytics dashboard',
        'Team collaboration',
        'SLA guarantee',
      ],
      cta: 'Start Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large-scale deployments',
      features: [
        'Everything in Pro',
        'Dedicated support',
        'Custom integrations',
        'On-premise deployment',
        'SSO / SAML',
        'Audit logs',
        'Compliance review',
        '24/7 support',
      ],
      cta: 'Contact Sales',
    },
  ]

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
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Pricing</span>
          </div>
          <h1 className="mb-4 text-5xl font-bold text-white">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300">
            Start free, scale as you grow. No credit card required.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mb-12 flex justify-center">
          <div className="inline-flex items-center gap-4 rounded-lg bg-black/30 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
                !annual
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
                annual
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {tiers.map((tier, index) => (
            <Card
              key={index}
              className={`relative border backdrop-blur-sm transition-all hover:scale-105 ${
                tier.popular
                  ? 'border-purple-500/50 bg-purple-500/10 shadow-2xl shadow-purple-500/20'
                  : 'border-purple-500/20 bg-black/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-purple-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <div className="mb-4 flex justify-center">
                  {index === 0 && <Zap className="h-8 w-8 text-gray-400" />}
                  {index === 1 && <Crown className="h-8 w-8 text-purple-400" />}
                  {index === 2 && <Building2 className="h-8 w-8 text-yellow-400" />}
                </div>
                <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  {tier.price !== 'Free' && tier.price !== 'Custom' && (
                    <span className="text-gray-400">/month</span>
                  )}
                </div>
                <CardDescription className="text-gray-400 mt-2">{tier.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 flex-shrink-0 text-green-400" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    tier.popular
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  onClick={() => {
                    if (tier.name === 'Community') {
                      window.location.href = '/'
                    } else if (tier.name === 'Pro') {
                      alert('Pro plan coming soon! Join our waitlist.')
                    } else {
                      alert('Enterprise inquiries: contact@offlinesign.dev')
                    }
                  }}
                >
                  {tier.cta}
                  {tier.name !== 'Community' && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">Feature Comparison</h2>
          <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-4 text-left text-sm font-medium text-gray-400">Feature</th>
                      <th className="py-4 text-center text-sm font-medium text-gray-400">Community</th>
                      <th className="py-4 text-center text-sm font-medium text-purple-400">Pro</th>
                      <th className="py-4 text-center text-sm font-medium text-yellow-400">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="py-4 text-sm text-gray-300">SDK Usage</td>
                      <td className="py-4 text-center text-sm text-gray-400">Unlimited</td>
                      <td className="py-4 text-center text-sm text-gray-400">Unlimited</td>
                      <td className="py-4 text-center text-sm text-gray-400">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-sm text-gray-300">Monthly Transactions</td>
                      <td className="py-4 text-center text-sm text-gray-400">10K</td>
                      <td className="py-4 text-center text-sm text-gray-400">100K</td>
                      <td className="py-4 text-center text-sm text-gray-400">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-sm text-gray-300">QR Code Export</td>
                      <td className="py-4 text-center text-green-400">✓</td>
                      <td className="py-4 text-center text-green-400">✓</td>
                      <td className="py-4 text-center text-green-400">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-sm text-gray-300">Offline Signing</td>
                      <td className="py-4 text-center text-green-400">✓</td>
                      <td className="py-4 text-center text-green-400">✓</td>
                      <td className="py-4 text-center text-green-400">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-sm text-gray-300">Support</td>
                      <td className="py-4 text-center text-sm text-gray-400">Community</td>
                      <td className="py-4 text-center text-sm text-gray-400">Priority</td>
                      <td className="py-4 text-center text-sm text-gray-400">Dedicated</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-sm text-gray-300">SLA</td>
                      <td className="py-4 text-center text-sm text-gray-400">-</td>
                      <td className="py-4 text-center text-sm text-gray-400">99.9%</td>
                      <td className="py-4 text-center text-sm text-gray-400">99.99%</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-sm text-gray-300">Custom Integrations</td>
                      <td className="py-4 text-center text-sm text-gray-400">-</td>
                      <td className="py-4 text-center text-green-400">✓</td>
                      <td className="py-4 text-center text-green-400">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Is the Community plan really free?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Yes! The Community plan is completely free with unlimited transactions. It's MIT-licensed, so you can even fork it and modify it for your needs.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">What's the difference between Pro and Enterprise?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Pro is designed for teams who need priority support and advanced features. Enterprise includes dedicated support, custom integrations, and on-premise deployment options.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Can I switch plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Absolutely! You can upgrade or downgrade your plan at any time. Prorated adjustments will be applied to your billing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-black/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Do I need a credit card to sign up?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  No credit card required for the Community plan. For Pro and Enterprise, we'll invoice you based on your usage.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="mx-auto max-w-2xl border-purple-500/20 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
            <CardContent className="p-8">
              <h3 className="mb-4 text-2xl font-bold text-white">Ready to get started?</h3>
              <p className="mb-6 text-gray-300">
                Join thousands of developers building secure, non-custodial Solana applications.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => (window.location.href = '/')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Try the Demo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://github.com/airgapped-priv/sdk')}
                >
                  View on GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>Need help? Contact us at <a href="mailto:support@offlinesign.dev" className="text-purple-400 hover:text-purple-300">support@offlinesign.dev</a></p>
        </div>
      </main>
    </div>
  )
}
