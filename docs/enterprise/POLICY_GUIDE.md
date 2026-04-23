# Policy Configuration Guide

## Overview

The OfflineSign policy engine enables organizations to enforce governance rules and compliance requirements on cryptocurrency transactions. This guide covers policy creation, configuration, and best practices.

---

## Policy Concepts

### What is a Policy?

A policy is a set of rules that evaluate whether a transaction should be allowed, denied, or require additional approval. Policies act as automated controls that enforce organizational governance.

### Policy Evaluation Flow

```
Transaction Created → Policy Engine Evaluation → Decision
                                                ├── ALLOW: Transaction proceeds
                                                ├── DENY: Transaction blocked
                                                └── REQUIRE_APPROVAL: Sent to approval workflow
```

### Policy Types

1. **Amount Limits** - Restrict transaction amounts
2. **Recipient Controls** - Whitelist/blacklist addresses
3. **Time Restrictions** - Limit when transactions can occur
4. **Geographic Rules** - Restrict by user location
5. **Frequency Limits** - Limit transaction frequency
6. **Multi-Transaction Rules** - Complex multi-step validations
7. **Custom Rules** - Business-specific logic

---

## Creating Policies

### Basic Policy Structure

```typescript
import { Policy, PolicyType } from '@airgapped-priv/sdk'

const policy: Policy = {
  id: 'daily-transaction-limit',
  name: 'Daily Transaction Limit',
  description: 'Limit total daily transactions to 100k SOL',
  version: '1.0.0',
  enabled: true,
  rules: [
    {
      type: PolicyType.AMOUNT_LIMIT,
      config: {
        maxAmount: 100000,
        period: 'daily',
        currency: 'SOL',
      },
    },
  ],
}
```

### Amount Limit Policies

#### Fixed Transaction Limit

```typescript
import { PolicyRules } from '@airgapped-priv/sdk'

// Single transaction cannot exceed 50k SOL
const singleTxLimit = PolicyRules.amountLimit({
  maxAmount: 50000,
  currency: 'SOL',
})
```

#### Cumulative Period Limits

```typescript
// Daily limit: 100k SOL total per day
const dailyLimit = PolicyRules.amountLimit({
  maxAmount: 100000,
  period: 'daily',
  currency: 'SOL',
})

// Weekly limit: 500k SOL total per week
const weeklyLimit = PolicyRules.amountLimit({
  maxAmount: 500000,
  period: 'weekly',
  currency: 'SOL',
})

// Monthly limit: 2M SOL total per month
const monthlyLimit = PolicyRules.amountLimit({
  maxAmount: 2000000,
  period: 'monthly',
  currency: 'SOL',
})
```

#### Tiered Limits by Role

```typescript
// Different limits for different user roles
const roleBasedLimits = {
  operators: PolicyRules.amountLimit({
    maxAmount: 10000,
    period: 'daily',
    currency: 'SOL',
  }),
  managers: PolicyRules.amountLimit({
    maxAmount: 100000,
    period: 'daily',
    currency: 'SOL',
  }),
  executives: PolicyRules.amountLimit({
    maxAmount: 1000000,
    period: 'daily',
    currency: 'SOL',
  }),
}
```

### Recipient Control Policies

#### Whitelist (Allow Only)

```typescript
import { PolicyRules } from '@airgapped-priv/sdk'

// Only allow transactions to approved addresses
const whitelistPolicy = PolicyRules.recipientWhitelist({
  addresses: [
    '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', // Treasury A
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Treasury B
  ],
  description: 'Only company treasury addresses allowed',
})

// Whitelist with group support
const dynamicWhitelist = PolicyRules.recipientWhitelist({
  addressGroups: ['approved-exchanges', 'partners', 'treasuries'],
  description: 'Allow transactions to approved groups',
})
```

#### Blacklist (Block Specific)

```typescript
// Block transactions to known risky addresses
const blacklistPolicy = PolicyRules.recipientBlacklist({
  addresses: [
    'H3v3x9fPHRSEzQRWADW8FURpEBUrPrkUFuUUk3mNoqba', // Known scam
    '6Zfu3gNXZgbVJ7zQjKWst4oTGjjV3gDGf8J7yQaWbQma', // Blacklisted exchange
  ],
  description: 'Block transactions to blacklisted addresses',
})
```

### Time Restriction Policies

#### Business Hours Only

```typescript
import { PolicyRules } from '@airgapped-priv/sdk'

// Only allow transactions during business hours (9 AM - 5 PM UTC, Mon-Fri)
const businessHoursPolicy = PolicyRules.timeRestriction({
  allowedHours: { start: 9, end: 17 },
  allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
  timezone: 'UTC',
  description: 'Business hours only',
})
```

