import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/core/index.ts', 'src/hooks/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  target: 'es2022',
  external: ['react', 'react-dom'],
  treeshake: true,
  minify: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  esbuildOptions(options) {
    options.banner = {
      js: `/**
 * @airgapped-priv/sdk
 * Non-custodial, air-gapped Solana SDK
 * MIT License
 */`,
    }
  },
})
