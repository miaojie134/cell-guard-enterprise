import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  History,
  AlertCircle,
  Eye,
  Users,
  Building2,
  UserCheck,
  Calendar,
  Filter,
  CalendarDays
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { verificationService } from '@/services/verificationService';
import { VERIFICATION_STATUS } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

const VerificationManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 时间筛选状态
  const [timeFilter, setTimeFilter] = React.useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [customDateRange, setCustomDateRange] = React.useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [tempDateRange, setTempDateRange] = React.useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  // 计算时间筛选的开始时间
  const getTimeFilterDates = () => {
    const now = new Date();
    let createdAfter: string | undefined;
    let createdBefore: string | undefined;
    
    switch (timeFilter) {
      case '7d':
        createdAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        createdAfter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        createdAfter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'custom':
        if (customDateRange.from) {
          createdAfter = customDateRange.from.toISOString();
        }
        if (customDateRange.to) {
          // 设置为当天结束时间
          const endOfDay = new Date(customDateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          createdBefore = endOfDay.toISOString();
        }
        break;
      case 'all':
      default:
        createdAfter = undefined;
        createdBefore = undefined;
        break;
    }
    
    return { createdAfter, createdBefore };
  };

  // 获取批处理任务列表
  const { data: batchTasks = [], isLoading } = useQuery({
    queryKey: ['verification-batches', timeFilter, customDateRange.from, customDateRange.to],
    queryFn: () => {
      const { createdAfter, createdBefore } = getTimeFilterDates();
      return verificationService.getBatchList({
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...( createdAfter && { createdAfter }),
        ...( createdBefore && { createdBefore })
      });
    },
    refetchInterval: 5000
  });

  // 计算统计数据
  const stats = React.useMemo(() => {
    const total = batchTasks.length;
    const inProgress = batchTasks.filter(task => 
      task.status === VERIFICATION_STATUS.PENDING || 
      task.status === VERIFICATION_STATUS.IN_PROGRESS
    ).length;
    const completed = batchTasks.filter(task => 
      task.status === VERIFICATION_STATUS.COMPLETED
    ).length;
    const failed = batchTasks.filter(task => 
      task.status === VERIFICATION_STATUS.FAILED ||
      task.status === VERIFICATION_STATUS.COMPLETED_WITH_ERRORS
    ).length;

    return { total, inProgress, completed, failed };
  }, [batchTasks]);

  const handleCreateVerification = () => {
    navigate('/verification/create');
  };

  const handleViewResults = () => {
    navigate('/verification/results');
  };

  const handleViewBatchStatus = (batchId: string) => {
    navigate(`/verification/batch/${batchId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case VERIFICATION_STATUS.PENDING:
        return <Badge variant="secondary">等待中</Badge>;
      case VERIFICATION_STATUS.IN_PROGRESS:
        return <Badge variant="default" className="bg-orange-500">进行中</Badge>;
      case VERIFICATION_STATUS.COMPLETED:
        return <Badge variant="default" className="bg-green-500">已完成</Badge>;
      case VERIFICATION_STATUS.COMPLETED_WITH_ERRORS:
        return <Badge variant="destructive">完成(有错误)</Badge>;
      case VERIFICATION_STATUS.FAILED:
        return <Badge variant="destructive">失败</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScopeDisplay = (scopeType: string, scopeValues?: string) => {
    switch (scopeType) {
      case 'all_users':
        return { icon: Users, text: '全员盘点' };
      case 'department_ids':
        const deptCount = scopeValues ? scopeValues.split(',').length : 0;
        return { icon: Building2, text: `按部门盘点 (${deptCount}个部门)` };
      case 'employee_ids':
        const empCount = scopeValues ? scopeValues.split(',').length : 0;
        return { icon: UserCheck, text: `按员工盘点 (${empCount}位员工)` };
      default:
        return { icon: AlertCircle, text: scopeType };
    }
  };

  const handleTimeFilterChange = (value: '7d' | '30d' | '90d' | 'all' | 'custom') => {
    setTimeFilter(value);
    if (value !== 'custom') {
      setCustomDateRange({});
      setTempDateRange({});
    }
  };

  const applyCustomDateRange = () => {
    setCustomDateRange(tempDateRange);
    if (timeFilter !== 'custom') {
      setTimeFilter('custom');
    }
    setIsDatePickerOpen(false);
  };

  const getCustomDateDisplay = () => {
    if (!customDateRange.from && !customDateRange.to) {
      return '选择日期范围';
    }
    
    const startStr = customDateRange.from 
      ? format(customDateRange.from, 'yyyy-MM-dd', { locale: zhCN })
      : '';
    const endStr = customDateRange.to 
      ? format(customDateRange.to, 'yyyy-MM-dd', { locale: zhCN })
      : '';
    
    if (startStr && endStr) {
      return `${startStr} 至 ${endStr}`;
    } else if (startStr) {
      return `从 ${startStr} 开始`;
    } else if (endStr) {
      return `到 ${endStr} 结束`;
    }
    
    return '选择日期范围';
  };

  const getTempDateDisplay = () => {
    if (!tempDateRange.from && !tempDateRange.to) {
      return '选择日期范围';
    }
    
    const startStr = tempDateRange.from 
      ? format(tempDateRange.from, 'yyyy-MM-dd', { locale: zhCN })
      : '';
    const endStr = tempDateRange.to 
      ? format(tempDateRange.to, 'yyyy-MM-dd', { locale: zhCN })
      : '';
    
    if (startStr && endStr) {
      return `${startStr} 至 ${endStr}`;
    } else if (startStr) {
      return `从 ${startStr} 开始`;
    } else if (endStr) {
      return `到 ${endStr} 结束`;
    }
    
    return '选择日期范围';
  };

  return (
    <MainLayout title="手机号码盘点管理">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              盘点流程发起和查看盘点结果
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">总任务数</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                历史总计
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">进行中</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                正在执行的任务
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">已完成</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                成功完成的任务
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">失败</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">
                执行失败的任务
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCreateVerification}>
            <CardContent className="flex flex-col items-center justify-center p-5">
              <div className="rounded-full bg-blue-100 p-2 mb-3">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold mb-2">发起新盘点</h3>
              <p className="text-sm text-muted-foreground text-center">
                创建新的手机号码使用确认任务
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewResults}>
            <CardContent className="flex flex-col items-center justify-center p-5">
              <div className="rounded-full bg-green-100 p-2 mb-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-base font-semibold mb-2">查看盘点结果</h3>
              <p className="text-sm text-muted-foreground text-center">
                查看已完成盘点的详细结果和统计
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 盘点任务历史 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <CardTitle className="text-base">盘点任务历史</CardTitle>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={timeFilter} onValueChange={(value: '7d' | '30d' | '90d' | 'all' | 'custom') => handleTimeFilterChange(value)}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue placeholder="选择时间" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">最近7天</SelectItem>
                      <SelectItem value="30d">最近30天</SelectItem>
                      <SelectItem value="90d">最近90天</SelectItem>
                      <SelectItem value="all">全部时间</SelectItem>
                      <SelectItem value="custom">自定义时间</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* 自定义日期范围选择器 - 始终显示 */}
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 px-2 text-xs min-w-16 max-w-none"
                        onClick={() => {
                          // 打开选择器时，初始化临时状态为当前值
                          setTempDateRange(customDateRange);
                          setIsDatePickerOpen(true);
                        }}
                      >
                        <CalendarDays className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>
                          {timeFilter === 'custom' && (customDateRange.from || customDateRange.to) 
                            ? getCustomDateDisplay()
                            : '自定义'
                          }
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="end">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-center border-b pb-1">
                          {tempDateRange.from || tempDateRange.to ? (
                            <span>选择: {getTempDateDisplay()}</span>
                          ) : (
                            <span>请选择日期范围</span>
                          )}
                        </div>
                        
                        {/* 单月日历范围选择 */}
                        <CalendarComponent
                          mode="range"
                          selected={tempDateRange as DateRange}
                          onSelect={(range: DateRange | undefined) => {
                            if (range) {
                              setTempDateRange({
                                from: range.from,
                                to: range.to
                              });
                            } else {
                              setTempDateRange({});
                            }
                          }}
                          locale={zhCN}
                          numberOfMonths={1}
                          className="rounded-md border p-1"
                          classNames={{
                            head_cell: "text-muted-foreground rounded-md w-8 font-normal text-xs",
                            cell: "h-8 w-8 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-8 w-8 p-0 font-normal text-xs aria-selected:opacity-100",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-xs font-medium",
                            nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                            table: "w-full border-collapse space-y-1",
                            row: "flex w-full mt-1"
                          }}
                        />
                        
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTempDateRange({});
                            }}
                            className="flex-1 h-6 text-xs px-1"
                          >
                            清空
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDatePickerOpen(false)}
                            className="flex-1 h-6 text-xs px-1"
                          >
                            取消
                          </Button>
                          <Button
                            size="sm"
                            onClick={applyCustomDateRange}
                            className="flex-1 h-6 text-xs px-1"
                            disabled={!tempDateRange.from}
                          >
                            应用
                          </Button>
                        </div>
                        
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
              </div>
            ) : batchTasks.length === 0 ? (
              <div className="text-center py-6">
                <div className="rounded-full bg-gray-100 w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  {timeFilter === 'all' ? (
                    <History className="h-7 w-7 text-gray-400" />
                  ) : (
                    <Calendar className="h-7 w-7 text-gray-400" />
                  )}
                </div>
                <h3 className="text-base font-medium mb-2">
                  {timeFilter === 'all' ? '暂无盘点任务' : '该时间段内暂无任务'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {timeFilter === 'all' 
                    ? '还没有创建过盘点任务，点击上方按钮开始第一次盘点' 
                    : timeFilter === '7d'
                    ? '最近7天内没有创建盘点任务，可以尝试查看更长的时间范围'
                    : timeFilter === '30d'
                    ? '最近30天内没有创建盘点任务，可以尝试查看更长的时间范围'
                    : timeFilter === '90d'
                    ? '最近90天内没有创建盘点任务，可以尝试查看全部时间'
                    : '自定义时间范围内没有创建盘点任务，可以尝试查看全部时间'
                  }
                </p>
                {timeFilter === 'all' ? (
                  <Button onClick={handleCreateVerification}>
                    <Plus className="h-4 w-4 mr-2" />
                    创建第一个盘点任务
                  </Button>
                ) : (
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => handleTimeFilterChange('all')}>
                      查看全部时间
                    </Button>
                    <Button onClick={handleCreateVerification}>
                      <Plus className="h-4 w-4 mr-2" />
                      创建新任务
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="space-y-2 pr-2" 
                  style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d1d5db #f3f4f6'
                  }}
                >
                  {batchTasks.map((task) => {
                    const scope = getScopeDisplay(task.requestedScopeType, task.requestedScopeValues);
                    const ScopeIcon = scope.icon;
                    
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <ScopeIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-sm truncate">{scope.text}</p>
                              {getStatusBadge(task.status)}
                            </div>
                            <div className="flex items-center space-x-3 mt-0.5">
                              <p className="text-xs text-muted-foreground">
                                {task.totalEmployeesToProcess}人
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {task.requestedDurationDays}天
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBatchStatus(task.id)}
                          className="ml-2 flex-shrink-0 text-xs px-2 py-1 h-7"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          详情
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {/* 滚动提示渐变 */}
                {batchTasks.length > 3 && (
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default VerificationManagement; 