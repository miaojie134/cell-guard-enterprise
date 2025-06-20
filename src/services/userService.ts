import { API_CONFIG } from '@/config/api/base';
import { apiFetch } from './api';

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
  // 创建用户
  async createUser(request: CreateUserRequest): Promise<User> {
    try {
      console.log('创建用户:', request);

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/users`, {
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

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/users`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.data;
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

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
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

      const response = await apiFetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
      }
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