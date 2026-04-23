# Compliance Features Guide

## Overview

OfflineSign SDK provides comprehensive compliance features to help organizations meet regulatory requirements including SOC 2 Type II, ISO 27001, GDPR, and other frameworks. This guide covers all compliance capabilities.

---

## Supported Compliance Frameworks

| Framework | Status | Target Date |
|-----------|--------|-------------|
| SOC 2 Type II | In Progress | Q3 2026 |
| ISO 27001 | Planned | Q4 2026 |
| GDPR | Supported | Now |
| PCI DSS | Partial | Future |
| SOX | Partial | Future |
| HIPAA | Partial | Future |

---

## Core Compliance Features

### 1. Immutable Audit Trail

All system events are logged with tamper-evident storage.

**Event Types Logged (30+):**
- Authentication (login, logout, failed attempts)
- Transaction operations (create, sign, broadcast, fail)
- Key management (generate, import, export, delete)
- Policy events (create, update, delete, violations)
- Admin actions (user management, config changes)
- Security incidents (alerts, breaches, unauthorized access)

**Usage:**
```typescript
import { AuditLogger, AuditEventType } from '@airgapped-priv/sdk'

const logger = new AuditLogger({
  storage: 'postgresql',
  connectionString: process.env.DATABASE_URL,
  retentionDays: 365,
})

// Log events
await logger.logEvent({
  eventType: AuditEventType.TRANSACTION_SIGN,
  userId: 'user-123',
  sessionId: 'session-456',
  timestamp: new Date(),
  details: {
    transactionId: 'tx-789',
    amount: 1000,
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  },
  severity: 'low',
  status: 'success',
})

// Query audit trail
const trail = await logger.getAuditTrail({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  eventType: AuditEventType.TRANSACTION_SIGN,
})
```

**Audit Trail Properties:**
- **Immutable**: Logs cannot be modified or deleted
- **Tamper-Evident**: Any unauthorized changes are detectable
- **Complete**: All relevant events are captured
- **Searchable**: Query by date, type, user, severity
- **Exportable**: CSV and JSON export for compliance reporting

### 2. Access Control (RBAC)

Role-based access control with granular permissions.

**50+ Permissions Across 11 Categories:**
- Transaction (create, sign, broadcast, view)
- Key (generate, import, export, delete, manage)
- Wallet (connect, disconnect, view balance)
- User (create, update, delete, view, manage)
- Role (assign, revoke, view, manage)
- Audit (view, export, manage)
- Policy (create, update, delete, view, enforce)
- Workflow (create, approve, reject, view, manage)
- Admin (system config, maintenance, view)
- Security (alerts, incidents, investigate)
- Report (generate, view, export)

**Usage:**
```typescript
import { RBACManager, Role, Permission } from '@airgapped-priv/sdk'

const rbac = new RBACManager()

// Assign role to user
await rbac.assignRole('user-123', Role.OPERATOR)

// Check permissions
const canSign = await rbac.hasPermission('user-123', Permission.SIGN_TRANSACTION)

// Require permission (throws if not authorized)
await rbac.requirePermission('user-123', Permission.SIGN_TRANSACTION)

// Custom role with specific permissions
await rbac.createRole('treasury-operator', [
  Permission.CREATE_TRANSACTION,
  Permission.SIGN_TRANSACTION,
  Permission.VIEW_AUDIT_LOGS,
])
```

**Access Control Principles:**
- **Least Privilege**: Users only get necessary permissions
- **Separation of Duties**: Critical operations require multiple people
- **Need-to-Know**: Access restricted to relevant data
- **Auditability**: All access attempts logged

### 3. Approval Workflows

Multi-person approval for sensitive operations.

**Approval Types:**
- **Sequential**: Chain of approvals (CFO → CEO)
- **Parallel**: Multiple approvers, any combination
- **Threshold**: M of N signatures required
- **Timelock**: Delayed execution with cooling-off period

**Usage:**
```typescript
import { WorkflowEngine, ApprovalPolicy } from '@airgapped-priv/sdk'

const engine = new WorkflowEngine()

// Create workflow with approval policy
const workflow = await engine.createWorkflow(transaction, {
  type: 'threshold',
  requiredApprovers: 3,
  totalApprovers: 5,
  timeout: 86400, // 24 hours
})

// Request approvals
await engine.requestApproval(workflow.id, [
  new PublicKey('approver-1-public-key'),
  new PublicKey('approver-2-public-key'),
  new PublicKey('approver-3-public-key'),
])

// Approvers provide signatures
await engine.approveStep(workflow.id, 'step-id', approverSignature)

// Execute when threshold reached
const signature = await engine.executeWorkflow(workflow.id)
```

