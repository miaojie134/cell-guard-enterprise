import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Mail, 
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Building2,
  UserCheck,
  User,
  Copy,
  Plus
} from 'lucide-react';
import { verificationService } from '@/services/verificationService';
import { employeeService } from '@/services/employeeService';
import { departmentService } from '@/services/departmentService';
import { VERIFICATION_STATUS } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

const VerificationBatchStatus: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});
  const [departmentNames, setDepartmentNames] = useState<Record<string, string>>({});
  const [selectedFailedEmployees, setSelectedFailedEmployees] = useState<string[]>([]);
  const [showAllFailed, setShowAllFailed] = useState(false);

  // 获取批处理状态，自动轮询
  const { data: batchStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['verification', 'batch', batchId],
    queryFn: () => {
      if (!batchId) throw new Error('缺少批处理ID');
      return verificationService.getBatchStatus(batchId);
    },
    enabled: !!batchId,
    refetchInterval: (query) => {
      // 如果任务还在进行中，每10秒刷新一次
      const data = query.state.data;
      if (data?.status === VERIFICATION_STATUS.PENDING || data?.status === VERIFICATION_STATUS.IN_PROGRESS) {
        return 10000;
      }
      return false; // 任务完成后停止轮询
    },
    retry: false,
  });

  // 当 batchStatus 更新且是员工盘点时，获取员工姓名
  useEffect(() => {
    if (batchStatus?.requestedScopeType === 'employee_ids' && batchStatus.requestedScopeValues) {
      console.log('原始员工范围值:', batchStatus.requestedScopeValues);
      console.log('员工范围值类型:', typeof batchStatus.requestedScopeValues);
      
      let empIds: string[] = [];
      try {
        // 尝试解析JSON格式的数组
        empIds = JSON.parse(batchStatus.requestedScopeValues);
        console.log('JSON解析后的员工工号数组:', empIds);
      } catch (error) {
        // 如果不是JSON格式，则尝试逗号分隔的字符串
        console.log('JSON解析失败，使用逗号分隔解析:', error);
        empIds = batchStatus.requestedScopeValues.split(',').map(id => id.trim());
      }
      
      console.log('最终员工工号数组:', empIds);
      console.log('第一个员工工号:', empIds[0], '类型:', typeof empIds[0]);
      
      // 使用员工列表接口的搜索功能逐个查找员工
      const fetchEmployeeNames = async () => {
        const nameMap: Record<string, string> = {};
        
        // 逐个搜索每个员工工号
        for (const empId of empIds) {
          try {
            console.log(`搜索员工工号: "${empId}" (类型: ${typeof empId})`);
            const searchResponse = await employeeService.getEmployees({
              search: empId,
              limit: 10,
              page: 1
            });
            
            console.log(`员工 ${empId} 搜索响应:`, searchResponse);
            
            // 查找完全匹配的员工工号
            const matchedEmployee = searchResponse.items.find(emp => emp.employeeId === empId);
            if (matchedEmployee) {
              nameMap[empId] = matchedEmployee.fullName;
              console.log(`找到员工: ${empId} -> ${matchedEmployee.fullName}`);
            } else {
              console.log(`未找到员工: ${empId}，搜索结果:`, searchResponse.items);
              nameMap[empId] = empId; // fallback 到工号
            }
          } catch (error) {
            console.error(`搜索员工 ${empId} 失败:`, error);
            nameMap[empId] = empId; // fallback 到工号
          }
        }
        
        console.log('员工姓名映射结果:', nameMap);
        setEmployeeNames(nameMap);
      };
      
      fetchEmployeeNames();
    } else if (batchStatus?.requestedScopeType === 'department_ids' && batchStatus.requestedScopeValues) {
      console.log('原始部门范围值:', batchStatus.requestedScopeValues);
      
      let deptIds: string[] = [];
      try {
        // 尝试解析JSON格式的数组
        deptIds = JSON.parse(batchStatus.requestedScopeValues);
        console.log('JSON解析后的部门ID数组:', deptIds);
      } catch (error) {
        // 如果不是JSON格式，则尝试逗号分隔的字符串
        console.log('部门ID JSON解析失败，使用逗号分隔解析:', error);
        deptIds = batchStatus.requestedScopeValues.split(',').map(id => id.trim());
      }
      
      // 获取部门名称
      const fetchDepartmentNames = async () => {
        const nameMap: Record<string, string> = {};
        
        for (const deptId of deptIds) {
          try {
            console.log(`获取部门ID: ${deptId} 的信息`);
            const department = await departmentService.getDepartmentById(parseInt(deptId));
            nameMap[deptId] = department.name;
            console.log(`找到部门: ${deptId} -> ${department.name}`);
          } catch (error) {
            console.error(`获取部门 ${deptId} 信息失败:`, error);
            nameMap[deptId] = `部门${deptId}`; // fallback 到部门ID
          }
        }
        
        console.log('部门名称映射结果:', nameMap);
        setDepartmentNames(nameMap);
      };
      
      fetchDepartmentNames();
    }
  }, [batchStatus]);

  // 手动刷新
  const handleRefresh = () => {
    refetch();
  };

  // 计算进度百分比
  const getProgressPercentage = () => {
    if (!batchStatus) return 0;
    
    const { totalEmployeesToProcess, tokensGeneratedCount } = batchStatus;
    if (totalEmployeesToProcess === 0) return 0;
    
    return Math.round((tokensGeneratedCount / totalEmployeesToProcess) * 100);
  };

  // 获取状态颜色和图标
  const getStatusDisplay = () => {
    if (!batchStatus) return { color: 'gray', icon: Clock, text: '未知' };
    
    switch (batchStatus.status) {
      case VERIFICATION_STATUS.PENDING:
        return { color: 'yellow', icon: Clock, text: '等待处理' };
      case VERIFICATION_STATUS.IN_PROGRESS:
        return { color: 'blue', icon: Loader2, text: '处理中' };
      case VERIFICATION_STATUS.COMPLETED:
        return { color: 'green', icon: CheckCircle, text: '已完成' };
      case VERIFICATION_STATUS.COMPLETED_WITH_ERRORS:
        return { color: 'orange', icon: AlertCircle, text: '完成（有错误）' };
      case VERIFICATION_STATUS.FAILED:
        return { color: 'red', icon: AlertCircle, text: '失败' };
      default:
        return { color: 'gray', icon: Clock, text: '未知状态' };
    }
  };

  // 获取盘点范围的具体显示信息
  const getScopeDisplay = () => {
    if (!batchStatus) return { text: '未知', icon: Users, detail: '' };
    
    const { requestedScopeType, requestedScopeValues } = batchStatus;
    
    switch (requestedScopeType) {
      case 'all_users':
        return { 
          text: '全员盘点', 
          icon: Users, 
          detail: '所有在职员工' 
        };
      case 'department_ids':
        if (requestedScopeValues) {
          let deptIds: string[] = [];
          try {
            // 使用JSON解析，与useEffect中的逻辑保持一致
            deptIds = JSON.parse(requestedScopeValues);
          } catch (error) {
            // 如果不是JSON格式，则尝试逗号分隔的字符串
            deptIds = requestedScopeValues.split(',').map(id => id.trim());
          }
          
          // 如果有部门名称信息，显示名称；否则显示ID
          if (Object.keys(departmentNames).length > 0) {
            const names = deptIds.map(id => {
              const name = departmentNames[id];
              return name || `部门${id}`;
            });
            return { 
              text: '按部门盘点', 
              icon: Building2, 
              detail: `部门名称: ${names.join(', ')} (${names.length}个部门)` 
            };
          } else {
            return { 
              text: '按部门盘点', 
              icon: Building2, 
              detail: `部门ID: ${deptIds.join(', ')} (${deptIds.length}个部门)` 
            };
          }
        }
        return { text: '按部门盘点', icon: Building2, detail: '部门信息缺失' };
      case 'employee_ids':
        if (requestedScopeValues) {
          let empIds: string[] = [];
          try {
            // 使用JSON解析，与useEffect中的逻辑保持一致
            empIds = JSON.parse(requestedScopeValues);
          } catch (error) {
            // 如果不是JSON格式，则尝试逗号分隔的字符串
            empIds = requestedScopeValues.split(',').map(id => id.trim());
          }
          
          // 如果有员工姓名信息，显示姓名；否则显示工号
          if (Object.keys(employeeNames).length > 0) {
            const names = empIds.map(id => {
              const name = employeeNames[id];
              return name || id;
            });
            return { 
              text: '按员工盘点', 
              icon: UserCheck, 
              detail: `员工姓名: ${names.join(', ')} (${names.length}位员工)` 
            };
          } else {
            return { 
              text: '按员工盘点', 
              icon: UserCheck, 
              detail: `员工工号: ${empIds.join(', ')} (${empIds.length}位员工)` 
            };
          }
        }
        return { text: '按员工盘点', icon: UserCheck, detail: '员工信息缺失' };
      default:
        return { text: requestedScopeType, icon: Users, detail: requestedScopeValues || '' };
    }
  };

  // 计算邮件发送成功率
  const getEmailSuccessRate = () => {
    if (!batchStatus || batchStatus.emailsAttemptedCount === 0) return 0;
    return Math.round((batchStatus.emailsSucceededCount / batchStatus.emailsAttemptedCount) * 100);
  };

  // 解析失败员工详情
  const parseFailedEmployees = (errorSummary: string) => {
    try {
      // 首先尝试解析为JSON数组
      const errors = JSON.parse(errorSummary);
      if (Array.isArray(errors)) {
        return errors.map((error: any) => ({
          employeeId: error.employeeId || '未知',
          employeeName: error.employeeName || employeeNames[error.employeeId] || '未知员工',
          emailAddress: error.emailAddress || '未知邮箱',
          reason: getFriendlyErrorMessage(error.reason || '')
        }));
      } else {
        // 单个JSON对象
        return [{
          employeeId: errors.employeeId || '未知',
          employeeName: errors.employeeName || '未知员工',
          emailAddress: errors.emailAddress || '未知邮箱',
          reason: getFriendlyErrorMessage(errors.reason || errorSummary)
        }];
      }
    } catch (error) {
      // JSON解析失败，尝试按换行符分割多个JSON对象
      try {
        const lines = errorSummary.trim().split('\n').filter(line => line.trim());
        const failedEmployees = [];
        
        for (const line of lines) {
          try {
            const errorData = JSON.parse(line.trim());
            failedEmployees.push({
              employeeId: errorData.employeeId || '未知',
              employeeName: errorData.employeeName || employeeNames[errorData.employeeId] || '未知员工',
              emailAddress: errorData.emailAddress || '未知邮箱',
              reason: getFriendlyErrorMessage(errorData.reason || '')
            });
          } catch (lineError) {
            console.error('解析单行错误信息失败:', line, lineError);
            // 如果单行解析失败，尝试从字符串中提取信息
            const emailMatch = line.match(/(\w+@[\w.-]+\.\w+)/);
            const employeeMatch = line.match(/employeeName":"([^"]+)"/);
            
            failedEmployees.push({
              employeeId: '未知',
              employeeName: employeeMatch ? employeeMatch[1] : '未知员工',
              emailAddress: emailMatch ? emailMatch[1] : '未知邮箱',
              reason: getFriendlyErrorMessage(line)
            });
          }
        }
        
        return failedEmployees.length > 0 ? failedEmployees : [{
          employeeId: '未知',
          employeeName: '未知员工',
          emailAddress: '未知邮箱',
          reason: getFriendlyErrorMessage(errorSummary)
        }];
      } catch (multiLineError) {
        console.error('解析多行错误信息失败:', multiLineError);
        // 最后的fallback
        const emailMatch = errorSummary.match(/(\w+@[\w.-]+\.\w+)/);
        const employeeMatch = errorSummary.match(/employeeName":"([^"]+)"/);
        
        return [{
          employeeId: '未知',
          employeeName: employeeMatch ? employeeMatch[1] : '未知员工',
          emailAddress: emailMatch ? emailMatch[1] : '未知邮箱',
          reason: getFriendlyErrorMessage(errorSummary)
        }];
      }
    }
  };

  // 将技术错误信息转换为用户友好的信息
  const getFriendlyErrorMessage = (reason: string): string => {
    if (reason.includes('SMTP rcpt to failed: 554') || reason.includes('User unknown')) {
      return '邮箱地址无效';
    }
    if (reason.includes('Connection timeout') || reason.includes('timeout')) {
      return '邮件服务器超时';
    }
    if (reason.includes('Authentication failed')) {
      return '邮件服务器认证失败';
    }
    if (reason.includes('Mailbox full') || reason.includes('over quota')) {
      return '员工邮箱已满';
    }
    if (reason.includes('Blocked') || reason.includes('spam')) {
      return '被识别为垃圾邮件';
    }
    return '邮件发送失败';
  };

  // 补发选中员工的邮件
  const handleResendSelectedEmails = async () => {
    if (selectedFailedEmployees.length === 0) {
      toast({
        title: "请选择员工",
        description: "请先选择需要补发邮件的员工",
        variant: "destructive",
      });
      return;
    }

    if (!batchId) {
      toast({
        title: "错误",
        description: "缺少批处理任务ID",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('开始补发邮件，选中员工:', selectedFailedEmployees);
      
      const result = await verificationService.resendFailedEmails(batchId, selectedFailedEmployees);
      
      console.log('补发邮件结果:', result);

      // 显示详细的补发结果
      const successMessage = `补发完成：总计 ${result.totalAttempted} 人，成功 ${result.successCount} 人，失败 ${result.failedCount} 人`;
      
      if (result.failedCount === 0) {
        // 全部成功
        toast({
          title: "补发成功",
          description: successMessage,
        });
      } else {
        // 部分成功或全部失败
        const failedNames = result.failedEmails.map(email => email.employeeName).join(', ');
        toast({
          title: result.successCount > 0 ? "部分补发成功" : "补发失败",
          description: `${successMessage}${result.failedCount > 0 ? `\n失败员工：${failedNames}` : ''}`,
          variant: result.successCount > 0 ? "default" : "destructive",
        });
      }

      // 清空选择状态
      setSelectedFailedEmployees([]);
      
      // 刷新批处理状态以获取最新数据
      refetch();
      
    } catch (error) {
      console.error('补发邮件失败:', error);
      toast({
        title: "补发失败",
        description: error instanceof Error ? error.message : "补发邮件失败，请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 全选/取消全选失败员工
  const handleSelectAllFailed = (failedEmployees: any[]) => {
    if (selectedFailedEmployees.length === failedEmployees.length) {
      setSelectedFailedEmployees([]);
    } else {
      setSelectedFailedEmployees(failedEmployees.map(emp => emp.employeeId));
    }
  };

  // 补发全部失败邮件
  const handleResendAllFailed = async () => {
    if (!batchId) {
      toast({
        title: "错误",
        description: "缺少批处理任务ID",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('开始补发全部失败邮件');
      
      // 不传入employeeIds，让后端自动从错误摘要中解析
      const result = await verificationService.resendFailedEmails(batchId);
      
      console.log('补发全部失败邮件结果:', result);

      // 显示详细的补发结果
      const successMessage = `补发完成：总计 ${result.totalAttempted} 人，成功 ${result.successCount} 人，失败 ${result.failedCount} 人`;
      
      if (result.failedCount === 0) {
        // 全部成功
        toast({
          title: "补发成功",
          description: successMessage,
        });
      } else {
        // 部分成功或全部失败
        const failedNames = result.failedEmails.map(email => email.employeeName).join(', ');
        toast({
          title: result.successCount > 0 ? "部分补发成功" : "补发失败",
          description: `${successMessage}${result.failedCount > 0 ? `\n失败员工：${failedNames}` : ''}`,
          variant: result.successCount > 0 ? "default" : "destructive",
        });
      }

      // 清空选择状态
      setSelectedFailedEmployees([]);
      
      // 刷新批处理状态以获取最新数据
      refetch();
      
    } catch (error) {
      console.error('补发全部失败邮件失败:', error);
      toast({
        title: "补发失败",
        description: error instanceof Error ? error.message : "补发邮件失败，请稍后重试",
        variant: "destructive",
      });
    }
  };

  const statusDisplay = getStatusDisplay();
  const scopeDisplay = getScopeDisplay();
  const StatusIcon = statusDisplay.icon;
  const ScopeIcon = scopeDisplay.icon;
  const progressPercentage = getProgressPercentage();
  const emailSuccessRate = getEmailSuccessRate();

  return (
    <MainLayout title="批处理任务状态">
      <div className="space-y-3 w-full min-h-[calc(100vh-8rem)]">
        {/* 头部 */}
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
            <p className="text-muted-foreground text-sm">任务ID: {batchId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            {batchStatus && (batchStatus.status === VERIFICATION_STATUS.COMPLETED || 
              batchStatus.status === VERIFICATION_STATUS.COMPLETED_WITH_ERRORS) && (
              <Button 
                onClick={() => navigate('/verification/results')}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                查看结果
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <Card className="w-full h-96 flex items-center justify-center">
            <CardContent className="flex items-center justify-center py-5">
              <div className="text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">正在加载批处理状态...</p>
              </div>
            </CardContent>
          </Card>
        ) : error || !batchStatus ? (
          <Card className="w-full h-96 flex items-center justify-center">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-red-600 text-base">
                <AlertCircle className="h-4 w-4 mr-2" />
                加载失败
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3 text-sm">
                {error instanceof Error ? error.message : '无法获取批处理状态'}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                重试
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 w-full flex-1">
            {/* 左侧主要信息 */}
            <div className="xl:col-span-3 space-y-4 w-full">
              {/* 任务状态 */}
              <Card className="w-full">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`h-5 w-5 ${
                        statusDisplay.color === 'blue' ? 'animate-spin' : ''
                      } ${
                        statusDisplay.color === 'green' ? 'text-green-600' :
                        statusDisplay.color === 'red' ? 'text-red-600' :
                        statusDisplay.color === 'orange' ? 'text-orange-600' :
                        statusDisplay.color === 'blue' ? 'text-blue-600' :
                        'text-gray-600'
                      }`} />
                      <Badge variant={
                        statusDisplay.color === 'green' ? 'default' :
                        statusDisplay.color === 'red' ? 'destructive' :
                        statusDisplay.color === 'orange' ? 'secondary' :
                        'outline'
                      } className="text-sm px-3 py-1">
                        {statusDisplay.text}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(batchStatus.updatedAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>处理进度</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="text-xs text-gray-600">
                      已处理 {batchStatus.tokensGeneratedCount} / {batchStatus.totalEmployeesToProcess} 个员工
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 详细统计 */}
              <Card>
                <CardContent className="py-3">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <Users className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      <p className="text-base font-bold text-blue-600">{batchStatus.totalEmployeesToProcess}</p>
                      <p className="text-xs text-gray-600">目标员工</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-600" />
                      <p className="text-base font-bold text-green-600">{batchStatus.tokensGeneratedCount}</p>
                      <p className="text-xs text-gray-600">令牌生成</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <Mail className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                      <p className="text-base font-bold text-purple-600">{batchStatus.emailsAttemptedCount}</p>
                      <p className="text-xs text-gray-600">邮件尝试</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                      <p className="text-base font-bold text-orange-600">{batchStatus.emailsFailedCount}</p>
                      <p className="text-xs text-gray-600">邮件失败</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 错误信息 */}
              {batchStatus.errorSummary && (
                <Card className="w-full flex-1">
                  <CardHeader className="pb-3">
                    {/* <CardTitle className="flex items-center text-red-600 text-lg">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      邮件发送失败
                    </CardTitle> */}
                  </CardHeader>
                  <CardContent className="pt-0 flex-1">
                    {(() => {
                      const failedEmployees = parseFailedEmployees(batchStatus.errorSummary);
                      const displayEmployees = showAllFailed ? failedEmployees : failedEmployees.slice(0, 5);
                      
                      return (
                        <div className="space-y-4 h-full flex flex-col">
                          {/* 失败统计 */}
                          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-5 w-5 text-red-600" />
                              <span className="text-base font-medium text-red-800">
                              邮件发送失败-{failedEmployees.length}位员工邮件发送失败
                              </span>
                            </div>
                            <Badge variant="destructive" className="text-sm px-2 py-1">{failedEmployees.length}人</Badge>
                          </div>

                          {/* 失败员工列表 */}
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={selectedFailedEmployees.length === failedEmployees.length && failedEmployees.length > 0}
                                  onCheckedChange={() => handleSelectAllFailed(failedEmployees)}
                                />
                                <span className="text-base font-medium">失败员工列表</span>
                              </div>
                              {failedEmployees.length > 5 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowAllFailed(!showAllFailed)}
                                  className="h-8 px-3"
                                >
                                  {showAllFailed ? '收起' : `查看全部 ${failedEmployees.length} 人`}
                                </Button>
                              )}
                            </div>
                            
                            <div className="max-h-60 overflow-y-auto space-y-2 flex-1">
                              {displayEmployees.map((employee, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                  <Checkbox
                                    checked={selectedFailedEmployees.includes(employee.employeeId)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedFailedEmployees(prev => [...prev, employee.employeeId]);
                                      } else {
                                        setSelectedFailedEmployees(prev => prev.filter(id => id !== employee.employeeId));
                                      }
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-base">{employee.employeeName}</span>
                                      <span className="text-sm text-gray-500">({employee.employeeId})</span>
                                    </div>
                                    <div className="text-sm text-gray-600 truncate">
                                      {employee.emailAddress} • {employee.reason}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex gap-3 pt-3 border-t">
                            <Button
                              variant="default"
                              size="default"
                              onClick={handleResendSelectedEmails}
                              disabled={selectedFailedEmployees.length === 0}
                              className="h-10"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              补发邮件 ({selectedFailedEmployees.length})
                            </Button>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={handleResendAllFailed}
                              className="h-10"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              补发全部
                            </Button>
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => navigate('/employees')}
                              className="h-10"
                            >
                              <User className="h-4 w-4 mr-2" />
                              员工管理
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 右侧信息面板 */}
            <div className="xl:col-span-1 space-y-4 w-full">
              {/* 任务信息 */}
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">任务信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <div className="flex items-center mb-2">
                      <ScopeIcon className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="text-base font-medium text-gray-500">盘点范围</span>
                    </div>
                    <p className="text-base">{scopeDisplay.text}</p>
                  </div>
                  {scopeDisplay.detail && (
                    <div>
                      <span className="text-base font-medium text-gray-500">范围详情</span>
                      <p className="text-sm text-gray-700 break-all mt-1">{scopeDisplay.detail}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-base font-medium text-gray-500">有效期</span>
                    <p className="text-base">{batchStatus.requestedDurationDays} 天</p>
                  </div>
                  <div>
                    <span className="text-base font-medium text-gray-500">创建时间</span>
                    <p className="text-base">{new Date(batchStatus.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 邮件发送统计 */}
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">邮件发送统计</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{emailSuccessRate}%</p>
                    <p className="text-sm text-gray-600">发送成功率</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-base">
                      <span>成功发送</span>
                      <span className="text-green-600 font-semibold">{batchStatus.emailsSucceededCount}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span>发送失败</span>
                      <span className="text-red-600 font-semibold">{batchStatus.emailsFailedCount}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span>总计尝试</span>
                      <span className="font-semibold">{batchStatus.emailsAttemptedCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default VerificationBatchStatus; 