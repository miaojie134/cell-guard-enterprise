import { API_CONFIG } from '@/config/api/base';

// 用户信息类型定义
export interface User {
  userId: number;
  username: string;
  name?: string;
  role: 'super_admin' | 'regional_admin';
  isSuperAdmin: boolean; // 改为必选字段，兼容现有逻辑
  departmentPermissions?: Array<{
    departmentId: number;
    departmentName: string;
    permissionType: 'manage' | 'view';
  }>;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  password: string;
  role: 'super_admin' | 'regional_admin';
}

// 更新用户请求
export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: 'super_admin' | 'regional_admin';
}

class UserService {
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

  // 创建用户
  async createUser(request: CreateUserRequest): Promise<User> {
    try {
      console.log('创建用户:', request);

      const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      return await this.handleResponse<User>(response);
    } catch (error) {
      console.error('创建用户失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('创建用户失败');
    }
  }

  // 获取所有用户
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('获取所有用户');

      const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<User[]>(response);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('获取用户列表失败');
    }
  }

  // 更新用户信息
  async updateUser(userId: number, request: UpdateUserRequest): Promise<User> {
    try {
      console.log('更新用户信息:', userId, request);

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      return await this.handleResponse<User>(response);
    } catch (error) {
      console.error('更新用户信息失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('更新用户信息失败');
    }
  }

  // 删除用户
  async deleteUser(userId: number): Promise<void> {
    try {
      console.log('删除用户:', userId);

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      await this.handleResponse<null>(response);
    } catch (error) {
      console.error('删除用户失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('删除用户失败');
    }
  }
}

// 导出服务实例
export const userService = new UserService(); 