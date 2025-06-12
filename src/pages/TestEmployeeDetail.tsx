import React, { useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeDetailDialog } from '@/components/EmployeeDetailDialog';
import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { useDepartmentOptions } from '@/hooks/useDepartments';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, User, Calendar, Building } from 'lucide-react';

const TestEmployeeDetail = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  
  // 获取部门选项数据
  const { options: departmentOptions } = useDepartmentOptions();
  const { employeeDetail, isLoading, error, fetchEmployeeDetail } = useEmployeeDetail(departmentOptions);

  const handleFetchDetail = async () => {
    if (!employeeId.trim()) {
      alert('请输入员工工号');
      return;
    }
    await fetchEmployeeDetail(employeeId.trim());
  };

  const handleShowDialog = () => {
    if (!employeeId.trim()) {
      alert('请输入员工工号');
      return;
    }
    setShowDialog(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'departed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPhoneStatusBadgeVariant = (status: string) => {
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
    <MainLayout title="员工详情接口测试">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">员工详情接口测试</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>测试员工详情接口</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">员工编号</label>
                <Input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="请输入员工编号，例如：EMP001"
                />
              </div>
              <Button onClick={handleFetchDetail} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                获取详情
              </Button>
              <Button variant="outline" onClick={handleShowDialog}>
                弹窗显示
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {employeeDetail && (
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-semibold">员工详情数据</h3>
                
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
                      作为当前使用人的手机号码 ({employeeDetail.usingMobileNumbers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employeeDetail.usingMobileNumbers.length > 0 ? (
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
                      <p className="text-gray-500 text-center py-4">暂无作为当前使用人的手机号码</p>
                    )}
                  </CardContent>
                </Card>

                {/* 作为办卡人的手机号码 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      作为办卡人的手机号码 ({employeeDetail.handledMobileNumbers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employeeDetail.handledMobileNumbers.length > 0 ? (
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
                      <p className="text-gray-500 text-center py-4">暂无作为办卡人的手机号码</p>
                    )}
                  </CardContent>
                </Card>

                {/* 原始数据 */}
                <Card>
                  <CardHeader>
                    <CardTitle>原始JSON数据</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(employeeDetail, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <EmployeeDetailDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          employeeId={employeeId.trim() || null}
        />
      </div>
    </MainLayout>
  );
};

export default TestEmployeeDetail; 