import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getPhoneNumbers, getPhoneByNumber, createPhone, updatePhone, deletePhone, assignPhone, unassignPhone, getRiskPhoneNumbers, handleRiskPhone } from '@/services/phoneService';
import { PhoneSearchParams, APIPhone, CreatePhoneRequest, UpdatePhoneRequest, AssignPhoneRequest, UnassignPhoneRequest, RiskPhoneSearchParams, HandleRiskPhoneRequest } from '@/config/api/phone';
import { PhoneNumber, mapBackendPhoneToFrontend } from '@/types';

export interface UsePhoneNumbersOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  applicantStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const usePhoneNumbers = (options: UsePhoneNumbersOptions = {}) => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const searchParams: PhoneSearchParams = {
    page: options.page || 1,
    limit: options.limit || 10,
    search: options.search,
    status: options.status,
    applicantStatus: options.applicantStatus,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
  };

  // 获取手机号码列表
  const {
    data: phoneListResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['phoneNumbers', searchParams],
    queryFn: () => getPhoneNumbers(searchParams),
    enabled: isAuthenticated, // 只有在认证后才执行查询
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // 如果是认证错误，不要重试
      if (error?.message?.includes('401') || error?.message?.includes('Authorization')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // 转换后端数据为前端格式
  const phoneNumbers: PhoneNumber[] = useMemo(() => {
    if (!phoneListResponse?.data?.items) return [];
    return phoneListResponse.data.items.map(mapBackendPhoneToFrontend);
  }, [phoneListResponse]);

  const pagination = phoneListResponse?.data?.pagination;

  // 创建手机号码
  const createMutation = useMutation({
    mutationFn: (data: CreatePhoneRequest) => createPhone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
      toast({
        title: '成功',
        description: '手机号码创建成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '创建手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 更新手机号码
  const updateMutation = useMutation({
    mutationFn: ({ phoneNumber, data }: { phoneNumber: string; data: UpdatePhoneRequest }) =>
      updatePhone(phoneNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
      queryClient.invalidateQueries({ queryKey: ['phoneNumber'] });
      toast({
        title: '成功',
        description: '手机号码更新成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '更新手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 删除手机号码
  const deleteMutation = useMutation({
    mutationFn: deletePhone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
      toast({
        title: '成功',
        description: '手机号码删除成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '删除手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 分配手机号码
  const assignMutation = useMutation({
    mutationFn: ({ phoneNumber, data }: { phoneNumber: string; data: AssignPhoneRequest }) =>
      assignPhone(phoneNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
      toast({
        title: '成功',
        description: '手机号码分配成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '分配手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 回收手机号码
  const unassignMutation = useMutation({
    mutationFn: ({ phoneNumber, data }: { phoneNumber: string; data: UnassignPhoneRequest }) =>
      unassignPhone(phoneNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] });
      toast({
        title: '成功',
        description: '手机号码回收成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '回收手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  return {
    phoneNumbers,
    pagination,
    isLoading,
    error,
    refetch,
    createPhone: createMutation.mutate,
    updatePhone: updateMutation.mutate,
    deletePhone: deleteMutation.mutate,
    assignPhone: assignMutation.mutate,
    unassignPhone: unassignMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAssigning: assignMutation.isPending,
    isUnassigning: unassignMutation.isPending,
  };
};

// 获取单个手机号码详情的hook
export const usePhoneNumber = (phoneNumber: string) => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const {
    data: phoneResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['phoneNumber', phoneNumber],
    queryFn: () => getPhoneByNumber(phoneNumber),
    enabled: !!phoneNumber && isAuthenticated, // 只有在有phoneNumber且已认证时才执行查询
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('Authorization')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const phoneNumberData = useMemo(() => {
    if (!phoneResponse?.data) return null;
    return mapBackendPhoneToFrontend(phoneResponse.data);
  }, [phoneResponse]);

  return {
    phoneNumber: phoneNumberData,
    isLoading,
    error,
  };
};

export const useRiskPhoneNumbers = (options: RiskPhoneSearchParams) => {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const searchParams: RiskPhoneSearchParams = {
    page: options.page || 1,
    limit: options.limit || 10,
    search: options.search,
    applicantStatus: options.applicantStatus,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
  };

  // 获取风险手机号码列表
  const {
    data: riskPhoneListResponse,
    isLoading: riskPhoneLoading,
    error: riskPhoneError,
    refetch: riskPhoneRefetch
  } = useQuery({
    queryKey: ['riskPhoneNumbers', searchParams],
    queryFn: () => getRiskPhoneNumbers(searchParams),
    enabled: isAuthenticated, // 只有在认证后才执行查询
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // 如果是认证错误，不要重试
      if (error?.message?.includes('401') || error?.message?.includes('Authorization')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // 转换后端数据为前端格式
  const riskPhoneNumbers: PhoneNumber[] = useMemo(() => {
    if (!riskPhoneListResponse?.data?.items) return [];
    return riskPhoneListResponse.data.items.map(mapBackendPhoneToFrontend);
  }, [riskPhoneListResponse]);

  const riskPhonePagination = riskPhoneListResponse?.data?.pagination;

  // 创建风险手机号码
  const createRiskPhoneMutation = useMutation({
    mutationFn: (data: CreatePhoneRequest) => createPhone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskPhoneNumbers'] });
      toast({
        title: '成功',
        description: '风险手机号码创建成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '创建风险手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 更新风险手机号码
  const updateRiskPhoneMutation = useMutation({
    mutationFn: ({ phoneNumber, data }: { phoneNumber: string; data: UpdatePhoneRequest }) =>
      updatePhone(phoneNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskPhoneNumbers'] });
      queryClient.invalidateQueries({ queryKey: ['phoneNumber'] });
      toast({
        title: '成功',
        description: '风险手机号码更新成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '更新风险手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 删除风险手机号码
  const deleteRiskPhoneMutation = useMutation({
    mutationFn: deletePhone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskPhoneNumbers'] });
      toast({
        title: '成功',
        description: '风险手机号码删除成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '删除风险手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 分配风险手机号码
  const assignRiskPhoneMutation = useMutation({
    mutationFn: ({ phoneNumber, data }: { phoneNumber: string; data: AssignPhoneRequest }) =>
      assignPhone(phoneNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskPhoneNumbers'] });
      toast({
        title: '成功',
        description: '风险手机号码分配成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '分配风险手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 回收风险手机号码
  const unassignRiskPhoneMutation = useMutation({
    mutationFn: ({ phoneNumber, data }: { phoneNumber: string; data: UnassignPhoneRequest }) =>
      unassignPhone(phoneNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskPhoneNumbers'] });
      toast({
        title: '成功',
        description: '风险手机号码回收成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '回收风险手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  // 处理风险手机号码
  const handleRiskPhoneMutation = useMutation({
    mutationFn: ({ phoneNumber, data }: { phoneNumber: string; data: HandleRiskPhoneRequest }) =>
      handleRiskPhone(phoneNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskPhoneNumbers'] });
      queryClient.invalidateQueries({ queryKey: ['phoneNumbers'] }); // 同时刷新主列表
      toast({
        title: '成功',
        description: '风险手机号码处理成功',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || '处理风险手机号码失败';
      if (error.message?.includes('401')) {
        toast({
          title: '认证失败',
          description: '请重新登录',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '错误',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
  });

  return {
    riskPhoneNumbers,
    riskPhonePagination,
    riskPhoneLoading,
    riskPhoneError,
    riskPhoneRefetch,
    createRiskPhone: createRiskPhoneMutation.mutate,
    updateRiskPhone: updateRiskPhoneMutation.mutate,
    deleteRiskPhone: deleteRiskPhoneMutation.mutate,
    assignRiskPhone: assignRiskPhoneMutation.mutate,
    unassignRiskPhone: unassignRiskPhoneMutation.mutate,
    handleRiskPhone: handleRiskPhoneMutation.mutate,
    isCreatingRiskPhone: createRiskPhoneMutation.isPending,
    isUpdatingRiskPhone: updateRiskPhoneMutation.isPending,
    isDeletingRiskPhone: deleteRiskPhoneMutation.isPending,
    isAssigningRiskPhone: assignRiskPhoneMutation.isPending,
    isUnassigningRiskPhone: unassignRiskPhoneMutation.isPending,
    isHandlingRiskPhone: handleRiskPhoneMutation.isPending,
  };
}; 