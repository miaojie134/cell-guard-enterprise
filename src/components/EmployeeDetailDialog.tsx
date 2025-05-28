
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { Loader2, Phone, User, Calendar, Building, MapPin } from 'lucide-react';

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
  const { employeeDetail, isLoading, error, fetchEmployeeDetail, clearEmployeeDetail } = useEmployeeDetail();

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
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            员工详情
          </DialogTitle>
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

        {employeeDetail && (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                基本信息
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">员工姓名</div>
                  <div className="font-medium">{employeeDetail.fullName}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">员工工号</div>
                  <div className="font-medium">{employeeDetail.employeeId}</div>
                </div>
                
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
                <Phone className="h-4 w-4" />
                当前使用的手机号码
              </div>
              
              {employeeDetail.usingMobileNumbers && employeeDetail.usingMobileNumbers.length > 0 ? (
                <div className="space-y-2">
                  {employeeDetail.usingMobileNumbers.map((phone) => (
                    <div key={phone.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="h-4 w-4 text-green-600" />
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
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无当前使用的手机号码</p>
                </div>
              )}
            </div>

            <Separator />

            {/* 办理的手机号码 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                办理的手机号码
              </div>
              
              {employeeDetail.handledMobileNumbers && employeeDetail.handledMobileNumbers.length > 0 ? (
                <div className="space-y-2">
                  {employeeDetail.handledMobileNumbers.map((phone) => (
                    <div key={phone.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Phone className="h-4 w-4 text-blue-600" />
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
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
