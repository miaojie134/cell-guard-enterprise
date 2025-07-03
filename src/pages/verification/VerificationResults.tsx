import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verificationService } from '@/services/verificationService';
import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Phone, User, Users, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PendingPhonesDialog } from './components/PendingPhonesDialog';
import { PendingUser } from '@/types';

const PENDING_PHONE_DISPLAY_LIMIT = 5;

const VerificationResults: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['verification', 'results', batchId],
    queryFn: () => {
      if (!batchId) throw new Error('缺少批处理ID');
      return verificationService.getResults(batchId);
    },
    enabled: !!batchId,
  });

  if (isLoading) {
    return <MainLayout title="盘点结果"><div className="text-center p-6">加载中...</div></MainLayout>;
  }

  if (error) {
    return <MainLayout title="盘点结果"><div className="text-center p-6 text-red-500">加载失败: {error.message}</div></MainLayout>;
  }

  if (!results) {
    return <MainLayout title="盘点结果"><div className="text-center p-6">没有找到盘点结果</div></MainLayout>;
  }

  return (
    <MainLayout title={`盘点结果 (批次: ${batchId})`}>
      <div className="space-y-4">
        {/* 页面头部导航 */}
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>
        
        {/* 页面摘要 */}
        <Card>
          <CardHeader>
            <CardTitle>盘点结果摘要</CardTitle>
            <CardDescription>
              本次盘点任务的总体结果概览
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <User className="h-6 w-6 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-xs font-medium text-gray-600">新上报</p>
                      <p className="text-xl font-bold">{results.summary?.newlyReportedPhonesCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* 详细结果Tabs */}
        <div className="w-full">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-9">
              <TabsTrigger value="pending" className="text-xs">待确认用户 ({results.pendingUsers?.length || 0})</TabsTrigger>
              <TabsTrigger value="confirmed" className="text-xs">已确认号码 ({results.summary?.confirmedPhonesCount || 0})</TabsTrigger>
              <TabsTrigger value="issues" className="text-xs">问题报告 ({results.summary?.reportedIssuesCount || 0})</TabsTrigger>
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
                  <CardDescription className="text-sm">员工报告存在问题的手机号码</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">手机号码</TableHead>
                        <TableHead className="text-xs">报告人</TableHead>
                        <TableHead className="text-xs">问题描述</TableHead>
                        <TableHead className="text-xs">报告时间</TableHead>
                        <TableHead className="text-xs">处理状态</TableHead>
                        <TableHead className="text-xs">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(results.reportedIssues || []).map((issue) => (
                        <TableRow key={issue.issueId}>
                          <TableCell className="font-medium text-sm">{issue.phoneNumber}</TableCell>
                          <TableCell className="text-sm">{issue.reportedBy}</TableCell>
                          <TableCell className="text-sm">{issue.comment}</TableCell>
                          <TableCell className="text-sm">{new Date(issue.reportedAt).toLocaleString('zh-CN')}</TableCell>
                          <TableCell>
                            <Badge variant={issue.adminActionStatus === 'pending' ? 'destructive' : 'default'}>
                              {issue.adminActionStatus === 'pending' ? '待处理' : '已处理'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">处理</Button>
                          </TableCell>
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
                  <CardDescription className="text-sm">尚未完成确认的员工及其需要确认的号码</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">员工信息</TableHead>
                        <TableHead className="text-xs">待确认号码</TableHead>
                        <TableHead className="text-xs">链接过期时间</TableHead>
                        <TableHead className="text-xs">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(results.pendingUsers || []).map((user) => (
                        <TableRow key={user.employeeId}>
                          <TableCell>
                            <div className="font-medium text-sm">{user.fullName}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </TableCell>
                          <TableCell>
                            <div 
                              className="flex flex-wrap items-center gap-1 cursor-pointer"
                              onClick={() => setSelectedUser(user)}
                            >
                              {user.pendingPhones?.slice(0, PENDING_PHONE_DISPLAY_LIMIT).map(phone => (
                                <Badge key={phone.id} variant="outline">{phone.phoneNumber}</Badge>
                              ))}
                              {user.pendingPhones && user.pendingPhones.length > PENDING_PHONE_DISPLAY_LIMIT && (
                                <Badge variant="default">
                                  +{user.pendingPhones.length - PENDING_PHONE_DISPLAY_LIMIT}
                                </Badge>
                              )}
                              {(!user.pendingPhones || user.pendingPhones.length === 0) && (
                                <span className="text-xs text-gray-500">无号码信息</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{new Date(user.expiresAt).toLocaleString('zh-CN')}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">提醒</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(results.pendingUsers || []).length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-sm">所有用户均已确认</div>
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
        </div>
      </div>
      <PendingPhonesDialog 
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </MainLayout>
  );
};

export default VerificationResults; 