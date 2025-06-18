import { API_CONFIG, APIResponse, APIErrorResponse } from '@/config/api/base';

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
  // 获取认证头
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // 处理API响应
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // 尝试解析错误响应
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
      } catch {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // 对于成功的响应，检查是否有内容
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      // 如果响应有标准格式，使用data字段；否则直接返回响应数据
      if (data && typeof data === 'object' && 'data' in data) {
        return data.data;
      }
      return data;
    }

    // 如果没有JSON内容（如204 No Content），返回null
    return null as T;
  }

  // 获取用户权限信息
  async getUserPermissions(userId: string): Promise<UserPermissionInfo> {
    try {
      console.log('获取用户权限信息:', userId);

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/permissions`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<UserPermissionInfo>(response);
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

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/permissions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      return await this.handleResponse<UserPermissionInfo>(response);
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

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/permissions`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      return await this.handleResponse<UserPermissionInfo>(response);
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