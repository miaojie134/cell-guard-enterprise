import React, { useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getPhoneNumbers } from '@/services/phoneService';
import { Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const TestAPI = () => {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await getPhoneNumbers({ page: 1, limit: 10 });
      setResult(response);
      toast({
        title: '成功',
        description: 'API调用成功',
      });
    } catch (error: any) {
      console.error('API调用失败:', error);
      setResult({ error: error.message });
      toast({
        title: '错误',
        description: `API调用失败: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout title="API测试">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              需要登录
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>您需要先登录才能测试API。</p>
            <Link to="/login">
              <Button>前往登录</Button>
            </Link>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="API测试">
      <Card>
        <CardHeader>
          <CardTitle>手机号码API测试</CardTitle>
          <p className="text-sm text-muted-foreground">
            当前用户: {user?.username} | Token: {localStorage.getItem('token') ? '已设置' : '未设置'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAPI} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                测试中...
              </>
            ) : (
              '测试API调用'
            )}
          </Button>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">API响应结果:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default TestAPI; 