#### Maintenance Windows

```typescript
// Block transactions during maintenance windows
const maintenanceWindow = PolicyRules.timeRestriction({
  blockedHours: [
    { start: 2, end: 4 }, // 2 AM - 4 AM UTC
  ],
  blockedDays: [6, 0], // Saturday, Sunday
  timezone: 'UTC',
  description: 'Block during maintenance windows',
})
```

### Geographic Restrictions

```typescript
// Only allow transactions from specific countries
const geoPolicy = PolicyRules.geographicRestriction({
  allowedCountries: ['US', 'GB', 'CA', 'AU'],
  description: 'Only allow from US, UK, Canada, Australia',
})

// Block transactions from high-risk countries
const geoBlacklist = PolicyRules.geographicRestriction({
  blockedCountries: ['KP', 'IR', 'CU'],
  description: 'Block high-risk jurisdictions',
})
```

### Frequency Limits

```typescript
// Maximum 10 transactions per hour
const hourlyFrequency = PolicyRules.frequencyLimit({
  maxTransactions: 10,
  period: 'hourly',
})

// Maximum 100 transactions per day
const dailyFrequency = PolicyRules.frequencyLimit({
  maxTransactions: 100,
  period: 'daily',
})
```

---

## Policy Templates

### Conservative Policy (Low Risk)

```typescript
import { PolicyTemplates } from '@airgapped-priv/sdk'

const conservativePolicy = PolicyTemplates.conservative({
  amountLimit: 10000,
  period: 'daily',
  requireApprovalForAmount: 5000,
  approvalType: 'sequential',
  requiredApprovers: 2,
})

// Results in:
// - Daily limit: 10k SOL
// - Transactions > 5k SOL require 2 sequential approvals
// - Only whitelisted recipients allowed
// - Business hours only (Mon-Fri, 9-5 UTC)
```

### Moderate Policy (Balanced)

```typescript
const moderatePolicy = PolicyTemplates.moderate({
  amountLimit: 100000,
  period: 'daily',
  requireApprovalForAmount: 50000,
  approvalType: 'parallel',
  requiredApprovers: 2,
})

// Results in:
// - Daily limit: 100k SOL
// - Transactions > 50k SOL require 2 parallel approvals
// - No recipient whitelist
// - No time restrictions
```

### Permissive Policy (High Trust)

```typescript
const permissivePolicy = PolicyTemplates.permissive({
  amountLimit: 1000000,
  period: 'daily',
  requireApprovalForAmount: 500000,
  approvalType: 'threshold',
  requiredApprovers: 3,
  totalApprovers: 5,
})

// Results in:
// - Daily limit: 1M SOL
// - Transactions > 500k SOL require 3 of 5 approvals
// - Minimal restrictions otherwise
```

### Operational Policy (Treasury Operations)

```typescript
const operationalPolicy = PolicyTemplates.operational({
  amountLimit: 10000000,
  period: 'daily',
  requireApprovalForAmount: 1000000,
  approvalType: 'timelock',
  timelockDelay: 3600, // 1 hour delay
})

// Results in:
// - High daily limit for operations
// - Large transactions have 1-hour timelock
// - Allows operational flexibility
```

### Treasury Policy (Multi-Sig)

```typescript
const treasuryPolicy = PolicyTemplates.treasury({
  amountLimit: null, // No limit
  requireApprovalForAmount: 0, // All transactions require approval
  approvalType: 'threshold',
  requiredApprovers: 3,
  totalApprovers: 5,
  enableBusinessHours: true,
})

// Results in:
// - All transactions require 3 of 5 approvals
// - Business hours enforced
// - Maximum security
```

---

## Combining Multiple Policies

### Policy Stacking

```typescript
import { PolicyEngine } from '@airgapped-priv/sdk'

const engine = new PolicyEngine()

// Add multiple policies - ALL must pass
engine.addPolicy(dailyLimit)
engine.addPolicy(whitelistPolicy)
engine.addPolicy(businessHoursPolicy)

// Transaction must satisfy ALL policies
const result = await engine.evaluate(transaction, context)
```

### Policy Groups

```typescript
// Create groups of policies with OR logic
const standardGroup = [
  dailyLimit,
  whitelistPolicy,
  businessHoursPolicy,
]

const emergencyGroup = [
  PolicyRules.amountLimit({ maxAmount: 1000000 }),
  PolicyRules.recipientWhitelist({ addresses: emergencyAddresses }),
]

// Use conditional logic to switch groups
function getPolicies(isEmergency: boolean) {
  return isEmergency ? emergencyGroup : standardGroup
}
```

