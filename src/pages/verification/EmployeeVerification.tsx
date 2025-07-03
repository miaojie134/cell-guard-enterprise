import React, { useState, useEffect, useMemo } from 'react';
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
import PurposeSelector from '@/components/PurposeSelector';
import { createVerificationStore } from '@/stores/verificationStore';
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
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 报告号码有问题时，选择的问题类型
  const issueOptions = [
    { value: '封号/停机', label: '封号/停机' },
    { value: '丢失/遗失', label: '丢失/遗失' },
    { value: '号码已注销', label: '号码已注销' },
    { value: '其他', label: '其他' },
  ];

  // 使用Zustand store
  const useStore = useMemo(() => {
    if (!token) return null;
    return createVerificationStore(token);
  }, [token]);

  const store = useStore?.();
  const {
    verifiedNumbers,
    unlistedNumbers,
    setVerifiedNumbers,
    setUnlistedNumbers,
    updateVerifiedNumber,
    updateUnlistedNumber,
    addUnlistedNumber,
    removeUnlistedNumber,
    clearAll
  } = store || {
    verifiedNumbers: [],
    unlistedNumbers: [],
    setVerifiedNumbers: () => {},
    setUnlistedNumbers: () => {},
    updateVerifiedNumber: () => {},
    updateUnlistedNumber: () => {},
    addUnlistedNumber: () => {},
    removeUnlistedNumber: () => {},
    clearAll: () => {}
  };

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
      clearAll(); // 提交成功后清除数据
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
    if (employeeInfo?.phoneNumbers && Array.isArray(employeeInfo.phoneNumbers) && verifiedNumbers.length === 0) {
      const initialVerified = employeeInfo.phoneNumbers.map(phone => ({
        mobileNumberId: phone.id,
        action: VERIFICATION_ACTION.NOT_SELECTED,
        purpose: phone.purpose || '',
        userComment: phone.userComment || '',
      }));
      setVerifiedNumbers(initialVerified);
    }
  }, [employeeInfo, verifiedNumbers.length, setVerifiedNumbers]);

  // 表单验证
  const validateForm = (): boolean => {
    // 检查已确认号码
    for (const verified of verifiedNumbers) {
      if (verified.action === VERIFICATION_ACTION.NOT_SELECTED) {
        // 未选择状态
        toast({
          title: "表单验证失败",
          description: "请为所有号码选择使用状态（确认使用或报告问题）",
          variant: "destructive",
        });
        return false;
      } else if (verified.action === VERIFICATION_ACTION.CONFIRM_USAGE) {
        // 确认使用时需要填写用途说明
        if (!verified.purpose.trim()) {
          toast({
            title: "表单验证失败",
            description: "请填写确认使用号码的用途说明",
            variant: "destructive",
          });
          return false;
        }
      } else if (verified.action === VERIFICATION_ACTION.REPORT_ISSUE) {
        // 报告问题时需要选择问题类型
        if (!verified.userComment) {
          toast({
            title: "表单验证失败", 
            description: "请选择问题类型",
            variant: "destructive",
          });
          return false;
        }
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

    // 过滤掉未选择状态的号码，只提交已确认的号码
    const filteredVerifiedNumbers = verifiedNumbers.filter(
      verified => verified.action !== VERIFICATION_ACTION.NOT_SELECTED
    );

    const submitData: VerificationSubmitRequest = {
      verifiedNumbers: filteredVerifiedNumbers,
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
            {/* <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              完成
            </Button> */}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 头部信息 */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg font-medium text-gray-900">
              <User className="h-4 w-4 mr-2" />
              手机号码使用确认
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              请确认您当前使用的手机号码信息，如有问题请及时反馈
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-gray-700">
                <span className="font-medium text-gray-900">姓名：</span>
                <span className="ml-1">{employeeInfo.employeeName}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                <span className="font-medium text-gray-900">截止时间：</span>
                <span className="ml-1">
                  {new Date(employeeInfo.expiresAt).toLocaleDateString('zh-CN')} 23:59
                  <span className="text-xs text-gray-500 ml-1">（超时未确认的号码可能会停机）</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 号码列表 */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900">请确认以下号码的使用情况</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              请逐一确认每个号码的使用状态，并填写相关信息
            </CardDescription>
            {/* 简单的进度提示 */}
            {(() => {
              const totalNumbers = verifiedNumbers.length;
              const confirmedNumbers = verifiedNumbers.filter(v => v.action !== VERIFICATION_ACTION.NOT_SELECTED).length;
              
              if (totalNumbers > 0 && confirmedNumbers < totalNumbers) {
                return (
                  <div className="mt-2 text-xs text-gray-600">
                    已确认 {confirmedNumbers}/{totalNumbers} 个号码
                  </div>
                );
              }
              return null;
            })()}
          </CardHeader>
          <CardContent className="space-y-4">
            {(employeeInfo?.phoneNumbers || []).map((phone, index) => {
              const currentAction = verifiedNumbers[index]?.action;
              const isNotSelected = currentAction === VERIFICATION_ACTION.NOT_SELECTED;
              
              return (
                <div 
                  key={phone.id} 
                  className={`border rounded-lg p-4 ${
                    isNotSelected 
                      ? "border-orange-200 bg-orange-50/20" 
                      : "border-gray-200 bg-gray-50/30"
                  }`}
                >
                  {/* 号码标题区域 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                        <Phone className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{phone.phoneNumber}</div>
                        {phone.department && (
                          <Badge variant="secondary" className="text-xs mt-0.5 font-normal">
                            {phone.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isNotSelected && (
                        <span className="text-xs text-orange-600 font-medium">待确认</span>
                      )}
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded font-normal">
                        {index + 1}/{(employeeInfo?.phoneNumbers || []).length}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                    {/* 状态选择区域 */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">
                        使用状态 <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={currentAction === VERIFICATION_ACTION.CONFIRM_USAGE ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateVerifiedNumber(index, { 
                            action: VERIFICATION_ACTION.CONFIRM_USAGE,
                            userComment: ''
                          })}
                          className={`h-9 text-xs font-medium ${
                            currentAction === VERIFICATION_ACTION.CONFIRM_USAGE 
                              ? "bg-green-600 hover:bg-green-700 text-white" 
                              : ""
                          }`}
                        >
                          <CheckCircle className="h-3 w-3 mr-1.5" />
                          确认使用
                        </Button>
                        <Button
                          variant={currentAction === VERIFICATION_ACTION.REPORT_ISSUE ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => updateVerifiedNumber(index, { 
                            action: VERIFICATION_ACTION.REPORT_ISSUE,
                            purpose: ''
                          })}
                          className="h-9 text-xs font-medium"
                        >
                          <AlertCircle className="h-3 w-3 mr-1.5" />
                          报告问题
                        </Button>
                      </div>
                    </div>

                    {/* 用途说明 或 问题说明 */}
                    <div className="lg:col-span-2">
                      {currentAction === VERIFICATION_ACTION.NOT_SELECTED ? (
                        <div className="h-9 flex items-center text-xs text-orange-600 italic">
                          ← 请先选择使用状态
                        </div>
                      ) : currentAction === VERIFICATION_ACTION.REPORT_ISSUE ? (
                        <>
                          <Label className="text-xs font-medium text-red-700 mb-2 block">
                            问题说明 <span className="text-red-500">*</span>
                          </Label>
                          <PurposeSelector
                            value={verifiedNumbers[index]?.userComment || ''}
                            onValueChange={(value) => updateVerifiedNumber(index, { userComment: value })}
                            options={issueOptions}
                          />
                        </>
                      ) : (
                        <>
                          <Label className="text-xs font-medium text-gray-700 mb-2 block">
                            用途说明 <span className="text-red-500">*</span>
                          </Label>
                          <PurposeSelector
                            value={verifiedNumbers[index]?.purpose || ''}
                            onValueChange={(value) => updateVerifiedNumber(index, { purpose: value })}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 历史上报记录 */}
        {(employeeInfo?.previouslyReportedUnlisted || []).length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-gray-900">您之前上报的未列出号码</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(employeeInfo?.previouslyReportedUnlisted || []).map((phone, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-gray-500" />
                      <span className="font-medium text-sm text-gray-900">{phone.phoneNumber}</span>
                      <span className="text-sm text-gray-600">- {phone.purpose}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-normal">
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
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900">上报未列出的号码</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              如果您正在使用的号码未在上述列表中，请在此添加
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unlistedNumbers.map((phone, index) => (
                <div key={index} className="border border-gray-100 rounded-lg p-4 bg-gray-50/20">
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">
                          手机号码 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={phone.phoneNumber}
                          onChange={(e) => updateUnlistedNumber(index, { phoneNumber: e.target.value })}
                          placeholder="请输入11位手机号"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">
                          用途说明 <span className="text-red-500">*</span>
                        </Label>
                        <PurposeSelector
                          value={phone.purpose}
                          onValueChange={(value) => updateUnlistedNumber(index, { purpose: value })}
                        />
                      </div>
                    </div>
                    <div className="pt-7">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUnlistedNumber(index)}
                        className="h-9 px-3"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addUnlistedNumber}
                className="w-full h-10 mt-5 text-sm font-medium"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                添加号码
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <div className="flex flex-col items-center space-y-3">
          {(() => {
            const pendingCount = verifiedNumbers.filter(v => v.action === VERIFICATION_ACTION.NOT_SELECTED).length;
            const isDisabled = submitMutation.isPending || pendingCount > 0;
            
            return (
              <>
                {pendingCount > 0 && (
                  <div className="text-sm text-orange-600">
                    还有 {pendingCount} 个号码待确认
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={isDisabled}
                  size="lg"
                  className={`px-8 text-sm font-medium ${
                    isDisabled ? "opacity-60" : ""
                  }`}
                >
                  {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  提交确认结果
                </Button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default EmployeeVerification; 