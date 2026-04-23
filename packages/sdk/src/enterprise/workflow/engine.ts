import type {
  Workflow,
  WorkflowStep,
  ApprovalPolicy,
  ApprovalRequest,
  ApprovalResponse,
  ApprovalStatus,
  WorkflowExecutionResult,
  WorkflowStatus,
  WorkflowStorage,
  WorkflowListFilters,
} from './types.js'
import type { VersionedTransaction, PublicKey } from '@solana/web3.js'

/**
 * Workflow engine for managing multi-signature transaction approvals
 */
export class WorkflowEngine {
  private storage: WorkflowStorage

  constructor(storage: WorkflowStorage) {
    this.storage = storage
  }

  /**
   * Create a new approval workflow
   */
  async createWorkflow(
    transaction: VersionedTransaction,
    policy: ApprovalPolicy,
    createdBy: PublicKey,
    metadata?: Record<string, unknown>
  ): Promise<Workflow> {
    const workflowId = this.generateWorkflowId()
    const now = new Date()
    const expiresAt = policy.timeoutMinutes
      ? new Date(now.getTime() + policy.timeoutMinutes * 60 * 1000)
      : undefined

    // Create workflow steps based on policy type
    const steps = this.createSteps(workflowId, policy, createdBy, now)

    const workflow: Workflow = {
      id: workflowId,
      transaction,
      policy,
      status: 'pending',
      createdBy,
      createdAt: now,
      expiresAt,
      steps,
      currentStep: 0,
      metadata,
    }

    await this.storage.save(workflow)
    return workflow
  }

  /**
   * Approve a workflow step
   */
  async approveStep(
    workflowId: string,
    approver: PublicKey,
    comment?: string
  ): Promise<Workflow> {
    const workflow = await this.storage.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    // Check if workflow is still pending
    if (workflow.status !== 'pending') {
      throw new Error(
        `Cannot approve workflow with status: ${workflow.status}`
      )
    }

    // Check if workflow has expired
    if (workflow.expiresAt && workflow.expiresAt < new Date()) {
      workflow.status = 'expired'
      await this.storage.update(workflowId, workflow)
      throw new Error('Workflow has expired')
    }

    // Find pending step for this approver
    const stepIndex = workflow.steps.findIndex(
      step =>
        step.approver.equals(approver) &&
        step.status === 'pending' &&
        this.isStepCurrent(step, workflow)
    )

    if (stepIndex === -1) {
      throw new Error('No pending approval step found for this approver')
    }

    // Update step status
    workflow.steps[stepIndex].status = 'approved'
    workflow.steps[stepIndex].timestamp = new Date()
    workflow.steps[stepIndex].comment = comment

    // Check if workflow is complete
    const isComplete = this.checkWorkflowComplete(workflow)
    if (isComplete) {
      workflow.status = 'approved'
    }

    return await this.storage.update(workflowId, workflow)
  }

  /**
   * Reject a workflow step
   */
  async rejectStep(
    workflowId: string,
    approver: PublicKey,
    comment?: string
  ): Promise<Workflow> {
    const workflow = await this.storage.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    // Find pending step for this approver
    const stepIndex = workflow.steps.findIndex(
      step =>
        step.approver.equals(approver) &&
        step.status === 'pending' &&
        this.isStepCurrent(step, workflow)
    )

    if (stepIndex === -1) {
      throw new Error('No pending approval step found for this approver')
    }

    // Update step and workflow status
    workflow.steps[stepIndex].status = 'rejected'
    workflow.steps[stepIndex].timestamp = new Date()
    workflow.steps[stepIndex].comment = comment
    workflow.status = 'rejected'

    return await this.storage.update(workflowId, workflow)
  }

  /**
   * Check approval status of a workflow
   */
  async getApprovalStatus(workflowId: string): Promise<ApprovalStatus> {
    const workflow = await this.storage.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    const pendingApprovers: PublicKey[] = []
    const approvedBy: PublicKey[] = []
    const rejectedBy: PublicKey[] = []

    for (const step of workflow.steps) {
      if (step.status === 'pending' && this.isStepCurrent(step, workflow)) {
        pendingApprovers.push(step.approver)
      } else if (step.status === 'approved') {
        approvedBy.push(step.approver)
      } else if (step.status === 'rejected') {
        rejectedBy.push(step.approver)
      }
    }

    const canExecute = this.canExecuteWorkflow(workflow)

    return {
      workflowId: workflow.id,
      status: workflow.status,
      totalSteps: workflow.steps.length,
      completedSteps: workflow.steps.filter(s => s.status !== 'pending').length,
      pendingApprovers,
      approvedBy,
      rejectedBy,
      canExecute,
      expiresAt: workflow.expiresAt,
    }
  }