---

## Advanced Policy Configuration

### Custom Policy Rules

```typescript
import { PolicyRule, PolicyType } from '@airgapped-priv/sdk'

const customRule: PolicyRule = {
  type: PolicyType.CUSTOM,
  name: 'liquidity-check',
  description: 'Ensure recipient has sufficient liquidity',
  evaluate: async (transaction, context) => {
    // Custom logic: Check if recipient address is a DEX with liquidity
    const recipient = transaction.recipient.toString()
    const liquidity = await checkDEXLiquidity(recipient)

    return {
      allowed: liquidity > 1000000, // Require 1M SOL liquidity
      reason: liquidity > 1000000
        ? 'Sufficient liquidity'
        : 'Insufficient liquidity at destination',
    }
  },
}
```

### Conditional Policies

```typescript
// Different rules based on user role
const roleBasedPolicy = {
  evaluate: async (transaction, context) => {
    const userRole = context.user.role

    if (userRole === 'executive') {
      // Executives: Higher limits, no approval required
      return {
        allowed: true,
        reason: 'Executive role bypass',
      }
    } else if (userRole === 'manager') {
      // Managers: Moderate limits
      return {
        allowed: transaction.amount < 50000,
        reason: transaction.amount < 50000
          ? 'Within manager limit'
          : 'Requires executive approval',
      }
    } else {
      // Operators: Strict limits
      return {
        allowed: transaction.amount < 10000,
        reason: transaction.amount < 10000
          ? 'Within operator limit'
          : 'Exceeds operator limit',
      }
    }
  },
}
```

### Dynamic Policy Updates

```typescript
import { PolicyEngine } from '@airgapped-priv/sdk'

const engine = new PolicyEngine()

// Add new policy at runtime
engine.addPolicy(newPolicy)

// Update existing policy
engine.updatePolicy('policy-id', updatedPolicy)

// Remove policy
engine.removePolicy('policy-id')

// Enable/disable policy
engine.enablePolicy('policy-id')
engine.disablePolicy('policy-id')
```

---

## Policy Evaluation Context

### Context Data Available

```typescript
interface PolicyEvaluationContext {
  // Transaction details
  transaction: {
    from: PublicKey
    to: PublicKey
    amount: number
    currency: string
    timestamp: Date
  }

  // User details
  user: {
    id: string
    role: string
    permissions: string[]
    groups: string[]
    email: string
  }

  // Environment details
  environment: {
    ip: string
    country: string
    timezone: string
    userAgent: string
  }

  // Transaction history
  history: {
    dailyTotal: number
    weeklyTotal: number
    monthlyTotal: number
    transactionCount: number
  }

  // Metadata
  metadata: Record<string, any>
}
```

### Using Context in Policies

```typescript
const contextAwarePolicy: PolicyRule = {
  type: PolicyType.CUSTOM,
  name: 'context-aware',
  evaluate: async (transaction, context) => {
    // Access user role
    if (context.user.role === 'admin') {
      return { allowed: true, reason: 'Admin bypass' }
    }

    // Access transaction history
    if (context.history.dailyTotal > 50000) {
      return {
        allowed: false,
        reason: 'Daily limit exceeded',
      }
    }

    // Access geographic data
    if (context.environment.country === 'HIGH_RISK') {
      return {
        allowed: false,
        reason: 'Geographic restriction',
      }
    }

    return { allowed: true, reason: 'Policy passed' }
  },
}
```

---

## Testing Policies

### Unit Testing Policies

```typescript
import { describe, it, expect } from 'vitest'
import { PolicyEngine } from '@airgapped-priv/sdk'

describe('Amount Limit Policy', () => {
  it('should allow transactions under limit', async () => {
    const engine = new PolicyEngine()
    engine.addPolicy(PolicyRules.amountLimit({
      maxAmount: 10000,
    }))

    const result = await engine.evaluate({
      amount: 5000,
      recipient: new PublicKey('...'),
    }, {})

    expect(result.allowed).toBe(true)
  })

  it('should deny transactions over limit', async () => {
    const engine = new PolicyEngine()
    engine.addPolicy(PolicyRules.amountLimit({
      maxAmount: 10000,
    }))

    const result = await engine.evaluate({
      amount: 15000,
      recipient: new PublicKey('...'),
    }, {})

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('exceeds limit')
  })
})
```