**Workflow Features:**
- **Configurable Policies**: Customize approval requirements
- **Expiration**: Automatic timeout for stale approvals
- **Notifications**: Alert approvers of pending requests
- **Audit Trail**: Complete workflow history logged
- **Cancellation**: Ability to cancel pending workflows

### 4. Policy Enforcement

Automated governance rules for transactions.

**Policy Types:**
- Amount limits (per transaction, daily, weekly, monthly)
- Recipient whitelists/blacklists
- Time restrictions (business hours, maintenance windows)
- Geographic restrictions
- Frequency limits
- Custom business rules

**Usage:**
```typescript
import { PolicyEngine, PolicyRules } from '@airgapped-priv/sdk'

const engine = new PolicyEngine()

// Add policies
engine.addPolicy(PolicyRules.amountLimit({
  maxAmount: 100000,
  period: 'daily',
}))

engine.addPolicy(PolicyRules.recipientWhitelist({
  addresses: approvedAddresses,
}))

// Evaluate transaction
const result = await engine.evaluate(transaction, context)

if (!result.allowed) {
  console.log('Transaction denied:', result.reason)
  // Transaction blocked
}

// Enforce policy (auto-creates workflow if needed)
const enforced = await engine.enforce(transaction, context)
```

**Policy Features:**
- **Pre-Transaction Validation**: Check before signing
- **Real-Time Enforcement**: Block non-compliant transactions
- **Violation Tracking**: Log all policy violations
- **Alerting**: Notify on policy violations
- **Reporting**: Generate compliance reports

### 5. Data Protection

Encryption and protection for sensitive data.

**Encryption:**
- **At Rest**: AES-256-GCM for private keys
- **In Transit**: TLS 1.3+ for all communications
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Random IV**: Unique IV per encryption operation

**Usage:**
```typescript
import { encryptKeypair, decryptKeypair } from '@airgapped-priv/sdk'

// Encrypt with password
const encrypted = await encryptKeypair(keypair, 'strong-password')

// Decrypt with password
const decrypted = await decryptKeypair(encrypted, 'strong-password')
```

**Data Protection Features:**
- **User Control**: Users control their keys
- **No Server Storage**: Non-custodial architecture
- **Secure Memory**: Zeroization on disposal
- **Backup Support**: User-controlled backups

### 6. Session Management

Secure session handling with expiration.

**Session Features:**
- **Token-Based**: Secure random session tokens
- **Expiration**: 30-day default lifetime
- **Activity Tracking**: Session activity logging
- **Multi-Device**: Support multiple concurrent sessions
- **Revocation**: Immediate session termination

**Usage:**
```typescript
import { AuthManager } from '@airgapped-priv/sdk'

const auth = new AuthManager()

// Create session
const session = await auth.createSession(userId, {
  duration: 30 * 24 * 60 * 60 * 1000, // 30 days
  metadata: { ipAddress, userAgent },
})

// Validate session
const valid = await auth.validateSession(session.token)

// Revoke session
await auth.revokeSession(session.token)
```

---

## Compliance Reports

### SOC 2 Type II Report

```typescript
import { ComplianceGenerator } from '@airgapped-priv/sdk'

const generator = new ComplianceGenerator(auditLogger)

// Generate SOC 2 report
const report = await generator.generateSOC2Report({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-31'),
})

// Report includes:
// - Access control summary
// - Incident response documentation
// - Change management records
// - Risk assessment results
// - Compliance metrics
```

**SOC 2 Trust Service Criteria Covered:**

1. **Security**
   - Access control (RBAC, multi-factor auth)
   - System monitoring (audit logging, alerts)
   - Data protection (encryption, secure storage)
   - Incident response (procedures, playbooks)

2. **Availability**
   - System monitoring (health checks, metrics)
   - Disaster recovery (backups, RTO/RPO)
   - Business continuity (procedures, testing)

3. **Processing Integrity**
   - Transaction validation (policy enforcement)
   - Approval workflows (multi-person controls)
   - Audit logging (complete trail)

4. **Confidentiality**
   - Data encryption (at rest, in transit)
   - Access controls (least privilege)
   - Data retention (user-controlled)

5. **Privacy**
   - Data minimization (only necessary data)
   - User rights (access, deletion, portability)
   - Consent management (clear mechanisms)

### Transaction Activity Report

```typescript
// Generate transaction report
const txReport = await generator.generateTransactionReport({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
})

// Report includes:
// - Total transaction count
// - Total volume
// - Success/failure rates
// - Average transaction size
// - Top recipients
```

### Audit Trail Report

```typescript
// Generate audit trail report
const auditReport = await generator.generateAuditReport({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
})

// Report includes:
// - All audit events
// - Event breakdown by type
// - User activity summaries
// - Security incidents
// - Policy violations
```

