import { useState, useCallback } from 'react';
import { employeeService } from '@/services/employeeService';
import { APIEmployeeDetail } from '@/config/api';

export interface UseEmployeeDetailReturn {
  employeeDetail: APIEmployeeDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchEmployeeDetail: (employeeId: string) => Promise<void>;
  clearEmployeeDetail: () => void;
}

export const useEmployeeDetail = (): UseEmployeeDetailReturn => {
  const [employeeDetail, setEmployeeDetail] = useState<APIEmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeDetail = useCallback(async (employeeId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching employee detail for employeeId:', employeeId);
      const detail = await employeeService.getEmployeeDetail(employeeId);
      setEmployeeDetail(detail);
      console.log('Employee detail fetched successfully:', detail);
    } catch (error) {
      console.error('Failed to fetch employee detail:', error);
      const errorMessage = error instanceof Error ? error.message : '获取员工详情失败';
      setError(errorMessage);
      setEmployeeDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearEmployeeDetail = useCallback(() => {
    setEmployeeDetail(null);
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