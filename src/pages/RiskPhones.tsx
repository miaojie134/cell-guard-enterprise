
import React, { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Edit } from "lucide-react";
import { PhoneNumber } from "@/types";

const RiskPhones = () => {
  const { getRiskPhones, updatePhone } = useData();
  
  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentPhoneId, setCurrentPhoneId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PhoneNumber>>({
    status: "active",
    notes: "",
  });
  
  // Get risk phone data
  const riskPhones = getRiskPhones();
  const total = riskPhones.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginatedPhones = riskPhones.slice((page - 1) * pageSize, page * pageSize);
  const currentPhone = currentPhoneId ? riskPhones.find(phone => phone.id === currentPhoneId) : null;

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  // Form handlers
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Dialog handlers
  const openEditDialog = (id: string) => {
    const phone = riskPhones.find(p => p.id === id);
    if (phone) {
      setCurrentPhoneId(id);
      setFormData({
        status: phone.status,
        notes: phone.notes,
      });
      setShowEditDialog(true);
    }
  };

  // Submit handlers
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPhoneId) {
      updatePhone(currentPhoneId, {
        status: formData.status as "active" | "inactive" | "pending" | "cancelled",
        notes: formData.notes,
      });
      setShowEditDialog(false);
    }
  };

  return (
    <MainLayout title="风险号码">
      <Card className="border-red-200">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <CardTitle className="text-red-700">风险号码管理</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground mb-4">
            以下号码的办卡人已经离职，请尽快处理这些号码，可以将其进行回收、转移或注销。
          </p>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>号码</th>
                  <th>办卡人</th>
                  <th>办卡人状态</th>
                  <th>当前使用人</th>
                  <th>状态</th>
                  <th>供应商</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPhones.map((phone) => (
                  <tr key={phone.id}>
                    <td>{phone.number}</td>
                    <td>{phone.registrant}</td>
                    <td><StatusBadge status="inactive" text="已离职" /></td>
                    <td>{phone.currentUser || "-"}</td>
                    <td><StatusBadge status={phone.status} /></td>
                    <td>{phone.provider}</td>
                    <td>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(phone.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {paginatedPhones.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      恭喜，没有发现风险号码
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {paginatedPhones.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              totalItems={total}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Edit Phone Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>处理风险号码</DialogTitle>
            <DialogDescription>
              请选择如何处理此风险号码
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-2">
              {currentPhone && (
                <div className="space-y-2">
                  <Label>手机号码信息</Label>
                  <div className="p-2 bg-muted rounded-md space-y-1 text-sm">
                    <p><span className="font-medium">号码:</span> {currentPhone.number}</p>
                    <p><span className="font-medium">办卡人:</span> {currentPhone.registrant} (已离职)</p>
                    <p><span className="font-medium">当前使用人:</span> {currentPhone.currentUser || "未分配"}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="status">更新状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">保持在用</SelectItem>
                    <SelectItem value="inactive">回收闲置</SelectItem>
                    <SelectItem value="pending">标记待处理</SelectItem>
                    <SelectItem value="cancelled">注销号码</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">处理备注</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="添加处理说明..."
                  value={formData.notes}
                  onChange={handleFormChange}
                />
              </div>
              
              {formData.status === "active" && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  注意: 如果保持该号码为在用状态，请确认已转移给新的负责人或有明确使用计划。
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button type="submit">保存处理结果</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default RiskPhones;