### Testing Policy Combinations

```typescript
describe('Combined Policies', () => {
  it('should require all policies to pass', async () => {
    const engine = new PolicyEngine()
    engine.addPolicy(PolicyRules.amountLimit({ maxAmount: 10000 }))
    engine.addPolicy(PolicyRules.timeRestriction({
      allowedHours: { start: 9, end: 17 },
    }))

    // Test during business hours, under limit
    const context1 = { hour: 10 }
    const result1 = await engine.evaluate({ amount: 5000 }, context1)
    expect(result1.allowed).toBe(true)

    // Test outside business hours, under limit
    const context2 = { hour: 20 }
    const result2 = await engine.evaluate({ amount: 5000 }, context2)
    expect(result2.allowed).toBe(false)

    // Test during business hours, over limit
    const context3 = { hour: 10 }
    const result3 = await engine.evaluate({ amount: 15000 }, context3)
    expect(result3.allowed).toBe(false)
  })
})
```

---

## Policy Violation Handling

### Violation Actions

```typescript
import { PolicyEngine } from '@airgapped-priv/sdk'

const engine = new PolicyEngine({
  onViolation: async (violation) => {
    // Log to audit trail
    await auditLogger.logEvent({
      type: 'POLICY_VIOLATION',
      severity: 'high',
      details: violation,
    })

    // Send alert
    await sendAlert({
      title: 'Policy Violation',
      message: violation.reason,
      recipients: ['security@company.com'],
    })

    // Block transaction
    return {
      action: 'BLOCK',
      message: 'Transaction blocked due to policy violation',
    }
  },
})
```

### Violation Tracking

```typescript
// Track violations for pattern detection
const engine = new PolicyEngine({
  violationTracking: {
    enabled: true,
    window: '24h',
    threshold: 5, // Alert after 5 violations in 24h
    onThresholdExceeded: async (violations) => {
      // Escalate to security team
      await escalateToSecurity(violations)
    },
  },
})
```

---

## Policy Best Practices

### 1. Principle of Least Privilege

```typescript
// ❌ BAD: Too permissive
const badPolicy = PolicyRules.amountLimit({
  maxAmount: 1000000000, // Way too high
})

// ✅ GOOD: Realistic limits
const goodPolicy = PolicyRules.amountLimit({
  maxAmount: 100000, // Based on actual needs
})
```

### 2. Defense in Depth

```typescript
// Combine multiple controls
const layeredPolicies = [
  PolicyRules.amountLimit({ maxAmount: 100000, period: 'daily' }),
  PolicyRules.recipientWhitelist({ addresses: approvedAddresses }),
  PolicyRules.timeRestriction({ allowedHours: { start: 9, end: 17 } }),
]
```

### 3. Clear Policy Names and Descriptions

```typescript
// ❌ BAD
const bad = {
  name: 'policy1',
  description: 'does stuff',
}

// ✅ GOOD
const good = {
  name: 'daily-transaction-limit-100k-sol',
  description: 'Limits total daily transactions to 100,000 SOL across all recipients',
}
```

### 4. Version Your Policies

```typescript
const policy = {
  id: 'daily-limit',
  version: '2.0.0',
  previousVersion: '1.5.0',
  changelog: 'Increased limit from 50k to 100k SOL',
  // ... rest of policy
}
```

### 5. Test Policies Thoroughly

```typescript
// Test edge cases
const testCases = [
  { amount: 0, expected: true }, // Zero amount
  { amount: 9999, expected: true }, // Just under limit
  { amount: 10000, expected: true }, // Exactly at limit
  { amount: 10001, expected: false }, // Just over limit
  { amount: 100000, expected: false }, // Way over limit
]
```

### 6. Monitor Policy Effectiveness

```typescript
// Track policy decisions
const metrics = {
  totalEvaluations: 1000,
  allowed: 850,
  denied: 100,
  requireApproval: 50,
  denialRate: 0.10, // 10% denial rate
}
```

---

## Troubleshooting

### Common Issues

**Issue: Policy not being evaluated**
- Verify policy is enabled: `policy.enabled === true`
- Check policy is added to engine: `engine.hasPolicy('policy-id')`
- Ensure context data is complete

**Issue: Unexpected policy denials**
- Check policy logs for detailed reason
- Verify policy logic matches business requirements
- Test with sample transactions

**Issue: Performance issues**
- Cache evaluation results where appropriate
- Use indexed queries for history lookups
- Consider asynchronous evaluation for complex policies

---

**Last Updated:** 2026-04-22
**Version:** 1.0.0
