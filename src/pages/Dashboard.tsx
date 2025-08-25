
import React from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { 
  getStatusVariant,
  getStatusText,
  getApplicantStatusVariant,
  getApplicantStatusText
} from "@/utils/phoneUtils";

const Dashboard = () => {
  const { 
    dashboardData, 
    isLoading, 
    error,
    stats,
    recentNumbers,
    riskNumbers
  } = useDashboard();

  // 加载状态处理
  if (isLoading) {
    return (
      <MainLayout title="仪表盘">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      </MainLayout>
    );
  }

  // 错误状态处理
  if (error) {
    return (
      <MainLayout title="仪表盘">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">加载仪表盘数据失败</p>
            <Button onClick={() => window.location.reload()}>重试</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="仪表盘">
      <div className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Phone className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">手机号码总数</p>
                <p className="text-xl font-bold">{stats?.totalPhones || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">在用号码</p>
                <p className="text-xl font-bold">{stats?.activePhones || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">风险号码</p>
                <p className="text-xl font-bold">{stats?.riskPhones || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent phones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">最近登记的号码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>号码</th>
                    <th>办卡人</th>
                    <th>使用人</th>
                    <th>状态</th>
                    <th>办卡日期</th>
                  </tr>
                </thead>
                <tbody>
                  {recentNumbers.map((phone, index) => (
                    <tr key={`${phone.phoneNumber}-${index}`}>
                      <td>{phone.phoneNumber}</td>
                      <td>{phone.applicantName}</td>
                      <td>{phone.currentUserName || "-"}</td>
                      <td><StatusBadge status={getStatusVariant(phone.status)} text={getStatusText(phone.status)} /></td>
                      <td>{phone.applicationDate}</td>
                    </tr>
                  ))}
                  {recentNumbers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Risk phones */}
        {riskNumbers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                风险号码警示
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>号码</th>
                      <th>办卡人</th>
                      <th>办卡人状态</th>
                      <th>使用人</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskNumbers.map((phone, index) => (
                      <tr key={`risk-${phone.phoneNumber}-${index}`}>
                        <td>{phone.phoneNumber}</td>
                        <td>{phone.applicantName}</td>
                        <td><StatusBadge status={getApplicantStatusVariant(phone.applicantStatus)} text={getApplicantStatusText(phone.applicantStatus)} /></td>
                        <td>{phone.currentUserName || "-"}</td>
                        <td><StatusBadge status={getStatusVariant(phone.status)} text={getStatusText(phone.status)} /></td>
                      </tr>
                    ))}
                    {riskNumbers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          暂无风险号码
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-right">
                <Link to="/risk">
                  <Button variant="outline" size="sm" className="text-xs">
                    查看全部风险号码
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
