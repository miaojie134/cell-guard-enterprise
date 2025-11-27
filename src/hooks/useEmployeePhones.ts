import { useQuery } from '@tanstack/react-query';
import { getEmployeeMobileNumbers } from '@/services/phoneService';
import { useEmployeeAuth } from '@/context/EmployeeAuthContext';

export const useEmployeePhones = (params: { page?: number, limit?: number }) => {
  const { isEmployeeAuthenticated } = useEmployeeAuth();

  return useQuery({
    queryKey: ['employeePhones', params],
    queryFn: () => getEmployeeMobileNumbers(params),
    enabled: isEmployeeAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
