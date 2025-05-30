import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { useDepartmentOptions } from '@/hooks/useDepartments';
import { Loader2, Phone, User, Calendar, Building, CreditCard, UserCheck } from 'lucide-react';

interface EmployeeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
}

export const EmployeeDetailDialog: React.FC<EmployeeDetailDialogProps> = ({
  open,
  onOpenChange,
  employeeId,
}) => {
  // 获取部门选项数据
  const { options: departmentOptions } = useDepartmentOptions();
  
  const { employeeDetail, isLoading, error, fetchEmployeeDetail, clearEmployeeDetail } = useEmployeeDetail(departmentOptions);

  useEffect(() => {
    if (open && employeeId) {
      fetchEmployeeDetail(employeeId);
    } else if (!open) {
      clearEmployeeDetail();
    }
  }, [open, employeeId, fetchEmployeeDetail, clearEmployeeDetail]);

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'departed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPhoneStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'pending_deactivation':
        return 'outline';
      case 'risk_pending':
      case 'user_reported':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getUsingPhoneStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending_deactivation':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'risk_pending':
      case 'user_reported':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'border hover:bg-muted/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            {employeeDetail ? (
              <>
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span>{employeeDetail.fullName}</span>
                  <span className="text-sm font-normal text-muted-foreground">{employeeDetail.employeeId}</span>
                </div>
              </>
            ) : (
              <>
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span>员工详情</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {employeeDetail
              ? `查看员工 ${employeeDetail.fullName} (${employeeDetail.employeeId}) 的详细信息，包括基本资料、当前使用的手机号码和曾办理的手机号码。`
              : '加载员工详细信息中。'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">加载中...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8 text-destructive bg-destructive/5 rounded-lg border border-destructive/20">
            <span className="text-sm">{error}</span>
          </div>
        )}

        {employeeDetail && !isLoading && !error && (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                基本信息
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">部门</div>
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{employeeDetail.department}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">在职状态</div>
                  <Badge variant={getStatusBadgeVariant(employeeDetail.employmentStatus)} className="w-fit">
                    {employeeDetail.employmentStatus === 'Active' ? '在职' : '离职'}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">入职日期</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{employeeDetail.hireDate}</span>
                  </div>
                </div>
                
                {employeeDetail.terminationDate && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">离职日期</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{employeeDetail.terminationDate}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* 当前使用的手机号码 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <UserCheck className="h-4 w-4" />
                当前使用的手机号码
              </div>
              
              {employeeDetail.usingMobileNumbers && employeeDetail.usingMobileNumbers.length > 0 ? (
                <div className="space-y-2">
                  {employeeDetail.usingMobileNumbers.map((phone) => (
                    <div key={phone.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:opacity-80 ${getUsingPhoneStatusColor(phone.status)}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-white/50 rounded-full flex items-center justify-center">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{phone.phoneNumber}</span>
                      </div>
                      <Badge variant={getPhoneStatusBadgeVariant(phone.status)} className="text-xs">
                        {phone.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无当前使用的手机号码</p>
                </div>
              )}
            </div>

            <Separator />

            {/* 办理的手机号码 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                办理的手机号码
              </div>
              
              {employeeDetail.handledMobileNumbers && employeeDetail.handledMobileNumbers.length > 0 ? (
                <div className="space-y-2">
                  {employeeDetail.handledMobileNumbers.map((phone) => (
                    <div key={phone.id} className={`flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 transition-colors`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-white/50 rounded-full flex items-center justify-center">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{phone.phoneNumber}</span>
                      </div>
                      <Badge variant={"secondary"} className="text-xs">
                        {phone.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无办理的手机号码</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
