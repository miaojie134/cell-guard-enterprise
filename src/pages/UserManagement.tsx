import React, { useState, useEffect, useRef } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Users, UserCog, Shield, Eye, Edit, X, Plus, ChevronRight, ChevronDown, UserPlus, Trash2 } from "lucide-react";
import { isSuperAdmin } from "@/utils/permissions";
import { userPermissionService, UserPermissionInfo, AssignPermissionRequest } from "@/services/userPermissionService";
import { userService, User, CreateUserRequest, UpdateUserRequest } from "@/services/userService";
import { useDepartmentTree } from "@/hooks/useDepartments";
import { DepartmentTreeNode } from "@/config/api/department";
import { useToast } from "@/hooks/use-toast";

// 支持半选状态的复选框组件
interface IndeterminateCheckboxProps {
  id: string;
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const IndeterminateCheckbox: React.FC<IndeterminateCheckboxProps> = ({ 
  id, 
  checked, 
  indeterminate, 
  onCheckedChange 
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
  );
};

// 树形部门选择器组件
interface DepartmentTreeSelectorProps {
  tree: DepartmentTreeNode[];
  selectedIds: number[];
  onSelectionChange: (departmentId: number, checked: boolean) => void;
  expandedIds: Set<number>;
  onToggleExpand: (departmentId: number) => void;
}

const DepartmentTreeSelector: React.FC<DepartmentTreeSelectorProps> = ({
  tree,
  selectedIds,
  onSelectionChange,
  expandedIds,
  onToggleExpand,
}) => {
  const renderTreeNode = (node: DepartmentTreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    
    // 获取所有子部门ID（递归）
    const getAllChildIds = (dept: DepartmentTreeNode): number[] => {
      let childIds: number[] = [];
      if (dept.children) {
        dept.children.forEach(child => {
          childIds.push(child.id);
          childIds.push(...getAllChildIds(child));
        });
      }
      return childIds;
    };

    // 计算选择状态 - 考虑权限继承
    const isDirectlySelected = selectedIds.includes(node.id);
    
    // 检查是否通过父部门继承了权限
    const hasInheritedPermission = () => {
      const findParentWithPermission = (tree: DepartmentTreeNode[], targetId: number): boolean => {
        for (const treeNode of tree) {
          if (treeNode.children) {
            for (const child of treeNode.children) {
              if (child.id === targetId && selectedIds.includes(treeNode.id)) {
                return true;
              }
              if (child.children && findParentWithPermission([child], targetId)) {
                return true;
              }
            }
          }
        }
        return false;
      };
      return findParentWithPermission(tree, node.id);
    };

    const hasPermission = isDirectlySelected || hasInheritedPermission();
    
    // 查找树中的节点
    const findNodeInTree = (tree: DepartmentTreeNode[], id: number): DepartmentTreeNode | null => {
      for (const treeNode of tree) {
        if (treeNode.id === id) return treeNode;
        if (treeNode.children) {
          const found = findNodeInTree(treeNode.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    // 计算子部门的权限状态
    const childIds = hasChildren ? getAllChildIds(node) : [];
    const childrenWithPermission = childIds.filter(childId => {
      // 子部门有权限的条件：直接选中 或 继承权限
      return selectedIds.includes(childId) || selectedIds.some(selectedId => {
        const selectedNode = findNodeInTree(tree, selectedId);
        if (selectedNode) {
          const selectedNodeAllChildren = getAllChildIds(selectedNode);
          return selectedNodeAllChildren.includes(childId);
        }
        return false;
      });
    });
    
    const selectedChildrenCount = childrenWithPermission.length;
    const totalChildrenCount = childIds.length;
    
    // 计算复选框状态
    let checked = false;
    let indeterminate = false;
    
    if (hasPermission) {
      // 当前部门有权限（直接或继承）
      checked = true;
      indeterminate = false;
    } else if (hasChildren && selectedChildrenCount > 0) {
      // 当前部门没有权限，但有子部门有权限
      if (selectedChildrenCount === totalChildrenCount) {
        // 所有子部门都有权限
        checked = true;
        indeterminate = false;
      } else {
        // 部分子部门有权限 - 半选状态
        checked = false;
        indeterminate = true;
      }
    } else {
      // 当前部门和子部门都没有权限
      checked = false;
      indeterminate = false;
    }

    // 调试日志
    if (node.name === "基地中心" && (indeterminate || selectedChildrenCount > 0)) {
      console.log(`基地中心状态:`, {
        isDirectlySelected,
        hasChildren,
        childIds,
        selectedChildrenCount,
        totalChildrenCount,
        checked,
        indeterminate,
        selectedIds
      });
    }
    
    const selectionState = { checked, indeterminate };
    
    return (
      <div key={node.id}>
        <div 
          className="flex items-center space-x-2 py-1"
          style={{ paddingLeft: `${level * 16}px` }}
        >
          {/* 展开/折叠按钮 */}
          <div className="w-4 h-4 flex items-center justify-center">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-4 h-4 p-0 hover:bg-gray-100"
                onClick={() => onToggleExpand(node.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            ) : null}
          </div>
          
          {/* 复选框 */}
          <IndeterminateCheckbox
            id={`dept-${node.id}`}
            checked={selectionState.checked}
            indeterminate={selectionState.indeterminate}
            onCheckedChange={(checked) => onSelectionChange(node.id, checked)}
          />
          
          {/* 部门名称 */}
          <Label
            htmlFor={`dept-${node.id}`}
            className={`text-sm cursor-pointer flex-1 ${!node.isActive ? 'text-gray-400' : ''}`}
          >
            {node.name}
            {!node.isActive && (
              <Badge variant="secondary" className="ml-2 text-xs">
                停用
              </Badge>
            )}
            {hasChildren && (
              <span className="text-xs text-gray-500 ml-1">
                ({node.children.length})
              </span>
            )}
          </Label>
        </div>
        
        {/* 子部门 */}
        {hasChildren && isExpanded && (
          <div key={`${node.id}-children`}>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {tree.map(node => renderTreeNode(node))}
    </div>
  );
};

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 状态管理
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
  const [selectedPermissionType, setSelectedPermissionType] = useState<'manage' | 'view'>('view');
  const [expandedDepartmentIds, setExpandedDepartmentIds] = useState<Set<number>>(new Set());

  // 用户管理状态
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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

  // 分配权限mutation
  const assignPermissionMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: number; request: AssignPermissionRequest }) =>
      userPermissionService.assignUserPermissions(userId.toString(), request),
    onSuccess: async () => {
      // 强制重新获取数据并等待完成
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await refetch();
      toast({
        title: "成功",
        description: "用户权限分配成功",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('分配权限失败:', error);
      toast({
        title: "错误",
        description: error.message || "分配权限失败",
        variant: "destructive",
      });
    },
  });

  // 更新权限mutation
  const updatePermissionMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: number; request: AssignPermissionRequest }) =>
      userPermissionService.updateUserPermissions(userId.toString(), request),
    onSuccess: async () => {
      // 强制重新获取数据并等待完成
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await refetch();
      toast({
        title: "成功",
        description: "用户权限更新成功",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('更新权限失败:', error);
      toast({
        title: "错误",
        description: error.message || "更新权限失败",
        variant: "destructive",
      });
    },
  });

  // 获取所有子部门ID（递归）
  const getAllChildIds = (node: DepartmentTreeNode): number[] => {
    const ids = [node.id];
    if (node.children) {
      node.children.forEach(child => {
        ids.push(...getAllChildIds(child));
      });
    }
    return ids;
  };

  // 获取继承的权限ID列表（考虑父部门权限包含子部门权限）
  const getInheritedPermissionIds = (userPermissions: Array<{departmentId: number}>) => {
    if (!userPermissions || userPermissions.length === 0) return [];
    
    const directPermissionIds = userPermissions.map(p => p.departmentId);
    const inheritedIds = new Set(directPermissionIds);
    
    // 为每个有权限的部门，添加其所有子部门
    const addChildrenRecursively = (tree: DepartmentTreeNode[]) => {
      tree.forEach(node => {
        if (directPermissionIds.includes(node.id)) {
          // 如果当前部门有权限，则其所有子部门也有权限
          const allChildIds = getAllChildIds(node);
          allChildIds.forEach(id => inheritedIds.add(id));
        }
        if (node.children && node.children.length > 0) {
          addChildrenRecursively(node.children);
        }
      });
    };
    
    addChildrenRecursively(departmentTree);
    return Array.from(inheritedIds);
  };

  // 打开编辑对话框
  const handleEditUser = (userInfo: User) => {
    setSelectedUser(userInfo);
    
    // 只设置用户直接拥有权限的部门ID，不包括继承的子部门
    const directPermissionIds = userInfo.departmentPermissions?.map(p => p.departmentId) || [];
    setSelectedDepartmentIds(directPermissionIds);
    setSelectedPermissionType('view');
    
    // 不自动展开，保持默认折叠状态
    setExpandedDepartmentIds(new Set());
    
    setShowEditDialog(true);
  };

  // 关闭权限编辑对话框
  const handleCloseDialog = () => {
    setShowEditDialog(false);
    setSelectedUser(null);
    setSelectedDepartmentIds([]);
    setSelectedPermissionType('view');
    setExpandedDepartmentIds(new Set());
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

    // 过滤掉空值字段，特别是空密码
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

    updateUserMutation.mutate({
      userId,
      request
    });
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

    const userId = user.userId || (user as any).id;
    if (!userId) {
      toast({
        title: "错误",
        description: "无法获取用户ID，请重试",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`确定要删除用户 "${user.name || user.username}" 吗？此操作不可逆。`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // 处理部门选择
  const handleDepartmentChange = (departmentId: number, checked: boolean) => {
    const findNode = (tree: DepartmentTreeNode[], id: number): DepartmentTreeNode | null => {
      for (const node of tree) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(departmentTree, departmentId);
    if (!node) return;

    if (checked) {
      // 选中时，同时选中所有子部门
      const allChildIds = getAllChildIds(node);
      setSelectedDepartmentIds(prev => {
        const newIds = [...prev];
        allChildIds.forEach(id => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    } else {
      // 取消选中时，同时取消所有子部门
      const allChildIds = getAllChildIds(node);
      setSelectedDepartmentIds(prev => prev.filter(id => !allChildIds.includes(id)));
    }
  };

  // 处理展开/折叠
  const handleToggleExpand = (departmentId: number) => {
    setExpandedDepartmentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(departmentId)) {
        newSet.delete(departmentId);
      } else {
        newSet.add(departmentId);
      }
      return newSet;
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

    // 获取用户直接选择的部门ID（排除通过继承获得权限的子部门）
    const getDirectSelectedDepartmentIds = () => {
      const directIds: number[] = [];
      
      // 检查每个选中的部门是否是直接选择的（即其父部门没有被选中）
      const isDirectlySelected = (deptId: number) => {
        const findParent = (tree: DepartmentTreeNode[], targetId: number): DepartmentTreeNode | null => {
          for (const node of tree) {
            if (node.children && node.children.some(child => child.id === targetId)) {
              return node;
            }
            if (node.children) {
              const found = findParent(node.children, targetId);
              if (found) return found;
            }
          }
          return null;
        };
        
        const parent = findParent(departmentTree, deptId);
        return !parent || !selectedDepartmentIds.includes(parent.id);
      };
      
      selectedDepartmentIds.forEach(id => {
        if (isDirectlySelected(id)) {
          directIds.push(id);
        }
      });
      
      return directIds;
    };

    const request: AssignPermissionRequest = {
      departmentIds: getDirectSelectedDepartmentIds(),
      permissionType: selectedPermissionType,
    };

    if (selectedUser.departmentPermissions && selectedUser.departmentPermissions.length > 0) {
      // 已有权限，更新
      updatePermissionMutation.mutate({ userId, request });
    } else {
      // 没有权限，分配
      assignPermissionMutation.mutate({ userId, request });
    }
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
      // 根据role字段判断
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
          <p className="text-gray-600">管理系统用户的角色和部门权限设置</p>
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
                  显示所有用户的角色和权限信息
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
                    
                    <div className="flex items-center space-x-4">
                      {/* 部门权限显示 */}
                      <div className="text-right">
                        {userInfo.departmentPermissions && userInfo.departmentPermissions.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {userInfo.departmentPermissions.length} 个部门权限
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {userInfo.departmentPermissions.slice(0, 3).map((perm) => {
                                const permDisplay = getPermissionTypeDisplay(perm.permissionType);
                                return (
                                  <div
                                    key={perm.departmentId}
                                    className={`flex items-center space-x-1 text-xs ${permDisplay.color}`}
                                  >
                                    {permDisplay.icon}
                                    <span>{perm.departmentName}</span>
                                  </div>
                                );
                              })}
                              {userInfo.departmentPermissions.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{userInfo.departmentPermissions.length - 3} 更多
                                </span>
                              )}
                            </div>
                          </div>
                        ) : userInfo.isSuperAdmin ? (
                          <p className="text-sm text-blue-600">全部权限</p>
                        ) : (
                          <p className="text-sm text-gray-500">无部门权限</p>
                        )}
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUserInfo(userInfo)}
                          disabled={isSystemAdmin(userInfo)} // 只有系统默认管理员不能编辑基本信息
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          编辑信息
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(userInfo)}
                          disabled={isSystemAdmin(userInfo)} // 只有系统默认管理员不能编辑权限
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          权限管理
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(userInfo)}
                          disabled={isSystemAdmin(userInfo)} // 只有系统默认管理员不能删除
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
                为用户 "{selectedUser?.name || selectedUser?.username}" 分配部门权限
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 权限类型选择 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">权限类型</Label>
                <RadioGroup
                  value={selectedPermissionType}
                  onValueChange={(value: 'manage' | 'view') => setSelectedPermissionType(value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manage" id="manage" />
                    <Label htmlFor="manage" className="flex items-center cursor-pointer">
                      <UserCog className="h-4 w-4 mr-2 text-blue-600" />
                      管理权限（可以查看、创建、编辑、删除）
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="view" id="view" />
                    <Label htmlFor="view" className="flex items-center cursor-pointer">
                      <Eye className="h-4 w-4 mr-2 text-green-600" />
                      查看权限（只能查看，不能修改）
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 部门选择 - 树形结构 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">选择部门</Label>
                <div className="max-h-64 overflow-y-auto border rounded-md p-3">
                  {departmentTree && departmentTree.length > 0 ? (
                    <DepartmentTreeSelector
                      tree={departmentTree}
                      selectedIds={selectedDepartmentIds}
                      onSelectionChange={handleDepartmentChange}
                      expandedIds={expandedDepartmentIds}
                      onToggleExpand={handleToggleExpand}
                    />
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">暂无部门数据</p>
                  )}
                </div>
              </div>

              {/* 当前权限显示 */}
              {selectedUser?.departmentPermissions && selectedUser.departmentPermissions.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">当前权限</Label>
                  <div className="space-y-2">
                    {selectedUser.departmentPermissions.map((perm) => {
                      const permDisplay = getPermissionTypeDisplay(perm.permissionType);
                      return (
                        <div
                          key={perm.departmentId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            {permDisplay.icon}
                            <span className="text-sm">{perm.departmentName}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {permDisplay.text}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button
                onClick={handleSavePermissions}
                disabled={
                  assignPermissionMutation.isPending ||
                  updatePermissionMutation.isPending
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                {selectedUser?.departmentPermissions && selectedUser.departmentPermissions.length > 0 ? '更新权限' : '分配权限'}
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
      </div>
    </MainLayout>
  );
};

export default UserManagement; 