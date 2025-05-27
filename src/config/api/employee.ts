// 员工相关API类型定义

// 员工搜索参数
export interface EmployeeSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  employmentStatus?: string;
}

// 后端员工数据结构
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

// 员工列表响应
export interface EmployeesListResponse {
  items: APIEmployee[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// 新增员工请求类型
export interface CreateEmployeeRequest {
  fullName: string;
  department: string;
  email: string;
  phoneNumber: string;
  hireDate: string; // YYYY-MM-DD 格式
}

// 新增员工响应类型
export interface CreateEmployeeResponse {
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

// 更新员工请求类型
export interface UpdateEmployeeRequest {
  department?: string;
  employmentStatus?: string;
  hireDate?: string; // YYYY-MM-DD 格式
  terminationDate?: string; // YYYY-MM-DD 格式
}

// 更新员工响应类型
export interface UpdateEmployeeResponse {
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