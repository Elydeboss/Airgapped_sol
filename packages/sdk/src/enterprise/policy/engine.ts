import type {
  Policy,
  PolicyDecision,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  PolicyEngine,
  PolicyEnforcementResult,
  PolicyListFilters,
} from './types.js'
import type { PublicKey, VersionedTransaction } from '@solana/web3.js'

/**
 * Policy engine for evaluating and enforcing governance rules
 */
export class Engine implements PolicyEngine {
  private policies: Map<string, Policy> = new Map()
  private violationHistory: Map<string, number[]> = new Map() // Track transaction frequency

  /**
   * Add a policy to the engine
   */
  addPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy)
  }

  /**
   * Remove a policy from the engine
   */
  removePolicy(policyId: string): void {
    this.policies.delete(policyId)
  }

  /**
   * Update an existing policy
   */
  updatePolicy(policyId: string, updates: Partial<Policy>): Policy {
    const existing = this.policies.get(policyId)
    if (!existing) {
      throw new Error(`Policy not found: ${policyId}`)
    }

    const updated = { ...existing, ...updates }
    this.policies.set(policyId, updated)
    return updated
  }

  /**
   * Get a policy by ID
   */
  getPolicy(policyId: string): Policy | null {
    return this.policies.get(policyId) || null
  }

  /**
   * List policies with optional filters
   */
  listPolicies(filters?: PolicyListFilters): Policy[] {
    let results = Array.from(this.policies.values())

    if (filters?.type) {
      results = results.filter(p => p.type === filters.type)
    }

    if (filters?.enabled !== undefined) {
      results = results.filter(p => p.enabled === filters.enabled)
    }

    if (filters?.minPriority !== undefined) {
      results = results.filter(p => p.priority >= filters.minPriority!)
    }

    if (filters?.maxPriority !== undefined) {
      results = results.filter(p => p.priority <= filters.maxPriority!)
    }

    // Sort by priority (highest first)
    results.sort((a, b) => b.priority - a.priority)

    return results
  }

  /**
   * Evaluate policies against a transaction context
   */
  evaluate(context: PolicyEvaluationContext): PolicyEvaluationResult {
    // Get enabled policies sorted by priority
    const policies = this.listPolicies({ enabled: true })

    const decisions: PolicyDecision[] = []
    const requiredApprovals: string[] = new Set()
    const violatedPolicies: Policy[] = []

    for (const policy of policies) {
      const decision = this.evaluatePolicy(policy, context)
      decisions.push(decision)

      if (!decision.allowed) {
        violatedPolicies.push(policy)
      }

      if (decision.requiredApprovals) {
        decision.requiredApprovals.forEach(approval => requiredApprovals.add(approval))
      }

      // If any policy explicitly denies, stop evaluation
      if (!decision.allowed && decision.violatedRules?.some(r => r.action === 'deny')) {
        break
      }
    }

    // Overall decision: allow only if no explicit denials
    const allowed = !decisions.some(d =>
      !d.allowed && d.violatedRules?.some(r => r.action === 'deny')
    )

    return {
      allowed,
      decisions,
      requiredApprovals: Array.from(requiredApprovals),
      violatedPolicies,
      metadata: {
        evaluatedAt: new Date(),
        policiesEvaluated: policies.length,
      },
    }
  }

  /**
   * Enforce policies on a transaction
   */
  enforce(context: PolicyEvaluationContext): PolicyEnforcementResult {
    const result = this.evaluate(context)

    // Track transaction for frequency limits
    this.trackTransaction(context)

    return {
      ...result,
      transaction: context.transaction,
      enforcedAt: new Date(),
    }
  }

  /**
   * Evaluate a single policy
   */
  private evaluatePolicy(
    policy: Policy,
    context: PolicyEvaluationContext
  ): PolicyDecision {
    const violatedRules: typeof policy.rules = []

    for (const rule of policy.rules) {
      const passes = this.evaluateRule(rule, context)

      if (!passes) {
        violatedRules.push(rule)

        // If rule action is deny, return immediately
        if (rule.action === 'deny') {
          return {
            allowed: false,
            policyId: policy.id,
            policyName: policy.name,
            reason: this.formatViolationReason([rule]),
            violatedRules: [rule],
          }
        }
      }
    }

    // If any rules require approval, mark as not allowed but with approval path
    const requiresApproval = policy.rules.some(r => r.action === 'require_approval' && violatedRules.includes(r))

    if (requiresApproval) {
      return {
        allowed: false,
        policyId: policy.id,
        policyName: policy.name,
        reason: this.formatViolationReason(violatedRules),
        requiredApprovals: this.getRequiredApprovals(policy, violatedRules),
        violatedRules,
      }
    }

    if (violatedRules.length > 0) {
      return {
        allowed: false,
        policyId: policy.id,
        policyName: policy.name,
        reason: this.formatViolationReason(violatedRules),
        violatedRules,
      }
    }

    return {
      allowed: true,
      policyId: policy.id,
      policyName: policy.name,
      reason: 'Policy check passed',
    }
  }

  /**
   * Evaluate a single rule
   */
  private evaluateRule(rule: any, context: PolicyEvaluationContext): boolean {
    const condition = rule.condition

    switch (condition.type) {
      case 'amount':
        return this.evaluateAmountRule(condition, context)

      case 'recipient':
        return this.evaluateRecipientRule(condition, context)

      case 'time_range':
      case 'day_of_week':
        return this.evaluateTimeRule(condition, context)

      case 'frequency':
        return this.evaluateFrequencyRule(condition, context)

      case 'custom':
        return this.evaluateCustomRule(condition, context)

      default:
        return true // Unknown rules pass by default
    }
  }

  /**
   * Evaluate amount rule
   */
  private evaluateAmountRule(condition: any, context: PolicyEvaluationContext): boolean {
    // Extract transaction amount from context
    // This would need to be parsed from the transaction instructions
    const amount = this.extractTransactionAmount(context.transaction)

    if (condition.min !== undefined && amount < condition.min) {
      return false
    }

    if (condition.max !== undefined && amount > condition.max) {
      return false
    }

    return true
  }

  /**
   * Evaluate recipient rule
   */
  private evaluateRecipientRule(condition: any, context: PolicyEvaluationContext): boolean {
    const recipient = this.extractRecipient(context.transaction)

    if (condition.mode === 'whitelist') {
      return condition.addresses.includes(recipient)
    } else {
      // blacklist
      return !condition.addresses.includes(recipient)
    }
  }

  /**
   * Evaluate time rule
   */
  private evaluateTimeRule(condition: any, context: PolicyEvaluationContext): boolean {
    const now = context.timestamp

    // Check day of week
    if (condition.daysOfWeek && condition.daysOfWeek.length > 0) {
      const dayOfWeek = now.getDay()
      if (!condition.daysOfWeek.includes(dayOfWeek)) {
        return false
      }
    }

    // Check time range
    if (condition.startTime && condition.endTime) {
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const [startHour, startMin] = condition.startTime.split(':').map(Number)
      const [endHour, endMin] = condition.endTime.split(':').map(Number)
      const startTime = startHour * 60 + startMin
      const endTime = endHour * 60 + endMin

      if (currentTime < startTime || currentTime > endTime) {
        return false
      }
    }

    return true
  }

  /**
   * Evaluate frequency rule
   */
  private evaluateFrequencyRule(condition: any, context: PolicyEvaluationContext): boolean {
    const key = this.getFrequencyKey(condition, context)
    const history = this.violationHistory.get(key) || []

    const now = Date.now()
    const periodMs = this.getPeriodMs(condition.period)

    // Filter history to current period
    const recentCount = history.filter(timestamp => now - timestamp < periodMs).length

    return recentCount < condition.maxCount
  }

  /**
   * Evaluate custom rule
   */
  private evaluateCustomRule(condition: any, context: PolicyEvaluationContext): boolean {
    // Custom rules would need to be registered with the engine
    // For now, return true (pass)
    return true
  }

  /**
   * Extract transaction amount (simplified)
   */
  private extractTransactionAmount(transaction: VersionedTransaction): number {
    // This is a simplified version
    // In production, you would parse the transaction instructions to get the actual amount
    // For now, return 0 as a placeholder
    return 0
  }

  /**
   * Extract recipient address from transaction
   */
  private extractRecipient(transaction: VersionedTransaction): string {
    // This is a simplified version
    // In production, you would parse the transaction instructions to get the recipient
    // For now, return empty string as a placeholder
    return ''
  }

  /**
   * Track transaction for frequency limits
   */
  private trackTransaction(context: PolicyEvaluationContext): void {
    const userId = context.userId || 'anonymous'

    if (!this.violationHistory.has(userId)) {
      this.violationHistory.set(userId, [])
    }

    const history = this.violationHistory.get(userId)!
    history.push(Date.now())

    // Clean old entries (older than 30 days)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const recent = history.filter(ts => Date.now() - ts < thirtyDaysMs)
    this.violationHistory.set(userId, recent)
  }

  /**
   * Get frequency key for tracking
   */
  private getFrequencyKey(condition: any, context: PolicyEvaluationContext): string {
    const userId = condition.perUser || context.userId || 'global'
    return `${userId}_${condition.period}`
  }

  /**
   * Convert period to milliseconds
   */
  private getPeriodMs(period: string): number {
    const periods: Record<string, number> = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    }
    return periods[period] || periods.daily
  }

  /**
   * Get required approvals for violated rules
   */
  private getRequiredApprovals(policy: Policy, violatedRules: any[]): string[] {
    const approvals: string[] = []

    for (const rule of violatedRules) {
      if (rule.action === 'require_approval') {
        approvals.push(`${policy.id}:${rule.type}`)
      }
    }

    return approvals
  }

  /**
   * Format violation reason message
   */
  private formatViolationReason(violatedRules: any[]): string {
    const reasons = violatedRules.map(rule => {
      const metadata = rule.metadata || {}
      return metadata.description || `Rule ${rule.type} violated`
    })

    return reasons.join('; ')
  }
}
