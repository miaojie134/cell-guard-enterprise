
import { useState, useEffect } from 'react';
import { employeeService } from '@/services/employeeService';
import { EmployeeSearchParams, BackendEmployee } from '@/config/api';
import { Employee, mapBackendEmployeeToFrontend } from '@/types';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const fetchEmployees = async (params: EmployeeSearchParams = {}) => {
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
      
      toast({
        title: "获取员工列表失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
