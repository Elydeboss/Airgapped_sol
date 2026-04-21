# OfflineSign

> Non-custodial, air-gapped Solana SDK with zero vendor lock-in

**[Phase 1: Monorepo + SDK skeleton + basic Solana connection]** 🚧

## Overview

OfflineSign is a fully non-custodial Solana SDK that enables air-gapped transaction signing without recurring SaaS fees or vendor lock-in. Built for developers who want complete control over their users' keys while offering a seamless onboarding experience.

### Key Features

- ✅ **True Non-custodial**: Native Solana keypairs, no server-side reconstruction
- 🔒 **Air-gapped Signing**: Create, export, and sign transactions completely offline via QR codes
- 🔌 **Wallet Adapter Ready**: Works with Phantom, Backpack, and all standard Solana wallets
- 🚀 **Future-proof**: Ready for Ika dWallets (Q2 2026)
- 📦 **NPM Ready**: Install with `npm install @airgapped-priv/sdk` and integrate in <5 minutes

### Why OfflineSign?

| Feature | OfflineSign | Privy | Magic.link |
|---------|-------------|-------|------------|
| Non-custodial | ✅ True | ❌ Hybrid | ❌ Hybrid |
| Air-gapped support | ✅ Native | ❌ No | ❌ No |
| Recurring fees | ❌ None | ✅ Yes | ✅ Yes |
| Open source | ✅ MIT | ❌ No | ❌ No |
| Vendor lock-in | ❌ None | ✅ Yes | ✅ Yes |

## Project Structure

```
airgapped-privy/
├── packages/
│   └── sdk/              # Main SDK package (@airgapped-priv/sdk)
├── apps/
│   └── demo/             # Next.js demo app
└── README.md
```

## Installation

```bash
# Install dependencies
bun install

# Build SDK
bun run sdk:build

# Run demo app
bun run demo:dev
```

## SDK Usage

```typescript
import { createUnsignedTxMessage, exportForCold, signOffline } from '@airgapped-priv/sdk'
import { Keypair } from '@solana/web3.js'

// Create an unsigned transaction for offline signing
const unsignedTx = await createUnsignedTxMessage(
  instructions,
  connection,
  keypair.publicKey
)

// Export as QR code (for cold storage)
const qrData = await exportForCold(unsignedTx, 'qr')

// Sign completely offline (air-gapped)
const signedTx = signOffline(unsignedTx, keypair)
```

## Development Status

- [x] Phase 1: Monorepo + SDK skeleton + basic Solana connection
- [ ] Phase 2: Air-gapped / offline signing flow
- [ ] Phase 3: dWallet creation + onboarding
- [ ] Phase 4: Polish + publish-ready SDK + docs
- [ ] Phase 5: Ika pre-alpha hooks

## Security

⚠️ **Important**: This SDK handles private keys. Never expose keys in logs, error messages, or client-side storage in production.

For production use:
- Encrypt all local storage with user's password/passkey
- Use secure enclaves for key management when possible
- Follow OWASP guidelines for cryptographic storage

## License

MIT

## Resources

- [Solana Docs: Offline Transactions](https://solana.com/docs/advanced/offline-transactions)
- [Wallet Adapter](https://github.com/anza-xyz/wallet-adapter)
- [Ika dWallets](https://ika.xyz)

---

**Built with ❤️ for the Solana ecosystem**
# Airgapped_sol
