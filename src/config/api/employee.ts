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

// 员工详情数据结构（包含手机号码信息）
export interface APIEmployeeDetail {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  employmentStatus: string;
  hireDate: string;
  terminationDate?: string;
  createdAt: string;
  updatedAt: string;
  handledMobileNumbers: MobileNumber[]; // 作为办卡人的手机号码列表
  usingMobileNumbers: MobileNumber[];   // 作为当前使用人的手机号码列表
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
