import React, { useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  Search, 
  Phone, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { verificationService } from '@/services/verificationService';

const VerificationResults: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    employee_id: '',
    department_id: '',
  });

  // 获取盘点结果
  const { data: results, isLoading, error, refetch } = useQuery({
    queryKey: ['verification', 'results', filters],
    queryFn: () => verificationService.getResults(filters),
    refetchOnWindowFocus: false,
  });

  // 手动刷新
  const handleRefresh = () => {
    refetch();
  };

  // 搜索过滤
  const handleSearch = () => {
    refetch();
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({ employee_id: '', department_id: '' });
  };

  return (
    <MainLayout title="盘点结果统计">
      <div className="space-y-4">
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
              {/* <h2 className="text-2xl font-bold">查看手机号码使用确认的详细结果</h2> */}
            <p className="text-muted-foreground text-sm">查看手机号码使用确认的详细结果</p>
            </div>
            {/* <p className="text-muted-foreground">查看手机号码使用确认的详细结果</p> */}
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">正在加载盘点结果...</p>
              </div>
            </CardContent>
          </Card>
        ) : error || !results ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-red-600 text-lg">
                <AlertTriangle className="h-4 w-4 mr-2" />
                加载失败
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                {error instanceof Error ? error.message : '无法获取盘点结果'}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                重试
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 统计摘要 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center">
                    <Phone className="h-6 w-6 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">总号码数</p>
                      <p className="text-xl font-bold">{results.summary?.totalPhonesCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">已确认</p>
                      <p className="text-xl font-bold">{results.summary?.confirmedPhonesCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">有问题</p>
                      <p className="text-xl font-bold">{results.summary?.reportedIssuesCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">待确认</p>
                      <p className="text-xl font-bold">{results.summary?.pendingPhonesCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">新上报</p>
                      <p className="text-xl font-bold">{results.summary?.newlyReportedPhonesCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 筛选区 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Search className="h-4 w-4 mr-2" />
                  筛选条件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">员工工号</Label>
                    <Input
                      value={filters.employee_id}
                      onChange={(e) => setFilters(prev => ({ ...prev, employee_id: e.target.value }))}
                      placeholder="输入员工工号"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">部门ID</Label>
                    <Input
                      value={filters.department_id}
                      onChange={(e) => setFilters(prev => ({ ...prev, department_id: e.target.value }))}
                      placeholder="输入部门ID"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <Button onClick={handleSearch} className="flex-1" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      搜索
                    </Button>
                    <Button onClick={handleReset} variant="outline" size="sm">
                      重置
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 详细数据表格 */}
            <Tabs defaultValue="confirmed" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9">
                <TabsTrigger value="confirmed" className="text-xs">已确认号码 ({results.summary?.confirmedPhonesCount || 0})</TabsTrigger>
                <TabsTrigger value="issues" className="text-xs">问题报告 ({results.summary?.reportedIssuesCount || 0})</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">待确认用户 ({results.pendingUsers?.length || 0})</TabsTrigger>
                <TabsTrigger value="unlisted" className="text-xs">新上报号码 ({results.summary?.newlyReportedPhonesCount || 0})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="confirmed" className="mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">已确认号码列表</CardTitle>
                    <CardDescription className="text-sm">员工已确认正在使用的手机号码</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">手机号码</TableHead>
                          <TableHead className="text-xs">部门</TableHead>
                          <TableHead className="text-xs">当前用户</TableHead>
                          <TableHead className="text-xs">用途</TableHead>
                          <TableHead className="text-xs">确认人</TableHead>
                          <TableHead className="text-xs">确认时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(results.confirmedPhones || []).map((phone) => (
                          <TableRow key={phone.id}>
                            <TableCell className="font-medium text-sm">{phone.phoneNumber}</TableCell>
                            <TableCell className="text-sm">{phone.department}</TableCell>
                            <TableCell className="text-sm">{phone.currentUser}</TableCell>
                            <TableCell className="text-sm">{phone.purpose}</TableCell>
                            <TableCell className="text-sm">{phone.confirmedBy}</TableCell>
                            <TableCell className="text-sm">{new Date(phone.confirmedAt).toLocaleString('zh-CN')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {(results.confirmedPhones || []).length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm">暂无已确认号码</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="issues" className="mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">问题报告列表</CardTitle>
                    <CardDescription className="text-sm">员工报告的号码使用问题</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">手机号码</TableHead>
                          <TableHead className="text-xs">报告人</TableHead>
                          <TableHead className="text-xs">问题描述</TableHead>
                          <TableHead className="text-xs">用途说明</TableHead>
                          <TableHead className="text-xs">原状态</TableHead>
                          <TableHead className="text-xs">处理状态</TableHead>
                          <TableHead className="text-xs">报告时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(results.reportedIssues || []).map((issue) => (
                          <TableRow key={issue.issueId}>
                            <TableCell className="font-medium text-sm">{issue.phoneNumber}</TableCell>
                            <TableCell className="text-sm">{issue.reportedBy}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm">{issue.comment}</TableCell>
                            <TableCell className="text-sm">{issue.purpose}</TableCell>
                            <TableCell className="text-sm">{issue.originalStatus}</TableCell>
                            <TableCell>
                              <Badge variant={issue.adminActionStatus === '待处理' ? 'destructive' : 'default'} className="text-xs">
                                {issue.adminActionStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{new Date(issue.reportedAt).toLocaleString('zh-CN')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {(results.reportedIssues || []).length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm">暂无问题报告</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pending" className="mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">待确认用户列表</CardTitle>
                    <CardDescription className="text-sm">尚未提交确认结果的员工</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">员工工号</TableHead>
                          <TableHead className="text-xs">员工姓名</TableHead>
                          <TableHead className="text-xs">邮箱地址</TableHead>
                          <TableHead className="text-xs">令牌状态</TableHead>
                          <TableHead className="text-xs">截止时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(results.pendingUsers || []).map((user) => (
                          <TableRow key={user.employeeId}>
                            <TableCell className="font-medium text-sm">{user.employeeId}</TableCell>
                            <TableCell className="text-sm">{user.fullName}</TableCell>
                            <TableCell className="text-sm">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={new Date(user.expiresAt) > new Date() ? 'default' : 'destructive'} className="text-xs">
                                {new Date(user.expiresAt) > new Date() ? '有效' : '已过期'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(user.expiresAt).toLocaleDateString('zh-CN')} 23:59
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {(results.pendingUsers || []).length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm">暂无待确认用户</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="unlisted" className="mt-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">新上报号码列表</CardTitle>
                    <CardDescription className="text-sm">员工上报的未在系统中列出的号码</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">手机号码</TableHead>
                          <TableHead className="text-xs">用途说明</TableHead>
                          <TableHead className="text-xs">备注</TableHead>
                          <TableHead className="text-xs">上报时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(results.unlistedNumbers || []).map((phone, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-sm">{phone.phoneNumber}</TableCell>
                            <TableCell className="text-sm">{phone.purpose}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm">{phone.userComment || '-'}</TableCell>
                            <TableCell className="text-sm">
                              {phone.reportedAt ? new Date(phone.reportedAt).toLocaleString('zh-CN') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {(results.unlistedNumbers || []).length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-sm">暂无新上报号码</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default VerificationResults; 