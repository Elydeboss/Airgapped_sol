# Threat Model for OfflineSign

## System Overview

OfflineSign is a non-custodial, air-gapped Solana SDK that enables secure offline transaction signing. The system consists of:

- **SDK Package**: TypeScript/JavaScript library for cryptographic operations
- **Demo Application**: Next.js 15 web interface for wallet connection
- **Offline Signer**: Standalone HTML file for air-gapped signing
- **Enterprise Features**: Audit logging, RBAC, policy enforcement, HSM integration

---

## Asset Identification

### Critical Assets
1. **Private Keys**: User's Solana private keys (highest value)
2. **Signed Transactions**: Authorized transaction signatures
3. **Audit Logs**: Immutable compliance trail
4. **Session Tokens**: Authentication credentials
5. **Policy Rules**: Governance and compliance rules

### Security Boundaries
- **Online Device**: Internet-connected, runs demo app, creates unsigned transactions
- **Offline Device**: Air-gapped, contains private keys, signs transactions
- **QR Codes**: Transfer mechanism between online/offline devices
- **HSM** (optional): Hardware-backed key storage and signing

---

## Threat Analysis

### Threat 1: Offline Device Compromise

**Description**: Attacker gains physical access to offline device containing private keys.

**Impact**: HIGH
- Unauthorized transaction signing
- Total loss of funds
- Irreversible key compromise

**Likelihood**: LOW
- Requires physical access to air-gapped device
- Device is typically stored securely
- Attacker would need device in hand

**Mitigations**:
- Device encryption (full disk encryption)
- Strong physical security (safe, vault)
- Regular key rotation for high-value wallets
- Multi-signature requirements for large amounts
- HSM integration for additional protection

**Residual Risk**: LOW

---

### Threat 2: QR Code Interception

**Description**: Attacker captures or manipulates QR code during transfer between online and offline devices.

**Impact**: MEDIUM
- Transaction details exposed
- Potential transaction modification
- Failed transactions

**Likelihood**: LOW-MEDIUM
- QR codes typically displayed in trusted environment
- Short transmission window
- Transaction requires additional signing

**Mitigations**:
- Encrypted QR code payload
- Transaction verification before signing
- Secure QR code generation (base58 encoding)
- User education on secure transfer

**Residual Risk**: LOW

---

### Threat 3: Session Token Theft

**Description**: Attacker steals session token from user's browser or storage.

**Impact**: MEDIUM
- Unauthorized access to demo app
- View audit logs and transaction history
- Cannot sign transactions (keys offline)

**Likelihood**: MEDIUM
- Standard web application attack vector
- XSS vulnerabilities could expose tokens
- LocalStorage can be accessed via client-side attacks

**Mitigations**:
- Short-lived session tokens (30 days)
- Secure token generation
- HttpOnly cookies (future enhancement)
- CSRF protection
- Regular session cleanup
- IP validation (future enhancement)

**Residual Risk**: MEDIUM

---

### Threat 4: Malicious Transaction Injection

**Description**: Attacker tricks user into signing malicious transaction through QR code.

**Impact**: HIGH
- Unauthorized fund transfer
- Loss of assets
- Transaction cannot be reversed

**Likelihood**: MEDIUM
- Social engineering attacks
- QR code spoofing possible
- User may not verify transaction details

**Mitigations**:
- Transaction preview before signing
- Clear display of transaction details
- Recipient verification
- Amount verification
- Multi-signature approval for large transactions
- Policy enforcement (amount limits, recipient whitelist)

**Residual Risk**: MEDIUM

---

### Threat 5: Supply Chain Attack

**Description**: Attacker compromises third-party dependency to inject malicious code.

**Impact**: HIGH
- Complete system compromise
- Key theft
- Transaction manipulation

**Likelihood**: LOW-MEDIUM
- Dependencies on Solana ecosystem libraries
- Regular dependency updates
- Automated vulnerability scanning

**Mitigations**:
- Automated dependency scanning (GitHub Actions, Snyk)
- CodeQL static analysis
- Regular dependency updates
- Security review of new dependencies
- Lock file integrity checks
- Minimum viable dependencies

**Residual Risk**: LOW

---

### Threat 6: Denial of Service

**Description**: Attacker overwhelms system with requests, causing unavailability.

**Impact**: LOW-MEDIUM
- Service unavailability
- Failed transactions
- User frustration

**Likelihood**: MEDIUM
- Standard web application attack
- Rate limiting may not be sufficient

**Mitigations**:
- Rate limiting on API endpoints
- CDN/DDoS protection (future)
- Caching static resources
- Graceful degradation
- Auto-scaling infrastructure (future)

**Residual Risk**: LOW

---

### Threat 7: Insider Threat

**Description**: Authorized user abuses access for malicious purposes.

**Impact**: HIGH
- Unauthorized fund transfers
- Data theft
- Compliance violations

**Likelihood**: LOW
- Requires trusted insider
- Audit logging tracks all actions
- Multi-person approval for sensitive operations

**Mitigations**:
- Comprehensive audit logging (immutable trail)
- RBAC with principle of least privilege
- Require approval for large transactions
- Regular security reviews
- Background checks for privileged users
- Separation of duties

**Residual Risk**: LOW-MEDIUM

---

### Threat 8: Cryptographic Implementation Flaws

**Description**: Vulnerabilities in cryptographic implementation allow key recovery or forgery.

**Impact**: CRITICAL
- Complete system compromise
- Key extraction
- Signature forgery

**Likelihood**: LOW
- Using well-vetted libraries (@noble/hashes)
- Standard Ed25519 implementation
- No custom cryptography
- Peer-reviewed dependencies

