import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  Users,
  MoreHorizontal,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDepartments, useDepartmentActions } from '@/hooks/useDepartments';
import { Department } from '@/config/api';
import { DepartmentForm } from '@/components/DepartmentForm';
import { DepartmentTree } from '@/components/DepartmentTree';

const Departments = () => {
  const { departments, isLoading, error, refetch } = useDepartments();
  const { 
    createDepartment, 
    updateDepartment, 
    deleteDepartment,
    isCreating,
    isUpdating,
    isDeleting
  } = useDepartmentActions();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const { toast } = useToast();

  // 计算部门统计信息
  const activeDepartments = departments.filter(dept => dept.isActive).length;
  const totalDepartments = departments.length;

  // 创建部门
  const handleCreateDepartment = async (data: any) => {
    try {
      await createDepartment(data);
      setShowAddDialog(false);
      toast({
        title: "创建成功",
        description: "部门已成功创建",
      });
    } catch (error) {
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "创建部门失败",
        variant: "destructive",
      });
    }
  };

  // 更新部门
  const handleUpdateDepartment = async (data: any) => {
    if (!selectedDepartment) return;
    
    try {
      await updateDepartment(selectedDepartment.id, data);
      setShowEditDialog(false);
      setSelectedDepartment(null);
      toast({
        title: "更新成功",
        description: "部门信息已成功更新",
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新部门失败",
        variant: "destructive",
      });
    }
  };

  // 删除部门
  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;
    
    try {
      await deleteDepartment(selectedDepartment.id);
      setShowDeleteDialog(false);
      setSelectedDepartment(null);
      toast({
        title: "删除成功",
        description: "部门已成功删除",
      });
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除部门失败",
        variant: "destructive",
      });
    }
  };

  // 打开编辑对话框
  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setShowEditDialog(true);
  };

  // 打开删除确认对话框
  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteDialog(true);
  };

  return (
    <MainLayout title="部门管理">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">部门管理</h2>
            <p className="text-muted-foreground">
              管理公司的组织架构和部门信息
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加部门
            </Button>
          </div>
        </div>

        {/* 部门树结构 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              组织架构
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">加载中...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <Button onClick={refetch} className="mt-2">重试</Button>
              </div>
            ) : (
              <DepartmentTree 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 添加部门对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加新部门</DialogTitle>
            <DialogDescription>
              创建一个新的部门。请填写部门的基本信息。
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            onSubmit={handleCreateDepartment}
            isLoading={isCreating}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑部门对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑部门</DialogTitle>
            <DialogDescription>
              修改部门的基本信息。
            </DialogDescription>
          </DialogHeader>
          {selectedDepartment && (
            <DepartmentForm
              department={selectedDepartment}
              onSubmit={handleUpdateDepartment}
              isLoading={isUpdating}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedDepartment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除部门 "{selectedDepartment?.name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedDepartment(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Departments; 