import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferService } from '@/services/transferService';
import { useEmployeeAuth } from '@/context/EmployeeAuthContext';
import { InitiateTransferPayload } from '@/types/index';

// Hook to get pending transfer requests for the current employee
export const usePendingTransfers = () => {
  const { isEmployeeAuthenticated } = useEmployeeAuth();

  return useQuery({
    queryKey: ['pendingTransfers'],
    queryFn: () => transferService.getPendingTransfers(),
    enabled: isEmployeeAuthenticated,
  });
};

// Hook for transfer actions
export const useTransferActions = () => {
  const queryClient = useQueryClient();

  const onSuccess = () => {
    // Refetch pending transfers and notifications
    queryClient.invalidateQueries({ queryKey: ['pendingTransfers'] });
    queryClient.invalidateQueries({ queryKey: ['employeeNotifications'] });
    queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    // Also refetch the main phone list as ownership has changed
    queryClient.invalidateQueries({ queryKey: ['employeePhones'] }); 
  };

  const { mutate: acceptTransfer, isPending: isAccepting } = useMutation({
    mutationFn: (transferId: string) => transferService.acceptTransfer(transferId),
    onSuccess,
  });

  const { mutate: rejectTransfer, isPending: isRejecting } = useMutation({
    mutationFn: (transferId: string) => transferService.rejectTransfer(transferId),
    onSuccess,
  });

  const { mutate: initiateTransfer, isPending: isInitiating } = useMutation({
    mutationFn: (payload: InitiateTransferPayload) => transferService.initiateTransfer(payload),
    onSuccess,
  });

  return {
    acceptTransfer,
    isAccepting,
    rejectTransfer,
    isRejecting,
    initiateTransfer,
    isInitiating,
  };
};
