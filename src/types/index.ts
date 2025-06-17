import { formatDateFromISO } from '@/lib/utils';

// Employment status constants
export const BACKEND_EMPLOYMENT_STATUS = {
  ACTIVE: 'Active',
  DEPARTED: 'Departed'
} as const;

export const FRONTEND_EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  DEPARTED: 'departed'
} as const;

// Phone status constants
export const BACKEND_PHONE_STATUS = {
  IDLE: 'idle',
  IN_USE: 'in_use',
  PENDING_CANCELLATION: 'pending_deactivation',
  CANCELLED: 'deactivated',
  PENDING_VERIFICATION_EMPLOYEE_LEFT: 'risk_pending',
  PENDING_VERIFICATION_USER_REPORT: 'user_reported'
} as const;

export const FRONTEND_PHONE_STATUS = {
  IDLE: 'idle',
  IN_USE: 'in_use',
  PENDING_CANCELLATION: 'pending_deactivation',
  CANCELLED: 'deactivated',
  PENDING_VERIFICATION_EMPLOYEE_LEFT: 'risk_pending',
  PENDING_VERIFICATION_USER_REPORT: 'user_reported'
} as const;

// User role constants
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  REGIONAL_ADMIN: 'regional_admin',
  ADMIN: 'admin',
  USER: 'user'
} as const;

// Sort order constants
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

// 权限类型常量
export const PERMISSION_TYPES = {
  MANAGE: 'manage',
  VIEW: 'view'
} as const;

// Type definitions based on constants
export type BackendEmploymentStatus = typeof BACKEND_EMPLOYMENT_STATUS[keyof typeof BACKEND_EMPLOYMENT_STATUS];
export type FrontendEmploymentStatus = typeof FRONTEND_EMPLOYMENT_STATUS[keyof typeof FRONTEND_EMPLOYMENT_STATUS];
export type BackendPhoneStatus = typeof BACKEND_PHONE_STATUS[keyof typeof BACKEND_PHONE_STATUS];
export type FrontendPhoneStatus = typeof FRONTEND_PHONE_STATUS[keyof typeof FRONTEND_PHONE_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type PermissionType = typeof PERMISSION_TYPES[keyof typeof PERMISSION_TYPES];
export type SortOrder = typeof SORT_ORDER[keyof typeof SORT_ORDER];

// Employee related types
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  email?: string;
  phoneNumber?: string;
  status: FrontendEmploymentStatus;
  joinDate: string;
  leaveDate?: string;
}

