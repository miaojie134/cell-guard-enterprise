import { API_CONFIG, APIResponse, APIErrorResponse } from '@/config/api/base';

// 用户权限管理相关类型定义
export interface UserPermissionInfo {
  userId: number;
  username: string;
  name?: string;
  isSuperAdmin: boolean;
  role?: string;
  departmentPermissions?: Array<{
    departmentId: number;
    departmentName: string;
    permissionType: 'manage' | 'view';
  }>;
}

export interface AssignPermissionRequest {
  departmentIds: number[];
  permissionType: 'manage' | 'view';
}



// PUT请求期望的权限数组格式
interface UserDepartmentPermission {
  departmentId: number;
  permissionType: 'manage' | 'view';
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

  // 为用户分配部门权限
  async assignUserPermissions(userId: string, request: AssignPermissionRequest): Promise<void> {
    try {
      console.log('分配用户权限:', userId, request);

      // POST请求期望 {departmentIds: [], permissionType: "xxx"} 格式
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/permissions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request), // 直接发送原格式
      });

      await this.handleResponse<null>(response);
    } catch (error) {
      console.error('分配用户权限失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('分配用户权限失败');
    }
  }

  // 更新用户权限设置
  async updateUserPermissions(userId: string, request: AssignPermissionRequest): Promise<void> {
    try {
      console.log('更新用户权限:', userId, request);

      // PUT请求期望数组格式 [{departmentId: x, permissionType: "xxx"}]
      const permissions: UserDepartmentPermission[] = request.departmentIds.map(departmentId => ({
        departmentId,
        permissionType: request.permissionType
      }));

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/permissions`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(permissions), // 发送数组格式
      });

      await this.handleResponse<null>(response);
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