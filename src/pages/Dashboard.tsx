
import React, { useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { sampleEmployees, samplePhoneNumbers } from "@/data/sampleData";

const Dashboard = () => {
  const { phoneNumbers, employees, getRiskPhones } = useData();
  
  // Calculate statistics
  const stats = {
    totalPhones: phoneNumbers.length,
    activePhones: phoneNumbers.filter(p => p.status === "active").length,
    inactivePhones: phoneNumbers.filter(p => p.status === "inactive").length,
    riskPhones: getRiskPhones().length,
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.status === "active").length,
    inactiveEmployees: employees.filter(e => e.status === "inactive").length,
  };
  
  // Recent phones (top 5)
  const recentPhones = [...phoneNumbers]
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
    .slice(0, 5);
  
  // Risk phones (top 5)
  const riskPhones = getRiskPhones().slice(0, 5);

  useEffect(() => {
  
  }, [phoneNumbers, employees]);

  return (
    <MainLayout title="仪表盘">
      <div className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Phone className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">手机号码总数</p>
                <p className="text-xl font-bold">{stats.totalPhones}</p>
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
                <p className="text-xl font-bold">{stats.activePhones}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="rounded-full bg-orange-100 p-2">
                <User className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">在职员工</p>
                <p className="text-xl font-bold">{stats.activeEmployees}</p>
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
                <p className="text-xl font-bold">{stats.riskPhones}</p>
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
                  {recentPhones.map((phone) => (
                    <tr key={phone.id}>
                      <td>{phone.number}</td>
                      <td>{phone.registrant}</td>
                      <td>{phone.currentUser || "-"}</td>
                      <td><StatusBadge status={phone.status} /></td>
                      <td>{phone.registrationDate}</td>
                    </tr>
                  ))}
                  {recentPhones.length === 0 && (
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
        {riskPhones.length > 0 && (
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
                    {riskPhones.map((phone) => (
                      <tr key={phone.id}>
                        <td>{phone.number}</td>
                        <td>{phone.registrant}</td>
                        <td><StatusBadge status="inactive" text="已离职" /></td>
                        <td>{phone.currentUser || "-"}</td>
                        <td><StatusBadge status={phone.status} /></td>
                      </tr>
                    ))}
                    {riskPhones.length === 0 && (
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
