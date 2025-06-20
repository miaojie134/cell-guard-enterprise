import { API_CONFIG, APIResponse, APIErrorResponse } from '@/config/api/base';
import { apiFetch } from './api';

// 简化的用户权限信息类型定义 - 只支持1级部门的直接权限
export interface UserPermissionInfo {
  userId: number;
  username: string;
  isSuperAdmin: boolean;
  permissions: Array<{
    departmentId: number;
    departmentName: string;
    permissionType: 'manage' | 'view';
  }>;
}

// 简化的权限请求格式 - 只支持1级部门，只有manage和view两种权限
export interface PermissionRequest {
  permissions: Array<{
    departmentId: number;        // 必须是1级部门ID
    permissionType: 'manage' | 'view';  // 只支持 "manage" 或 "view"
  }>;
}

class UserPermissionService {
  // 获取用户权限信息
  async getUserPermissions(userId: string): Promise<UserPermissionInfo> {
    try {
      console.log('获取用户权限信息:', userId);

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/users/${userId}/permissions`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('获取用户权限信息失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取用户权限信息失败');
    }
  }

  // 为用户分配部门权限 (只支持1级部门)
  async assignUserPermissions(userId: string, request: PermissionRequest): Promise<UserPermissionInfo> {
    try {
      console.log('分配用户权限:', userId, request);

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/users/${userId}/permissions`, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('分配用户权限失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('分配用户权限失败');
    }
  }

  // 更新用户权限设置 (只支持1级部门)
  async updateUserPermissions(userId: string, request: PermissionRequest): Promise<UserPermissionInfo> {
    try {
      console.log('更新用户权限:', userId, request);

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/users/${userId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('更新用户权限失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('更新用户权限失败');
    }
  }
}

// 导出服务实例
export const userPermissionService = new UserPermissionService(); 