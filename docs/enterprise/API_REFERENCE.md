# Enterprise API Reference

## Overview

Complete API reference for OfflineSign SDK enterprise features including audit logging, RBAC, policy enforcement, approval workflows, HSM integration, SSO, and compliance reporting.

---

## Table of Contents

1. [Audit Logging](#audit-logging)
2. [RBAC (Role-Based Access Control)](#rbac-role-based-access-control)
3. [Policy Engine](#policy-engine)
4. [Approval Workflows](#approval-workflows)
5. [HSM Integration](#hsm-integration)
6. [SSO (Single Sign-On)](#sso-single-sign-on)
7. [Compliance Reporting](#compliance-reporting)

---

## Audit Logging

### AuditLogger

Main class for audit logging operations.

```typescript
import { AuditLogger } from '@airgapped-priv/sdk'
```

#### Constructor

```typescript
constructor(config: {
  storage?: 'memory' | 'localStorage' | 'postgresql' | AuditStorage
  connectionString?: string
  retentionDays?: number
  batchSize?: number
  flushInterval?: number
})
```

**Parameters:**
- `storage` - Storage backend (default: 'memory')
- `connectionString` - Database connection string for PostgreSQL
- `retentionDays` - Days to retain logs (default: 365)
- `batchSize` - Batch size for writes (default: 100)
- `flushInterval` - Auto-flush interval in ms (default: 5000)

#### Methods

##### logEvent

```typescript
async logEvent(event: AuditEvent): Promise<void>
```

Log a single audit event.

**Parameters:**
- `event.eventType` - Type of event (AuditEventType)
- `event.userId` - User ID (optional)
- `event.sessionId` - Session ID (optional)
- `event.timestamp` - Event timestamp
- `event.details` - Event details (object)
- `event.severity` - Severity level: 'low' | 'medium' | 'high' | 'critical'
- `event.status` - Status: 'success' | 'failed' | 'pending'
- `event.metadata` - Additional metadata (optional)

**Example:**
```typescript
await logger.logEvent({
  eventType: AuditEventType.TRANSACTION_SIGN,
  userId: 'user-123',
  timestamp: new Date(),
  details: { transactionId: 'tx-789', amount: 1000 },
  severity: 'low',
  status: 'success',
})
```

##### getAuditTrail

```typescript
async getAuditTrail(filters?: {
  startDate?: Date
  endDate?: Date
  eventType?: AuditEventType | AuditEventType[]
  userId?: string
  sessionId?: string
  severity?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<AuditEvent[]>
```

Retrieve audit log events with optional filtering.

**Returns:** Array of AuditEvent objects

**Example:**
```typescript
const events = await logger.getAuditTrail({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  eventType: AuditEventType.TRANSACTION_SIGN,
  limit: 100,
})
```

##### exportAuditTrail

```typescript
async exportAuditTrail(format: 'csv' | 'json', filters?: AuditFilter): Promise<string>
```

Export audit trail in specified format.

**Returns:** Formatted string (CSV or JSON)

**Example:**
```typescript
const csv = await logger.exportAuditTrail('csv', {
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
})
```

##### generateComplianceReport

```typescript
async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceData>
```

Generate compliance report data for specified period.

**Returns:** Compliance data with metrics and summaries

**Example:**
```typescript
const report = await logger.generateComplianceReport(
  new Date('2026-01-01'),
  new Date('2026-01-31')
)
```

### AuditEventType

Enumeration of all audit event types.

```typescript
enum AuditEventType {
  // Authentication
  USER_LOGIN = 'auth.login',
  USER_LOGOUT = 'auth.logout',
  USER_LOGIN_FAILED = 'auth.login_failed',

  // Transactions
  TRANSACTION_CREATE = 'transaction.create',
  TRANSACTION_SIGN = 'transaction.sign',
  TRANSACTION_BROADCAST = 'transaction.broadcast',
  TRANSACTION_FAIL = 'transaction.fail',

  // Keys
  KEY_GENERATE = 'key.generate',
  KEY_IMPORT = 'key.import',
  KEY_EXPORT = 'key.export',
  KEY_DELETE = 'key.delete',

  // Policies
  POLICY_CREATE = 'policy.create',
  POLICY_UPDATE = 'policy.update',
  POLICY_DELETE = 'policy.delete',
  POLICY_VIOLATION = 'policy.violation',

  // Roles
  ROLE_ASSIGN = 'role.assign',
  ROLE_REVOKE = 'role.revoke',

  // Admin
  ADMIN_CONFIG_CHANGE = 'admin.config_change',
  ADMIN_USER_CREATE = 'admin.user_create',
  ADMIN_USER_DELETE = 'admin.user_delete',

  // Security
  SECURITY_ALERT = 'security.alert',
  SECURITY_BREACH_ATTEMPT = 'security.breach_attempt',
  SECURITY_MALICIOUS_ACTIVITY = 'security.malicious_activity',
  SECURITY_UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
}
```

---

## RBAC (Role-Based Access Control)

### RBACManager

Main class for role-based access control.

```typescript
import { RBACManager, Role, Permission } from '@airgapped-priv/sdk'
```

#### Methods

##### assignRole

```typescript
async assignRole(userId: string, role: Role): Promise<void>
```

Assign a role to a user.

**Parameters:**
- `userId` - User ID
- `role` - Role to assign

**Example:**
```typescript
await rbac.assignRole('user-123', Role.OPERATOR)
```

##### revokeRole

```typescript
async revokeRole(userId: string, role: Role): Promise<void>
```

Revoke a role from a user.

##### hasPermission

```typescript
async hasPermission(userId: string, permission: Permission): Promise<boolean>
```

Check if user has a specific permission.

**Returns:** Boolean indicating permission status

**Example:**
```typescript
const canSign = await rbac.hasPermission('user-123', Permission.SIGN_TRANSACTION)
```

##### requirePermission

```typescript
async requirePermission(userId: string, permission: Permission): Promise<void>
```

Require user to have permission, throws AuthorizationError if not.

**Throws:** AuthorizationError

**Example:**
```typescript
try {
  await rbac.requirePermission('user-123', Permission.SIGN_TRANSACTION)
  // Proceed with transaction
} catch (error) {
  // Handle unauthorized access
}
```

##### getUserPermissions

```typescript
async getUserPermissions(userId: string): Promise<Permission[]>
```

Get all permissions for a user.

**Returns:** Array of permissions

##### getUserRoles

```typescript
async getUserRoles(userId: string): Promise<Role[]>
```

Get all roles assigned to a user.

### Role

Enumeration of predefined roles.

```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  APPROVER = 'approver',
  VIEWER = 'viewer',
  AUDITOR = 'auditor',
  USER = 'user',
}
```

**Role Hierarchy:**
- SUPER_ADMIN (highest)
- ADMIN
- OPERATOR
- APPROVER
- VIEWER
- AUDITOR
- USER (lowest)

### Permission

Enumeration of granular permissions.

**Transaction Permissions:**
```typescript
Permission.CREATE_TRANSACTION = 'transaction:create'
Permission.SIGN_TRANSACTION = 'transaction:sign'
Permission.BROADCAST_TRANSACTION = 'transaction:broadcast'
Permission.VIEW_TRANSACTION = 'transaction:view'
Permission.CANCEL_TRANSACTION = 'transaction:cancel'
```

**Key Permissions:**
```typescript
Permission.GENERATE_KEY = 'key:generate'
Permission.IMPORT_KEY = 'key:import'
Permission.EXPORT_KEY = 'key:export'
Permission.DELETE_KEY = 'key:delete'
Permission.MANAGE_KEYS = 'key:manage'
```

**User Permissions:**
```typescript
Permission.CREATE_USER = 'user:create'
Permission.UPDATE_USER = 'user:update'
Permission.DELETE_USER = 'user:delete'
Permission.VIEW_USER = 'user:view'
Permission.MANAGE_USERS = 'user:manage'
```

**Full list available in:** `packages/sdk/src/enterprise/rbac/permissions.ts`

---

## Policy Engine

### PolicyEngine

Main class for policy evaluation and enforcement.

```typescript
import { PolicyEngine, Policy, PolicyDecision } from '@airgapped-priv/sdk'
```

#### Constructor

```typescript
constructor(config?: {
  enableCaching?: boolean
  cacheTTL?: number
  onViolation?: (violation: PolicyViolation) => Promise<void>
})
```

#### Methods

##### addPolicy

```typescript
addPolicy(policy: Policy): void
```

Add a policy to the engine.

##### removePolicy

```typescript
removePolicy(policyId: string): void
```

Remove a policy from the engine.

##### updatePolicy

```typescript
updatePolicy(policyId: string, updates: Partial<Policy>): void
```

Update an existing policy.

##### evaluate

```typescript
async evaluate(transaction: Transaction, context: PolicyEvaluationContext): Promise<PolicyDecision>
```

Evaluate a transaction against all policies.

**Returns:** PolicyDecision object
```typescript
interface PolicyDecision {
  allowed: boolean
  reason: string
  violations: PolicyViolation[]
  requiresApproval: boolean
  approvalPolicy?: ApprovalPolicy
}
```

**Example:**
```typescript
const decision = await engine.evaluate(transaction, {
  user: { id: 'user-123', role: 'operator' },
  history: { dailyTotal: 50000 },
})

if (!decision.allowed) {
  console.log('Transaction denied:', decision.reason)
}
```

##### enforce

```typescript
async enforce(transaction: Transaction, context: PolicyEvaluationContext): Promise<PolicyResult>
```

Evaluate and enforce policy decision.

**Returns:** PolicyResult with action to take

**Example:**
```typescript
const result = await engine.enforce(transaction, context)

if (result.action === 'BLOCK') {
  throw new Error('Transaction blocked by policy')
} else if (result.action === 'REQUIRE_APPROVAL') {
  await createApprovalWorkflow(transaction, result.approvalPolicy)
}
```

### PolicyRules

Helper class for creating standard policy rules.

#### amountLimit

```typescript
static amountLimit(config: {
  maxAmount: number
  currency?: string
  period?: 'transaction' | 'daily' | 'weekly' | 'monthly'
}): PolicyRule
```

Create an amount limit policy rule.

**Example:**
```typescript
const rule = PolicyRules.amountLimit({
  maxAmount: 100000,
  period: 'daily',
})
```

#### recipientWhitelist

```typescript
static recipientWhitelist(config: {
  addresses: string[]
  description?: string
}): PolicyRule
```

Create a recipient whitelist policy rule.

**Example:**
```typescript
const rule = PolicyRules.recipientWhitelist({
  addresses: ['address1', 'address2'],
  description: 'Only allow treasury addresses',
})
```

#### recipientBlacklist

```typescript
static recipientBlacklist(config: {
  addresses: string[]
  description?: string
}): PolicyRule
```

Create a recipient blacklist policy rule.

#### timeRestriction

```typescript
static timeRestriction(config: {
  allowedHours?: { start: number; end: number }
  allowedDays?: number[]
  blockedHours?: Array<{ start: number; end: number }>
  blockedDays?: number[]
  timezone?: string
}): PolicyRule
```

Create a time restriction policy rule.

**Example:**
```typescript
const rule = PolicyRules.timeRestriction({
  allowedHours: { start: 9, end: 17 },
  allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
  timezone: 'UTC',
})
```

---

## Approval Workflows

### WorkflowEngine

Main class for approval workflow orchestration.

```typescript
import { WorkflowEngine, Workflow, ApprovalPolicy } from '@airgapped-priv/sdk'
```

#### Methods

##### createWorkflow

```typescript
async createWorkflow(
  transaction: VersionedTransaction,
  policy: ApprovalPolicy
): Promise<Workflow>
```

Create a new approval workflow.

**Parameters:**
- `transaction` - Transaction requiring approval
- `policy` - Approval policy configuration

**Returns:** Workflow object

**Example:**
```typescript
const workflow = await engine.createWorkflow(transaction, {
  type: 'threshold',
  requiredApprovers: 3,
  totalApprovers: 5,
  timeout: 86400, // 24 hours
})
```

##### approveStep

```typescript
async approveStep(
  workflowId: string,
  stepId: string,
  signature: string
): Promise<WorkflowStep>
```

Approve a workflow step.

##### rejectStep

```typescript
async rejectStep(
  workflowId: string,
  stepId: string,
  reason: string
): Promise<WorkflowStep>
```

Reject a workflow step.

##### executeWorkflow

```typescript
async executeWorkflow(workflowId: string): Promise<string>
```

Execute workflow after all approvals collected.

**Returns:** Transaction signature

##### getWorkflow

```typescript
async getWorkflow(workflowId: string): Promise<Workflow>
```

Get workflow by ID.

##### getPendingWorkflows

```typescript
async getPendingWorkflows(approverPublicKey: string): Promise<Workflow[]>
```

Get all pending workflows for an approver.

### ApprovalPolicy

Interface for approval policy configuration.

```typescript
interface ApprovalPolicy {
  type: 'sequential' | 'parallel' | 'threshold' | 'timelock'
  requiredApprovers?: number
  totalApprovers?: number
  timeout?: number // seconds
  timelockDelay?: number // seconds
  approvers?: PublicKey[]
  amountThreshold?: number
  businessHoursOnly?: boolean
}
```

**Approval Types:**

1. **Sequential** - Chain of approvals (CFO → CEO)
2. **Parallel** - Multiple approvers, any order
3. **Threshold** - M of N signatures required
4. **Timelock** - Delayed execution with cooling-off period

---

## HSM Integration

### HSMProvider

Base interface for HSM providers.

```typescript
interface HSMProvider {
  connect(): Promise<void>
  disconnect(): Promise<void>
  generateKey(): Promise<Keypair>
  importKey(keyData: Uint8Array): Promise<void>
  sign(transaction: VersionedTransaction): Promise<VersionedTransaction>
  signMessage(message: Uint8Array): Promise<Uint8Array>
  exportKey(format: 'pkcs8' | 'jwk'): Promise<string>
}
```

### YubiKeyProvider

YubiKey HSM provider implementation.

```typescript
import { YubiKeyProvider } from '@airgapped-priv/sdk'
```

#### Static Methods

##### isSupported

```typescript
static isSupported(): boolean
```

Check if YubiKey WebHID/WebUSB is supported.

**Returns:** Boolean

##### requestDevice

```typescript
static async requestDevice(): Promise<YubiKeyProvider>
```

Request YubiKey device from user.

**Returns:** YubiKeyProvider instance

#### Instance Methods

##### connect

```typescript
async connect(): Promise<void>
```

Connect to YubiKey device.

##### generateKey

```typescript
async generateKey(): Promise<Keypair>
```

Generate new keypair on YubiKey.

##### sign

```typescript
async sign(transaction: VersionedTransaction): Promise<VersionedTransaction>
```

Sign transaction with YubiKey.

**Example:**
```typescript
const yubikey = await YubiKeyProvider.requestDevice()
await yubikey.connect()
const signedTx = await yubikey.sign(transaction)
```

### SoftwareHSMProvider

Software-based HSM provider for development/testing.

```typescript
import { SoftwareHSMProvider } from '@airgapped-priv/sdk'

const hsm = new SoftwareHSMProvider()
const keypair = await hsm.generateKey()
```

---

## SSO (Single Sign-On)

### SSOOrchestrator

Unified interface for SAML and OIDC SSO.

```typescript
import { SSOOrchestrator } from '@airgapped-priv/sdk'
```

#### Constructor

```typescript
constructor(config: {
  type: 'saml' | 'oidc'
  provider: SSOProvider
  config: SAMLConfig | OIDCConfig
})
```

#### Methods

##### getLoginUrl

```typescript
async getLoginUrl(state?: string): Promise<string>
```

Get login URL for IdP redirect.

**Returns:** Login URL

##### handleCallback

```typescript
async handleCallback(params: Record<string, string>): Promise<SSOSession>
```

Handle SSO callback from IdP.

**Returns:** User session

**Example:**
```typescript
const session = await sso.handleCallback({
  code: 'authorization_code',
  state: 'state_value',
})

console.log(session.user)
```

##### refreshSession

```typescript
async refreshSession(refreshToken: string): Promise<SSOSession>
```

Refresh session using refresh token.

### SAMLManager

SAML 2.0 SSO manager.

```typescript
import { SAMLManager, SAMLProviders } from '@airgapped-priv/sdk'
```

#### Factory Methods

**SAMLProviders.okta()**
**SAMLProviders.onelogin()**
**SAMLProviders.ping()**

Create pre-configured SAML managers for common providers.

**Example:**
```typescript
const saml = SAMLProviders.okta({
  entryPoint: 'https://org.okta.com/app/sso',
  issuer: 'https://org.okta.com',
  callbackUrl: 'https://app.com/auth/saml/callback',
  cert: fs.readFileSync('./okta-cert.pem', 'utf-8'),
})
```

### OIDCManager

OpenID Connect SSO manager.

```typescript
import { OIDCManager, OIDCProviders } from '@airgapped-priv/sdk'
```

#### Factory Methods

**OIDCProviders.auth0()**
**OIDCProviders.azure()**
**OIDCProviders.google()**
**OIDCProviders.okta()**

Create pre-configured OIDC managers for common providers.

**Example:**
```typescript
const oidc = OIDCProviders.auth0({
  clientId: 'client-id',
  clientSecret: 'client-secret',
  domain: 'domain.auth0.com',
  redirectUri: 'https://app.com/auth/callback',
})
```

---

## Compliance Reporting

### ComplianceGenerator

Main class for compliance report generation.

```typescript
import { ComplianceGenerator } from '@airgapped-priv/sdk'
```

#### Methods

##### generateSOC2Report

```typescript
async generateSOC2Report(period: ReportPeriod): Promise<ComplianceReport>
```

Generate SOC 2 Type II compliance report.

**Parameters:**
```typescript
interface ReportPeriod {
  startDate: Date
  endDate: Date
}
```

**Returns:** ComplianceReport object

**Example:**
```typescript
const report = await generator.generateSOC2Report({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-31'),
})
```

##### generateTransactionReport

```typescript
async generateTransactionReport(period: ReportPeriod): Promise<ComplianceReport>
```

Generate transaction activity report.

##### generateAuditReport

```typescript
async generateAuditReport(period: ReportPeriod): Promise<ComplianceReport>
```

Generate audit trail report.

##### generateUserActivityReport

```typescript
async generateUserActivityReport(period: ReportPeriod): Promise<ComplianceReport>
```

Generate user activity report.

##### generatePolicyViolationReport

```typescript
async generatePolicyViolationReport(period: ReportPeriod): Promise<ComplianceReport>
```

Generate policy violation report.

##### generateSecurityIncidentReport

```typescript
async generateSecurityIncidentReport(period: ReportPeriod): Promise<ComplianceReport>
```

Generate security incident report.

### ComplianceReport

Interface for compliance reports.

```typescript
interface ComplianceReport {
  id: string
  framework: ComplianceFramework
  period: ReportPeriod
  generatedAt: Date
  generatedBy: string
  format: ReportFormat
  data: ReportData
  metadata: Record<string, any>
}
```

**Report Formats:** 'pdf' | 'csv' | 'json' | 'html' | 'xlsx'

**Compliance Frameworks:** 'SOC2' | 'ISO27001' | 'GDPR' | 'PCI_DSS' | 'HIPAA' | 'SOX' | 'CUSTOM'

---

## Error Handling

### Error Types

#### AuthorizationError

Thrown when permission check fails.

```typescript
class AuthorizationError extends Error {
  permission: string
  userId: string
}
```

#### PolicyViolationError

Thrown when policy evaluation fails.

```typescript
class PolicyViolationError extends Error {
  violations: PolicyViolation[]
  decision: PolicyDecision
}
```

#### WorkflowError

Thrown when workflow operation fails.

```typescript
class WorkflowError extends Error {
  workflowId: string
  stepId?: string
}
```

#### HSMError

Thrown when HSM operation fails.

```typescript
class HSMError extends Error {
  code: string
  provider: string
}
```

---

## TypeScript Types

### Key Types

```typescript
// Audit
interface AuditEvent {
  id?: string
  eventType: AuditEventType
  userId?: string
  sessionId?: string
  timestamp: Date
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failed' | 'pending'
  metadata?: Record<string, any>
}

// RBAC
interface User {
  id: string
  roles: Role[]
  permissions: Permission[]
  metadata?: Record<string, any>
}

// Policy
interface Policy {
  id: string
  name: string
  description: string
  version: string
  enabled: boolean
  rules: PolicyRule[]
}

// Workflow
interface Workflow {
  id: string
  transaction: VersionedTransaction
  policy: ApprovalPolicy
  steps: WorkflowStep[]
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed'
  createdAt: Date
  expiresAt: Date
}

// SSO
interface SSOSession {
  user: SSOUser
  tokens: SSOTokens
  expiresAt: Date
  metadata?: Record<string, any>
}

interface SSOUser {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  groups?: string[]
  metadata?: Record<string, any>
}
```

---

## Usage Examples

### Complete Enterprise Workflow

```typescript
import {
  AuditLogger,
  RBACManager,
  PolicyEngine,
  WorkflowEngine,
  YubiKeyProvider,
} from '@airgapped-priv/sdk'

// Initialize components
const auditLogger = new AuditLogger({ storage: 'postgresql' })
const rbac = new RBACManager()
const policyEngine = new PolicyEngine()
const workflowEngine = new WorkflowEngine()

// 1. User authentication
await auditLogger.logEvent({
  eventType: AuditEventType.USER_LOGIN,
  userId: user.id,
  timestamp: new Date(),
  details: { method: 'sso' },
  severity: 'low',
  status: 'success',
})

// 2. Check permissions
await rbac.requirePermission(user.id, Permission.CREATE_TRANSACTION)

// 3. Evaluate policy
const policyDecision = await policyEngine.evaluate(transaction, {
  user: { id: user.id, role: user.role },
  history: { dailyTotal: 50000 },
})

// 4. Create approval workflow if needed
if (policyDecision.requiresApproval) {
  const workflow = await workflowEngine.createWorkflow(
    transaction,
    policyDecision.approvalPolicy
  )

  // Request approvals
  await workflowEngine.requestApproval(workflow.id, approvers)

  // Wait for approvals
  const approval = await waitForApproval(workflow.id)

  // Sign with HSM
  const hsm = new YubiKeyProvider()
  await hsm.connect()
  const signedTx = await hsm.sign(transaction)

  // Log transaction
  await auditLogger.logEvent({
    eventType: AuditEventType.TRANSACTION_SIGN,
    userId: user.id,
    timestamp: new Date(),
    details: { workflowId: workflow.id },
    severity: 'low',
    status: 'success',
  })
}
```

---

**Last Updated:** 2026-04-22
**Version:** 1.0.0
