import { useState, useEffect, useCallback, useMemo } from 'react';
import { employeeService } from '@/services/employeeService';
import { EmployeeSearchParams } from '@/config/api';
import { Employee, mapBackendEmployeeToFrontend, BackendEmployee } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDepartmentOptions } from '@/hooks/useDepartments';
import type { Employee as SelectorEmployee } from '@/components/EmployeeSelector';
import React from 'react';

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
  const [rawEmployees, setRawEmployees] = useState<any[]>([]); // 保存原始后端数据
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false); // 员工数据加载状态
  const [error, setError] = useState<string | null>(null);

  // 获取部门选项数据来映射部门名称
  const { options: departmentOptions, isLoading: isDepartmentLoading } = useDepartmentOptions();

  // 综合loading状态：员工数据加载中 OR 部门数据加载中 OR 有员工数据但还没有部门数据
  const isLoading = isLoadingEmployees || isDepartmentLoading || (rawEmployees.length > 0 && departmentOptions.length === 0);

  // 映射员工数据的函数
  const mapEmployeesWithDepartments = useCallback((rawEmployeeData: any[]) => {
    return rawEmployeeData.map(emp => {
      // 通过departmentId查找部门路径（显示层级结构）
      const departmentInfo = emp.departmentId
        ? departmentOptions.find(dept => dept.id === emp.departmentId)
        : null;

      const departmentDisplay = departmentInfo
        ? departmentInfo.path  // 使用完整路径，如"研发中心 / 前端组"
        : emp.departmentId
          ? `部门ID: ${emp.departmentId}`
          : '未分配部门';

      // 直接创建Employee对象，避免类型转换问题
      return {
        id: emp.id.toString(),
        employeeId: emp.employeeId,
        name: emp.fullName,
        department: departmentDisplay,
        departmentId: emp.departmentId, // 添加部门ID用于权限控制
        email: emp.email,
        phoneNumber: emp.phoneNumber,
        status: emp.employmentStatus === 'Active' ? 'active' : 'departed',
        joinDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : '',
        leaveDate: emp.terminationDate ? new Date(emp.terminationDate).toISOString().split('T')[0] : undefined,
      } as Employee;
    });
  }, [departmentOptions]);

  // 当部门选项数据变化时，重新映射员工数据
  React.useEffect(() => {
    if (rawEmployees.length > 0 && departmentOptions.length > 0) {

      const mappedEmployees = mapEmployeesWithDepartments(rawEmployees);
      setEmployees(mappedEmployees);
    } else if (rawEmployees.length > 0 && departmentOptions.length === 0) {
      // 有员工数据但部门数据还没加载完，清空employees确保loading状态
      setEmployees([]);
    }
  }, [rawEmployees, departmentOptions, mapEmployeesWithDepartments]);

  const fetchEmployees = useCallback(async (params: EmployeeSearchParams = {}) => {
    setIsLoadingEmployees(true);
    setError(null);

    try {

      const response = await employeeService.getEmployees(params);

      // 保存原始数据
      setRawEmployees(response.items);

      // 只有在部门选项已经加载的情况下才立即映射和显示数据
      if (departmentOptions.length > 0) {
        const mappedEmployees = mapEmployeesWithDepartments(response.items);
        setEmployees(mappedEmployees);
      }
      // 如果部门数据还没加载，不设置employees，保持空数组，让loading状态继续

      setTotalItems(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.currentPage);

    } catch (error) {
      console.error('Failed to fetch employees:', error);
      const errorMessage = error instanceof Error ? error.message : '获取员工列表失败';
      setError(errorMessage);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [departmentOptions, mapEmployeesWithDepartments]);

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

// 全局员工缓存刷新函数
export const useEmployeeCacheRefresh = () => {
  const queryClient = useQueryClient();

  const refreshAllEmployeeCaches = () => {
    // 清除所有员工相关的缓存
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['employeesForSelector'] });
    queryClient.invalidateQueries({ queryKey: ['employeeDetail'] });
  };

};

export interface UseEmployeesForSelectorOptions {
  search?: string;
  employmentStatus?: string;
  limit?: number;
}

export const useEmployeesForSelector = (options: UseEmployeesForSelectorOptions = {}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // 获取部门选项数据来映射部门名称
  const { options: departmentOptions, isLoading: isDepartmentLoading } = useDepartmentOptions();

  const searchParams = {
    search: options.search,
    employmentStatus: options.employmentStatus,
    limit: options.limit || 100, // 获取较多数据用于前端搜索
    page: 1,
  };

  const {
    data: employeesResponse,
    isLoading: isEmployeeDataLoading,
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

  // 综合loading状态：员工数据加载中 OR 部门数据加载中
  const isLoading = isEmployeeDataLoading || isDepartmentLoading || (employeesResponse?.items?.length > 0 && departmentOptions.length === 0);

  // 转换为EmployeeSelector需要的格式
  const employees: SelectorEmployee[] = useMemo(() => {
    // 如果员工数据还在加载，或者部门数据还在加载，返回空数组
    if (!employeesResponse?.items || departmentOptions.length === 0) return [];

    return employeesResponse.items.map(emp => {
      // 通过departmentId查找部门路径（显示层级结构）
      const departmentInfo = emp.departmentId
        ? departmentOptions.find(dept => dept.id === emp.departmentId)
        : null;

      const departmentDisplay = departmentInfo
        ? departmentInfo.path  // 使用完整路径，如"研发中心 / 前端组"
        : emp.departmentId
          ? `部门ID: ${emp.departmentId}`
          : '未分配部门';

      return {
        id: emp.id,
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        department: departmentDisplay,
        employmentStatus: emp.employmentStatus,
        email: emp.email,
        phone: emp.phoneNumber,
        position: undefined, // 如果后端有职位字段，这里可以映射
      };
    });
  }, [employeesResponse, departmentOptions]);

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
