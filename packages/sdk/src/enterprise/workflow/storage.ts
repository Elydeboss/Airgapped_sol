import type {
  Workflow,
  WorkflowStorage,
  WorkflowListFilters,
} from './types.js'

/**
 * In-memory workflow storage for development and testing
 * For production, replace with database storage (PostgreSQL, MongoDB, etc.)
 */
export class InMemoryWorkflowStorage implements WorkflowStorage {
  private workflows: Map<string, Workflow> = new Map()

  async save(workflow: Workflow): Promise<void> {
    this.workflows.set(workflow.id, { ...workflow })
  }

  async get(workflowId: string): Promise<Workflow | null> {
    const workflow = this.workflows.get(workflowId)
    return workflow ? { ...workflow } : null
  }

  async list(filters?: WorkflowListFilters): Promise<Workflow[]> {
    let results = Array.from(this.workflows.values())

    // Apply filters
    if (filters?.status) {
      results = results.filter(w => w.status === filters.status)
    }

    if (filters?.createdBy) {
      results = results.filter(w => w.createdBy.equals(filters.createdBy!))
    }

    if (filters?.createdAfter) {
      results = results.filter(w => w.createdAt >= filters.createdAfter!)
    }

    if (filters?.createdBefore) {
      results = results.filter(w => w.createdAt <= filters.createdBefore!)
    }

    if (filters?.expiresAfter) {
      results = results.filter(w => {
        if (!w.expiresAt) return false
        return w.expiresAt >= filters.expiresAfter!
      })
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Apply pagination
    if (filters?.offset) {
      results = results.slice(filters.offset)
    }
    if (filters?.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  }

  async update(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const existing = this.workflows.get(workflowId)
    if (!existing) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    const updated = { ...existing, ...updates }
    this.workflows.set(workflowId, updated)
    return updated
  }

  async delete(workflowId: string): Promise<void> {
    this.workflows.delete(workflowId)
  }

  /**
   * Get current workflow count
   */
  size(): number {
    return this.workflows.size
  }

  /**
   * Clear all workflows (useful for testing)
   */
  clear(): void {
    this.workflows.clear()
  }
}

/**
 * LocalStorage-based workflow storage for browser environments
 * Provides persistence across page reloads
 */
export class LocalStorageWorkflowStorage implements WorkflowStorage {
  private storageKey: string
  private maxWorkflows: number

  constructor(storageKey = 'approval_workflows', maxWorkflows = 1000) {
    this.storageKey = storageKey
    this.maxWorkflows = maxWorkflows
  }

  private getWorkflows(): Workflow[] {
    if (typeof window === 'undefined') return []

    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data, (key, value) => {
        // Revive Date objects and PublicKey objects
        if (key === 'createdAt' && value) return new Date(value)
        if (key === 'expiresAt' && value) return new Date(value)
        if (key === 'timestamp' && value) return new Date(value)
        return value
      }) : []
    } catch {
      return []
    }
  }

  private setWorkflows(workflows: Workflow[]): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(workflows))
    } catch (error) {
      console.error('Failed to save workflows to localStorage:', error)
    }
  }

  async save(workflow: Workflow): Promise<void> {
    const workflows = this.getWorkflows()

    // Remove existing workflow with same ID
    const filtered = workflows.filter(w => w.id !== workflow.id)

    // Add new workflow
    filtered.push(workflow)

    // Trim to max size if needed
    if (filtered.length > this.maxWorkflows) {
      // Remove oldest workflows
      filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      filtered.splice(0, filtered.length - this.maxWorkflows)
    }

    this.setWorkflows(filtered)
  }

  async get(workflowId: string): Promise<Workflow | null> {
    const workflows = this.getWorkflows()
    return workflows.find(w => w.id === workflowId) || null
  }

  async list(filters?: WorkflowListFilters): Promise<Workflow[]> {
    let results = this.getWorkflows()

    // Apply filters (same as InMemoryWorkflowStorage)
    if (filters?.status) {
      results = results.filter(w => w.status === filters.status)
    }

    if (filters?.createdBy) {
      results = results.filter(w => w.createdBy.equals(filters.createdBy!))
    }

    if (filters?.createdAfter) {
      results = results.filter(w => w.createdAt >= filters.createdAfter!)
    }

    if (filters?.createdBefore) {
      results = results.filter(w => w.createdAt <= filters.createdBefore!)
    }

    if (filters?.expiresAfter) {
      results = results.filter(w => {
        if (!w.expiresAt) return false
        return w.expiresAt >= filters.expiresAfter!
      })
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    if (filters?.offset) {
      results = results.slice(filters.offset)
    }
    if (filters?.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  }

  async update(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflows = this.getWorkflows()
    const index = workflows.findIndex(w => w.id === workflowId)

    if (index === -1) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    const updated = { ...workflows[index], ...updates }
    workflows[index] = updated

    this.setWorkflows(workflows)
    return updated
  }

  async delete(workflowId: string): Promise<void> {
    const workflows = this.getWorkflows()
    const filtered = workflows.filter(w => w.id !== workflowId)
    this.setWorkflows(filtered)
  }

  /**
   * Clear all workflows
   */
  clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }
}
