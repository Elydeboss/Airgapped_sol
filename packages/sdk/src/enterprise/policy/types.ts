import type { PublicKey } from '@solana/web3.js'
import type { VersionedTransaction } from '@solana/web3.js'

/**
 * Policy enforcement types for enterprise governance and compliance
 */

export type PolicyType =
  | 'amount_limit'
  | 'recipient_whitelist'
  | 'recipient_blacklist'
  | 'time_restriction'
  | 'geographic_restriction'
  | 'frequency_limit'
  | 'composite'

export interface Policy {
  id: string
  name: string
  description: string
  type: PolicyType
  enabled: boolean
  priority: number // Higher priority policies are evaluated first
  rules: PolicyRule[]
  metadata?: Record<string, unknown>
}

export type PolicyRuleType =
  | 'amount_limit'
  | 'recipient_whitelist'
  | 'recipient_blacklist'
  | 'time_range'
  | 'day_of_week'
  | 'frequency_limit'
  | 'custom'

export interface PolicyRule {
  type: PolicyRuleType
  condition: RuleCondition
  action: RuleAction
  metadata?: Record<string, unknown>
}

export type RuleCondition =
  | AmountCondition
  | RecipientCondition
  | TimeCondition
  | FrequencyCondition
  | CustomCondition

export interface AmountCondition {
  type: 'amount'
  min?: number
  max?: number
  currency?: string
}

export interface RecipientCondition {
  type: 'recipient'
  mode: 'whitelist' | 'blacklist'
  addresses: string[]
}

export interface TimeCondition {
  type: 'time_range' | 'day_of_week'
  startTime?: string // HH:MM format
  endTime?: string // HH:MM format
  daysOfWeek?: number[] // 0-6 (Sunday-Saturday)
  timezone?: string
}

export interface FrequencyCondition {
  type: 'frequency'
  maxCount: number
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
  perUser?: string
}

export interface CustomCondition {
  type: 'custom'
  validator: string // Reference to custom validator function
  params?: Record<string, unknown>
}

export type RuleAction = 'allow' | 'deny' | 'require_approval'

export interface PolicyDecision {
  allowed: boolean
  policyId: string
  policyName: string
  reason: string
  requiredApprovals?: string[]
  violatedRules?: PolicyRule[]
  metadata?: Record<string, unknown>
}

export interface PolicyEvaluationContext {
  transaction: VersionedTransaction
  userId?: string
  walletAddress?: PublicKey
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface PolicyEvaluationResult {
  allowed: boolean
  decisions: PolicyDecision[]
  requiredApprovals: string[]
  violatedPolicies: Policy[]
  metadata?: Record<string, unknown>
}

export interface PolicyEngine {
  addPolicy(policy: Policy): void
  removePolicy(policyId: string): void
  updatePolicy(policyId: string, updates: Partial<Policy>): Policy
  getPolicy(policyId: string): Policy | null
  listPolicies(filters?: PolicyListFilters): Policy[]
  evaluate(context: PolicyEvaluationContext): PolicyEvaluationResult
  enforce(context: PolicyEvaluationContext): PolicyEnforcementResult
}

export interface PolicyEnforcementResult extends PolicyEvaluationResult {
  transaction: VersionedTransaction
  enforcedAt: Date
  approvers?: PublicKey[] // Required approvers if approval needed
}

export interface PolicyListFilters {
  type?: PolicyType
  enabled?: boolean
  minPriority?: number
  maxPriority?: number
}

export interface PolicyViolation {
  policyId: string
  policyName: string
  violatedAt: Date
  violatedBy: string
  transaction?: VersionedTransaction
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
}

export interface PolicyViolationStorage {
  save(violation: PolicyViolation): Promise<void>
  list(filters?: ViolationFilters): Promise<PolicyViolation[]>
  resolve(violationId: string): Promise<PolicyViolation>
  count(filters?: ViolationFilters): Promise<number>
}

export interface ViolationFilters {
  policyId?: string
  resolved?: boolean
  severity?: PolicyViolation['severity'][]
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}
