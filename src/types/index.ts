import { formatDateFromISO } from '@/lib/utils';

// Employment status constants
export const BACKEND_EMPLOYMENT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DEPARTED: 'Departed'
} as const;

export const FRONTEND_EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEPARTED: 'departed'
} as const;

// Phone status constants
export const BACKEND_PHONE_STATUS = {
  IDLE: '闲置',
  IN_USE: '在用',
  PENDING_CANCELLATION: '待注销',
  CANCELLED: '已注销',
  PENDING_VERIFICATION_EMPLOYEE_LEFT: '待核实-办卡人离职',
  PENDING_VERIFICATION_USER_REPORT: '待核实-用户报告'
} as const;

export const FRONTEND_PHONE_STATUS = {
  IDLE: 'idle',
  IN_USE: 'in_use',
  PENDING_CANCELLATION: 'pending_cancellation',
  CANCELLED: 'cancelled',
  PENDING_VERIFICATION_EMPLOYEE_LEFT: 'pending_verification_employee_left',
  PENDING_VERIFICATION_USER_REPORT: 'pending_verification_user_report'
} as const;

// User role constants
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

// Sort order constants
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

// Type definitions based on constants
export type BackendEmploymentStatus = typeof BACKEND_EMPLOYMENT_STATUS[keyof typeof BACKEND_EMPLOYMENT_STATUS];
export type FrontendEmploymentStatus = typeof FRONTEND_EMPLOYMENT_STATUS[keyof typeof FRONTEND_EMPLOYMENT_STATUS];
export type BackendPhoneStatus = typeof BACKEND_PHONE_STATUS[keyof typeof BACKEND_PHONE_STATUS];
export type FrontendPhoneStatus = typeof FRONTEND_PHONE_STATUS[keyof typeof FRONTEND_PHONE_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type SortOrder = typeof SORT_ORDER[keyof typeof SORT_ORDER];

// Employee related types
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
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
  number: string;
  registrant: string; // Name of the person who registered the number
  registrantId: string; // Employee ID of the registrant
  registrantStatus: FrontendEmploymentStatus; // Status of the registrant
  registrationDate: string;
  provider: string;
  status: FrontendPhoneStatus;
  currentUser?: string; // Name of the current user
  currentUserId?: string; // Employee ID of the current user
  notes?: string;
}

// Backend phone number type mapping
export interface BackendPhoneNumber {
  id: number;
  number: string;
  registrant: string;
  registrantId: string;
  registrationDate: string;
  provider: string;
  status: BackendPhoneStatus;
  currentUser?: string;
  currentUserId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
  id: string;
  phoneId: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate?: string;
}

// Authentication types
export interface User {
  id: string;
  username: string;
  role: UserRole;
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
  [BACKEND_EMPLOYMENT_STATUS.INACTIVE]: FRONTEND_EMPLOYMENT_STATUS.INACTIVE,
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
    status: EMPLOYMENT_STATUS_MAP[backendEmployee.employmentStatus] || FRONTEND_EMPLOYMENT_STATUS.INACTIVE,
    joinDate: formatDateFromISO(backendEmployee.hireDate),
    leaveDate: backendEmployee.terminationDate ? formatDateFromISO(backendEmployee.terminationDate) : undefined,
  };
};

export const mapBackendPhoneToFrontend = (backendPhone: BackendPhoneNumber): PhoneNumber => {
  return {
    id: backendPhone.id.toString(),
    number: backendPhone.number,
    registrant: backendPhone.registrant,
    registrantId: backendPhone.registrantId,
    registrantStatus: FRONTEND_EMPLOYMENT_STATUS.ACTIVE, // 需要从其他地方获取注册人状态
    registrationDate: formatDateFromISO(backendPhone.registrationDate),
    provider: backendPhone.provider,
    status: PHONE_STATUS_MAP[backendPhone.status] || FRONTEND_PHONE_STATUS.IDLE,
    currentUser: backendPhone.currentUser,
    currentUserId: backendPhone.currentUserId,
    notes: backendPhone.notes,
  };
};
