import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '@/services/employeeService';
import { EmployeeSearchParams } from '@/config/api';
import { Employee, mapBackendEmployeeToFrontend, BackendEmployee } from '@/types';

export interface UseEmployeesReturn {
  employees: Employee[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  fetchEmployees: (params?: EmployeeSearchParams) => Promise<void>;
  getEmployeeById: (id: string) => Employee | null;
}

export const useEmployees = (): UseEmployeesReturn => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async (params: EmployeeSearchParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching employees with params:', params);
      const response = await employeeService.getEmployees(params);

      // 映射后端数据到前端格式
      const mappedEmployees = response.items.map(mapBackendEmployeeToFrontend);

      setEmployees(mappedEmployees);
      setTotalItems(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.currentPage);

      console.log('Employees fetched successfully:', {
        count: mappedEmployees.length,
        totalItems: response.pagination.totalItems,
        currentPage: response.pagination.currentPage
      });
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      const errorMessage = error instanceof Error ? error.message : '获取员工列表失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getEmployeeById = (id: string): Employee | null => {
    return employees.find(emp => emp.id === id) || null;
  };

  return {
    employees,
    totalItems,
    totalPages,
    currentPage,
    isLoading,
    error,
    fetchEmployees,
    getEmployeeById,
  };
};

// 新增：专门为EmployeeSelector组件使用的hook
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import type { Employee as SelectorEmployee } from '@/components/EmployeeSelector';

// 全局员工缓存刷新函数
export const useEmployeeCacheRefresh = () => {
  const queryClient = useQueryClient();

  const refreshAllEmployeeCaches = () => {
    // 清除所有员工相关的缓存
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['employeesForSelector'] });
    queryClient.invalidateQueries({ queryKey: ['employeeDetail'] });
  };

  return { refreshAllEmployeeCaches };
};

export interface UseEmployeesForSelectorOptions {
  search?: string;
  employmentStatus?: string;
  limit?: number;
}

export const useEmployeesForSelector = (options: UseEmployeesForSelectorOptions = {}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const searchParams = {
    search: options.search,
    employmentStatus: options.employmentStatus,
    limit: options.limit || 100, // 获取较多数据用于前端搜索
    page: 1,
  };

  const {
    data: employeesResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employeesForSelector', searchParams],
    queryFn: () => employeeService.getEmployees(searchParams),
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 减少到30秒缓存
    gcTime: 5 * 60 * 1000, // 5分钟后清理缓存
  });

  // 转换为EmployeeSelector需要的格式
  const employees: SelectorEmployee[] = useMemo(() => {
    if (!employeesResponse?.items) return [];
    return employeesResponse.items.map(emp => ({
      id: emp.id,
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      department: emp.department,
      employmentStatus: emp.employmentStatus,
    }));
  }, [employeesResponse]);

  // 在职员工
  const activeEmployees = useMemo(() => {
    return employees.filter(emp => emp.employmentStatus === 'Active');
  }, [employees]);

  // 手动刷新员工数据的方法
  const refreshEmployees = () => {
    // 清除相关缓存并重新获取
    queryClient.invalidateQueries({ queryKey: ['employeesForSelector'] });
    queryClient.invalidateQueries({ queryKey: ['employees'] }); // 也清除原来的员工缓存
  };

  return {
    employees,
    activeEmployees,
    isLoading,
    error,
    refetch,
    refreshEmployees, // 新增刷新方法
    total: employeesResponse?.pagination?.totalItems || 0,
  };
};

// 搜索员工的hook
export const useEmployeeSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { employees, isLoading } = useEmployeesForSelector({
    search: searchTerm,
    employmentStatus: 'Active', // 只搜索在职员工
  });

  const search = (term: string) => {
    setSearchTerm(term);
  };

  return {
    employees,
    isLoading,
    search,
    searchTerm,
  };
};