**Mitigations**:
- Use standard, well-audited libraries
- No custom cryptographic implementations
- Regular security audits
- Cryptographic test vectors
- Peer review of all crypto code

**Residual Risk**: VERY LOW

---

### Threat 9: Side-Channel Attacks

**Description**: Attacker extracts cryptographic keys through timing analysis, power analysis, or other side channels.

**Impact**: MEDIUM-HIGH
- Private key exposure
- Signature forgery
- Transaction compromise

**Likelihood**: VERY LOW
- Software-based signing (no hardware side channels)
- Attack requires local access to device
- Constant-time cryptographic operations

**Mitigations**:
- Constant-time comparison functions
- No sensitive data in memory longer than necessary
- Secure memory zeroization
- HSM integration for additional protection

**Residual Risk**: VERY LOW

---

### Threat 10: Compromised Recovery Mechanism

**Description**: Attacker exploits key backup/recovery process to extract keys.

**Impact**: HIGH
- Key exposure
- Fund theft

**Likelihood**: LOW
- No traditional recovery mechanism (air-gapped design)
- User responsible for key backup
- Recovery would require physical access

**Mitigations**:
- No server-side key storage
- No recovery mechanism that can be exploited
- User education on key backup security
- Optional social recovery (future, requires careful design)

**Residual Risk**: LOW

---

## Risk Assessment Matrix

| Threat | Impact | Likelihood | Residual Risk | Priority |
|--------|--------|------------|---------------|----------|
| Offline Device Compromise | HIGH | LOW | LOW | P2 |
| QR Code Interception | MEDIUM | LOW-MEDIUM | LOW | P3 |
| Session Token Theft | MEDIUM | MEDIUM | MEDIUM | P3 |
| Malicious Transaction Injection | HIGH | MEDIUM | MEDIUM | P1 |
| Supply Chain Attack | HIGH | LOW-MEDIUM | LOW | P2 |
| Denial of Service | LOW-MEDIUM | MEDIUM | LOW | P4 |
| Insider Threat | HIGH | LOW | LOW-MEDIUM | P2 |
| Cryptographic Implementation Flaws | CRITICAL | LOW | VERY LOW | P1 |
| Side-Channel Attacks | MEDIUM-HIGH | VERY LOW | VERY LOW | P3 |
| Compromised Recovery | HIGH | LOW | LOW | P2 |

---

## Control Effectiveness

### Strong Controls
- Air-gapped architecture (physical isolation)
- Standard cryptographic libraries
- Comprehensive audit logging
- Multi-signature support
- HSM integration capability

### Moderate Controls
- Transaction preview and verification
- Session management
- Rate limiting
- Dependency scanning
- RBAC with least privilege

### Weak Controls
- No client-side hardware security (software-based)
- Relies on user education for security
- Limited protection against social engineering
- No current protection against side-channel attacks (software limitation)

---

## Security Architecture Principles

### Defense in Depth
1. **Physical Isolation**: Air-gapped signing environment
2. **Cryptography**: Ed25519, AES-256-GCM, PBKDF2
3. **Access Control**: RBAC, multi-factor authentication
4. **Audit**: Immutable logging for compliance
5. **Monitoring**: Policy enforcement, violation detection

### Security by Design
1. **Non-custodial**: Keys never leave user control
2. **No Server Trust**: No server-side key storage or reconstruction
3. **Minimize Attack Surface**: Zero-trust architecture
4. **Fail Secure**: Deny by default, explicit allow

### Compliance & Governance
1. **SOC 2 Ready**: Audit trails, access controls, incident response
2. **ISO 27001**: Risk management, asset classification
3. **GDPR Capable**: Data protection, user rights management
4. **SOC 2 Compliance**: Comprehensive security controls

---

## Recommendations

### Short Term (Next 1-3 months)
1. Implement transaction verification UI with clear warnings
2. Add rate limiting to all API endpoints
3. Implement CSRF protection
4. Add security headers to demo app

### Medium Term (3-6 months)
1. Complete penetration testing engagement
2. Implement HSM integration for production users
3. Add bug bounty program
4. Complete SOC 2 Type II certification
5. Implement IP validation for sessions

### Long Term (6-12 months)
1. Complete ISO 27001 certification
2. Implement hardware security module support
3. Add advanced threat detection
4. Implement zero-trust architecture enhancements

---

**Last Updated**: 2026-04-22
**Version**: 1.0.0
**Next Review**: 2026-07-22

## Appendix: Attack Trees

### Attack Tree: Steal Funds via Malicious Transaction

**Goal**: Steal user funds by tricking them into signing malicious transaction

```
├── Social Engineering Attack
│   ├── Create fake website mimicking legitimate service
│   ├── Send phishing email with malicious QR code
│   └── Exploit user confusion about transaction details
├── Technical Attack
│   ├── Compromise user's online device
│   ├── Modify transaction creation flow
│   └── Manipulate QR code generation
└── Mitigations
    ├── Transaction preview shows exact details
    ├── Recipient verification
    ├── Amount verification
    └── Multi-signature approval for large amounts
```

### Attack Tree: Extract Private Keys via Side Channels

**Goal**: Extract private keys through timing or power analysis

```
├── Timing Analysis
│   ├── Measure signing operation duration
│   ├── Analyze memory access patterns
│   └── Extract key bits
├── Power Analysis
│   ├── Measure power consumption during signing
│   ├── Analyze electromagnetic emissions
│   └── Extract key material
├── Cache Attacks
│   ├── Analyze cache timing
│   ├── Flush+reload attacks
│   └── Extract key components
└── Mitigations
    ├── Constant-time cryptographic operations
    ├── No sensitive data in memory longer than necessary
    ├── Secure memory zeroization
    └── HSM integration for hardware protection
```
