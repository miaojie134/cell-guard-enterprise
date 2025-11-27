import React, { useState, useEffect } from "react";
import { useEmployeeAuth } from "@/context/EmployeeAuthContext"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebounce } from '@/hooks/useDebounce';
import { authService } from "@/services/authService";

const EmployeeLogin = () => {
  const [email, setEmail] = useState("");
  const [last4, setLast4] = useState("");
  const { employeeLogin, isEmployeeLoading } = useEmployeeAuth();
  const [phonePrefix, setPhonePrefix] = useState<string | null>(null);
  const [hintError, setHintError] = useState<string | null>(null);
  
  const [debouncedEmail] = useDebounce(email, 500);

  useEffect(() => {
    if (debouncedEmail && debouncedEmail.includes('@')) {
      setHintError(null);
      authService.getEmployeePhoneHint(debouncedEmail)
        .then(data => {
          if (data.exists) {
            setPhonePrefix(data.phonePrefix);
          } else {
            setPhonePrefix(null);
            setHintError('该邮箱未绑定手机号或不存在。');
          }
        })
        .catch(err => {
          setPhonePrefix(null);
          setHintError(err.message || '获取提示失败');
        });
    } else {
      setPhonePrefix(null);
      setHintError(null);
    }
  }, [debouncedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !last4) return;
    await employeeLogin({ email, last4 });
  };

  const hintText = hintError 
    ? <span className="text-red-500">{hintError}</span>
    : (phonePrefix ? `手机号前三位: ${phonePrefix}` : '请输入公司邮箱获取提示');

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
      {/* Background decor, slightly different colors */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-400/20 to-green-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <Card className="w-[400px] shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="https://kael.knowbox.cn/html/static/media/xiaohe-logo.c6f6c06b.png" 
                alt="logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">
              员工自助服务
            </CardTitle>
            <CardDescription>手机号资产盘点</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">公司邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入公司邮箱"
                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last4" className="text-gray-700 font-medium">绑定手机号后四位</Label>
                <Input
                  id="last4"
                  type="text"
                  maxLength={4}
                  pattern="\d{4}"
                  value={last4}
                  onChange={(e) => setLast4(e.target.value)}
                  placeholder="请输入4位数字密码"
                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  required
                />
                <p className="text-xs text-gray-500 pt-1 text-center h-4">{hintText}</p>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isEmployeeLoading}
              >
                {isEmployeeLoading ? "登录中..." : "登录"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-center text-gray-500 pb-6">
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeLogin;
