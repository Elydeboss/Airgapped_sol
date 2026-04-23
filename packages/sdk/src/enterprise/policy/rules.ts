import type { Policy, PolicyRule, PolicyRuleType, RuleCondition, RuleAction } from './types.js'
import type { PublicKey } from '@solana/web3.js'

/**
 * Standard policy rules for common governance scenarios
 */
export class PolicyRules {
  /**
   * Create an amount limit rule
   */
  static amountLimit(params: {
    min?: number
    max?: number
    currency?: string
    action?: RuleAction
  }): PolicyRule {
    return {
      type: 'amount_limit',
      condition: {
        type: 'amount',
        min: params.min,
        max: params.max,
        currency: params.currency || 'SOL',
      },
      action: params.action || 'deny',
      metadata: {
        description: `Transaction amount must be ${params.min ? `>= ${params.min}` : ''}${params.min && params.max ? ' and ' : ''}${params.max ? `<= ${params.max}` : ''} ${params.currency || 'SOL'}`,
      },
    }
  }

  /**
   * Create a recipient whitelist rule
   */
  static recipientWhitelist(
    addresses: string[],
    action?: RuleAction
  ): PolicyRule {
    return {
      type: 'recipient_whitelist',
      condition: {
        type: 'recipient',
        mode: 'whitelist',
        addresses,
      },
      action: action || 'deny',
      metadata: {
        description: `Transaction recipients must be in approved list (${addresses.length} addresses)`,
        addressCount: addresses.length,
      },
    }
  }

  /**
   * Create a recipient blacklist rule
   */
  static recipientBlacklist(
    addresses: string[],
    action?: RuleAction
  ): PolicyRule {
    return {
      type: 'recipient_blacklist',
      condition: {
        type: 'recipient',
        mode: 'blacklist',
        addresses,
      },
      action: action || 'deny',
      metadata: {
        description: `Transaction recipients cannot be in blocked list (${addresses.length} addresses)`,
        addressCount: addresses.length,
      },
    }
  }

  /**
   * Create a time range rule
   */
  static timeRange(params: {
    startTime: string // HH:MM
    endTime: string // HH:MM
    daysOfWeek?: number[] // 0-6 (Sunday-Saturday)
    timezone?: string
    action?: RuleAction
  }): PolicyRule {
    return {
      type: 'time_restriction',
      condition: {
        type: 'time_range',
        startTime: params.startTime,
        endTime: params.endTime,
        daysOfWeek: params.daysOfWeek,
        timezone: params.timezone || 'UTC',
      },
      action: params.action || 'deny',
      metadata: {
        description: `Transactions only allowed ${params.startTime} - ${params.endTime} ${params.daysOfWeek ? `on ${params.daysOfWeek.join(', ')}` : 'daily'} ${params.timezone || 'UTC'}`,
      },
    }
  }

  /**
   * Create business hours rule (9 AM - 5 PM, Mon-Fri)
   */
  static businessHours(
    timezone?: string,
    action?: RuleAction
  ): PolicyRule {
    return this.timeRange({
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
      timezone: timezone || 'UTC',
      action,
    })
  }

  /**
   * Create a day-of-week rule
   */
  static dayOfWeek(params: {
    allowedDays: number[] // 0-6 (Sunday-Saturday)
    timezone?: string
    action?: RuleAction
  }): PolicyRule {
    return {
      type: 'time_restriction',
      condition: {
        type: 'day_of_week',
        daysOfWeek: params.allowedDays,
        timezone: params.timezone || 'UTC',
      },
      action: params.action || 'deny',
      metadata: {
        description: `Transactions only allowed on ${params.allowedDays.map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]).join(', ')}`,
      },
    }
  }

  /**
   * Create a frequency limit rule
   */
  static frequencyLimit(params: {
    maxCount: number
    period: 'hourly' | 'daily' | 'weekly' | 'monthly'
    perUser?: string
    action?: RuleAction
  }): PolicyRule {
    return {
      type: 'frequency_limit',
      condition: {
        type: 'frequency',
        maxCount: params.maxCount,
        period: params.period,
        perUser: params.perUser,
      },
      action: params.action || 'deny',
      metadata: {
        description: `Maximum ${params.maxCount} transactions per ${params.period}${params.perUser ? ` for ${params.perUser}` : ''}`,
      },
    }
  }

  /**
   * Create a daily transaction limit
   */
  static dailyLimit(maxTransactions: number, perUser?: string): PolicyRule {
    return this.frequencyLimit({
      maxCount: maxTransactions,
      period: 'daily',
      perUser,
    })
  }

  /**
   * Create a weekly transaction limit
   */
  static weeklyLimit(maxTransactions: number, perUser?: string): PolicyRule {
    return this.frequencyLimit({
      maxCount: maxTransactions,
      period: 'weekly',
      perUser,
    })
  }

  /**
   * Create a custom rule with validator function
   */
  static custom(params: {
    validator: string
    validatorParams?: Record<string, unknown>
    action?: RuleAction
  }): PolicyRule {
    return {
      type: 'custom',
      condition: {
        type: 'custom',
        validator: params.validator,
        params: params.validatorParams,
      },
      action: params.action || 'deny',
      metadata: {
        description: `Custom validation using ${params.validator}`,
      },
    }
  }
}

/**
 * Predefined policy templates for common use cases
 */
