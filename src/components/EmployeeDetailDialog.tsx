
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
import { Loader2, Phone, User, Calendar, Building, MapPin, Mail, IdCard, Clock } from 'lucide-react';

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'departed':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPhoneStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-blue-600 bg-blue-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-purple-600 bg-purple-50';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden bg-gradient-to-br from-slate-50 to-white">
        <DialogHeader className="pb-6 border-b border-slate-200">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            员工详情信息
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <span className="text-lg font-medium text-slate-600">正在加载员工信息...</span>
            </div>
          )}

          {error && (
            <div className="mx-6 my-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {employeeDetail && (
            <div className="space-y-6 p-6">
              {/* 员工头像和基本信息 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="text-white">
                      <h2 className="text-3xl font-bold">{employeeDetail.fullName}</h2>
                      <p className="text-blue-100 text-lg mt-1">员工工号: {employeeDetail.employeeId}</p>
                      <div className="mt-3">
                        <Badge 
                          variant={getStatusBadgeVariant(employeeDetail.employmentStatus)}
                          className={`${getStatusColor(employeeDetail.employmentStatus)} px-3 py-1 text-sm font-medium rounded-full border`}
                        >
                          {employeeDetail.employmentStatus === 'Active' ? '在职' : '离职'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Building className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">所属部门</p>
                          <p className="text-lg font-semibold text-slate-800">{employeeDetail.department}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">入职日期</p>
                          <p className="text-lg font-semibold text-slate-800">{employeeDetail.hireDate}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <IdCard className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">员工ID</p>
                          <p className="text-lg font-semibold text-slate-800">{employeeDetail.id}</p>
                        </div>
                      </div>

                      {employeeDetail.terminationDate && (
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 font-medium">离职日期</p>
                            <p className="text-lg font-semibold text-orange-600">{employeeDetail.terminationDate}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 手机号码信息 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 当前使用的手机号码 */}
                <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                    <CardTitle className="flex items-center gap-3 text-green-800">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-xl">当前使用号码</span>
                        <p className="text-sm font-normal text-green-600 mt-1">
                          共 {employeeDetail.usingMobileNumbers.length} 个号码
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {employeeDetail.usingMobileNumbers && employeeDetail.usingMobileNumbers.length > 0 ? (
                      <div className="space-y-3">
                        {employeeDetail.usingMobileNumbers.map((phone) => (
                          <div key={phone.id} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getPhoneStatusColor(phone.status)}`}>
                                  <Phone className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 text-lg">{phone.phoneNumber}</p>
                                  <p className="text-sm text-slate-500">ID: {phone.id}</p>
                                </div>
                              </div>
                              <Badge variant={getPhoneStatusBadgeVariant(phone.status)} className="capitalize">
                                {phone.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                          <Phone className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">暂无使用中的手机号码</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 办理的手机号码 */}
                <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <CardTitle className="flex items-center gap-3 text-blue-800">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xl">办理的号码</span>
                        <p className="text-sm font-normal text-blue-600 mt-1">
                          共 {employeeDetail.handledMobileNumbers.length} 个号码
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {employeeDetail.handledMobileNumbers && employeeDetail.handledMobileNumbers.length > 0 ? (
                      <div className="space-y-3">
                        {employeeDetail.handledMobileNumbers.map((phone) => (
                          <div key={phone.id} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getPhoneStatusColor(phone.status)}`}>
                                  <Phone className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 text-lg">{phone.phoneNumber}</p>
                                  <p className="text-sm text-slate-500">ID: {phone.id}</p>
                                </div>
                              </div>
                              <Badge variant={getPhoneStatusBadgeVariant(phone.status)} className="capitalize">
                                {phone.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                          <Phone className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">暂无办理的手机号码</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 时间信息 */}
              <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Clock className="h-5 w-5 text-slate-600" />
                    </div>
                    时间记录
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">创建时间</p>
                        <p className="text-lg font-semibold text-slate-800">{employeeDetail.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">更新时间</p>
                        <p className="text-lg font-semibold text-slate-800">{employeeDetail.updatedAt}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
