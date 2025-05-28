import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { Loader2, Phone, User, Calendar, Building } from 'lucide-react';

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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            员工详情
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">加载中...</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4">
            {error}
          </div>
        )}

        {employeeDetail && (
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">员工姓名</label>
                    <p className="text-sm font-medium">{employeeDetail.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">员工工号</label>
                    <p className="text-sm font-medium">{employeeDetail.employeeId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">部门</label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {employeeDetail.department}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">在职状态</label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(employeeDetail.employmentStatus)}>
                        {employeeDetail.employmentStatus === 'Active' ? '在职' : '离职'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">入职日期</label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {employeeDetail.hireDate}
                    </p>
                  </div>
                  {employeeDetail.terminationDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">离职日期</label>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {employeeDetail.terminationDate}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 作为当前使用人的手机号码 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  当前使用的手机号码
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeeDetail.usingMobileNumbers && employeeDetail.usingMobileNumbers.length > 0 ? (
                  <div className="space-y-3">
                    {employeeDetail.usingMobileNumbers.map((phone) => (
                      <div key={phone.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{phone.phoneNumber}</span>
                        </div>
                        <Badge variant={getPhoneStatusBadgeVariant(phone.status)}>
                          {phone.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">暂无当前使用的手机号码</p>
                )}
              </CardContent>
            </Card>

            {/* 作为办卡人的手机号码 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  办理的手机号码
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeeDetail.handledMobileNumbers && employeeDetail.handledMobileNumbers.length > 0 ? (
                  <div className="space-y-3">
                    {employeeDetail.handledMobileNumbers.map((phone) => (
                      <div key={phone.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{phone.phoneNumber}</span>
                        </div>
                        <Badge variant={getPhoneStatusBadgeVariant(phone.status)}>
                          {phone.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">暂无办理的手机号码</p>
                )}
              </CardContent>
            </Card>

            <Separator />

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 