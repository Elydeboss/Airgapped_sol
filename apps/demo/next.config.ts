import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@airgapped-priv/sdk'],
  experimental: {
    optimizePackageImports: ['@airgapped-priv/sdk', 'lucide-react'],
  },
  webpack: (config) => {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          sdk: {
            test: /[\\/]node_modules[\\/]@airgapped-priv[\\/]/,
            name: 'sdk',
            priority: 10,
            reuseExistingChunk: true,
          },
          solana: {
            test: /[\\/]node_modules[\\/](@solana|bs58|@noble)[\\/]/,
            name: 'solana',
            priority: 9,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: 1,
            reuseExistingChunk: true,
          },
        },
      },
    }
    return config
  },
}

export default nextConfig
