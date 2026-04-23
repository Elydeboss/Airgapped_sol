import type { VersionedTransaction } from '@solana/web3.js'
import type { PublicKey } from '@solana/web3.js'

/**
 * Approval workflow types for enterprise transaction processing
 */

export type ApprovalType = 'sequential' | 'parallel' | 'threshold' | 'timelock'

export interface ApprovalPolicy {
  type: ApprovalType
  requiredApprovers: number // For threshold: need X of Y
  approvers?: PublicKey[] // Specific approvers (optional)
  timeoutMinutes?: number // Auto-expire after X minutes
  minAmount?: number // Require approval for transactions above this amount
  maxAmount?: number // Maximum amount allowed
  allowedRecipients?: PublicKey[] // Whitelist of recipients
  businessHoursOnly?: boolean // Only approve during business hours
}

export interface WorkflowStep {
  id: string
  workflowId: string
  sequence: number
  approver: PublicKey
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  timestamp: Date
  comment?: string
  metadata?: Record<string, unknown>
}

export type WorkflowStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled' | 'executing'

export interface Workflow {
  id: string
  transaction: VersionedTransaction
  policy: ApprovalPolicy
  status: WorkflowStatus
  createdBy: PublicKey
  createdAt: Date
  expiresAt?: Date
  steps: WorkflowStep[]
  currentStep?: number
  metadata?: Record<string, unknown>
}

export interface ApprovalRequest {
  workflowId: string
  requester: PublicKey
  approvers: PublicKey[]
  transaction: VersionedTransaction
  policy: ApprovalPolicy
  metadata?: Record<string, unknown>
}

export interface ApprovalResponse {
  workflowId: string
  stepId: string
  approver: PublicKey
  decision: 'approved' | 'rejected'
  timestamp: Date
  comment?: string
}

export interface ApprovalStatus {
  workflowId: string
  status: WorkflowStatus
  totalSteps: number
  completedSteps: number
  pendingApprovers: PublicKey[]
  approvedBy: PublicKey[]
  rejectedBy: PublicKey[]
  canExecute: boolean
  expiresAt?: Date
}

export interface WorkflowExecutionResult {
  workflowId: string
  transaction: VersionedTransaction
  signature?: string
  status: 'success' | 'failed'
  error?: string
  executedAt: Date
}

export interface WorkflowStorage {
  save(workflow: Workflow): Promise<void>
  get(workflowId: string): Promise<Workflow | null>
  list(filters?: WorkflowListFilters): Promise<Workflow[]>
  update(workflowId: string, updates: Partial<Workflow>): Promise<Workflow>
  delete(workflowId: string): Promise<void>
}

export interface WorkflowListFilters {
  status?: WorkflowStatus
  createdBy?: PublicKey
  createdAfter?: Date
  createdBefore?: Date
  expiresAfter?: Date
  limit?: number
  offset?: number
}
