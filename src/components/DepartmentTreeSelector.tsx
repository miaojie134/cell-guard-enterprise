import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Briefcase,
  Globe
} from 'lucide-react';
import { useDepartmentTree } from '@/hooks/useDepartments';
import { DepartmentTreeNode } from '@/config/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { hasManagePermission } from '@/utils/permissions';

interface DepartmentTreeSelectorProps {
  selectedDepartmentIds: string[];
  onDepartmentChange: (departmentId: string, checked: boolean, departmentName?: string) => void;
  activeEmployees?: Array<{ department: string }>;
}

interface TreeNodeProps {
  node: DepartmentTreeNode;
  level: number;
  isLast?: boolean;
  parentIsLast?: boolean[];
  selectedDepartmentIds: string[];
  onDepartmentChange: (departmentId: string, checked: boolean, departmentName?: string) => void;
  activeEmployees?: Array<{ department: string }>;
}

// 根据部门层级返回不同的图标
const getDepartmentIcon = (level: number, hasChildren: boolean) => {
  if (level === 0) return Globe; // 顶级部门用地球图标
  if (hasChildren) return Building2; // 有子部门用建筑图标
  return Briefcase; // 叶子部门用公文包图标
};

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  isLast = false, 
  parentIsLast = [],
  selectedDepartmentIds,
  onDepartmentChange,
  activeEmployees = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // 默认关闭
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedDepartmentIds.includes(node.id.toString());

  // 计算该部门及其子部门的员工数量
  const matchingEmployees = activeEmployees.filter(emp => {
    const empDept = emp.department; // 格式如："产研中心 > 产研中心4组"
    
    // 如果员工部门路径包含当前部门名称，则匹配
    // 处理几种情况：
    // 1. 完全匹配：empDept === node.name （不太可能，因为员工部门是路径格式）
    // 2. 路径中包含部门名称：empDept.includes(node.name)
    // 3. 路径结尾匹配：empDept.endsWith(node.name) （精确匹配子部门）
    
    // 情况1：完全匹配
    if (empDept === node.name) {
      return true;
    }
    
    // 情况2：员工部门路径以当前部门名称结尾（精确匹配）
    // 例如："产研中心 > 产研中心4组" 结尾匹配 "产研中心4组"
    if (empDept.endsWith(node.name)) {
      return true;
    }
    
    // 情况3：如果是父部门，匹配所有以该部门开头的路径
    // 例如："产研中心" 匹配 "产研中心 > 产研中心4组"
    if (empDept.startsWith(node.name + ' >')) {
      return true;
    }
    
    return false;
  });
  
  const employeeCount = matchingEmployees.length;
  
  // 调试信息：输出匹配情况
  if (node.name.includes('产研中心')) {
    console.log(`部门 "${node.name}" 的员工匹配情况:`, {
      departmentName: node.name,
      matchingEmployees: matchingEmployees.map(emp => emp.department),
      employeeCount,
      // 测试几个样本匹配
      testMatches: activeEmployees.slice(0, 5).map(emp => ({
        empDept: emp.department,
        endsWith: emp.department.endsWith(node.name),
        startsWith: emp.department.startsWith(node.name + ' >'),
        exact: emp.department === node.name
      }))
    });
  }

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    onDepartmentChange(node.id.toString(), checked, node.name);
  };

  const DepartmentIcon = getDepartmentIcon(level, hasChildren);

  return (
    <div className="relative">
      {/* 连接线 */}
      {level > 0 && (
        <>
          {/* 垂直连接线 */}
          {parentIsLast.map((isParentLast, index) => (
            <div
              key={index}
              className={cn(
                "absolute w-0.5 bg-border/30",
                !isParentLast && "h-full"
              )}
              style={{
                left: `${22 + index * 28}px`,
                top: index === parentIsLast.length - 1 ? '0' : '-12px',
                height: index === parentIsLast.length - 1 ? '20px' : 'calc(100% + 12px)'
              }}
            />
          ))}
          
          {/* 水平连接线 */}
          <div
            className="absolute h-0.5 bg-border/30"
            style={{
              left: `${22 + (level - 1) * 28}px`,
              top: '19px',
              width: '16px'
            }}
          />
        </>
      )}

      {/* 节点内容 */}
      <div
        className={cn(
          "flex items-center gap-3 py-2 pr-3 rounded-lg transition-all duration-200",
          "group relative z-10 bg-background",
          "hover:bg-accent/30",
          isSelected && "bg-primary/5 border border-primary/20"
        )}
        style={{ 
          marginLeft: level > 0 ? `${20 + level * 28}px` : '0px',
          paddingLeft: '8px'
        }}
      >
        {/* 展开/折叠按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-5 w-5 p-0 rounded-full transition-all duration-200",
            "hover:bg-accent",
            hasChildren ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={handleToggle}
          disabled={!hasChildren}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          )}
        </Button>

        {/* 复选框 */}
        <Checkbox
          id={`dept-${node.id}`}
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />

        {/* 部门图标 */}
        <div className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full border bg-background",
          node.isActive 
            ? "border-primary/30 text-primary" 
            : "border-muted-foreground/20 text-muted-foreground"
        )}>
          <DepartmentIcon className="h-3.5 w-3.5" />
        </div>

        {/* 部门信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <label 
              htmlFor={`dept-${node.id}`}
              className={cn(
                "font-medium truncate cursor-pointer transition-colors duration-200",
                level === 0 ? "text-base" : "text-sm",
                node.isActive ? "text-foreground hover:text-primary" : "text-muted-foreground"
              )}
            >
              {node.name}
            </label>
            
            {/* 员工数量徽章 */}
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {employeeCount}
            </Badge>
            
            {!node.isActive && (
              <Badge variant="secondary" className="text-xs h-5 bg-orange-100 text-orange-700 border-orange-200">
                停用
              </Badge>
            )}
            
            {hasChildren && (
              <Badge variant="outline" className="text-xs h-5 bg-blue-50 text-blue-700 border-blue-200">
                {node.children.length}
              </Badge>
            )}
          </div>
          
          {node.description && (
            <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
              {node.description}
            </div>
          )}
        </div>
      </div>

      {/* 子部门 */}
      {hasChildren && isExpanded && (
        <div className="relative mt-1">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isLast={index === node.children.length - 1}
              parentIsLast={[...parentIsLast, isLast]}
              selectedDepartmentIds={selectedDepartmentIds}
              onDepartmentChange={onDepartmentChange}
              activeEmployees={activeEmployees}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DepartmentTreeSelector: React.FC<DepartmentTreeSelectorProps> = ({ 
  selectedDepartmentIds,
  onDepartmentChange,
  activeEmployees = []
}) => {
  const { tree, isLoading, error } = useDepartmentTree();
  const { user } = useAuth();

  // 递归过滤部门树，只显示有权限的部门
  const filterTreeByPermission = (nodes: DepartmentTreeNode[]): DepartmentTreeNode[] => {
    return nodes.filter(node => {
      // 检查用户是否对该部门有管理权限
      const hasPermission = hasManagePermission(user, node.id);
      if (hasPermission) {
        // 如果有权限，递归过滤子部门
        node.children = filterTreeByPermission(node.children);
        return true;
      }
      return false;
    });
  };

  // 过滤后的部门树
  const filteredTree = tree ? filterTreeByPermission(tree) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载部门树...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!filteredTree || filteredTree.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {tree && tree.length > 0 ? "暂无有权限访问的部门" : "暂无部门数据"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 bg-muted/20 rounded-lg p-3 max-h-64 overflow-y-auto">
      {filteredTree.map((node, index) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          isLast={index === filteredTree.length - 1}
          parentIsLast={[]}
          selectedDepartmentIds={selectedDepartmentIds}
          onDepartmentChange={onDepartmentChange}
          activeEmployees={activeEmployees}
        />
      ))}
    </div>
  );
};

export default DepartmentTreeSelector; 