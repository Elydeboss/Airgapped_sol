import type {
  ApprovalRequest,
  ApprovalResponse,
  ApprovalStatus,
  Workflow,
} from './types.js'
import type { PublicKey } from '@solana/web3.js'
import { WorkflowEngine } from './engine.js'
import type { WorkflowStorage } from './types.js'

/**
 * Approval management system
 * Handles requesting, tracking, and managing approvals
 */
export class ApprovalManager {
  private engine: WorkflowEngine

  constructor(storage: WorkflowStorage) {
    this.engine = new WorkflowEngine(storage)
  }

  /**
   * Request approval for a transaction
   */
  async requestApproval(request: ApprovalRequest): Promise<Workflow> {
    const workflow = await this.engine.createWorkflow(
      request.transaction,
      request.policy,
      request.requester,
      request.metadata
    )

    return workflow
  }

  /**
   * Approve a workflow step
   */
  async approve(
    workflowId: string,
    approver: PublicKey,
    comment?: string
  ): Promise<Workflow> {
    return await this.engine.approveStep(workflowId, approver, comment)
  }

  /**
   * Reject a workflow step
   */
  async reject(
    workflowId: string,
    approver: PublicKey,
    comment?: string
  ): Promise<Workflow> {
    return await this.engine.rejectStep(workflowId, approver, comment)
  }

  /**
   * Check approval status
   */
  async checkApprovals(workflowId: string): Promise<ApprovalStatus> {
    return await this.engine.getApprovalStatus(workflowId)
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(approver: PublicKey): Promise<Workflow[]> {
    const allWorkflows = await this.engine.listWorkflows({
      status: 'pending',
    })

    // Filter workflows where this approver has a pending step
    return allWorkflows.filter(workflow =>
      workflow.steps.some(
        step =>
          step.approver.equals(approver) &&
          step.status === 'pending' &&
          this.isStepCurrentForApprover(step, workflow)
      )
    )
  }

  /**
   * Get approved workflows ready for execution
   */
  async getReadyWorkflows(): Promise<Workflow[]> {
    const allWorkflows = await this.engine.listWorkflows()

    return allWorkflows.filter(workflow => {
      const status = workflow.status === 'approved'
      return status
    })
  }

  /**
   * Get workflow details
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    return await this.engine.getWorkflow(workflowId)
  }

  /**
   * Cancel a workflow
   */
  async cancel(workflowId: string, reason?: string): Promise<Workflow> {
    return await this.engine.cancelWorkflow(workflowId, reason)
  }

  /**
   * Execute an approved workflow
   */
  async execute(workflowId: string) {
    return await this.engine.executeWorkflow(workflowId)
  }

  /**
   * Check if step is current for an approver
   */
  private isStepCurrentForApprover(step: any, workflow: Workflow): boolean {
    switch (workflow.policy.type) {
      case 'sequential':
        const firstPendingIndex = workflow.steps.findIndex(s => s.status === 'pending')
        return step.sequence === firstPendingIndex

      case 'parallel':
      case 'threshold':
        return step.status === 'pending'

      case 'timelock':
        const timeElapsed = Date.now() - workflow.createdAt.getTime()
        const timeoutMs = (workflow.policy.timeoutMinutes || 0) * 60 * 1000
        return timeElapsed >= timeoutMs

      default:
        return true
    }
  }
}

/**
 * Helper function to create standard approval policies
 */
export class ApprovalPolicies {
  /**
   * Sequential approval (each approver must approve in order)
   */
  static sequential(
    approvers: PublicKey[],
    options?: Partial<ApprovalPolicy>
  ): ApprovalPolicy {
    return {
      type: 'sequential',
      approvers,
      requiredApprovers: approvers.length,
      ...options,
    }
  }

  /**
   * Parallel approval (all approvers must approve, any order)
   */
  static parallel(
    approvers: PublicKey[],
    options?: Partial<ApprovalPolicy>
  ): ApprovalPolicy {
    return {
      type: 'parallel',
      approvers,
      requiredApprovers: approvers.length,
      ...options,
    }
  }

  /**
   * Threshold approval (X of Y approvers must approve)
   */
  static threshold(
    approvers: PublicKey[],
    required: number,
    options?: Partial<ApprovalPolicy>
  ): ApprovalPolicy {
    return {
      type: 'threshold',
      approvers,
      requiredApprovers: required,
      ...options,
    }
  }

  /**
   * Time-locked approval (approval with time delay)
   */
  static timelock(
    approver: PublicKey,
    timeoutMinutes: number,
    options?: Partial<ApprovalPolicy>
  ): ApprovalPolicy {
    return {
      type: 'timelock',
      approvers: [approver],
      requiredApprovers: 1,
      timeoutMinutes,
      ...options,
    }
  }

  /**
   * Business hours only approval
   */
  static businessHours(
    approvers: PublicKey[],
    options?: Partial<ApprovalPolicy>
  ): ApprovalPolicy {
    return {
      type: 'parallel',
      approvers,
      requiredApprovers: approvers.length,
      businessHoursOnly: true,
      ...options,
    }
  }

  /**
   * Amount-based approval (require approval for amounts above threshold)
   */
  static amountThreshold(
    approvers: PublicKey[],
    minAmount: number,
    options?: Partial<ApprovalPolicy>
  ): ApprovalPolicy {
    return {
      type: 'threshold',
      approvers,
      requiredApprovers: Math.ceil(approvers.length / 2), // Majority
      minAmount,
      ...options,
    }
  }

  /**
   * Whitelist approval (only approved recipients)
   */
  static whitelist(
    approvers: PublicKey[],
    allowedRecipients: PublicKey[],
    options?: Partial<ApprovalPolicy>
  ): ApprovalPolicy {
    return {
      type: 'parallel',
      approvers,
      requiredApprovers: approvers.length,
      allowedRecipients,
      ...options,
    }
  }
}
