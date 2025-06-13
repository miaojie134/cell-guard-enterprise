import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Users,
  Edit,
  Trash2,
  MoreHorizontal,
  Briefcase,
  Globe
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDepartmentTree } from '@/hooks/useDepartments';
import { DepartmentTreeNode } from '@/config/api';
import { cn } from '@/lib/utils';

interface DepartmentTreeProps {
  onEdit?: (department: DepartmentTreeNode) => void;
  onDelete?: (department: DepartmentTreeNode) => void;
}

interface TreeNodeProps {
  node: DepartmentTreeNode;
  level: number;
  isLast?: boolean;
  parentIsLast?: boolean[];
  onEdit?: (department: DepartmentTreeNode) => void;
  onDelete?: (department: DepartmentTreeNode) => void;
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
  onEdit, 
  onDelete 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
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
                "absolute w-0.5 bg-gradient-to-b from-border/40 to-border/60",
                !isParentLast && "h-full"
              )}
              style={{
                left: `${22 + index * 32}px`,
                top: index === parentIsLast.length - 1 ? '0' : '-16px',
                height: index === parentIsLast.length - 1 ? '24px' : 'calc(100% + 16px)'
              }}
            />
          ))}
          
          {/* 水平连接线 */}
          <div
            className="absolute h-0.5 bg-gradient-to-r from-border/60 to-border/40 rounded-full"
            style={{
              left: `${22 + (level - 1) * 32}px`,
              top: '23px',
              width: '20px'
            }}
          />
          
          {/* 连接点 */}
          <div
            className="absolute w-2 h-2 bg-background border-2 border-border/60 rounded-full shadow-sm"
            style={{
              left: `${22 + (level - 1) * 32 - 4}px`,
              top: '19px'
            }}
          />
        </>
      )}

      {/* 节点内容 */}
      <div
        className={cn(
          "flex items-center gap-4 py-3 pr-4 rounded-xl transition-all duration-300",
          "group relative z-10 bg-background",
          "hover:bg-gradient-to-r hover:from-accent/30 hover:to-accent/20",
          "hover:shadow-md hover:shadow-primary/5",
          "border border-transparent hover:border-border/30"
        )}
        style={{ 
          marginLeft: level > 0 ? `${24 + level * 32}px` : '0px',
          paddingLeft: '12px'
        }}
      >
        {/* 展开/折叠按钮 */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0 rounded-full transition-all duration-200",
            "hover:bg-primary/10 hover:text-primary",
            hasChildren ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={handleToggle}
          disabled={!hasChildren}
        >
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          )}
        </Button>

        {/* 部门图标容器 */}
        <div className={cn(
          "flex items-center justify-center w-9 h-9 rounded-full border-2 bg-background transition-all duration-200",
          "shadow-sm group-hover:shadow-md",
          node.isActive 
            ? "border-primary/60 text-primary bg-primary/5 group-hover:border-primary group-hover:bg-primary/10" 
            : "border-muted-foreground/20 text-muted-foreground bg-muted/30 group-hover:border-muted-foreground/40"
        )}>
          <DepartmentIcon className="h-4 w-4" />
        </div>

        {/* 部门信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className={cn(
              "font-semibold truncate transition-colors duration-200",
              level === 0 ? "text-lg" : "text-base",
              node.isActive ? "text-foreground group-hover:text-primary" : "text-muted-foreground"
            )}>
              {node.name}
            </span>
            {!node.isActive && (
              <Badge variant="secondary" className="text-xs h-5 bg-orange-100 text-orange-700 border-orange-200">
                停用
              </Badge>
            )}
            {hasChildren && (
              <Badge variant="outline" className={cn(
                "text-xs h-5 transition-colors duration-200",
                "bg-blue-50 text-blue-700 border-blue-200",
                "group-hover:bg-blue-100 group-hover:border-blue-300"
              )}>
                {node.children.length} 个子部门
              </Badge>
            )}
          </div>
          {node.description && (
            <div className="text-sm text-muted-foreground/70 truncate mt-1 group-hover:text-muted-foreground transition-colors duration-200">
              {node.description}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-accent hover:text-accent-foreground">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(node)} className="text-sm">
                  <Edit className="h-4 w-4 mr-2" />
                  编辑部门
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(node)}
                  className="text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除部门
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 子部门 */}
      {hasChildren && isExpanded && (
        <div className="relative mt-2">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isLast={index === node.children.length - 1}
              parentIsLast={[...parentIsLast, isLast]}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DepartmentTree: React.FC<DepartmentTreeProps> = ({ onEdit, onDelete }) => {
  const { tree, isLoading, error } = useDepartmentTree();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">加载部门树...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">暂无部门数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-gradient-to-br from-background to-muted/20 rounded-lg p-4">
      {tree.map((node, index) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          isLast={index === tree.length - 1}
          parentIsLast={[]}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default DepartmentTree; 