import React, { useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Building2, UserCheck, Calendar, Send, ArrowLeft, X } from 'lucide-react';
import { EmployeeSelector, type Employee } from '@/components/EmployeeSelector';
import { verificationService } from '@/services/verificationService';
import { departmentService } from '@/services/departmentService';
import { useEmployeesForSelector } from '@/hooks/useEmployees';
import { 
  VerificationInitiateRequest, 
  VERIFICATION_SCOPE
} from '@/types';
import { 
  Department
} from '@/config/api';
import { toast } from '@/hooks/use-toast';

interface CreateForm {
  scope: string;
  selectedDepartments: string[];
  selectedEmployees: Employee[];
  durationDays: number;
  previewEnabled: boolean;
}

const VerificationCreate: React.FC = () => {
  const navigate = useNavigate();
  
  const [form, setForm] = useState<CreateForm>({
    scope: VERIFICATION_SCOPE.ALL_USERS,
    selectedDepartments: [],
    selectedEmployees: [],
    durationDays: 7,
    previewEnabled: false,
  });

  // 获取部门列表
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getDepartments(),
  });

  // 获取活跃员工数据用于统计 (员工选择器现在自带动态搜索)
  const { activeEmployees, isLoading: isLoadingEmployees } = useEmployeesForSelector({
    employmentStatus: 'Active',
    limit: 1000, // 用于统计，获取更多数据
  });

  // 发起盘点
  const createMutation = useMutation({
    mutationFn: (data: VerificationInitiateRequest) => verificationService.initiate(data),
    onSuccess: (response) => {
      toast({
        title: "盘点任务已发起",
        description: "批处理任务已创建，正在发送邮件通知",
      });
      navigate(`/verification/batch/${response.batchId}`);
    },
    onError: (error) => {
      toast({
        title: "发起失败",
        description: error instanceof Error ? error.message : "发起盘点失败，请稍后重试",
        variant: "destructive",
      });
    },
  });

  // 处理范围变更
  const handleScopeChange = (scope: string) => {
    setForm(prev => ({
      ...prev,
      scope,
      selectedDepartments: [],
      selectedEmployees: [],
    }));
  };

  // 处理部门选择
  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      selectedDepartments: checked
        ? [...prev.selectedDepartments, departmentId]
        : prev.selectedDepartments.filter(id => id !== departmentId)
    }));
  };

  // 处理员工选择
  const handleEmployeeSelect = (employee: Employee | null) => {
    if (!employee) return;
    
    // 检查是否已经选择过该员工
    const isAlreadySelected = form.selectedEmployees.some(emp => emp.id === employee.id);
    if (isAlreadySelected) {
      toast({
        title: "重复选择",
        description: "该员工已经被选择",
        variant: "destructive",
      });
      return;
    }

    setForm(prev => ({
      ...prev,
      selectedEmployees: [...prev.selectedEmployees, employee]
    }));
  };

  // 移除选中的员工
  const handleEmployeeRemove = (employeeId: number) => {
    setForm(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.filter(emp => emp.id !== employeeId)
    }));
  };

  // 获取预览数据
  const getPreviewData = () => {
    switch (form.scope) {
      case VERIFICATION_SCOPE.ALL_USERS:
        return {
          title: "全员盘点",
          count: activeEmployees.length,
          description: "将向所有在职员工发送确认邮件"
        };
      case VERIFICATION_SCOPE.DEPARTMENT_IDS:
        const selectedDepts = departments.filter(dept => 
          form.selectedDepartments.includes(dept.id.toString())
        );
        const deptEmployees = activeEmployees.filter(emp => 
          selectedDepts.some(dept => dept.name === emp.department)
        );
        return {
          title: "按部门盘点",
          count: deptEmployees.length,
          description: `选中部门：${selectedDepts.map(d => d.name).join(', ')}`
        };
      case VERIFICATION_SCOPE.EMPLOYEE_IDS:
        return {
          title: "按员工盘点",
          count: form.selectedEmployees.length,
          description: `已选择 ${form.selectedEmployees.length} 位员工`
        };
      default:
        return { title: "", count: 0, description: "" };
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (form.scope === VERIFICATION_SCOPE.DEPARTMENT_IDS && form.selectedDepartments.length === 0) {
      toast({
        title: "表单验证失败",
        description: "请至少选择一个部门",
        variant: "destructive",
      });
      return false;
    }

    if (form.scope === VERIFICATION_SCOPE.EMPLOYEE_IDS && form.selectedEmployees.length === 0) {
      toast({
        title: "表单验证失败",
        description: "请至少选择一个员工",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // 提交表单
  const handleSubmit = () => {
    if (!validateForm()) return;

    const requestData: VerificationInitiateRequest = {
      scope: form.scope as any,
      durationDays: form.durationDays,
    };

    if (form.scope === VERIFICATION_SCOPE.DEPARTMENT_IDS) {
      requestData.scopeValues = form.selectedDepartments;
    } else if (form.scope === VERIFICATION_SCOPE.EMPLOYEE_IDS) {
      requestData.scopeValues = form.selectedEmployees.map(emp => emp.employeeId);
    }

    createMutation.mutate(requestData);
  };

  const previewData = getPreviewData();

  return (
    <MainLayout title="发起盘点">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/verification')}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {/* <h2 className="text-2xl font-bold">发起盘点</h2> */}
              <p className="text-muted-foreground">
              创建新的手机号码使用确认任务
            </p>
            </div>

          </div>
        </div>

        {isLoadingEmployees ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">正在加载数据...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 左侧配置区 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 盘点范围 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Users className="h-4 w-4 mr-2" />
                    盘点范围
                  </CardTitle>
                  <CardDescription className="text-sm">
                    选择需要进行盘点的人员范围
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RadioGroup
                    value={form.scope}
                    onValueChange={handleScopeChange}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={VERIFICATION_SCOPE.ALL_USERS} id="all" />
                      <Label htmlFor="all" className="flex items-center cursor-pointer text-sm">
                        <Users className="h-4 w-4 mr-2" />
                        全员盘点
                        <Badge variant="outline" className="ml-2 text-xs">
                          {activeEmployees.length} 人
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={VERIFICATION_SCOPE.DEPARTMENT_IDS} id="departments" />
                      <Label htmlFor="departments" className="flex items-center cursor-pointer text-sm">
                        <Building2 className="h-4 w-4 mr-2" />
                        按部门盘点
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={VERIFICATION_SCOPE.EMPLOYEE_IDS} id="employees" />
                      <Label htmlFor="employees" className="flex items-center cursor-pointer text-sm">
                        <UserCheck className="h-4 w-4 mr-2" />
                        按员工盘点
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* 部门选择 */}
              {form.scope === VERIFICATION_SCOPE.DEPARTMENT_IDS && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">选择部门</CardTitle>
                    <CardDescription className="text-sm">
                      请选择需要进行盘点的部门
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {departments.map((dept) => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={form.selectedDepartments.includes(dept.id.toString())}
                            onCheckedChange={(checked) => 
                              handleDepartmentChange(dept.id.toString(), checked as boolean)
                            }
                          />
                          <Label htmlFor={`dept-${dept.id}`} className="cursor-pointer text-sm">
                            {dept.name}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {activeEmployees.filter(emp => emp.department === dept.name).length}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 员工选择 */}
              {form.scope === VERIFICATION_SCOPE.EMPLOYEE_IDS && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">选择员工</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 员工选择器 */}
                    <div>
                      <EmployeeSelector
                        value={null}
                        onChange={handleEmployeeSelect}
                        placeholder="搜索员工姓名或部门..."
                        compact
                        enableDynamicSearch={true}
                      />
                    </div>

                    {/* 已选择的员工列表 */}
                    {form.selectedEmployees.length > 0 && (
                      <div>
                        <Label className="text-sm">已选择的员工 ({form.selectedEmployees.length}人)</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {form.selectedEmployees.map((employee) => (
                            <Badge 
                              key={employee.id} 
                              variant="secondary" 
                              className="flex items-center gap-1 px-2 py-1 text-xs"
                            >
                              <span>{employee.fullName}</span>
                              <span className="text-muted-foreground">({employee.employeeId})</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-3 w-3 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleEmployeeRemove(employee.id)}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 批量操作提示 */}
                    {form.selectedEmployees.length === 0 && (
                      <Alert className="py-2">
                        <UserCheck className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          请使用上方搜索框搜索并选择员工。支持按姓名、部门等搜索。
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 有效期设置 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="h-4 w-4 mr-2" />
                    有效期设置
                  </CardTitle>
                  <CardDescription className="text-sm">
                    设置确认链接的有效期，过期后员工将无法提交确认
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">有效期：{form.durationDays} 天</Label>
                    <Slider
                      value={[form.durationDays]}
                      onValueChange={(value) => setForm(prev => ({ ...prev, durationDays: value[0] }))}
                      max={30}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1天</span>
                      <span>30天</span>
                    </div>
                  </div>
                  <Alert className="py-2">
                    <AlertDescription className="text-sm">
                      截止时间：{(() => {
                        const expireDate = new Date();
                        expireDate.setDate(expireDate.getDate() + form.durationDays);
                        expireDate.setHours(23, 59, 59, 999);
                        return expireDate.toLocaleString('zh-CN');
                      })()}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            {/* 右侧预览区 */}
            <div className="space-y-4">
              {/* 预览信息 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">预览信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">盘点类型</Label>
                    <p className="text-base font-medium">{previewData.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">目标人数</Label>
                    <p className="text-xl font-bold text-blue-600">{previewData.count} 人</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">描述</Label>
                    <p className="text-sm text-gray-600">{previewData.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">有效期</Label>
                    <p className="text-sm">{form.durationDays} 天</p>
                  </div>
                </CardContent>
              </Card>

              {/* 操作按钮 */}
              <Card>
                <CardContent className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || previewData.count === 0}
                    className="w-full"
                    size="lg"
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Send className="h-4 w-4 mr-2" />
                    发起盘点
                  </Button>
                  {previewData.count === 0 && (
                    <p className="text-xs text-red-600 mt-2 text-center">
                      请选择至少一个盘点目标
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default VerificationCreate; 