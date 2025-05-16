
import React, { useEffect } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { sampleEmployees, samplePhoneNumbers } from "@/data/sampleData";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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
    console.log("Dashboard data:", { phoneNumbers, employees });
  }, [phoneNumbers, employees]);

  return (
    <MainLayout title="仪表盘">
      <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Phone className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">手机号码总数</p>
                <p className="text-2xl font-bold">{stats.totalPhones}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">在用号码</p>
                <p className="text-2xl font-bold">{stats.activePhones}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="rounded-full bg-orange-100 p-3">
                <User className="h-6 w-6 text-orange-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">在职员工</p>
                <p className="text-2xl font-bold">{stats.activeEmployees}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">风险号码</p>
                <p className="text-2xl font-bold">{stats.riskPhones}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent phones */}
        <Card>
          <CardHeader>
            <CardTitle>最近登记的号码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>号码</TableHead>
                    <TableHead>办卡人</TableHead>
                    <TableHead>使用人</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>办卡日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPhones.map((phone) => (
                    <TableRow key={phone.id}>
                      <TableCell>{phone.number}</TableCell>
                      <TableCell>{phone.registrant}</TableCell>
                      <TableCell>{phone.currentUser || "-"}</TableCell>
                      <TableCell><StatusBadge status={phone.status} /></TableCell>
                      <TableCell>{phone.registrationDate}</TableCell>
                    </TableRow>
                  ))}
                  {recentPhones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Risk phones */}
        {riskPhones.length > 0 && (
          <Card>
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="text-red-700 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                风险号码警示
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>号码</TableHead>
                      <TableHead>办卡人</TableHead>
                      <TableHead>办卡人状态</TableHead>
                      <TableHead>使用人</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskPhones.map((phone) => (
                      <TableRow key={phone.id}>
                        <TableCell>{phone.number}</TableCell>
                        <TableCell>{phone.registrant}</TableCell>
                        <TableCell><StatusBadge status="inactive" text="已离职" /></TableCell>
                        <TableCell>{phone.currentUser || "-"}</TableCell>
                        <TableCell><StatusBadge status={phone.status} /></TableCell>
                      </TableRow>
                    ))}
                    {riskPhones.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          暂无风险号码
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-right">
                <Link to="/risk">
                  <Button variant="outline" size="sm">
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
