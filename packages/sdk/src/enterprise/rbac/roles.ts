import { Permission } from './permissions.js'

/**
 * System roles with predefined permission sets
 */
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  APPROVER = 'approver',
  VIEWER = 'viewer',
  AUDITOR = 'auditor',
  USER = 'user',
}

/**
 * Role definitions with their associated permissions
 */
export const RolePermissions: Record<Role, Permission[]> = {
  /**
   * Super Admin - Has all permissions including system management
   */
  [Role.SUPER_ADMIN]: [Permission.ALL],

  /**
   * Admin - Can manage users, roles, policies, and view audits
   */
  [Role.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_VIEW,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_SUSPEND,
    Permission.USER_UNSUSPEND,
    Permission.ROLE_CREATE,
    Permission.ROLE_VIEW,
    Permission.ROLE_UPDATE,
    Permission.ROLE_ASSIGN,
    Permission.ROLE_REVOKE,
    Permission.POLICY_CREATE,
    Permission.POLICY_VIEW,
    Permission.POLICY_UPDATE,
    Permission.POLICY_DELETE,
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
    Permission.TRANSACTION_VIEW,
    Permission.WALLET_VIEW,
    Permission.KEY_VIEW,
    Permission.WORKFLOW_VIEW,
    Permission.SECURITY_ALERT_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.REPORT_EXPORT,
  ],

  /**
   * Operator - Can perform transactions and manage keys
   */
  [Role.OPERATOR]: [
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_SIGN,
    Permission.TRANSACTION_BROADCAST,
    Permission.TRANSACTION_VIEW,
    Permission.WALLET_CONNECT,
    Permission.WALLET_DISCONNECT,
    Permission.WALLET_VIEW,
    Permission.KEY_CREATE,
    Permission.KEY_VIEW,
    Permission.KEY_BACKUP,
    Permission.WORKFLOW_CREATE,
    Permission.WORKFLOW_VIEW,
  ],

  /**
   * Approver - Can approve workflows and view transactions
   */
  [Role.APPROVER]: [
    Permission.TRANSACTION_VIEW,
    Permission.WORKFLOW_VIEW,
    Permission.WORKFLOW_APPROVE,
    Permission.WORKFLOW_REJECT,
    Permission.AUDIT_VIEW,
    Permission.REPORT_VIEW,
  ],

  /**
   * Viewer - Read-only access to most resources
   */
  [Role.VIEWER]: [
    Permission.TRANSACTION_VIEW,
    Permission.WALLET_VIEW,
    Permission.KEY_VIEW,
    Permission.WORKFLOW_VIEW,
    Permission.POLICY_VIEW,
    Permission.ROLE_VIEW,
    Permission.REPORT_VIEW,
  ],

  /**
   * Auditor - Full access to audit logs and reports
   */
  [Role.AUDITOR]: [
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
    Permission.TRANSACTION_VIEW,
    Permission.USER_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.REPORT_EXPORT,
    Permission.SECURITY_ALERT_VIEW,
  ],

  /**
   * User - Basic permissions for regular users
   */
  [Role.USER]: [
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_VIEW,
    Permission.WALLET_CONNECT,
    Permission.WALLET_DISCONNECT,
    Permission.WALLET_VIEW,
    Permission.KEY_CREATE,
    Permission.KEY_VIEW,
    Permission.KEY_BACKUP,
  ],
}

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return RolePermissions[role] || []
}

/**
 * Check if role has specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role)
  return permissions.includes(Permission.ALL) || permissions.includes(permission)
}

/**
 * Get all available roles
 */
export function getAllRoles(): Role[] {
  return Object.values(Role)
}

/**
 * Validate if a string is a valid role
 */
export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role)
}

/**
 * Parse role string to enum
 */
export function parseRole(role: string): Role | null {
  if (isValidRole(role)) {
    return role as Role
  }
  return null
}

/**
 * Role hierarchy (higher number = higher privilege)
 */
export const RoleHierarchy: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.OPERATOR]: 60,
  [Role.APPROVER]: 50,
  [Role.AUDITOR]: 45,
  [Role.VIEWER]: 30,
  [Role.USER]: 20,
}

/**
 * Check if one role has higher privilege than another
 */
export function isHigherPrivilege(role1: Role, role2: Role): boolean {
  return RoleHierarchy[role1] > RoleHierarchy[role2]
}

/**
 * Get highest privilege role from array of roles
 */
export function getHighestPrivilegeRole(roles: Role[]): Role {
  return roles.reduce((highest, current) =>
    isHigherPrivilege(current, highest) ? current : highest
  )
}
