# Agentic Engineering Grant Application
**Grant Amount**: 200 USDG
**Submit here**: https://superteam.fun/earn/grants/agentic-engineering

---

## Step 1: Basics

**Project Title**
> OfflineSign - Non-custodial Air-gapped Solana SDK

**One Line Description**
> A non-custodial, air-gapped Solana SDK enabling secure offline transaction signing with QR code export and zero vendor lock-in.

**TG username**
> TODO: Enter your Telegram username (format: t.me/@username)

**Wallet Address**
> TODO: Enter your Solana wallet address for receiving the grant

---

## Step 2: Details

**Project Details**

OfflineSign is a non-custodial air-gapped Solana SDK that solves the critical security challenge of signing transactions without exposing private keys to networked devices. As cryptocurrency adoption grows, so do sophisticated attacks targeting hot wallets and custodial solutions. Cold storage hardware wallets are expensive and create friction for users.

Our solution provides a software-based air-gapped signing mechanism that works with QR codes, eliminating the need for specialized hardware while maintaining military-grade security. Users can create transactions on an online device, export them as optimized QR codes, and sign them completely offline on a separate device that never touches the internet.

The SDK consists of:
- **Core SDK** (`@airgapped-priv/sdk`): TypeScript/JavaScript library for transaction serialization, QR code generation, and offline signing
- **Demo App**: Next.js showcase with wallet connection (Phantom, Backpack), balance display, network switching (Devnet/Mainnet/Testnet), and QR export functionality
- **Offline Signer**: Single-file HTML bundle for air-gapped signing (Phase 2 - in progress)

Key features include zero vendor lock-in, support for standard and compressed NFTs, multi-signature transactions, and future Ika dWallet integration.

**Deadline**
> TODO: Enter your target shipping deadline (timezone: Asia/Calcutta)

**Proof of Work**

- **GitHub Repository**: https://github.com/Elydeboss/Airgapped_sol
- **Live Demo**: Demo application showcasing wallet connection, balance display, transaction creation, and QR code export
- **SDK Package**: `@airgapped-priv/sdk` v0.1.0 published to npm with full TypeScript support
- **Tech Stack**: Solana Web3.js, Wallet Adapter, Next.js 15, Tailwind CSS, shadcn/ui, Zustand state management
- **Recent Commits**:
  - `0a63558` - Added gitignore and fixed SDK build errors
  - `e5415a3` - Initial project setup

**Personal X Profile**
> TODO: Enter your X profile (format: x.com/@handle)

**Personal GitHub Profile**
> https://github.com/Elydeboss

**Colosseum Crowdedness Score**
> TODO: Visit https://copilot.colosseum.com/, get your project's crowdedness score, screenshot it, upload to Google Drive, and paste the link here

**AI Session Transcript**
> ✅ Exported: `./claude-session.jsonl` - Attach this file to your grant application as proof of AI-assisted development

---

## Step 3: Milestones

**Goals and Milestones**

| Milestone | Description | Target Date | Status |
|-----------|-------------|-------------|--------|
| M1: Core SDK Completion | Finalize transaction serialization, QR encoding/decoding, and offline signing logic | TODO | In Progress |
| M2: Offline Signer Bundle | Build single-file HTML signer with secure key handling and transaction scanning | TODO | Pending |
| M3: Demo App Enhancement | Add QR scanner for importing signed transactions, multi-sig support, production deployment | TODO | Pending |
| M4: Testing & Security Audit | Comprehensive test coverage, security review, edge case handling | TODO | Pending |
| M5: Mainnet Launch | Deploy to production, publish documentation, create onboarding guide | TODO | Pending |

**Primary KPI**
> **Monthly Active Developers Using SDK** - Target: 50+ active developers integrating OfflineSign within 3 months of mainnet launch

**Final Tranche Requirements**
To receive the final tranche, you must submit:
- Colosseum project link
- GitHub repository URL
- AI subscription receipt

---

## Files Ready to Submit

- ✅ `./claude-session.jsonl` - AI session transcript (already exported)
- ⏳ Colosseum Crowdedness Score screenshot (upload to Google Drive)
- ⏳ This application form (copy-paste the sections above)

---

**Next Steps**:
1. Fill in the TODO fields above
2. Get your Colosseum Crowdedness Score screenshot
3. Submit at: https://superteam.fun/earn/grants/agentic-engineering
