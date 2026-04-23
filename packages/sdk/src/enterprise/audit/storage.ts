import type {
  AuditEvent,
  AuditFilter,
  AuditStorage,
} from './types.js'

/**
 * In-memory audit storage for development and testing
 * For production, replace with database storage (PostgreSQL, MongoDB, etc.)
 */
export class InMemoryAuditStorage implements AuditStorage {
  private events: Map<string, AuditEvent> = new Map()
  private eventIdCounter = 0

  async write(event: AuditEvent): Promise<void> {
    // Ensure event has unique ID
    if (!event.id) {
      event.id = `audit_${++this.eventIdCounter}`
    }

    // Ensure timestamp is set
    if (!event.timestamp) {
      event.timestamp = new Date()
    }

    this.events.set(event.id, { ...event })
  }

  async query(filters: AuditFilter = {}): Promise<AuditEvent[]> {
    let results = Array.from(this.events.values())

    // Filter by userId
    if (filters.userId) {
      results = results.filter(e => e.userId === filters.userId)
    }

    // Filter by eventType
    if (filters.eventType) {
      const types = Array.isArray(filters.eventType)
        ? filters.eventType
        : [filters.eventType]
      results = results.filter(e => types.includes(e.eventType))
    }

    // Filter by date range
    if (filters.startDate) {
      results = results.filter(e => e.timestamp >= filters.startDate!)
    }
    if (filters.endDate) {
      results = results.filter(e => e.timestamp <= filters.endDate!)
    }

    // Filter by severity
    if (filters.severity && filters.severity.length > 0) {
      results = results.filter(e => filters.severity!.includes(e.severity))
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      results = results.filter(e => filters.status!.includes(e.status))
    }

    // Filter by resourceId
    if (filters.resourceId) {
      results = results.filter(e => e.resourceId === filters.resourceId)
    }

    // Filter by resourceType
    if (filters.resourceType) {
      results = results.filter(e => e.resourceType === filters.resourceType)
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply pagination
    if (filters.offset) {
      results = results.slice(filters.offset)
    }
    if (filters.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  }

  async count(filters: AuditFilter = {}): Promise<number> {
    const results = await this.query(filters)
    return results.length
  }

  async export(
    filters: AuditFilter,
    format: 'csv' | 'json'
  ): Promise<string> {
    const events = await this.query(filters)

    if (format === 'json') {
      return JSON.stringify(events, null, 2)
    }

    // CSV export
    const headers = [
      'id',
      'eventType',
      'userId',
      'username',
      'timestamp',
      'severity',
      'status',
      'resourceId',
      'resourceType',
      'ipAddress',
      'metadata',
    ]

    const rows = events.map(event => [
      event.id,
      event.eventType,
      event.userId || '',
      event.username || '',
      event.timestamp.toISOString(),
      event.severity,
      event.status,
      event.resourceId || '',
      event.resourceType || '',
      event.ipAddress || '',
      JSON.stringify(event.metadata || {}),
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  async clearOldEvents(beforeDate: Date): Promise<number> {
    let count = 0
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < beforeDate) {
        this.events.delete(id)
        count++
      }
    }
    return count
  }

  /**
   * Clear all events (useful for testing)
   */
  clear(): void {
    this.events.clear()
    this.eventIdCounter = 0
  }

  /**
   * Get current event count
   */
  size(): number {
    return this.events.size
  }
}

/**
 * LocalStorage-based audit storage for browser environments
 * Provides persistence across page reloads
 */
export class LocalStorageAuditStorage implements AuditStorage {
  private storageKey: string
  private maxEvents: number

  constructor(storageKey = 'audit_events', maxEvents = 10000) {
    this.storageKey = storageKey
    this.maxEvents = maxEvents
  }

  private getEvents(): AuditEvent[] {
    if (typeof window === 'undefined') return []

    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data, (key, value) => {
        // Revive Date objects
        if (key === 'timestamp' && value) {
          return new Date(value)
        }
        return value
      }) : []
    } catch {
      return []
    }
  }

  private setEvents(events: AuditEvent[]): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(events))
    } catch (error) {
      console.error('Failed to save audit events to localStorage:', error)
    }
  }

  async write(event: AuditEvent): Promise<void> {
    const events = this.getEvents()

    // Ensure event has ID
    if (!event.id) {
      event.id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Ensure timestamp
    if (!event.timestamp) {
      event.timestamp = new Date()
    }

    events.push(event)

    // Trim to max size if needed (remove oldest)
    if (events.length > this.maxEvents) {
      events.splice(0, events.length - this.maxEvents)
    }

    this.setEvents(events)
  }

  async query(filters: AuditFilter = {}): Promise<AuditEvent[]> {
    let results = this.getEvents()

    // Apply same filters as InMemoryAuditStorage
    if (filters.userId) {
      results = results.filter(e => e.userId === filters.userId)
    }

    if (filters.eventType) {
      const types = Array.isArray(filters.eventType)
        ? filters.eventType
        : [filters.eventType]
      results = results.filter(e => types.includes(e.eventType))
    }

    if (filters.startDate) {
      results = results.filter(e => e.timestamp >= filters.startDate!)
    }
    if (filters.endDate) {
      results = results.filter(e => e.timestamp <= filters.endDate!)
    }

    if (filters.severity && filters.severity.length > 0) {
      results = results.filter(e => filters.severity!.includes(e.severity))
    }

    if (filters.status && filters.status.length > 0) {
      results = results.filter(e => filters.status!.includes(e.status))
    }

    if (filters.resourceId) {
      results = results.filter(e => e.resourceId === filters.resourceId)
    }

    if (filters.resourceType) {
      results = results.filter(e => e.resourceType === filters.resourceType)
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (filters.offset) {
      results = results.slice(filters.offset)
    }
    if (filters.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  }

  async count(filters: AuditFilter = {}): Promise<number> {
    const results = await this.query(filters)
    return results.length
  }

  async export(
    filters: AuditFilter,
    format: 'csv' | 'json'
  ): Promise<string> {
    const events = await this.query(filters)

    if (format === 'json') {
      return JSON.stringify(events, null, 2)
    }

    // CSV export (same as InMemoryAuditStorage)
    const headers = [
      'id',
      'eventType',
      'userId',
      'username',
      'timestamp',
      'severity',
      'status',
      'resourceId',
      'resourceType',
      'ipAddress',
      'metadata',
    ]

    const rows = events.map(event => [
      event.id,
      event.eventType,
      event.userId || '',
      event.username || '',
      event.timestamp.toISOString(),
      event.severity,
      event.status,
      event.resourceId || '',
      event.resourceType || '',
      event.ipAddress || '',
      JSON.stringify(event.metadata || {}),
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  async clearOldEvents(beforeDate: Date): Promise<number> {
    const events = this.getEvents()
    const initialCount = events.length
    const filtered = events.filter(e => e.timestamp >= beforeDate)
    this.setEvents(filtered)
    return initialCount - filtered.length
  }
}
