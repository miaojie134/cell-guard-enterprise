import { User, DepartmentPermission, USER_ROLES, PERMISSION_TYPES } from '@/types';

// 权限检查辅助函数

/**
 * 检查用户是否为超级管理员
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;

  // 检查新的isSuperAdmin字段
  if ('isSuperAdmin' in user && typeof user.isSuperAdmin === 'boolean') {
    return user.isSuperAdmin;
  }

  // 向后兼容：检查role字段
  return user.role === USER_ROLES.SUPER_ADMIN;
}

/**
 * 检查用户是否为区域管理员
 */
export function isRegionalAdmin(user: User | null): boolean {
  if (!user) return false;

  // 如果是超级管理员，则不是区域管理员
  if (isSuperAdmin(user)) return false;

  // 检查是否有部门权限（表示是区域管理员）
  if (user.departmentPermissions && user.departmentPermissions.length > 0) {
    return true;
  }

  // 向后兼容：检查role字段
  return user.role === USER_ROLES.REGIONAL_ADMIN;
}

/**
 * 检查用户是否有管理权限（针对特定部门）
 */
export function hasManagePermission(user: User | null, departmentId?: number): boolean {
  if (!user) return false;

  // 超级管理员拥有所有权限
  if (isSuperAdmin(user)) return true;

  // 如果未指定部门ID，返回false
  if (!departmentId) return false;

  // 检查区域管理员是否有该部门的管理权限
  const managedDepartmentIds = getManagedDepartmentIds(user);
  return managedDepartmentIds.includes(departmentId);
}

/**
 * 检查用户是否有查看权限（针对特定部门）
 */
export function hasViewPermission(user: User | null, departmentId?: number): boolean {
  if (!user) return false;

  // 超级管理员拥有所有权限
  if (isSuperAdmin(user)) return true;

  // 如果未指定部门ID，返回false
  if (!departmentId) return false;

  // 检查区域管理员是否有该部门的查看权限
  return user.departmentPermissions?.some(
    (p: DepartmentPermission) => p.departmentId === departmentId
  ) || false;
}

/**
 * 获取用户可管理的部门ID列表
 */
export function getManagedDepartmentIds(user: User | null): number[] {
  if (!user) return [];

  // 超级管理员拥有所有权限（这里返回空数组，在具体使用时需要特殊处理）
  if (isSuperAdmin(user)) return [];

  // 返回有管理权限的部门ID列表
  return user.departmentPermissions?.filter(
    (p: DepartmentPermission) => p.permissionType === PERMISSION_TYPES.MANAGE
  ).map((p: DepartmentPermission) => p.departmentId) || [];
}

/**
 * 获取用户可查看的部门ID列表
 */
export function getViewableDepartmentIds(user: User | null): number[] {
  if (!user) return [];

  // 超级管理员拥有所有权限（这里返回空数组，在具体使用时需要特殊处理）
  if (isSuperAdmin(user)) return [];

  // 返回有权限的部门ID列表（管理权限包含查看权限）
  return user.departmentPermissions?.map((p: DepartmentPermission) => p.departmentId) || [];
}

/**
 * 检查用户是否有权限访问某个菜单
 */
export function hasMenuPermission(user: User | null, menuKey: string): boolean {
  if (!user) return false;

  // 超级管理员可以访问所有菜单
  if (isSuperAdmin(user)) return true;

  // 区域管理员的菜单权限控制
  if (isRegionalAdmin(user)) {
    const restrictedMenus = ['departments', 'users', 'settings']; // 区域管理员不能访问的菜单
    return !restrictedMenus.includes(menuKey);
  }

  return false;
}

/**
 * 存储用户权限信息到localStorage
 */
export function storeUserPermissions(user: User): void {
  localStorage.setItem("userRole", user.role);
  localStorage.setItem("departmentPermissions", JSON.stringify(user.departmentPermissions || []));

  // 计算用户可管理的部门ID列表（用于权限控制）
  const managedDepartmentIds = getManagedDepartmentIds(user);
  localStorage.setItem("managedDepartmentIds", JSON.stringify(managedDepartmentIds));
}

/**
 * 从localStorage获取用户权限信息
 */
export function getUserPermissionsFromStorage(): {
  userRole: string | null;
  departmentPermissions: DepartmentPermission[];
  managedDepartmentIds: number[];
} {
  const userRole = localStorage.getItem("userRole");
  const departmentPermissions = JSON.parse(localStorage.getItem("departmentPermissions") || "[]");
  const managedDepartmentIds = JSON.parse(localStorage.getItem("managedDepartmentIds") || "[]");

  return {
    userRole,
    departmentPermissions,
    managedDepartmentIds
  };
}

/**
 * 清除权限相关的localStorage
 */
export function clearUserPermissions(): void {
  localStorage.removeItem("userRole");
  localStorage.removeItem("departmentPermissions");
  localStorage.removeItem("managedDepartmentIds");
} 