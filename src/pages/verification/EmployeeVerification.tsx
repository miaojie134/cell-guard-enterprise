import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Plus, Trash2, Phone, Clock, User } from 'lucide-react';
import { verificationService } from '@/services/verificationService';
import { 
  VerificationEmployeeInfo, 
  VerificationSubmitRequest, 
  VerifiedNumber,
  UnlistedPhone,
  VERIFICATION_ACTION,
  PHONE_VERIFICATION_STATUS
} from '@/types';
import { toast } from '@/hooks/use-toast';

const EmployeeVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [verifiedNumbers, setVerifiedNumbers] = useState<VerifiedNumber[]>([]);
  const [unlistedNumbers, setUnlistedNumbers] = useState<UnlistedPhone[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 获取员工确认信息
  const { data: employeeInfo, isLoading, error } = useQuery({
    queryKey: ['verification', 'employee', token],
    queryFn: () => {
      if (!token) throw new Error('缺少验证令牌');
      return verificationService.getEmployeeInfo(token);
    },
    enabled: !!token,
    retry: false,
  });

  // 提交确认结果
  const submitMutation = useMutation({
    mutationFn: (data: VerificationSubmitRequest) => {
      if (!token) throw new Error('缺少验证令牌');
      return verificationService.submitVerification(token, data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "提交成功",
        description: "您的反馈已成功提交，感谢您的配合！",
      });
    },
    onError: (error) => {
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交失败，请稍后重试",
        variant: "destructive",
      });
    },
  });

  // 初始化已确认号码列表
  useEffect(() => {
    if (employeeInfo?.phoneNumbers) {
      const initialVerified = employeeInfo.phoneNumbers.map(phone => ({
        mobileNumberId: phone.id,
        action: phone.status === PHONE_VERIFICATION_STATUS.CONFIRMED 
          ? VERIFICATION_ACTION.CONFIRM_USAGE 
          : phone.status === PHONE_VERIFICATION_STATUS.REPORTED
            ? VERIFICATION_ACTION.REPORT_ISSUE
            : VERIFICATION_ACTION.CONFIRM_USAGE,
        purpose: phone.purpose,
        userComment: phone.userComment || '',
      }));
      setVerifiedNumbers(initialVerified);
    }
  }, [employeeInfo]);

  // 更新号码确认状态
  const updateVerifiedNumber = (index: number, updates: Partial<VerifiedNumber>) => {
    setVerifiedNumbers(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  // 添加未列出号码
  const addUnlistedNumber = () => {
    setUnlistedNumbers(prev => [...prev, {
      phoneNumber: '',
      purpose: '',
      userComment: '',
    }]);
  };

  // 删除未列出号码
  const removeUnlistedNumber = (index: number) => {
    setUnlistedNumbers(prev => prev.filter((_, i) => i !== index));
  };

  // 更新未列出号码
  const updateUnlistedNumber = (index: number, updates: Partial<UnlistedPhone>) => {
    setUnlistedNumbers(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  // 表单验证
  const validateForm = (): boolean => {
    // 检查已确认号码
    for (const verified of verifiedNumbers) {
      if (!verified.purpose.trim()) {
        toast({
          title: "表单验证失败",
          description: "请填写所有号码的用途",
          variant: "destructive",
        });
        return false;
      }
      if (verified.action === VERIFICATION_ACTION.REPORT_ISSUE && !verified.userComment?.trim()) {
        toast({
          title: "表单验证失败", 
          description: "报告问题时必须填写备注说明",
          variant: "destructive",
        });
        return false;
      }
    }

    // 检查未列出号码
    for (const unlisted of unlistedNumbers) {
      if (!unlisted.phoneNumber.trim() || !unlisted.purpose.trim()) {
        toast({
          title: "表单验证失败",
          description: "请完整填写新增号码的信息",
          variant: "destructive",
        });
        return false;
      }
      if (!/^1[3-9]\d{9}$/.test(unlisted.phoneNumber)) {
        toast({
          title: "表单验证失败",
          description: "请输入正确的手机号码格式",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  // 提交表单
  const handleSubmit = () => {
    if (!validateForm()) return;

    const submitData: VerificationSubmitRequest = {
      verifiedNumbers,
      unlistedNumbersReported: unlistedNumbers,
    };

    submitMutation.mutate(submitData);
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在加载确认信息...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !employeeInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              访问失败
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : '无法获取确认信息，请检查链接是否有效或已过期'}
            </p>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已提交状态
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              提交成功
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              您的反馈已成功提交，感谢您的配合！
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              完成
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 头部信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              手机号码使用确认
            </CardTitle>
            <CardDescription>
              请确认您当前使用的手机号码信息，如有问题请及时反馈
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">员工姓名：</span>
                {employeeInfo.employeeName}
              </div>
              <div>
                <span className="font-medium">员工工号：</span>
                {employeeInfo.employeeId}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span className="font-medium">截止时间：</span>
                {new Date(employeeInfo.expiresAt).toLocaleString('zh-CN')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 号码列表 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>请确认以下号码的使用情况</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employeeInfo.phoneNumbers.map((phone, index) => (
              <div key={phone.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{phone.phoneNumber}</span>
                    <Badge variant="outline">{phone.department}</Badge>
                  </div>
                  <Badge variant={
                    verifiedNumbers[index]?.action === VERIFICATION_ACTION.CONFIRM_USAGE 
                      ? "default" : "destructive"
                  }>
                    {verifiedNumbers[index]?.action === VERIFICATION_ACTION.CONFIRM_USAGE 
                      ? "确认使用" : "报告问题"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>使用状态</Label>
                    <div className="flex space-x-2 mt-1">
                      <Button
                        variant={verifiedNumbers[index]?.action === VERIFICATION_ACTION.CONFIRM_USAGE ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateVerifiedNumber(index, { 
                          action: VERIFICATION_ACTION.CONFIRM_USAGE,
                          userComment: ''
                        })}
                      >
                        确认使用
                      </Button>
                      <Button
                        variant={verifiedNumbers[index]?.action === VERIFICATION_ACTION.REPORT_ISSUE ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => updateVerifiedNumber(index, { 
                          action: VERIFICATION_ACTION.REPORT_ISSUE 
                        })}
                      >
                        报告问题
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>用途说明 *</Label>
                    <Input
                      value={verifiedNumbers[index]?.purpose || ''}
                      onChange={(e) => updateVerifiedNumber(index, { purpose: e.target.value })}
                      placeholder="请输入号码用途"
                      className="mt-1"
                    />
                  </div>
                </div>

                {verifiedNumbers[index]?.action === VERIFICATION_ACTION.REPORT_ISSUE && (
                  <div>
                    <Label>问题说明 *</Label>
                    <Textarea
                      value={verifiedNumbers[index]?.userComment || ''}
                      onChange={(e) => updateVerifiedNumber(index, { userComment: e.target.value })}
                      placeholder="请详细说明遇到的问题"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 历史上报记录 */}
        {employeeInfo.previouslyReportedUnlisted.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>您之前上报的未列出号码</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employeeInfo.previouslyReportedUnlisted.map((phone, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">{phone.phoneNumber}</span>
                      <span className="text-gray-600">- {phone.purpose}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {phone.reportedAt ? new Date(phone.reportedAt).toLocaleDateString('zh-CN') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 新增未列出号码 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>上报未列出的号码</CardTitle>
            <CardDescription>
              如果您正在使用的号码未在上述列表中，请在此添加
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unlistedNumbers.map((phone, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>手机号码 *</Label>
                      <Input
                        value={phone.phoneNumber}
                        onChange={(e) => updateUnlistedNumber(index, { phoneNumber: e.target.value })}
                        placeholder="请输入11位手机号"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>用途说明 *</Label>
                      <Input
                        value={phone.purpose}
                        onChange={(e) => updateUnlistedNumber(index, { purpose: e.target.value })}
                        placeholder="请输入号码用途"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUnlistedNumber(index)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>备注说明</Label>
                    <Textarea
                      value={phone.userComment || ''}
                      onChange={(e) => updateUnlistedNumber(index, { userComment: e.target.value })}
                      placeholder="请说明获得此号码的原因或使用情况"
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addUnlistedNumber}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加号码
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            size="lg"
            className="px-8"
          >
            {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            提交确认结果
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeVerification; 