// 员工相关API类型定义

// 手机号码信息
export interface MobileNumber {
  id: number;
  phoneNumber: string;
  status: string;
}

// 员工搜索参数
export interface EmployeeSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  employmentStatus?: string;
  departmentId?: number;
}

// 后端员工数据结构（新版本 - 支持部门ID）
export interface APIEmployee {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  departmentId?: number;
  departmentPath?: string;
  email: string;
  phoneNumber: string;
  employmentStatus: string;
  hireDate: string;
  terminationDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// 员工详情数据结构（包含手机号码信息）
export interface APIEmployeeDetail {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  departmentId?: number;
  departmentPath?: string;
  employmentStatus: string;
  hireDate: string;
  terminationDate?: string;
  createdAt: string;
  updatedAt: string;
  handledMobileNumbers: MobileNumber[];
  usingMobileNumbers: MobileNumber[];
}

// 后端员工数据结构别名 - 为了向后兼容
export interface BackendEmployee extends APIEmployee { }

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

// 新增员工请求类型（新版本 - 支持部门ID）
export interface CreateEmployeeRequest {
  fullName: string;
  department?: string;
  departmentId?: number;
  email: string;
  phoneNumber: string;
  hireDate: string;
}

// 新增员工响应类型
export interface CreateEmployeeResponse {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  departmentId?: number;
  departmentPath?: string;
  email: string;
  phoneNumber: string;
  employmentStatus: string;
  hireDate: string;
  terminationDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// 更新员工请求类型（新版本 - 支持部门ID）
export interface UpdateEmployeeRequest {
  department?: string;
  departmentId?: number;
  employmentStatus?: string;
  hireDate?: string;
  terminationDate?: string;
}

// 更新员工响应类型
export interface UpdateEmployeeResponse {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  departmentId?: number;
  departmentPath?: string;
  email: string;
  phoneNumber: string;
  employmentStatus: string;
  hireDate: string;
  terminationDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
