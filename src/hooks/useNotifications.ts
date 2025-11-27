import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { useEmployeeAuth } from '@/context/EmployeeAuthContext';

// Hook to get paginated notifications
export const useEmployeeNotifications = (params: { page?: number, limit?: number }) => {
  const { isEmployeeAuthenticated } = useEmployeeAuth();

  return useQuery({
    queryKey: ['employeeNotifications', params],
    queryFn: () => notificationService.getEmployeeNotifications(params),
    enabled: isEmployeeAuthenticated,
  });
};

// Hook to get unread notification count
export const useUnreadNotificationCount = () => {
  const { isEmployeeAuthenticated } = useEmployeeAuth();

  return useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isEmployeeAuthenticated,
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
  });
};

// 标记已读由后端自动处理，前端不再调用