  /**
   * Execute a fully approved workflow
   */
  async executeWorkflow(
    workflowId: string
  ): Promise<WorkflowExecutionResult> {
    const workflow = await this.storage.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    // Check if workflow can be executed
    if (!this.canExecuteWorkflow(workflow)) {
      throw new Error('Workflow cannot be executed')
    }

    // Update status to executing
    workflow.status = 'executing'
    await this.storage.update(workflowId, workflow)

    try {
      // For now, return the transaction for broadcasting
      // In production, this would integrate with your transaction broadcasting system
      return {
        workflowId: workflow.id,
        transaction: workflow.transaction,
        status: 'success',
        executedAt: new Date(),
      }
    } catch (error) {
      workflow.status = 'pending' // Revert on failure
      await this.storage.update(workflowId, workflow)

      return {
        workflowId: workflow.id,
        transaction: workflow.transaction,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        executedAt: new Date(),
      }
    }
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(
    workflowId: string,
    reason?: string
  ): Promise<Workflow> {
    const workflow = await this.storage.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    if (workflow.status !== 'pending') {
      throw new Error(`Cannot cancel workflow with status: ${workflow.status}`)
    }

    workflow.status = 'cancelled'
    if (reason) {
      workflow.metadata = { ...workflow.metadata, cancellationReason: reason }
    }

    return await this.storage.update(workflowId, workflow)
  }

  /**
   * List workflows with optional filters
   */
  async listWorkflows(filters?: WorkflowListFilters): Promise<Workflow[]> {
    return await this.storage.list(filters)
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    return await this.storage.get(workflowId)
  }

  /**
   * Create workflow steps based on policy type
   */
  private createSteps(
    workflowId: string,
    policy: ApprovalPolicy,
    createdBy: PublicKey,
    timestamp: Date
  ): WorkflowStep[] {
    const steps: WorkflowStep[] = []

    switch (policy.type) {
      case 'sequential':
        // Create sequential steps for each approver
        if (policy.approvers) {
          policy.approvers.forEach((approver, index) => {
            steps.push({
              id: this.generateStepId(workflowId, index),
              workflowId,
              sequence: index,
              approver,
              status: 'pending',
              timestamp,
            })
          })
        }
        break

      case 'parallel':
      case 'threshold':
        // Create parallel steps (all can approve simultaneously)
        if (policy.approvers) {
          policy.approvers.forEach((approver, index) => {
            steps.push({
              id: this.generateStepId(workflowId, index),
              workflowId,
              sequence: 0, // All at same level for parallel
              approver,
              status: 'pending',
              timestamp,
            })
          })
        }
        break

      case 'timelock':
        // Single approval step with time delay
        steps.push({
          id: this.generateStepId(workflowId, 0),
          workflowId,
          sequence: 0,
          approver: createdBy,
          status: 'pending',
          timestamp,
          metadata: { timelock: true },
        })
        break
    }

    return steps
  }

  /**
   * Check if a workflow is complete (all required approvals received)
   */
  private checkWorkflowComplete(workflow: Workflow): boolean {
    const { policy, steps } = workflow

    switch (policy.type) {
      case 'sequential':
        // All steps must be approved in order
        for (let i = 0; i < steps.length; i++) {
          if (steps[i].status !== 'approved') {
            return false
          }
        }
        return true

      case 'parallel':
        // All steps must be approved (any order)
        return steps.every(step => step.status === 'approved')

      case 'threshold':
        // Need at least requiredApprovers approvals
        const approvedCount = steps.filter(step => step.status === 'approved').length
        return approvedCount >= (policy.requiredApprovers || steps.length)

      case 'timelock':
        // Must have waited the timeout period and have approval
        const timeElapsed = Date.now() - workflow.createdAt.getTime()
        const timeoutMs = (policy.timeoutMinutes || 0) * 60 * 1000
        const hasApproval = steps.some(step => step.status === 'approved')
        return timeElapsed >= timeoutMs && hasApproval

      default:
        return false
    }
  }

  /**
   * Check if a workflow can be executed
   */
  private canExecuteWorkflow(workflow: Workflow): boolean {
    return (
      workflow.status === 'approved' ||
      this.checkWorkflowComplete(workflow)
    )
  }

  /**
   * Check if a step is currently active (can be approved)
   */
  private isStepCurrent(step: WorkflowStep, workflow: Workflow): boolean {
    switch (workflow.policy.type) {
      case 'sequential':
        // Only the next pending step is current
        const firstPendingIndex = workflow.steps.findIndex(s => s.status === 'pending')
        return step.sequence === firstPendingIndex

      case 'parallel':
      case 'threshold':
        // All pending steps are current
        return step.status === 'pending'

      case 'timelock':
        // Step is current if time has passed
        const timeElapsed = Date.now() - workflow.createdAt.getTime()
        const timeoutMs = (workflow.policy.timeoutMinutes || 0) * 60 * 1000
        return timeElapsed >= timeoutMs

      default:
        return true
    }
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique step ID
   */
  private generateStepId(workflowId: string, index: number): string {
    return `${workflowId}_step_${index}_${Date.now()}`
  }
}
