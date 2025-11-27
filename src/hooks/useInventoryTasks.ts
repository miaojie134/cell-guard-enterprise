import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import { 
  InventoryTaskSearchParams, 
  InventoryTasksListResponse,
  CreateInventoryTaskPayload,
  InventoryTask,
  PerformItemActionPayload,
  ReportUnlistedPhonePayload,
} from '@/types/index';
import { useAuth } from '@/context/AuthContext';
import { useEmployeeAuth } from '@/context/EmployeeAuthContext';

export interface UseInventoryTasksReturn {
  data: InventoryTasksListResponse | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useInventoryTasks = (params: InventoryTaskSearchParams = {}): UseInventoryTasksReturn => {
  const { isAuthenticated } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inventoryTasks', params],
    queryFn: () => inventoryService.getInventoryTasks(params),
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟后清理缓存
  });

  return {
    data,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};

export const useInventoryTaskItems = (taskId: string, params: { page?: number, limit?: number }) => {
  const { isEmployeeAuthenticated } = useEmployeeAuth();

  return useQuery({
    queryKey: ['inventoryTaskItems', taskId, params],
    queryFn: () => inventoryService.getEmployeeTaskItems(taskId, params),
    enabled: isEmployeeAuthenticated && !!taskId,
  });
};

export const useInventoryTaskActions = () => {
  const queryClient = useQueryClient();

  const { mutate: createInventoryTask, isPending: isCreating } = useMutation({
    mutationFn: (payload: CreateInventoryTaskPayload) => 
      inventoryService.createInventoryTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTasks'] });
    },
  });

  const { mutate: performItemAction, isPending: isPerformingAction } = useMutation({
    mutationFn: (variables: { taskId: string; itemId: number; payload: PerformItemActionPayload }) =>
      inventoryService.performItemAction(variables.taskId, variables.itemId, variables.payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTaskItems', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['inventoryTasks'] }); // Also refetch overall task progress
    },
  });
  const { mutateAsync: performItemActionAsync } = useMutation({
    mutationFn: (variables: { taskId: string; itemId: number; payload: PerformItemActionPayload }) =>
      inventoryService.performItemAction(variables.taskId, variables.itemId, variables.payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTaskItems', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['inventoryTasks'] });
    },
  });

  const { mutate: reportUnlistedPhone, isPending: isReporting } = useMutation({
    mutationFn: (variables: { taskId: string; payload: ReportUnlistedPhonePayload }) =>
      inventoryService.reportUnlistedPhone(variables.taskId, variables.payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTaskItems', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['inventoryTasks'] });
    },
  });

  const { mutate: submitTask, isPending: isSubmitting } = useMutation({
    mutationFn: (taskId: string) => inventoryService.submitTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTaskItems', taskId] });
      queryClient.invalidateQueries({ queryKey: ['inventoryTasks'] });
      queryClient.invalidateQueries({ queryKey: ['employeeNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });

  return {
    createInventoryTask,
    isCreating,
    performItemAction,
    performItemActionAsync,
    isPerformingAction,
    reportUnlistedPhone,
    isReporting,
    submitTask,
    isSubmitting,
  };
};
