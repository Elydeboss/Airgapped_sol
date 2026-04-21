# OfflineSign Demo App

This is the official demo application for the **OfflineSign** SDK - showcasing air-gapped Solana transaction signing.

## Features

- ✅ **Wallet Connection**: Connect with Phantom, Backpack, and other Solana wallets
- 📱 **QR Code Export**: Create transactions and export as optimized QR codes
- 🔒 **Air-Gapped Signing**: Sign transactions completely offline (Phase 2)
- 💰 **Balance Display**: Check SOL balance for connected wallet
- 🌐 **Network Switching**: Toggle between Devnet, Mainnet, and Testnet

## Getting Started

### Prerequisites

- Node.js 20+ or Bun 1.0+
- A Solana wallet (Phantom recommended)

### Installation

```bash
# From project root
bun install

# Run the demo
bun run demo:dev
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
cp .env.local.example .env.local
```

For production, get a free Helius API key at https://www.helius.dev/

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and select your Solana wallet
2. **Get Balance**: View your SOL balance on the selected network
3. **Create Offline TX**: Generate a sample transaction and export as QR code
4. **Download QR**: Save the QR code for offline signing

## Development

```bash
# Development server
bun run dev

# Production build
bun run build

# Start production server
bun start
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Wallet**: Solana Wallet Adapter
- **SDK**: @airgapped-priv/sdk

## Future Features

- [ ] Offline signer page (single-file HTML bundle)
- [ ] QR code scanner for importing signed transactions
- [ ] Multi-signature transaction support
- [ ] Ika dWallet integration (Q2 2026)

## Security Notes

⚠️ **This is a demo application**:
- Uses localStorage for convenience
- Not production-ready for mainnet with real funds
- For production use, implement proper key encryption and secure storage

## License

MIT

## Support

- GitHub: [github.com/airgapped-priv/sdk](https://github.com/airgapped-priv/sdk)
- Issues: [github.com/airgapped-priv/sdk/issues](https://github.com/airgapped-priv/sdk/issues)
