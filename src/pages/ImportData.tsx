import React, { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { EmployeeImportForm } from "@/components/EmployeeImportForm";
import { EnhancedPhoneImportForm } from "@/components/EnhancedPhoneImportForm";
import { exportPhoneAssets } from "@/services/phoneService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { hasManagePermission, isSuperAdmin } from "@/utils/permissions";

const ImportData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPhoneAssets = async () => {
    try {
      setIsExporting(true);
      const blob = await exportPhoneAssets();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 生成文件名（包含当前日期）
      const now = new Date();
      const dateStr = now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0');
      link.download = `手机号码资产明细_${dateStr}.csv`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "导出成功",
        description: "手机号码资产明细已下载",
      });
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "导出手机号码资产明细时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 检查权限
  if (!hasManagePermission(user)) {
    return (
      <MainLayout title="数据导入">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              权限不足
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                只有具有管理权限的用户才能访问数据导入功能。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="数据导入">
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto mb-6">
          <TabsTrigger value="employees">员工导入</TabsTrigger>
          <TabsTrigger value="phones">号码导入</TabsTrigger>
          <TabsTrigger value="export" disabled={!isSuperAdmin(user)}>
            数据导出
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees">
          <EmployeeImportForm />
        </TabsContent>
        
        <TabsContent value="phones">
          <EnhancedPhoneImportForm />
        </TabsContent>
        
        <TabsContent value="export">
          {!isSuperAdmin(user) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  权限不足
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    数据导出功能仅对超级管理员开放。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">数据导出</h2>
                <p className="text-muted-foreground text-sm mt-2">导出系统中的数据明细，支持CSV格式文件下载</p>
              </div>
              
              <div className="flex justify-center">
                <Card className="relative overflow-hidden w-full max-w-md">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -translate-y-10 translate-x-10"></div>
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Download className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">手机号码资产明细</CardTitle>
                        <CardDescription className="text-sm">
                          完整的手机号码管理数据
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• 包含所有手机号码的详细信息</p>
                      <p>• 办卡人、使用人、状态等完整数据</p>
                    </div>
                    <div className="pt-2">
                      <Button 
                        onClick={handleExportPhoneAssets}
                        disabled={isExporting}
                        className="w-full"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            正在生成文件...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            立即导出
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default ImportData;