// Backend employee type mapping
export interface BackendEmployee {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  email: string;
  phoneNumber: string;
  employmentStatus: BackendEmploymentStatus;
  hireDate: string;
  terminationDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Phone related types
export interface PhoneNumber {
  id: string;
  phoneNumber: string;
  applicantEmployeeId: string; // 申请人员工ID
  applicantName: string; // 申请人姓名
  applicantStatus: string; // 申请人状态
  applicationDate: string; // 申请日期
  cancellationDate?: string; // 注销日期
  currentEmployeeId?: string; // 当前使用人员工ID
  currentUserName?: string; // 当前使用人姓名
  purpose: string; // 用途
  remarks?: string; // 备注
  status: string; // 号码状态
  vendor: string; // 运营商
  createdAt: string;
  updatedAt: string;
  usageHistory?: PhoneUsageHistory[]; // 使用历史记录
}

// Backend phone number type mapping
export interface BackendPhoneNumber {
  id: number;
  phoneNumber: string;
  applicantEmployeeId: string;
  applicantName: string;
  applicantStatus: string;
  applicationDate: string;
  cancellationDate: string;
  createdAt: string;
  currentEmployeeId: string;
  currentUserName: string;
  purpose: string;
  remarks: string;
  status: string;
  updatedAt: string;
  vendor: string;
  usageHistory?: Array<{
    employeeId: string;
    startDate: string;
    endDate: string;
    createdAt: string;
  }>; // 后端使用历史记录格式
}

export interface PhoneUsage {
  id: string;
  phoneId: string;
  employeeId: string;
  startDate: string;
  endDate?: string;
  dataUsage?: number;
}

export interface PhoneAssign {
  id: string;
  phoneId: string;
  employeeId: string;
  assignDate: string;
  returnDate?: string;
  notes?: string;
}

export interface PhoneUsageHistory {
  employeeId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

// Authentication types
export interface User {
  id: string;
  username: string;
  name?: string; // 添加用户姓名字段
  role: UserRole;
  isSuperAdmin?: boolean; // 添加超级管理员标识字段
  departmentPermissions?: DepartmentPermission[]; // 多部门权限列表
}

// General data types
export type PaginatedData<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

// Search and filter types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

// Import types
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// Status mapping utilities
const EMPLOYMENT_STATUS_MAP: Record<BackendEmploymentStatus, FrontendEmploymentStatus> = {
  [BACKEND_EMPLOYMENT_STATUS.ACTIVE]: FRONTEND_EMPLOYMENT_STATUS.ACTIVE,
  [BACKEND_EMPLOYMENT_STATUS.DEPARTED]: FRONTEND_EMPLOYMENT_STATUS.DEPARTED,
};

const PHONE_STATUS_MAP: Record<BackendPhoneStatus, FrontendPhoneStatus> = {
  [BACKEND_PHONE_STATUS.IDLE]: FRONTEND_PHONE_STATUS.IDLE,
  [BACKEND_PHONE_STATUS.IN_USE]: FRONTEND_PHONE_STATUS.IN_USE,
  [BACKEND_PHONE_STATUS.PENDING_CANCELLATION]: FRONTEND_PHONE_STATUS.PENDING_CANCELLATION,
  [BACKEND_PHONE_STATUS.CANCELLED]: FRONTEND_PHONE_STATUS.CANCELLED,
  [BACKEND_PHONE_STATUS.PENDING_VERIFICATION_EMPLOYEE_LEFT]: FRONTEND_PHONE_STATUS.PENDING_VERIFICATION_EMPLOYEE_LEFT,
  [BACKEND_PHONE_STATUS.PENDING_VERIFICATION_USER_REPORT]: FRONTEND_PHONE_STATUS.PENDING_VERIFICATION_USER_REPORT,
};

// Utility functions
export const mapBackendEmployeeToFrontend = (backendEmployee: BackendEmployee): Employee => {
  return {
    id: backendEmployee.id.toString(),
    employeeId: backendEmployee.employeeId,
    name: backendEmployee.fullName,
    department: backendEmployee.department,
    email: backendEmployee.email,
    phoneNumber: backendEmployee.phoneNumber,
    status: EMPLOYMENT_STATUS_MAP[backendEmployee.employmentStatus] || FRONTEND_EMPLOYMENT_STATUS.DEPARTED,
    joinDate: formatDateFromISO(backendEmployee.hireDate),
    leaveDate: backendEmployee.terminationDate ? formatDateFromISO(backendEmployee.terminationDate) : undefined,
  };
};

export const mapBackendPhoneToFrontend = (backendPhone: BackendPhoneNumber): PhoneNumber => {
  return {
    id: backendPhone.id.toString(),
    phoneNumber: backendPhone.phoneNumber,
    applicantEmployeeId: backendPhone.applicantEmployeeId,
    applicantName: backendPhone.applicantName,
    applicantStatus: backendPhone.applicantStatus,
    applicationDate: formatDateFromISO(backendPhone.applicationDate),
    cancellationDate: backendPhone.cancellationDate ? formatDateFromISO(backendPhone.cancellationDate) : undefined,
    currentEmployeeId: backendPhone.currentEmployeeId,
    currentUserName: backendPhone.currentUserName,
    purpose: backendPhone.purpose,
    remarks: backendPhone.remarks,
    status: backendPhone.status,
    vendor: backendPhone.vendor,
    createdAt: formatDateFromISO(backendPhone.createdAt),
    updatedAt: formatDateFromISO(backendPhone.updatedAt),
    usageHistory: backendPhone.usageHistory?.map(usage => ({
      employeeId: usage.employeeId,
      startDate: formatDateFromISO(usage.startDate),
      endDate: formatDateFromISO(usage.endDate),
      createdAt: formatDateFromISO(usage.createdAt),
    })),
  };
};

// 盘点验证相关类型定义
export interface VerificationInitiateRequest {
  scope: 'all_users' | 'department_ids' | 'employee_ids';
  scopeValues?: string[];
  durationDays: number;
}

export interface VerificationBatchTask {
  id: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'CompletedWithErrors' | 'Failed';
  totalEmployeesToProcess: number;
  tokensGeneratedCount: number;
  emailsAttemptedCount: number;
  emailsSucceededCount: number;
  emailsFailedCount: number;
  errorSummary?: string;
  requestedScopeType: string;
  requestedScopeValues?: string;
  requestedDurationDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationPhoneInfo {
  id: number;
  phoneNumber: string;
  department: string;
  purpose: string;
  status: 'pending' | 'confirmed' | 'reported';
  userComment?: string;
}

export interface VerificationEmployeeInfo {
  employeeId: string;
  employeeName: string;
  phoneNumbers: VerificationPhoneInfo[];
  previouslyReportedUnlisted: UnlistedPhone[];
  expiresAt: string;
}

export interface VerifiedNumber {
  mobileNumberId: number;
  action: 'confirm_usage' | 'report_issue';
  purpose: string;
  userComment?: string;
}

export interface UnlistedPhone {
  phoneNumber: string;
  purpose: string;
  userComment?: string;
  reportedAt?: string;
}

export interface VerificationSubmitRequest {
  verifiedNumbers: VerifiedNumber[];
  unlistedNumbersReported: UnlistedPhone[];
}

export interface ConfirmedPhone {
  id: number;
  phoneNumber: string;
  department: string;
  currentUser: string;
  purpose: string;
  confirmedBy: string;
  confirmedAt: string;
}

export interface PendingUser {
  employeeId: string;
  fullName: string;
  email: string;
  tokenId: number;
  expiresAt: string;
}

export interface ReportedIssue {
  issueId: number;
  phoneNumber: string;
  reportedBy: string;
  comment: string;
  purpose: string;
  originalStatus: string;
  reportedAt: string;
  adminActionStatus: string;
}

export interface VerificationResultSummary {
  totalPhonesCount: number;
  confirmedPhonesCount: number;
  reportedIssuesCount: number;
  pendingPhonesCount: number;
  newlyReportedPhonesCount: number;
}

export interface VerificationResults {
  summary: VerificationResultSummary;
  confirmedPhones: ConfirmedPhone[];
  pendingUsers: PendingUser[];
  reportedIssues: ReportedIssue[];
  unlistedNumbers: UnlistedPhone[];
}

// 盘点状态常量
export const VERIFICATION_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  COMPLETED_WITH_ERRORS: 'CompletedWithErrors',
  FAILED: 'Failed'
} as const;

export const VERIFICATION_SCOPE = {
  ALL_USERS: 'all_users',
  DEPARTMENT_IDS: 'department_ids',
  EMPLOYEE_IDS: 'employee_ids'
} as const;

export const VERIFICATION_ACTION = {
  CONFIRM_USAGE: 'confirm_usage',
  REPORT_ISSUE: 'report_issue'
} as const;

export const PHONE_VERIFICATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REPORTED: 'reported'
} as const;

export type VerificationScopeType = typeof VERIFICATION_SCOPE[keyof typeof VERIFICATION_SCOPE];
export type VerificationStatusType = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];
export type VerificationActionType = typeof VERIFICATION_ACTION[keyof typeof VERIFICATION_ACTION];
export type PhoneVerificationStatusType = typeof PHONE_VERIFICATION_STATUS[keyof typeof PHONE_VERIFICATION_STATUS];

// 部门权限类型
export interface DepartmentPermission {
  departmentId: number;
  departmentName: string;
  permissionType: PermissionType;
}