### User Activity Report

```typescript
// Generate user activity report
const userReport = await generator.generateUserActivityReport({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
})

// Report includes:
// - Login/logout activity
// - Failed authentication attempts
// - User session statistics
// - Geographic distribution
// - Device usage
```

### Policy Violation Report

```typescript
// Generate policy violation report
const violationReport = await generator.generatePolicyViolationReport({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
})

// Report includes:
// - Total violations
// - Violations by severity
// - Violations by policy
// - Trending violations
// - Remediation status
```

### Security Incident Report

```typescript
// Generate security incident report
const incidentReport = await generator.generateSecurityIncidentReport({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
})

// Report includes:
// - Total incidents
// - Incidents by severity
// - Response times
// - Resolution status
// - Lessons learned
```

---

## GDPR Compliance

### Data Subject Rights

```typescript
import { UserDataManager } from '@airgapped-priv/sdk'

const dataManager = new UserDataManager()

// Right to Access (Data Portability)
const userData = await dataManager.exportUserData('user-123')
// Returns: All user data in machine-readable format

// Right to Deletion (Right to be Forgotten)
await dataManager.deleteUserData('user-123')
// Deletes: All user data from system

// Right to Rectification
await dataManager.updateUserData('user-123', updates)
// Updates: User can correct inaccurate data

// Right to Restrict Processing
await dataManager.restrictProcessing('user-123')
// Restricts: Limits data processing to storage only
```

### Consent Management

```typescript
import { ConsentManager } from '@airgapped-priv/sdk'

const consent = new ConsentManager()

// Record consent
await consent.recordConsent('user-123', {
  dataProcessing: true,
  marketingEmails: false,
  analytics: true,
  timestamp: new Date(),
  ipAddress: '192.168.1.1',
})

// Check consent
const hasConsent = await consent.hasConsent('user-123', 'dataProcessing')

// Withdraw consent
await consent.withdrawConsent('user-123', 'marketingEmails')
```

### Data Breach Notification

```typescript
import { IncidentManager } from '@airgapped-priv/sdk'

const incidents = new IncidentManager()

// Report breach
await incidents.reportBreach({
  severity: 'high',
  affectedUsers: ['user-1', 'user-2', 'user-3'],
  description: 'Unauthorized access incident',
  discoveryTime: new Date(),
  containmentTime: new Date(),
  notificationRequired: true,
  // Notify affected users within 72 hours
  await notifyAffectedUsers(incident),
})
```

---

## Compliance Checklists

### SOC 2 Readiness Checklist

- [ ] **Access Control**
  - [ ] RBAC implemented with 50+ granular permissions
  - [ ] Multi-factor authentication available
  - [ ] Session management with expiration
  - [ ] Privileged access review process

- [ ] **Audit Logging**
  - [ ] Immutable audit trail implemented
  - [ ] 30+ event types logged
  - [ ] Audit log retention (1 year default)
  - [ ] Regular audit log reviews

- [ ] **Incident Response**
  - [ ] Incident response plan documented
  - [ ] Response team assigned
  - [ ] Escalation procedures defined
  - [ ] Post-incident reviews conducted

- [ ] **Change Management**
  - [ ] Configuration changes tracked
  - [ ] Approval process for changes
  - [ ] Testing before production deployment
  - [ ] Rollback procedures documented

- [ ] **Risk Management**
  - [ ] Risk assessment process
  - [ ] Risk register maintained
  - [ ] Mitigation plans documented
  - [ ] Regular risk reviews

- [ ] **Data Protection**
  - [ ] Encryption at rest (AES-256-GCM)
  - [ ] Encryption in transit (TLS 1.3+)
  - [ ] Secure key management
  - [ ] Data classification policy

- [ ] **Vendor Management**
  - [ ] Third-party risk assessments
  - [ ] Vendor review process
  - [ ] SLAs documented
  - [ ] Regular vendor reviews

### ISO 27001 Readiness Checklist

- [ ] **Information Security Policies**
  - [ ] Information security policy published
  - [ ] Policy review process
  - [ ] Policy communication to all employees
  - [ ] Policy compliance monitoring

- [ ] **Risk Assessment**
  - [ ] Risk assessment methodology
  - [ ] Asset identification and valuation
  - [ ] Risk analysis process
  - [ ] Risk treatment planning

- [ ] **Asset Management**
  - [ ] Asset inventory maintained
  - [ ] Asset classification scheme
  - [ ] Asset labeling
  - [ ] Asset acceptance process

- [ ] **Access Control**
  - [ ] Access control policy
  - [ ] User access management
  - [ ] User registration and deregistration
  - [ ] Privileged access management

