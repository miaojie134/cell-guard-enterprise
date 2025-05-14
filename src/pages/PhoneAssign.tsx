
import React, { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useData } from "@/context/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

const PhoneAssign = () => {
  const { phoneNumbers, employees, assignPhone, recoverPhone } = useData();
  
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  
  // Filter available phones (inactive status)
  const availablePhones = phoneNumbers.filter(phone => phone.status === "inactive");
  
  // Filter phones in use
  const phonesInUse = phoneNumbers.filter(phone => phone.status === "active");
  
  // Filter active employees
  const activeEmployees = employees.filter(emp => emp.status === "active");
  
  // Selected phone and employee objects
  const selectedPhone = phoneNumbers.find(phone => phone.id === selectedPhoneId);
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  
  // Handle assignment
  const handleAssignPhone = () => {
    if (selectedPhoneId && selectedEmployeeId) {
      assignPhone(selectedPhoneId, selectedEmployeeId);
      setSelectedPhoneId("");
      setSelectedEmployeeId("");
    }
  };
  
  // Handle recovery
  const handleRecoverPhone = (phoneId: string) => {
    recoverPhone(phoneId);
  };
  
  return (
    <MainLayout title="号码分配与回收">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assign Phone Card */}
        <Card>
          <CardHeader>
            <CardTitle>分配号码</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">选择闲置号码</label>
              <Select
                value={selectedPhoneId}
                onValueChange={setSelectedPhoneId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择一个闲置号码" />
                </SelectTrigger>
                <SelectContent>
                  {availablePhones.length > 0 ? (
                    availablePhones.map(phone => (
                      <SelectItem key={phone.id} value={phone.id}>
                        {phone.number} ({phone.provider})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      无可用闲置号码
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedPhoneId && (
              <div className="p-2 bg-muted rounded-md text-sm">
                <p><span className="font-medium">号码:</span> {selectedPhone?.number}</p>
                <p><span className="font-medium">供应商:</span> {selectedPhone?.provider}</p>
                <p><span className="font-medium">办卡人:</span> {selectedPhone?.registrant}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">选择分配的员工</label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择一个员工" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeId} - {employee.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedEmployeeId && (
              <div className="p-2 bg-muted rounded-md text-sm">
                <p><span className="font-medium">员工工号:</span> {selectedEmployee?.employeeId}</p>
                <p><span className="font-medium">员工姓名:</span> {selectedEmployee?.name}</p>
                <p><span className="font-medium">所属部门:</span> {selectedEmployee?.department}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleAssignPhone} 
              disabled={!selectedPhoneId || !selectedEmployeeId}
            >
              分配号码
            </Button>
          </CardFooter>
        </Card>
        
        {/* Recover Phone Card */}
        <Card>
          <CardHeader>
            <CardTitle>回收号码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto max-h-96">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>号码</th>
                    <th>当前使用人</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {phonesInUse.map(phone => (
                    <tr key={phone.id}>
                      <td>{phone.number}</td>
                      <td>{phone.currentUser}</td>
                      <td><StatusBadge status={phone.status} /></td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRecoverPhone(phone.id)}
                        >
                          回收
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {phonesInUse.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        当前没有在用的号码
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PhoneAssign;
