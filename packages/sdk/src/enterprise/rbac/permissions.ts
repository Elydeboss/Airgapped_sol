/**
 * Role-based access control (RBAC) permissions
 * Defines all available permissions in the system
 */

export enum Permission {
  // Transaction permissions
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_SIGN = 'transaction:sign',
  TRANSACTION_BROADCAST = 'transaction:broadcast',
  TRANSACTION_VIEW = 'transaction:view',
  TRANSACTION_DELETE = 'transaction:delete',

  // Key management permissions
  KEY_CREATE = 'key:create',
  KEY_IMPORT = 'key:import',
  KEY_EXPORT = 'key:export',
  KEY_DELETE = 'key:delete',
  KEY_VIEW = 'key:view',
  KEY_ROTATE = 'key:rotate',
  KEY_BACKUP = 'key:backup',
  KEY_RESTORE = 'key:restore',

  // Wallet permissions
  WALLET_CONNECT = 'wallet:connect',
  WALLET_DISCONNECT = 'wallet:disconnect',
  WALLET_VIEW = 'wallet:view',
  WALLET_MANAGE = 'wallet:manage',

  // User management permissions
  USER_CREATE = 'user:create',
  USER_VIEW = 'user:view',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_SUSPEND = 'user:suspend',
  USER_UNSUSPEND = 'user:unsuspend',

  // Role management permissions
  ROLE_CREATE = 'role:create',
  ROLE_VIEW = 'role:view',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',
  ROLE_ASSIGN = 'role:assign',
  ROLE_REVOKE = 'role:revoke',

  // Audit permissions
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',
  AUDIT_DELETE = 'audit:delete',

  // Policy permissions
  POLICY_CREATE = 'policy:create',
  POLICY_VIEW = 'policy:view',
  POLICY_UPDATE = 'policy:update',
  POLICY_DELETE = 'policy:delete',
  POLICY_OVERRIDE = 'policy:override',

  // Workflow permissions
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_VIEW = 'workflow:view',
  WORKFLOW_APPROVE = 'workflow:approve',
  WORKFLOW_REJECT = 'workflow:reject',
  WORKFLOW_CANCEL = 'workflow:cancel',
  WORKFLOW_EXECUTE = 'workflow:execute',

  // Admin permissions
  ADMIN_LOGIN = 'admin:login',
  ADMIN_CONFIG_VIEW = 'admin:config:view',
  ADMIN_CONFIG_UPDATE = 'admin:config:update',
  ADMIN_SYSTEM_MANAGE = 'admin:system:manage',

  // Security permissions
  SECURITY_ALERT_VIEW = 'security:alert:view',
  SECURITY_ALERT_RESOLVE = 'security:alert:resolve',
  SECURITY_MANAGE = 'security:manage',

  // Reporting permissions
  REPORT_VIEW = 'report:view',
  REPORT_GENERATE = 'report:generate',
  REPORT_EXPORT = 'report:export',

  // Wildcard permission (all permissions)
  ALL = '*',
}

/**
 * Permission categories for easier management
 */
export const PermissionCategories = {
  TRANSACTION: [
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_SIGN,
    Permission.TRANSACTION_BROADCAST,
    Permission.TRANSACTION_VIEW,
    Permission.TRANSACTION_DELETE,
  ],
  KEY: [
    Permission.KEY_CREATE,
    Permission.KEY_IMPORT,
    Permission.KEY_EXPORT,
    Permission.KEY_DELETE,
    Permission.KEY_VIEW,
    Permission.KEY_ROTATE,
    Permission.KEY_BACKUP,
    Permission.KEY_RESTORE,
  ],
  WALLET: [
    Permission.WALLET_CONNECT,
    Permission.WALLET_DISCONNECT,
    Permission.WALLET_VIEW,
    Permission.WALLET_MANAGE,
  ],
  USER: [
    Permission.USER_CREATE,
    Permission.USER_VIEW,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_SUSPEND,
    Permission.USER_UNSUSPEND,
  ],
  ROLE: [
    Permission.ROLE_CREATE,
    Permission.ROLE_VIEW,
    Permission.ROLE_UPDATE,
    Permission.ROLE_DELETE,
    Permission.ROLE_ASSIGN,
    Permission.ROLE_REVOKE,
  ],
  AUDIT: [
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
    Permission.AUDIT_DELETE,
  ],
  POLICY: [
    Permission.POLICY_CREATE,
    Permission.POLICY_VIEW,
    Permission.POLICY_UPDATE,
    Permission.POLICY_DELETE,
    Permission.POLICY_OVERRIDE,
  ],
  WORKFLOW: [
    Permission.WORKFLOW_CREATE,
    Permission.WORKFLOW_VIEW,
    Permission.WORKFLOW_APPROVE,
    Permission.WORKFLOW_REJECT,
    Permission.WORKFLOW_CANCEL,
    Permission.WORKFLOW_EXECUTE,
  ],
  ADMIN: [
    Permission.ADMIN_LOGIN,
    Permission.ADMIN_CONFIG_VIEW,
    Permission.ADMIN_CONFIG_UPDATE,
    Permission.ADMIN_SYSTEM_MANAGE,
  ],
  SECURITY: [
    Permission.SECURITY_ALERT_VIEW,
    Permission.SECURITY_ALERT_RESOLVE,
    Permission.SECURITY_MANAGE,
  ],
  REPORT: [
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.REPORT_EXPORT,
  ],
} as const

/**
 * Check if a permission string is valid
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(Permission).includes(permission as Permission)
}

/**
 * Parse permission string to enum
 */
export function parsePermission(permission: string): Permission | null {
  if (isValidPermission(permission)) {
    return permission as Permission
  }
  return null
}

/**
 * Get all permissions in a category
 */
export function getPermissionsInCategory(
  category: keyof typeof PermissionCategories
): Permission[] {
  return PermissionCategories[category] as Permission[]
}

/**
 * Check if wildcard permission grants specific permission
 */
export function hasWildcardPermission(
  permissions: Permission[],
  required: Permission
): boolean {
  return permissions.includes(Permission.ALL) || permissions.includes(required)
}
