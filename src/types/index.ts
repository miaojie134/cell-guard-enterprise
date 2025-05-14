
// Employee related types
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  status: "active" | "inactive";
  joinDate: string;
  leaveDate?: string;
}

// Phone related types
export interface PhoneNumber {
  id: string;
  number: string;
  registrant: string; // Name of the person who registered the number
  registrantId: string; // Employee ID of the registrant
  registrantStatus: "active" | "inactive"; // Status of the registrant
  registrationDate: string;
  provider: string;
  status: "active" | "inactive" | "pending" | "cancelled";
  currentUser?: string; // Name of the current user
  currentUserId?: string; // Employee ID of the current user
  notes?: string;
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
  role: "admin" | "user";
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
  sortOrder?: "asc" | "desc";
}

// Import types
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