export class PolicyTemplates {
  /**
   * Conservative policy: Strict limits for high-security environments
   */
  static conservative(): Policy {
    return {
      id: 'policy_conservative',
      name: 'Conservative Transaction Policy',
      description: 'Strict limits for high-security environments',
      type: 'composite',
      enabled: true,
      priority: 100,
      rules: [
        PolicyRules.amountLimit({
          max: 1000,
          currency: 'SOL',
          action: 'require_approval',
        }),
        PolicyRules.recipientWhitelist([]),
        PolicyRules.businessHours(),
        PolicyRules.dailyLimit(10),
      ],
      metadata: {
        category: 'conservative',
        riskLevel: 'low',
      },
    }
  }

  /**
   * Moderate policy: Balanced security and flexibility
   */
  static moderate(): Policy {
    return {
      id: 'policy_moderate',
      name: 'Moderate Transaction Policy',
      description: 'Balanced security and flexibility',
      type: 'composite',
      enabled: true,
      priority: 50,
      rules: [
        PolicyRules.amountLimit({
          max: 10000,
          currency: 'SOL',
          action: 'require_approval',
        }),
        PolicyRules.recipientBlacklist([]),
        PolicyRules.dailyLimit(100),
      ],
      metadata: {
        category: 'moderate',
        riskLevel: 'medium',
      },
    }
  }

  /**
   * Permissive policy: Minimal restrictions for trusted environments
   */
  static permissive(): Policy {
    return {
      id: 'policy_permissive',
      name: 'Permissive Transaction Policy',
      description: 'Minimal restrictions for trusted environments',
      type: 'composite',
      enabled: true,
      priority: 10,
      rules: [
        PolicyRules.amountLimit({
          max: 100000,
          currency: 'SOL',
          action: 'deny',
        }),
      ],
      metadata: {
        category: 'permissive',
        riskLevel: 'high',
      },
    }
  }

  /**
   * Operational policy: For day-to-day operations
   */
  static operational(): Policy {
    return {
      id: 'policy_operational',
      name: 'Operational Transaction Policy',
      description: 'Standard policy for daily operations',
      type: 'composite',
      enabled: true,
      priority: 50,
      rules: [
        PolicyRules.amountLimit({
          max: 50000,
          currency: 'SOL',
          action: 'require_approval',
        }),
        PolicyRules.businessHours('UTC', 'allow'),
        PolicyRules.weeklyLimit(500),
      ],
      metadata: {
        category: 'operational',
        riskLevel: 'medium',
      },
    }
  }

  /**
   * Treasury policy: For treasury management
   */
  static treasury(): Policy {
    return {
      id: 'policy_treasury',
      name: 'Treasury Management Policy',
      description: 'Strict policy for treasury operations',
      type: 'composite',
      enabled: true,
      priority: 100,
      rules: [
        PolicyRules.amountLimit({
          max: 1000,
          currency: 'SOL',
          action: 'require_approval',
        }),
        PolicyRules.recipientWhitelist([]),
        PolicyRules.businessHours('UTC', 'require_approval'),
        PolicyRules.dailyLimit(5),
      ],
      metadata: {
        category: 'treasury',
        riskLevel: 'low',
        requiresApproval: true,
      },
    }
  }
}

/**
 * Helper function to validate policy rule configuration
 */
export function validatePolicyRule(rule: PolicyRule): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate amount rules
  if (rule.type === 'amount_limit') {
    const condition = rule.condition as any
    if (condition.type === 'amount') {
      if (condition.min !== undefined && condition.max !== undefined) {
        if (condition.min >= condition.max) {
          errors.push('Minimum amount must be less than maximum amount')
        }
      }
      if (condition.min !== undefined && condition.min < 0) {
        errors.push('Minimum amount cannot be negative')
      }
      if (condition.max !== undefined && condition.max <= 0) {
        errors.push('Maximum amount must be positive')
      }
    }
  }

  // Validate time rules
  if (rule.type === 'time_restriction') {
    const condition = rule.condition as any
    if (condition.type === 'time_range') {
      if (condition.startTime && !isValidTimeFormat(condition.startTime)) {
        errors.push('Invalid start time format (use HH:MM)')
      }
      if (condition.endTime && !isValidTimeFormat(condition.endTime)) {
        errors.push('Invalid end time format (use HH:MM)')
      }
    }
    if (condition.type === 'day_of_week') {
      if (condition.daysOfWeek) {
        const invalidDays = condition.daysOfWeek.filter(d => d < 0 || d > 6)
        if (invalidDays.length > 0) {
          errors.push(`Invalid day of week values: ${invalidDays.join(', ')}`)
        }
      }
    }
  }

  // Validate frequency rules
  if (rule.type === 'frequency_limit') {
    const condition = rule.condition as any
    if (condition.type === 'frequency') {
      if (condition.maxCount <= 0) {
        errors.push('Maximum count must be positive')
      }
    }
  }

  // Validate recipient rules
  if (rule.type === 'recipient_whitelist' || rule.type === 'recipient_blacklist') {
    const condition = rule.condition as any
    if (condition.type === 'recipient') {
      if (!condition.addresses || condition.addresses.length === 0) {
        errors.push('Recipient list cannot be empty')
      }
      // Validate Solana address format
      const invalidAddresses = condition.addresses.filter((addr: string) => {
        try {
          PublicKey.isOnCurve(new PublicKey(addr))
          return false
        } catch {
          return true
        }
      })
      if (invalidAddresses.length > 0) {
        errors.push(`Invalid Solana addresses: ${invalidAddresses.join(', ')}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Helper function to validate time format (HH:MM)
 */
function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(time)
}
