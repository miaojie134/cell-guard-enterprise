import { User, DepartmentPermission, USER_ROLES, PERMISSION_TYPES, PermissionType } from '@/types';

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
  if (!user) {
    return false;
  }

  // 超级管理员拥有所有权限
  if (isSuperAdmin(user)) {
    return true;
  }

  // 如果未指定部门ID，检查用户是否在任何部门有管理权限
  if (departmentId === undefined) {
    return user.departmentPermissions?.some(
      (p: DepartmentPermission) => p.permissionType === PERMISSION_TYPES.MANAGE
    ) || false;
  }

  // 使用新的权限检查逻辑，支持父子部门权限继承
  const permissionType = getDepartmentPermissionType(user, departmentId);
  return permissionType === PERMISSION_TYPES.MANAGE;
}

/**
 * 检查用户是否有查看权限（针对特定部门）
 */
export function hasViewPermission(user: User | null, departmentId?: number): boolean {
  if (!user) return false;

  // 超级管理员拥有所有权限
  if (isSuperAdmin(user)) return true;

  // 如果未指定部门ID，检查用户是否在任何部门有查看权限
  if (departmentId === undefined) {
    return user.departmentPermissions?.length > 0 || false;
  }

  // 使用新的权限检查逻辑，支持父子部门权限继承
  const permissionType = getDepartmentPermissionType(user, departmentId);
  return permissionType === PERMISSION_TYPES.VIEW || permissionType === PERMISSION_TYPES.MANAGE;
}

/**
 * 获取用户可管理的部门ID列表（包含父部门和子部门）
 */
export function getManagedDepartmentIds(user: User | null): number[] {
  if (!user) return [];

  // 超级管理员拥有所有权限（这里返回空数组，在具体使用时需要特殊处理）
  if (isSuperAdmin(user)) return [];

  const managedIds: number[] = [];

  user.departmentPermissions?.forEach((p: DepartmentPermission) => {
    if (p.permissionType === PERMISSION_TYPES.MANAGE) {
      // 添加父部门ID
      managedIds.push(p.departmentId);
      // 添加所有子部门ID
      if (p.subDepartmentIds) {
        managedIds.push(...p.subDepartmentIds);
      }
    }
  });

  return managedIds;
}

/**
 * 获取用户可查看的部门ID列表（包含父部门和子部门）
 */
export function getViewableDepartmentIds(user: User | null): number[] {
  if (!user) return [];

  // 超级管理员拥有所有权限（这里返回空数组，在具体使用时需要特殊处理）
  if (isSuperAdmin(user)) return [];

  const viewableIds: number[] = [];

  user.departmentPermissions?.forEach((p: DepartmentPermission) => {
    // 管理权限和查看权限都可以查看
    // 添加父部门ID
    viewableIds.push(p.departmentId);
    // 添加所有子部门ID
    if (p.subDepartmentIds) {
      viewableIds.push(...p.subDepartmentIds);
    }
  });

  return viewableIds;
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

/**
 * 根据部门ID获取用户对该部门的权限类型
 * 支持父子部门权限继承
 */
export function getDepartmentPermissionType(user: User | null, departmentId: number): PermissionType | null {
  if (!user) {
    return null;
  }

  // 超级管理员拥有所有权限
  if (isSuperAdmin(user)) {
    return PERMISSION_TYPES.MANAGE;
  }

  if (!user.departmentPermissions) {
    return null;
  }

  // 查找权限：先查父部门，再查子部门
  for (const permission of user.departmentPermissions) {
    // 检查是否是父部门
    if (permission.departmentId === departmentId) {
      return permission.permissionType;
    }

    // 检查是否是子部门
    if (permission.subDepartmentIds?.includes(departmentId)) {
      return permission.permissionType;
    }
  }

  return null;
}

