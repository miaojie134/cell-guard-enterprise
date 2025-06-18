import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Users, UserCog, Shield, Eye, Edit, X, Plus, UserPlus, Trash2 } from "lucide-react";
import { isSuperAdmin } from "@/utils/permissions";
import { userPermissionService, UserPermissionInfo, PermissionRequest } from "@/services/userPermissionService";
import { userService, User, CreateUserRequest, UpdateUserRequest } from "@/services/userService";
import { useDepartmentTree } from "@/hooks/useDepartments";
import { DepartmentTreeNode } from "@/config/api/department";
import { useToast } from "@/hooks/use-toast";

// 简化的部门选择器组件 - 只显示1级部门
interface DepartmentSelectorProps {
  tree: DepartmentTreeNode[];
  selectedPermissions: Record<number, 'manage' | 'view'>;
  onPermissionChange: (departmentId: number, permissionType: 'manage' | 'view' | null) => void;
}

const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  tree,
  selectedPermissions,
  onPermissionChange,
}) => {
  // 过滤出1级部门（parentId为null的部门）
  const firstLevelDepartments = tree.filter(dept => 
    dept.parentId === null || dept.parentId === undefined
  );

  return (
    <div className="space-y-3">
      {firstLevelDepartments.map((department) => {
        const currentPermission = selectedPermissions[department.id];
        
        return (
          <div 
            key={department.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <span className={`font-medium ${!department.isActive ? 'text-gray-400' : ''}`}>
                {department.name}
              </span>
              {!department.isActive && (
                <Badge variant="secondary" className="text-xs">
                  停用
                </Badge>
              )}
            </div>
            
            <div className="flex items-center">
              <Select
                value={currentPermission || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    onPermissionChange(department.id, null);
                  } else {
                    onPermissionChange(department.id, value as 'manage' | 'view');
                  }
                }}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="无权限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无权限</SelectItem>
                  <SelectItem value="view">查看</SelectItem>
                  <SelectItem value="manage">管理</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}
      
      {firstLevelDepartments.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">暂无1级部门数据</p>
      )}
    </div>
  );
};

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 状态管理
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissionDetail, setUserPermissionDetail] = useState<UserPermissionInfo | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<number, 'manage' | 'view'>>({});

  // 用户管理状态
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [createUserForm, setCreateUserForm] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: 'regional_admin'
  });
  const [editUserForm, setEditUserForm] = useState<Partial<UpdateUserRequest>>({});

  // 获取所有用户列表
  const {
    data: users,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
    enabled: isSuperAdmin(user),
    refetchOnWindowFocus: false,
  });

  // 获取部门树
  const { tree: departmentTree } = useDepartmentTree();

  // 创建用户mutation
  const createUserMutation = useMutation({
    mutationFn: (request: CreateUserRequest) => userService.createUser(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await refetch();
      toast({
        title: "成功",
        description: "用户创建成功",
      });
      handleCloseCreateDialog();
    },
    onError: (error: any) => {
      console.error('创建用户失败:', error);
      toast({
        title: "错误",
        description: error.message || "创建用户失败",
        variant: "destructive",
      });
    },
  });

  // 更新用户mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: number; request: UpdateUserRequest }) =>
      userService.updateUser(userId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await refetch();
      toast({
        title: "成功",
        description: "用户信息更新成功",
      });
      handleCloseEditUserDialog();
    },
    onError: (error: any) => {
      console.error('更新用户失败:', error);
      toast({
        title: "错误",
        description: error.message || "更新用户失败",
        variant: "destructive",
      });
    },
  });

  // 删除用户mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => userService.deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await refetch();
      toast({
        title: "成功",
        description: "用户删除成功",
      });
    },
    onError: (error: any) => {
      console.error('删除用户失败:', error);
      toast({
        title: "错误",
        description: error.message || "删除用户失败",
        variant: "destructive",
      });
    },
  });

  // 分配/更新权限mutation
  const managePermissionMutation = useMutation({
    mutationFn: ({ userId, request, isUpdate }: { userId: number; request: PermissionRequest; isUpdate: boolean }) => {
      if (isUpdate) {
        return userPermissionService.updateUserPermissions(userId.toString(), request);
      } else {
        return userPermissionService.assignUserPermissions(userId.toString(), request);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await refetch();
      toast({
        title: "成功",
        description: "用户权限更新成功",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('权限操作失败:', error);
      toast({
        title: "错误",
        description: error.message || "权限操作失败",
        variant: "destructive",
      });
    },
  });

  // 打开编辑对话框
  const handleEditUser = async (userInfo: User) => {
    try {
      setSelectedUser(userInfo);
      
      // 获取用户详细权限信息
      const userId = userInfo.userId || (userInfo as any).id;
      if (!userId) {
        throw new Error('无法获取用户ID');
      }
      
      const permissionDetail = await userPermissionService.getUserPermissions(userId.toString());
      setUserPermissionDetail(permissionDetail);
      
      // 初始化部门权限状态
      const initialPermissions: Record<number, 'manage' | 'view'> = {};
      permissionDetail.permissions?.forEach(perm => {
        initialPermissions[perm.departmentId] = perm.permissionType;
      });
      setSelectedPermissions(initialPermissions);
      
      setShowEditDialog(true);
    } catch (error) {
      console.error('获取用户权限详情失败:', error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取用户权限详情失败",
        variant: "destructive",
      });
    }
  };

  // 关闭权限编辑对话框
  const handleCloseDialog = () => {
    setShowEditDialog(false);
    setSelectedUser(null);
    setUserPermissionDetail(null);
    setSelectedPermissions({});
  };

  // 用户管理处理函数
  const handleCreateUser = () => {
    setShowCreateUserDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateUserDialog(false);
    setCreateUserForm({
      username: '',
      password: '',
      role: 'regional_admin'
    });
  };

  const handleEditUserInfo = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      username: user.username,
      role: user.role
    });
    setShowEditUserDialog(true);
  };

  const handleCloseEditUserDialog = () => {
    setShowEditUserDialog(false);
    setEditingUser(null);
    setEditUserForm({});
  };

  const handleCreateUserSubmit = () => {
    if (!createUserForm.username || !createUserForm.password) {
      toast({
        title: "错误",
        description: "请填写完整的用户信息",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(createUserForm);
  };

  const handleUpdateUserSubmit = () => {
    if (!editingUser) return;

    const request: UpdateUserRequest = {};
    
    if (editUserForm.username && editUserForm.username.trim()) {
      request.username = editUserForm.username.trim();
    }
    
    if (editUserForm.password && editUserForm.password.trim()) {
      request.password = editUserForm.password.trim();
    }
    
    if (editUserForm.role) {
      request.role = editUserForm.role;
    }

    const userId = editingUser.userId || (editingUser as any).id;
    if (!userId) {
      toast({
        title: "错误",
        description: "无法获取用户ID，请重试",
        variant: "destructive",
      });
      return;
    }

    updateUserMutation.mutate({ userId, request });
  };

  const handleDeleteUser = (user: User) => {
    if (isSystemAdmin(user)) {
      toast({
        title: "错误",
        description: "不能删除系统默认管理员账户",
        variant: "destructive",
      });
      return;
    }

    setUserToDelete(user);
    setShowDeleteConfirmDialog(true);
  };

  // 处理部门权限变更
  const handlePermissionChange = (departmentId: number, permissionType: 'manage' | 'view' | null) => {
    setSelectedPermissions(prev => {
      const newPermissions = { ...prev };
      if (permissionType === null) {
        delete newPermissions[departmentId];
      } else {
        newPermissions[departmentId] = permissionType;
      }
      return newPermissions;
    });
  };

  // 保存权限设置
  const handleSavePermissions = () => {
    if (!selectedUser) {
      toast({
        title: "错误",
        description: "选中的用户信息为空，请重试",
        variant: "destructive",
      });
      return;
    }
    
    const userId = selectedUser.userId || (selectedUser as any).id;
    if (!userId) {
      toast({
        title: "错误", 
        description: `用户 ${selectedUser.username} 缺少用户ID，请重试`,
        variant: "destructive",
      });
      return;
    }

    // 构建权限请求
    const permissions: Array<{ departmentId: number; permissionType: 'manage' | 'view' }> = 
      Object.entries(selectedPermissions).map(([deptId, permType]) => ({
        departmentId: parseInt(deptId),
        permissionType: permType
      }));

    if (permissions.length === 0) {
      toast({
        title: "提示",
        description: "请至少为用户分配一个部门权限",
        variant: "destructive",
      });
      return;
    }

    const request: PermissionRequest = { permissions };
    const isUpdate = userPermissionDetail?.permissions && userPermissionDetail.permissions.length > 0;

    managePermissionMutation.mutate({ userId, request, isUpdate: !!isUpdate });
  };

  // 检查权限
  if (!isSuperAdmin(user)) {
    return (
      <MainLayout title="用户管理">
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
                只有超级管理员才能访问用户权限管理功能。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  // 判断是否是系统默认管理员（不可编辑）
  const isSystemAdmin = (userInfo: User) => {
    return userInfo.username === 'admin' && userInfo.isSuperAdmin;
  };

  const getRoleDisplay = (userInfo: User) => {
    if (userInfo.isSuperAdmin) {
      return { text: "超级管理员", variant: "default" as const };
    } else if (userInfo.departmentPermissions && userInfo.departmentPermissions.length > 0) {
      return { text: "区域管理员", variant: "secondary" as const };
    } else if (userInfo.role) {
      switch (userInfo.role) {
        case "super_admin":
          return { text: "超级管理员", variant: "default" as const };
        case "regional_admin":
          return { text: "区域管理员", variant: "secondary" as const };
        default:
          return { text: userInfo.role, variant: "outline" as const };
      }
    } else {
      return { text: "普通用户", variant: "outline" as const };
    }
  };

  const getPermissionTypeDisplay = (type: string) => {
    switch (type) {
      case "manage":
        return { text: "管理", icon: <UserCog className="h-3 w-3" />, color: "text-blue-600" };
      case "view":
        return { text: "查看", icon: <Eye className="h-3 w-3" />, color: "text-green-600" };
      default:
        return { text: type, icon: <Shield className="h-3 w-3" />, color: "text-gray-600" };
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="用户管理">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">加载用户权限信息中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="用户管理">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              加载失败
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error ? error.message : "获取用户权限信息失败"}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4"
            >
              重试
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="用户管理">
      <div className="space-y-6">
        {/* 页面标题和描述 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">用户权限管理</h1>
          <p className="text-gray-600">管理系统用户的角色和1级部门权限设置</p>
        </div>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  用户列表
                </CardTitle>
                <CardDescription>
                  显示所有用户的角色和1级部门权限信息
                </CardDescription>
              </div>
              <Button onClick={handleCreateUser} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                新增用户
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users?.map((userInfo, index) => {
                const roleDisplay = getRoleDisplay(userInfo);
                
                return (
                  <div
                    key={`${userInfo.userId}-${index}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                        {userInfo.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{userInfo.name || userInfo.username}</p>
                          <Badge variant={roleDisplay.variant}>
                            {roleDisplay.text}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">@{userInfo.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUserInfo(userInfo)}
                          disabled={isSystemAdmin(userInfo)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          编辑信息
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(userInfo)}
                          disabled={isSystemAdmin(userInfo)}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          权限管理
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(userInfo)}
                          disabled={isSystemAdmin(userInfo)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {!users || users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无用户数据</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 编辑权限对话框 */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                编辑用户权限
              </DialogTitle>
              <DialogDescription>
                为用户 "{selectedUser?.name || selectedUser?.username}" 分配1级部门权限
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">选择1级部门权限</Label>
                <div className="max-h-64 overflow-y-auto border rounded-md p-3">
                  {departmentTree && departmentTree.length > 0 ? (
                    <DepartmentSelector
                      tree={departmentTree}
                      selectedPermissions={selectedPermissions}
                      onPermissionChange={handlePermissionChange}
                    />
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">暂无部门数据</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button
                onClick={handleSavePermissions}
                disabled={managePermissionMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                {userPermissionDetail?.permissions && userPermissionDetail.permissions.length > 0 ? '更新权限' : '分配权限'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 创建用户对话框 */}
        <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                创建新用户
              </DialogTitle>
              <DialogDescription>
                创建一个新的系统用户账户
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="输入用户名"
                  value={createUserForm.username}
                  onChange={(e) => setCreateUserForm({
                    ...createUserForm,
                    username: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="输入密码"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm({
                    ...createUserForm,
                    password: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>用户角色</Label>
                <Select
                  value={createUserForm.role}
                  onValueChange={(value) => setCreateUserForm({
                    ...createUserForm,
                    role: value as 'super_admin' | 'regional_admin'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regional_admin">区域管理员</SelectItem>
                    <SelectItem value="super_admin">超级管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseCreateDialog}>
                取消
              </Button>
              <Button 
                onClick={handleCreateUserSubmit}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? '创建中...' : '创建用户'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 编辑用户信息对话框 */}
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                编辑用户信息
              </DialogTitle>
              <DialogDescription>
                修改用户 "{editingUser?.username}" 的基本信息。
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">用户名</Label>
                <Input
                  id="edit-username"
                  type="text"
                  placeholder="输入用户名"
                  value={editUserForm.username || ''}
                  onChange={(e) => setEditUserForm({
                    ...editUserForm,
                    username: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">密码</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="留空表示不修改密码"
                  value={editUserForm.password || ''}
                  onChange={(e) => setEditUserForm({
                    ...editUserForm,
                    password: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>用户角色</Label>
                <Select
                  value={editUserForm.role || 'regional_admin'}
                  onValueChange={(value) => setEditUserForm({
                    ...editUserForm,
                    role: value as 'super_admin' | 'regional_admin'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regional_admin">区域管理员</SelectItem>
                    <SelectItem value="super_admin">超级管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseEditUserDialog}>
                取消
              </Button>
              <Button 
                onClick={handleUpdateUserSubmit}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? '更新中...' : '更新信息'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                确认删除用户
              </DialogTitle>
              <DialogDescription>
                您即将删除用户 <strong>"{userToDelete?.name || userToDelete?.username}"</strong>。
                <br />
                此操作不可撤销。
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirmDialog(false);
                  setUserToDelete(null);
                }}
                disabled={deleteUserMutation.isPending}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (userToDelete) {
                    const userId = userToDelete.userId || (userToDelete as any).id;
                    if (userId) {
                      deleteUserMutation.mutate(userId);
                    } else {
                      toast({
                        title: "错误",
                        description: "无法获取用户ID，请重试",
                        variant: "destructive",
                      });
                    }
                  }
                  setShowDeleteConfirmDialog(false);
                  setUserToDelete(null);
                }}
                disabled={deleteUserMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleteUserMutation.isPending ? '删除中...' : '确认删除'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default UserManagement; 