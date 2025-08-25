import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getDashboardStats } from '@/services/dashboardService';
import { DashboardStatsData } from '@/config/api/dashboard';

export const useDashboard = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStatsData> => {
      const response = await getDashboardStats();
      return response.data;
    },
    enabled: isAuthenticated,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5分钟内数据被认为是新鲜的
    gcTime: 10 * 60 * 1000,   // 10分钟后垃圾回收
  });

  return {
    dashboardData,
    isLoading,
    error,
    refetch,
    // 辅助计算属性
    stats: dashboardData ? {
      totalPhones: dashboardData.totalNumbers,
      activePhones: dashboardData.inUseNumbers,
      riskPhones: dashboardData.riskNumbers,
    } : null,
    recentNumbers: dashboardData?.recentNumbers || [],
    riskNumbers: dashboardData?.riskNumberList || [],
  };
};
