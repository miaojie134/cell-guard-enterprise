import {
  API_CONFIG,
  APIResponse,
  APIErrorResponse,
  ResponseStatus,
  Department,
  DepartmentTreeNode,
  DepartmentOption,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  DepartmentSearchParams,
  DepartmentsListResponse,
  DepartmentTreeResponse,
  DepartmentOptionsResponse,
} from '@/config/api';
import { apiFetch } from './api';

class DepartmentService {
  // 获取部门列表
  async getDepartments(params: DepartmentSearchParams = {}): Promise<Department[]> {
    try {
      // 构建基础路径
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}`;

      // 构建查询参数
      const queryParams = new URLSearchParams();
      if (params.includeInactive !== undefined) {
        queryParams.append('includeInactive', params.includeInactive.toString());
      }
      if (params.parentId) {
        queryParams.append('parent_id', params.parentId.toString());
      }

      // 如果有查询参数，添加到URL中
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await apiFetch(url, {
        method: 'GET',
        signal: params.signal,
      });

      const data: DepartmentsListResponse | APIErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '获取部门列表失败');
      }

      const successData = data as DepartmentsListResponse;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '部门列表响应格式错误');
      }

      return successData.data;
    } catch (error) {
      console.error('Get departments error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  // 获取部门选项（用于下拉选择）
  async getDepartmentOptions(): Promise<DepartmentOption[]> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}/options`;

      const response = await apiFetch(url, {
        method: 'GET',
      });

      const data: DepartmentOptionsResponse | APIErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '获取部门选项失败');
      }

      const successData = data as DepartmentOptionsResponse;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '部门选项响应格式错误');
      }

      return successData.data;
    } catch (error) {
      console.error('Get department options error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  // 获取部门树
  async getDepartmentTree(): Promise<DepartmentTreeNode[]> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}/tree`;

      const response = await apiFetch(url, {
        method: 'GET',
      });

      const data: DepartmentTreeResponse | APIErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '获取部门树失败');
      }

      const successData = data as DepartmentTreeResponse;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '部门树响应格式错误');
      }

      return successData.data;
    } catch (error) {
      console.error('Get department tree error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  // 获取部门详情
  async getDepartmentById(id: number): Promise<Department> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}/${id}`;

      const response = await apiFetch(url, {
        method: 'GET',
      });

      const data: APIResponse<Department> | APIErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '获取部门详情失败');
      }

      const successData = data as APIResponse<Department>;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '部门详情响应格式错误');
      }

      return successData.data;
    } catch (error) {
      console.error('Get department by id error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  // 创建部门
  async createDepartment(departmentData: CreateDepartmentPayload): Promise<Department> {
    try {
      const response = await apiFetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}`, {
        method: 'POST',
        body: JSON.stringify(departmentData),
      });

      const data: APIResponse<Department> | APIErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '创建部门失败');
      }

      const successData = data as APIResponse<Department>;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '创建部门响应格式错误');
      }

      return successData.data;
    } catch (error) {
      console.error('Create department error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  // 更新部门
  async updateDepartment(id: number, updateData: UpdateDepartmentPayload): Promise<Department> {
    try {
      const response = await apiFetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const data: APIResponse<Department> | APIErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '更新部门失败');
      }

      const successData = data as APIResponse<Department>;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '更新部门响应格式错误');
      }

      return successData.data;
    } catch (error) {
      console.error('Update department error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  // 删除部门
  async deleteDepartment(id: number): Promise<void> {
    try {
      const response = await apiFetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data: APIErrorResponse = await response.json();
        throw new Error(data.error || data.details || '删除部门失败');
      }
    } catch (error) {
      console.error('Delete department error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }
}

export const departmentService = new DepartmentService(); 