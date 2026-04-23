import { Permission } from './permissions.js'
import { Role, getPermissionsForRole, RolePermissions } from './roles.js'

/**
 * User interface for RBAC
 */
export interface User {
  id: string
  username?: string
  email?: string
  roles: Role[]
  permissions?: Permission[] // Additional custom permissions beyond roles
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean
  reason?: string
  missingPermissions?: Permission[]
}

/**
 * Authorization context for request/response
 */
export interface AuthorizationContext {
  user: User
  resource?: string
  action?: string
  metadata?: Record<string, unknown>
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  // Check wildcard permission
  if (user.permissions?.includes(Permission.ALL)) {
    return true
  }

  // Check direct permission assignment
  if (user.permissions?.includes(permission)) {
    return true
  }

  // Check permissions from roles
  for (const role of user.roles) {
    const rolePermissions = getPermissionsForRole(role)
    if (rolePermissions.includes(Permission.ALL) || rolePermissions.includes(permission)) {
      return true
    }
  }

  return false
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission))
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission))
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User, role: Role): boolean {
  return user.roles.includes(role)
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User, roles: Role[]): boolean {
  return roles.some(role => hasRole(user, role))
}

/**
 * Get all permissions for a user (from roles + direct assignments)
 */
export function getUserPermissions(user: User): Permission[] {
  const permissions = new Set<Permission>()

  // Add permissions from roles
  for (const role of user.roles) {
    const rolePermissions = getPermissionsForRole(role)
    rolePermissions.forEach(permission => permissions.add(permission))
  }

  // Add directly assigned permissions
  if (user.permissions) {
    user.permissions.forEach(permission => permissions.add(permission))
  }

  return Array.from(permissions)
}

/**
 * Check permission with detailed result
 */
export function checkPermission(
  user: User,
  permission: Permission
): PermissionCheckResult {
  if (hasPermission(user, permission)) {
    return { granted: true }
  }

  const missingPermissions = [permission]
  return {
    granted: false,
    reason: `User lacks required permission: ${permission}`,
    missingPermissions,
  }
}

/**
 * Check multiple permissions with detailed result
 */
export function checkPermissions(
  user: User,
  permissions: Permission[],
  requireAll: boolean = true
): PermissionCheckResult {
  const missing: Permission[] = []

  if (requireAll) {
    // User must have ALL permissions
    for (const permission of permissions) {
      if (!hasPermission(user, permission)) {
        missing.push(permission)
      }
    }

    if (missing.length === 0) {
      return { granted: true }
    }

    return {
      granted: false,
      reason: `User lacks ${missing.length} required permissions`,
      missingPermissions: missing,
    }
  } else {
    // User must have AT LEAST ONE permission
    const hasOne = permissions.some(permission => hasPermission(user, permission))

    if (hasOne) {
      return { granted: true }
    }

    return {
      granted: false,
      reason: 'User lacks at least one required permission',
      missingPermissions: permissions,
    }
  }
}

/**
 * Create a middleware function for Express.js style routes
 */
export function requirePermission(permission: Permission) {
  return (ctx: AuthorizationContext): PermissionCheckResult => {
    return checkPermission(ctx.user, permission)
  }
}

/**
 * Create a middleware function requiring all permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return (ctx: AuthorizationContext): PermissionCheckResult => {
    return checkPermissions(ctx.user, permissions, true)
  }
}

/**
 * Create a middleware function requiring any permission
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (ctx: AuthorizationContext): PermissionCheckResult => {
    return checkPermissions(ctx.user, permissions, false)
  }
}

/**
 * Create a middleware function requiring role
 */
export function requireRole(role: Role) {
  return (ctx: AuthorizationContext): PermissionCheckResult => {
    if (hasRole(ctx.user, role)) {
      return { granted: true }
    }

    return {
      granted: false,
      reason: `User lacks required role: ${role}`,
    }
  }
}

/**
 * Create a middleware function requiring any role
 */
export function requireAnyRole(roles: Role[]) {
  return (ctx: AuthorizationContext): PermissionCheckResult => {
    if (hasAnyRole(ctx.user, roles)) {
      return { granted: true }
    }

    return {
      granted: false,
      reason: `User lacks any of the required roles: ${roles.join(', ')}`,
    }
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string = 'UNAUTHORIZED',
    public missingPermissions?: Permission[]
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Throw if permission is not granted
 */
export function throwIfUnauthorized(
  user: User,
  permission: Permission
): void {
  const result = checkPermission(user, permission)
  if (!result.granted) {
    throw new AuthorizationError(
      result.reason || 'Unauthorized',
      'UNAUTHORIZED',
      result.missingPermissions
    )
  }
}

/**
 * Throw if role is not assigned
 */
export function throwIfWrongRole(user: User, role: Role): void {
  if (!hasRole(user, role)) {
    throw new AuthorizationError(
      `User must have role: ${role}`,
      'FORBIDDEN'
    )
  }
}

/**
 * Filter resources based on user permissions
 */
export function filterByPermission<T>(
  items: T[],
  user: User,
  permission: Permission,
  getPermissionCheck?: (item: T) => boolean
): T[] {
  if (hasPermission(user, permission)) {
    return items
  }

  if (getPermissionCheck) {
    return items.filter(getPermissionCheck)
  }

  return []
}

/**
 * Create a permission guard for React components
 */
export function usePermissionGuard(user: User, permission: Permission): boolean {
  return hasPermission(user, permission)
}

/**
 * Create a role guard for React components
 */
export function useRoleGuard(user: User, role: Role): boolean {
  return hasRole(user, role)
}
