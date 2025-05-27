
// API配置
export const API_CONFIG = {
  BASE_URL: '/api/v1', // 使用代理，不需要完整URL
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    EMPLOYEES: '/employees',
  },
};

export enum ResponseStatus {
  SUCCESS = "success",
  // 可以根据需要添加其他状态
}

// API响应类型定义
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponsePayload { // 原LoginResponse，代表成功登录响应中的data部分
  token: string;
  user: {
    id?: string; // id 字段可选
    username: string;
    role: string;
  };
}

export interface APIResponse<TData = any> {
  status: ResponseStatus; // 使用枚举
  message: string;
  data: TData; // 成功时data字段是必需的
}

export interface APIErrorResponse {
  details?: string; // details 字段可选
  error: string;   // error 字段是主要的错误信息
}

// 员工API相关类型
export interface EmployeeSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  employmentStatus?: string;
}

export interface APIEmployee {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  email: string;
  phoneNumber: string;
  employmentStatus: string;
  hireDate: string;
  terminationDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface EmployeesListResponse {
  items: APIEmployee[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