- [ ] **Cryptography**
  - [ ] Cryptography policy
  - [ ] Encryption standards defined
  - [ ] Key management process
  - [ ] Cryptographic algorithm selection

- [ ] **Operations Security**
  - [ ] Operating procedures documented
  - [ ] Change management process
  - [ ] Capacity planning
  - [ ] Backup and recovery procedures

- [ ] **Communications Security**
  - [ ] Network security controls
  - [ ] Information transfer policies
  - [ ] Security of information in transit
  - [ ] Security of information at rest

### GDPR Readiness Checklist

- [ ] **Lawfulness, Fairness, Transparency**
  - [ ] Legal basis for processing identified
  - [ ] Privacy notice provided
  - [ ] Transparent processing practices
  - [ ] Fair processing of data

- [ ] **Purpose Limitation**
  - [ ] Specific purposes defined
  - [ ] Compatible processing only
  - [ ] Purpose documented
  - [ ] No further processing without consent

- [ ] **Data Minimization**
  - [ ] Adequate, relevant, limited data
  - [ ] Minimal data collection
  - [ ] Data retention limits
  - [ ] Regular data review

- [ ] **Accuracy**
  - [ ] Accurate and up-to-date data
  - [ ] Data correction procedures
  - [ ] Inaccurate data deletion
  - [ ] Data quality processes

- [ ] **Storage Limitation**
  - [ ] Retention periods defined
  - [ ] Data deletion procedures
  - [ ] Regular data review
  - [ ] Secure data disposal

- [ ] **Integrity and Confidentiality**
  - [ ] Security measures implemented
  - [ ] Access controls
  - [ ] Encryption
  - [ ] Regular security testing

- [ ] **Accountability**
  - [ ] Records of processing activities
  - [ ] Data protection by design
  - [ ] Data protection impact assessments
  - [ ] Data protection officer appointed

---

## Compliance Metrics

### Key Performance Indicators

```typescript
// Compliance metrics to track
const complianceMetrics = {
  // Access Control
  uniqueUsersWithAccess: 150,
  privilegedUsers: 12,
  failedAuthenticationAttempts: 23,
  mfaAdoptionRate: 0.95,

  // Audit Logging
  totalAuditEvents: 150000,
  eventsPerDay: 5000,
  auditLogQueryTime: 150, // ms
  logRetentionDays: 365,

  // Policy Enforcement
  policyViolationRate: 0.02, // 2%
  blockedTransactions: 45,
  approvedTransactions: 2200,
  averageApprovalTime: 1800, // seconds

  // Incident Response
  totalIncidents: 3,
  criticalIncidents: 0,
  highIncidents: 1,
  averageResponseTime: 900, // seconds
  averageResolutionTime: 7200, // seconds

  // Data Protection
  encryptedDataAtRest: '100%',
  encryptedDataInTransit: '100%',
  keyRotationDays: 90,
  dataBreachIncidents: 0,
}
```

---

## Best Practices

### 1. Implement Defense in Depth

```typescript
// Multiple layers of security controls
const controls = [
  rbac.requirePermission(user, Permission.SIGN_TRANSACTION),
  policyEngine.evaluate(transaction, context),
  workflowEngine.requireApproval(transaction),
  auditLogger.logEvent({ eventType: 'TRANSACTION_SIGN' }),
]
```

### 2. Maintain Complete Audit Trail

```typescript
// Log everything
await auditLogger.logEvent({
  eventType: AuditEventType.TRANSACTION_CREATE,
  userId: user.id,
  timestamp: new Date(),
  details: { transactionId, amount, recipient },
  severity: 'low',
  status: 'success',
  ipAddress: context.ip,
  userAgent: context.userAgent,
})
```

### 3. Regular Security Reviews

```typescript
// Schedule regular reviews
const reviewTasks = [
  'Weekly: Review policy violations',
  'Monthly: Review user access',
  'Quarterly: Review and update policies',
  'Annually: Complete risk assessment',
]
```

### 4. Continuous Compliance Monitoring

```typescript
// Monitor compliance continuously
setInterval(async () => {
  const violations = await auditLogger.getRecentPolicyViolations()
  if (violations.length > THRESHOLD) {
    await escalateToComplianceTeam(violations)
  }
}, 3600000) // Every hour
```

---

## Compliance Support

### Getting Compliance Assistance

For compliance questions or assistance:
- **Email**: compliance@offlinesign.dev
- **Documentation**: docs/enterprise/
- **Security**: security@offlinesign.dev

### Third-Party Auditors

We work with recognized audit firms for:
- SOC 2 Type II audits
- ISO 27001 certifications
- Penetration testing
- Security assessments

---

**Last Updated:** 2026-04-22
**Version:** 1.0.0
