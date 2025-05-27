import {
  API_CONFIG,
  EmployeeSearchParams,
  EmployeesListResponse,
  APIResponse,
  APIErrorResponse,
  ResponseStatus,
  APIEmployee,
  CreateEmployeeRequest,
  CreateEmployeeResponse,
  UpdateEmployeeRequest,
  UpdateEmployeeResponse
} from '@/config/api';
import { formatDateFromISO } from '@/lib/utils';

class EmployeeService {
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async getEmployees(params: EmployeeSearchParams = {}): Promise<EmployeesListResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.search) queryParams.append('search', params.search);
      if (params.employmentStatus) queryParams.append('employmentStatus', params.employmentStatus);

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEES}?${queryParams.toString()}`;

      console.log('Fetching employees from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      console.log('Employees response status:', response.status);

      const data: APIResponse<EmployeesListResponse> | APIErrorResponse = await response.json();
      console.log('Employees response data:', data);

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '获取员工列表失败');
      }

      const successData = data as APIResponse<EmployeesListResponse>;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '员工列表响应格式错误');
      }

      // 格式化员工列表中的时间字段
      const formattedData = {
        ...successData.data,
        items: successData.data.items.map(employee => ({
          ...employee,
          hireDate: formatDateFromISO(employee.hireDate),
          terminationDate: employee.terminationDate ? formatDateFromISO(employee.terminationDate) : undefined
        }))
      };

      return formattedData;
    } catch (error) {
      console.error('Get employees error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  async getEmployeeById(id: string): Promise<APIEmployee> {
    try {
      console.log('Fetching employee by id:', id);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEES}/${id}`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      console.log('Employee response status:', response.status);

      const data: APIResponse<APIEmployee> | APIErrorResponse = await response.json();
      console.log('Employee response data:', data);

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '获取员工详情失败');
      }

      const successData = data as APIResponse<APIEmployee>;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '员工详情响应格式错误');
      }

      // 格式化时间字段
      const formattedData = {
        ...successData.data,
        hireDate: formatDateFromISO(successData.data.hireDate),
        terminationDate: successData.data.terminationDate ? formatDateFromISO(successData.data.terminationDate) : undefined
      };

      return formattedData;
    } catch (error) {
      console.error('Get employee by id error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  async createEmployee(employeeData: CreateEmployeeRequest): Promise<CreateEmployeeResponse> {
    try {
      console.log('Creating employee:', employeeData);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEES}`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(employeeData),
      });

      console.log('Create employee response status:', response.status);

      const data: APIResponse<CreateEmployeeResponse> | APIErrorResponse = await response.json();
      console.log('Create employee response data:', data);

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '创建员工失败');
      }

      const successData = data as APIResponse<CreateEmployeeResponse>;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '创建员工响应格式错误');
      }

      // 格式化时间字段
      const formattedData = {
        ...successData.data,
        hireDate: formatDateFromISO(successData.data.hireDate),
        terminationDate: successData.data.terminationDate ? formatDateFromISO(successData.data.terminationDate) : undefined
      };

      return formattedData;
    } catch (error) {
      console.error('Create employee error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }

  async updateEmployee(employeeId: string, updateData: UpdateEmployeeRequest): Promise<UpdateEmployeeResponse> {
    try {
      console.log('Updating employee:', employeeId, updateData);

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMPLOYEES}/${employeeId}/update`;
      console.log('Update URL:', url);
      console.log('Employee ID being used:', employeeId);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(updateData),
      });

      console.log('Update employee response status:', response.status);

      const data: APIResponse<UpdateEmployeeResponse> | APIErrorResponse = await response.json();
      console.log('Update employee response data:', data);

      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || errorData.details || '更新员工失败');
      }

      const successData = data as APIResponse<UpdateEmployeeResponse>;
      if (successData.status !== ResponseStatus.SUCCESS || !successData.data) {
        throw new Error(successData.message || '更新员工响应格式错误');
      }

      // 格式化时间字段
      const formattedData = {
        ...successData.data,
        hireDate: formatDateFromISO(successData.data.hireDate),
        terminationDate: successData.data.terminationDate ? formatDateFromISO(successData.data.terminationDate) : undefined
      };

      return formattedData;
    } catch (error) {
      console.error('Update employee error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查后端服务是否正常运行');
    }
  }
}

export const employeeService = new EmployeeService();
