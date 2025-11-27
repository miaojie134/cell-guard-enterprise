import React, { useState } from 'react';
import { useEmployeePhones } from '@/hooks/useEmployeePhones';
import { UnifiedPhoneTable, ActionConfig } from '@/components/UnifiedPhoneTable';
import { Pagination } from '@/components/ui/pagination';
import { useEmployeeAuth } from '@/context/EmployeeAuthContext';
import { useDepartmentOptions } from '@/hooks/useDepartments';
import { Phone, Edit, ArrowRightLeft } from 'lucide-react';
import { InitiateTransferDialog } from '@/pages/employee/components/InitiateTransferDialog';
import { PhoneNumber } from '@/types/index';
import { PhoneSearchParams } from '@/utils/phoneUtils';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { requestDeactivatePhone } from '@/services/phoneService';

const EmployeeDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useState<Partial<PhoneSearchParams>>({ page: 1, limit: 10 });
  const { employee } = useEmployeeAuth();
  const { toast } = useToast();
  
  const { options: departmentOptions } = useDepartmentOptions();
  const { data: phoneData, isLoading, error, refetch } = useEmployeePhones(searchParams);
  const { data: notificationData } = useEmployeeNotifications({ page: 1, limit: 5 });

  const [isTransferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<PhoneNumber | null>(null);
  const [isDeactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [phoneToDeactivate, setPhoneToDeactivate] = useState<PhoneNumber | null>(null);
  const [isSubmittingDeactivate, setSubmittingDeactivate] = useState(false);

  const handleOpenTransferDialog = (phone: PhoneNumber) => {
    setSelectedPhone(phone);
    setTransferDialogOpen(true);
  };

  const actions: ActionConfig[] = [
    {
      key: 'deactivate',
      label: '停用',
      icon: <Phone className="h-3 w-3" />,
      variant: 'outline',
      onClick: (phoneNumber) => {
        const phone = phoneData?.data.find(p => p.phoneNumber === phoneNumber) || null;
        setPhoneToDeactivate(phone);
        setDeactivateDialogOpen(true);
      },
    },
    {
      key: 'transfer',
      label: '转移',
      icon: <ArrowRightLeft className="h-3 w-3" />,
      variant: 'outline',
      onClick: (phoneNumber) => {
        const phoneToTransfer = phoneData?.data.find(p => p.phoneNumber === phoneNumber);
        if (phoneToTransfer) {
          handleOpenTransferDialog(phoneToTransfer);
        }
      },
    },
  ];

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = phoneData ? Math.ceil(phoneData.total / phoneData.pageSize) : 1;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">我的资产</h1>
      </div>
      
      <div className="border rounded-lg">
        <UnifiedPhoneTable
          phoneNumbers={phoneData?.data || []}
          isLoading={isLoading}
          error={error as Error | null}
          searchParams={searchParams}
          user={employee as any}
          departmentOptions={departmentOptions}
          onFilterChange={() => {}}
          onUpdateSearchParams={(updater) => setSearchParams(updater(searchParams))}
          actions={actions}
          showColumns={{
            currentUser: false,
            applicant: false,
            applicantStatus: false,
            purpose: true,
            cancellationDate: false,
          }}
          emptyText="您名下没有手机号码资产。"
        />
      </div>

       <div className="mt-4 flex justify-center">
        {phoneData && phoneData.total > 0 && (
          <Pagination>
            <button 
              onClick={() => handlePageChange(searchParams.page - 1)} 
              disabled={searchParams.page <= 1}
              className="px-4 py-2 mx-1 border rounded-md disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 mx-1">
              第 {searchParams.page} / {totalPages} 页
            </span>
            <button 
              onClick={() => handlePageChange(searchParams.page + 1)} 
              disabled={searchParams.page >= totalPages}
              className="px-4 py-2 mx-1 border rounded-md disabled:opacity-50"
            >
              下一页
            </button>
          </Pagination>
        )}
      </div>
      <InitiateTransferDialog 
        open={isTransferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        phone={selectedPhone}
      />

      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认标记停用？</AlertDialogTitle>
            <AlertDialogDescription>
              {phoneToDeactivate ? `手机号码 【${phoneToDeactivate.phoneNumber}】将会注销` : '确认提交停用申请？'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmittingDeactivate}
              onClick={async () => {
                if (!phoneToDeactivate) {
                  setDeactivateDialogOpen(false);
                  return;
                }
                setSubmittingDeactivate(true);
                try {
                  await requestDeactivatePhone(phoneToDeactivate.phoneNumber);
                  toast({
                    title: '已提交停用申请',
                    description: `号码 ${phoneToDeactivate.phoneNumber} 待处理`,
                  });
                  setDeactivateDialogOpen(false);
                  refetch();
                } catch (err) {
                  toast({
                    title: '提交失败',
                    description: err instanceof Error ? err.message : '请稍后重试',
                    variant: 'destructive',
                  });
                } finally {
                  setSubmittingDeactivate(false);
                }
              }}
            >
              {isSubmittingDeactivate ? '提交中...' : '确认'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeDashboard;
