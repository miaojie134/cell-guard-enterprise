import { useState, useCallback, useMemo } from 'react';
import { employeeService } from '@/services/employeeService';
import { APIEmployeeDetail, DepartmentOption } from '@/config/api';

export interface UseEmployeeDetailReturn {
  employeeDetail: APIEmployeeDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchEmployeeDetail: (employeeId: string) => Promise<void>;
  clearEmployeeDetail: () => void;
}

export const useEmployeeDetail = (departmentOptions: DepartmentOption[] = []): UseEmployeeDetailReturn => {
  const [rawEmployeeDetail, setRawEmployeeDetail] = useState<APIEmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理部门名称映射
  const employeeDetail = useMemo(() => {
    if (!rawEmployeeDetail) return null;

    // 通过departmentId查找部门路径（显示层级结构）
    const departmentInfo = rawEmployeeDetail.departmentId
      ? departmentOptions.find(dept => dept.id === rawEmployeeDetail.departmentId)
      : null;

    const departmentDisplay = departmentInfo
      ? departmentInfo.path  // 使用完整路径，如"研发中心 / 前端组"
      : rawEmployeeDetail.departmentId
        ? `部门ID: ${rawEmployeeDetail.departmentId}`
        : '未分配部门';

    return {
      ...rawEmployeeDetail,
      department: departmentDisplay
    };
  }, [rawEmployeeDetail, departmentOptions]);

  const fetchEmployeeDetail = useCallback(async (employeeId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching employee detail for employeeId:', employeeId);
      const detail = await employeeService.getEmployeeDetail(employeeId);
      setRawEmployeeDetail(detail);
      console.log('Employee detail fetched successfully:', detail);
    } catch (error) {
      console.error('Failed to fetch employee detail:', error);
      const errorMessage = error instanceof Error ? error.message : '获取员工详情失败';
      setError(errorMessage);
      setRawEmployeeDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearEmployeeDetail = useCallback(() => {
    setRawEmployeeDetail(null);
    setError(null);
  }, []);

  return {
    employeeDetail,
    isLoading,
    error,
    fetchEmployeeDetail,
    clearEmployeeDetail,
  };
}; 