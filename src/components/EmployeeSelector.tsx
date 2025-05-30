import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Search, 
  X, 
  Loader2, 
  User, 
  Building2, 
  Mail,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  employmentStatus: string;
  email?: string;
  phone?: string;
  position?: string;
}

interface EmployeeSelectorProps {
  value?: Employee | null;
  onChange: (employee: Employee | null) => void;
  employees: Employee[];
  isLoading?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onSearch?: (query: string) => void;
  error?: string;
  compact?: boolean;
  label?: string;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  value,
  onChange,
  employees,
  isLoading = false,
  placeholder = "搜索员工姓名、工号或部门...",
  required = false,
  disabled = false,
  onSearch,
  error,
  compact = false,
  label,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 过滤员工列表
  useEffect(() => {
    if (!searchTerm.trim() && !showDropdown) {
      setFilteredEmployees([]);
      return;
    }

    // 如果没有搜索词但显示下拉框，显示最近的员工
    if (!searchTerm.trim() && showDropdown) {
      setFilteredEmployees(employees.slice(0, compact ? 6 : 10));
      setHighlightedIndex(-1);
      return;
    }

    const filtered = employees.filter(emp => 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, compact ? 6 : 10);

    setFilteredEmployees(filtered);
    setHighlightedIndex(-1);
  }, [searchTerm, employees, compact, showDropdown]);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    
    // 只有在输入内容时才显示下拉框
    setShowDropdown(query.trim().length > 0);
    
    // 如果有搜索回调，调用它
    if (onSearch) {
      onSearch(query);
    }
  };

  // 处理输入框点击
  const handleInputClick = () => {
    if (!value) {
      setShowDropdown(!showDropdown);
    }
  };

  // 处理搜索图标点击
  const handleSearchIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
    inputRef.current?.focus();
  };

  // 选择员工
  const handleEmployeeSelect = (employee: Employee) => {
    onChange(employee);
    setSearchTerm(`${employee.fullName} (${employee.employeeId})`);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  // 清除选择
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredEmployees.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredEmployees.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredEmployees.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredEmployees[highlightedIndex]) {
          handleEmployeeSelect(filteredEmployees[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 当value变化时更新搜索框
  useEffect(() => {
    if (value) {
      setSearchTerm(`${value.fullName} (${value.employeeId})`);
    } else if (!showDropdown) {
      setSearchTerm('');
    }
  }, [value, showDropdown]);

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      {label && (
        <Label className={cn("text-sm font-medium", error && "text-red-500")}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onClick={handleInputClick}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "pr-20 transition-all duration-200",
              error && "border-red-500 focus-visible:ring-red-500",
              value && "border-green-500 bg-green-50/30",
              compact && "h-8 text-sm"
            )}
          />
          
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            
            {value && !disabled && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted rounded-full"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted rounded-full"
              onClick={handleSearchIconClick}
              disabled={disabled || isLoading}
            >
              <Search className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* 下拉选项 */}
        {showDropdown && filteredEmployees.length > 0 && (
          <Card 
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 shadow-lg border"
          >
            <CardContent className="p-0">
              <div className={cn("max-h-60 overflow-auto", compact && "max-h-48")}>
                {filteredEmployees.map((employee, index) => {
                  return (
                    <div
                      key={employee.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-200",
                        "hover:bg-accent border-b border-border/30 last:border-b-0",
                        index === highlightedIndex && "bg-accent",
                        compact && "py-1.5 text-sm"
                      )}
                      onClick={() => handleEmployeeSelect(employee)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {/* 员工头像/图标 */}
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary",
                        compact && "w-7 h-7"
                      )}>
                        <User className={cn("h-4 w-4", compact && "h-3 w-3")} />
                      </div>
                      
                      {/* 员工信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{employee.fullName}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {employee.employeeId}
                          </span>
                          <span className="flex items-center gap-1" title={employee.department || '未分配部门'}>
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{employee.department || '未分配部门'}</span>
                          </span>
                        </div>
                        
                        {employee.email && (
                          <div className="mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              {employee.email}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 选中标识 */}
                      {value?.id === employee.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
                
                {employees.length > filteredEmployees.length && (
                  <div className={cn(
                    "text-center text-muted-foreground border-t border-border/30 bg-muted/20",
                    compact ? "py-2 text-xs" : "py-3 text-sm"
                  )}>
                    继续输入以缩小搜索范围...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 无结果提示 */}
        {showDropdown && searchTerm && filteredEmployees.length === 0 && !isLoading && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg border">
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground text-center">
                未找到匹配的员工
              </div>
            </CardContent>
          </Card>
        )}

        {/* 无员工数据提示 */}
        {showDropdown && !searchTerm && employees.length === 0 && !isLoading && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg border">
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground text-center">
                暂无可选择的员工
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default EmployeeSelector;