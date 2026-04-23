import type {
  AuditEvent,
  AuditFilter,
  AuditLoggerConfig,
  AuditSummary,
  AuditComplianceData,
} from './types.js'
import { AuditEventType } from './types.js'
import { AuditStorage } from './storage.js'

/**
 * Audit logger for enterprise compliance
 * Provides immutable audit trail for all system events
 */
export class AuditLogger {
  private storage: AuditStorage
  private enableConsole: boolean
  private minSeverity: AuditEvent['severity']
  private eventBuffer: AuditEvent[] = []
  private batchSize: number
  private flushInterval: number
  private flushTimer?: ReturnType<typeof setInterval>

  constructor(config: AuditLoggerConfig) {
    this.storage = config.storage
    this.enableConsole = config.enableConsole ?? false
    this.minSeverity = config.minSeverity ?? 'low'
    this.batchSize = config.batchSize ?? 100
    this.flushInterval = config.flushInterval ?? 30000 // 30 seconds

    // Start auto-flush if interval is set
    if (this.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush()
      }, this.flushInterval)
    }
  }

  /**
   * Log an audit event
   */
  async logEvent(
    eventType: AuditEventType,
    details: Partial<AuditEvent> = {}
  ): Promise<void> {
    // Determine severity based on event type if not provided
    let severity = details.severity ?? this.getDefaultSeverity(eventType)

    // Skip if below minimum severity
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
    if (severityLevels[severity] < severityLevels[this.minSeverity]) {
      return
    }

    // Create audit event
    const event: AuditEvent = {
      id: details.id ?? this.generateEventId(),
      eventType,
      timestamp: details.timestamp ?? new Date(),
      severity,
      status: details.status ?? 'success',
      ...details,
    }

    // Add to buffer
    this.eventBuffer.push(event)

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.batchSize) {
      await this.flush()
    }

    // Console logging if enabled
    if (this.enableConsole) {
      this.logToConsole(event)
    }
  }

  /**
   * Flush buffered events to storage
   */
  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return
    }

    const eventsToFlush = [...this.eventBuffer]
    this.eventBuffer = []

    // Write all events to storage
    await Promise.all(
      eventsToFlush.map(event => this.storage.write(event))
    )
  }

  /**
   * Query audit trail
   */
  async getAuditTrail(filters?: AuditFilter): Promise<AuditEvent[]> {
    await this.flush() // Ensure all events are written
    return this.storage.query(filters)
  }

  /**
   * Get audit summary
   */
  async getSummary(filters?: AuditFilter): Promise<AuditSummary> {
    const events = await this.getAuditTrail(filters)

    const eventCounts: Record<string, number> = {}
    const userActivity: Record<string, number> = {}
    let securityIncidents = 0
    let policyViolations = 0
    let lastActivity: Date | null = null

    for (const event of events) {
      // Count by event type
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1

      // Count by user
      if (event.userId) {
        userActivity[event.userId] = (userActivity[event.userId] || 0) + 1
      }

      // Count security incidents
      if (event.eventType.startsWith('security.')) {
        securityIncidents++
      }

      // Count policy violations
      if (event.eventType === AuditEventType.POLICY_VIOLATION) {
        policyViolations++
      }

      // Track last activity
      if (!lastActivity || event.timestamp > lastActivity) {
        lastActivity = event.timestamp
      }
    }

    return {
      totalEvents: events.length,
      eventCounts: eventCounts as Record<AuditEventType, number>,
      userActivity,
      securityIncidents,
      policyViolations,
      lastActivity,
    }
  }

  /**
   * Generate compliance data for reporting
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<AuditComplianceData> {
    const filters: AuditFilter = {
      startDate,
      endDate,
    }

    const events = await this.getAuditTrail(filters)

    // Aggregate by type
    const eventsByType: Record<string, number> = {}
    events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1
    })

    // Aggregate by user
    const eventsByUser: Record<string, number> = {}
    events.forEach(event => {
      if (event.userId) {
        eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1
      }
    })

    // Aggregate by severity
    const eventsBySeverity: Record<string, number> = {}
    events.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
    })

    // Filter security events
    const securityEvents = events.filter(e =>
      e.eventType.startsWith('security.') ||
      e.severity === 'critical' ||
      e.severity === 'high'
    )

    // Filter policy violations
    const policyViolations = events.filter(e =>
      e.eventType === AuditEventType.POLICY_VIOLATION
    )

    // Filter admin actions
    const adminActions = events.filter(e =>
      e.eventType.startsWith('admin.')
    )

    return {
      period: { start: startDate, end: endDate },
      totalEvents: events.length,
      eventsByType,
      eventsByUser,
      eventsBySeverity,
      securityEvents,
      policyViolations,
      adminActions,
    }
  }

  /**
   * Export audit trail
   */
  async exportAuditTrail(
    filters: AuditFilter,
    format: 'csv' | 'json' = 'json'
  ): Promise<string> {
    await this.flush()
    return this.storage.export(filters, format)
  }

  /**
   * Clear old audit events
   */
  async clearOldEvents(beforeDate: Date): Promise<number> {
    return this.storage.clearOldEvents(beforeDate)
  }

  /**
   * Stop the audit logger and cleanup
   */
  async shutdown(): Promise<void> {
    // Flush any remaining events
    await this.flush()

    // Clear timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  /**
   * Get default severity for event type
   */
  private getDefaultSeverity(eventType: AuditEventType): AuditEvent['severity'] {
    // Security events are high severity by default
    if (eventType.startsWith('security.')) {
      return 'high'
    }

    // Admin events are medium severity
    if (eventType.startsWith('admin.')) {
      return 'medium'
    }

    // Policy violations are high severity
    if (eventType === AuditEventType.POLICY_VIOLATION) {
      return 'high'
    }

    // Authentication failures are medium severity
    if (eventType === AuditEventType.USER_LOGIN_FAILED) {
      return 'medium'
    }

    // Transaction failures are medium severity
    if (eventType === AuditEventType.TRANSACTION_FAIL) {
      return 'medium'
    }

    // Default to low severity
    return 'low'
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Log event to console
   */
  private logToConsole(event: AuditEvent): void {
    const logLevel = this.getLogLevel(event.severity)
    const message = `[AUDIT] ${event.eventType}`

    const consoleMethod = {
      info: console.info,
      warn: console.warn,
      error: console.error,
    }[logLevel] || console.log

    consoleMethod(message, {
      userId: event.userId,
      timestamp: event.timestamp,
      severity: event.severity,
      status: event.status,
      ...event.metadata,
    })
  }

  /**
   * Get console log level for severity
   */
  private getLogLevel(severity: AuditEvent['severity']): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error'
      case 'medium':
        return 'warn'
      default:
        return 'info'
    }
  }
}

/**
 * Create a default audit logger instance
 */
export function createAuditLogger(config?: Partial<AuditLoggerConfig>): AuditLogger {
  const { InMemoryAuditStorage } = require('./storage.js')

  return new AuditLogger({
    storage: new InMemoryAuditStorage(),
    enableConsole: process.env.NODE_ENV === 'development',
    minSeverity: 'low',
    batchSize: 100,
    flushInterval: 30000,
    ...config,
  })
}
