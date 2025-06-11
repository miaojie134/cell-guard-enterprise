import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/departmentService';
import {
  Department,
  DepartmentTreeNode,
  DepartmentOption,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  DepartmentSearchParams,
} from '@/config/api';
import { useAuth } from '@/context/AuthContext';

// 自然排序函数，正确处理包含数字的字符串
const naturalSort = (a: string, b: string): number => {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base'
  });
  return collator.compare(a, b);
};

// 递归排序部门树
const sortDepartmentTree = (nodes: DepartmentTreeNode[]): DepartmentTreeNode[] => {
  return nodes
    .sort((a, b) => naturalSort(a.name, b.name))
    .map(node => ({
      ...node,
      children: node.children ? sortDepartmentTree(node.children) : []
    }));
};

// 部门列表 Hook
export interface UseDepartmentsReturn {
  departments: Department[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDepartments = (params: DepartmentSearchParams = {}): UseDepartmentsReturn => {
  const { isAuthenticated } = useAuth();

  const {
    data: departments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['departments', params],
    queryFn: () => departmentService.getDepartments(params),
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
  });

  return {
    departments,
    isLoading,
    error: error?.message || null,
    refetch,
  };
};

// 部门选项 Hook（用于下拉选择器）
export interface UseDepartmentOptionsReturn {
  options: DepartmentOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDepartmentOptions = (params: DepartmentSearchParams = {}): UseDepartmentOptionsReturn => {
  const { isAuthenticated } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['departmentOptions', params],
    queryFn: () => departmentService.getDepartmentOptions(),
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
  });

  // 对部门选项进行自然排序
  const options = data ? data.sort((a, b) => naturalSort(a.name, b.name)) : [];

  return {
    options,
    isLoading,
    error: error?.message || null,
    refetch,
  };
};

// 部门树 Hook
export interface UseDepartmentTreeReturn {
  tree: DepartmentTreeNode[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDepartmentTree = (): UseDepartmentTreeReturn => {
  const { isAuthenticated } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['departmentTree'],
    queryFn: () => departmentService.getDepartmentTree(),
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
  });

  // 对部门树进行自然排序
  const tree = data ? sortDepartmentTree(data) : [];

  return {
    tree,
    isLoading,
    error: error?.message || null,
    refetch,
  };
};

// 部门详情 Hook
export interface UseDepartmentDetailReturn {
  department: Department | null;
  isLoading: boolean;
  error: string | null;
  fetchDepartment: (id: number) => Promise<void>;
  clearDepartment: () => void;
}

export const useDepartmentDetail = (): UseDepartmentDetailReturn => {
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartment = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await departmentService.getDepartmentById(id);
      setDepartment(detail);
    } catch (error) {
      console.error('Failed to fetch department detail:', error);
      const errorMessage = error instanceof Error ? error.message : '获取部门详情失败';
      setError(errorMessage);
      setDepartment(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearDepartment = useCallback(() => {
    setDepartment(null);
    setError(null);
  }, []);

  return {
    department,
    isLoading,
    error,
    fetchDepartment,
    clearDepartment,
  };
};

// 部门管理操作 Hook
export interface UseDepartmentActionsReturn {
  createDepartment: (data: CreateDepartmentPayload) => Promise<Department>;
  updateDepartment: (id: number, data: UpdateDepartmentPayload) => Promise<Department>;
  deleteDepartment: (id: number) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const useDepartmentActions = (): UseDepartmentActionsReturn => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const createDepartment = useCallback(async (data: CreateDepartmentPayload): Promise<Department> => {
    setIsCreating(true);
    try {
      const newDepartment = await departmentService.createDepartment(data);

      // 刷新相关缓存
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departmentOptions'] });
      queryClient.invalidateQueries({ queryKey: ['departmentTree'] });

      return newDepartment;
    } finally {
      setIsCreating(false);
    }
  }, [queryClient]);

  const updateDepartment = useCallback(async (id: number, data: UpdateDepartmentPayload): Promise<Department> => {
    setIsUpdating(true);
    try {
      const updatedDepartment = await departmentService.updateDepartment(id, data);

      // 刷新相关缓存
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departmentOptions'] });
      queryClient.invalidateQueries({ queryKey: ['departmentTree'] });

      return updatedDepartment;
    } finally {
      setIsUpdating(false);
    }
  }, [queryClient]);

  const deleteDepartment = useCallback(async (id: number): Promise<void> => {
    setIsDeleting(true);
    try {
      await departmentService.deleteDepartment(id);

      // 刷新相关缓存
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departmentOptions'] });
      queryClient.invalidateQueries({ queryKey: ['departmentTree'] });
    } finally {
      setIsDeleting(false);
    }
  }, [queryClient]);

  return {
    createDepartment,
    updateDepartment,
    deleteDepartment,
    isCreating,
    isUpdating,
    isDeleting,
  };
}; 