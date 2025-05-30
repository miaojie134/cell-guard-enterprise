// 部门相关API类型定义

// 部门基础接口
export interface Department {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 部门树节点接口
export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
}

// 部门选项接口（用于下拉选择）
export interface DepartmentOption {
  id: number;
  name: string;
  path: string;
}

// 创建部门请求
export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  parentId?: number;
}

// 更新部门请求
export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  parentId?: number;
  isActive?: boolean;
}

// 部门查询参数
export interface DepartmentSearchParams {
  includeInactive?: boolean;
}

// 部门列表响应
export interface DepartmentsListResponse {
  status: string;
  data: Department[];
  message: string;
}

// 部门树响应
export interface DepartmentTreeResponse {
  status: string;
  data: DepartmentTreeNode[];
  message: string;
}

// 部门选项响应
export interface DepartmentOptionsResponse {
  status: string;
  data: DepartmentOption[];
  message: string;
} 