import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { useEmployeesForSelector } from '@/hooks/useEmployees';
import { useDebounce } from '@/hooks/useDebounce';

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
  employees?: Employee[];
  isLoading?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onSearch?: (query: string) => void;
  error?: string;
  compact?: boolean;
  label?: string;
  enableDynamicSearch?: boolean;
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  value,
  onChange,
  employees: staticEmployees = [],
  isLoading: externalIsLoading = false,
  placeholder = "搜索员工姓名或部门...",
  required = false,
  disabled = false,
  onSearch,
  error,
  compact = false,
  label,
  enableDynamicSearch = true, // 默认启用动态搜索
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false); // 中文输入法状态
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 防抖搜索词，减少API调用频率（增加到500ms，适合中文输入）
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 动态搜索：根据搜索词调用API（只有在非中文输入状态下才搜索）
  const {
    employees: searchResults,
    isLoading: isSearchLoading,
  } = useEmployeesForSelector({
    search: enableDynamicSearch && debouncedSearchTerm.trim() && !isComposing ? debouncedSearchTerm : undefined,
    employmentStatus: 'Active',
    limit: 50, // 搜索结果限制在50个，提高响应速度
  });

  // 默认员工列表（当没有搜索时显示）
  const {
    employees: defaultEmployees,
    isLoading: isDefaultLoading,
  } = useEmployeesForSelector({
    search: undefined, // 不传搜索条件
    employmentStatus: 'Active',
    limit: 20, // 默认只显示20个最近的员工
  });

  // 选择合适的员工数据源
  const employees = useMemo(() => {
    // 如果传入了静态员工列表，优先使用（向后兼容）
    if (staticEmployees.length > 0) {
      return staticEmployees;
    }
    
    // 如果启用动态搜索
    if (enableDynamicSearch) {
      // 有搜索词时使用搜索结果，没有搜索词时使用默认列表
      return debouncedSearchTerm.trim() ? searchResults : defaultEmployees;
    }
    
    // 不启用动态搜索时返回空数组
    return [];
  }, [staticEmployees, enableDynamicSearch, debouncedSearchTerm, searchResults, defaultEmployees]);

  // 综合loading状态
  const isLoading = useMemo(() => {
    if (staticEmployees.length > 0) {
      return externalIsLoading;
    }
    
    if (enableDynamicSearch) {
      return debouncedSearchTerm.trim() ? isSearchLoading : isDefaultLoading;
    }
    
    return false;
  }, [staticEmployees.length, externalIsLoading, enableDynamicSearch, debouncedSearchTerm, isSearchLoading, isDefaultLoading]);

  // 过滤员工列表
  useEffect(() => {
    if (!showDropdown) {
      setFilteredEmployees([]);
      return;
    }

    // 如果使用静态员工列表，需要前端过滤
    if (staticEmployees.length > 0) {
      const filtered = employees.filter(emp => 
        !searchTerm.trim() || 
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, compact ? 8 : 12);
      
      setFilteredEmployees(filtered);
      setHighlightedIndex(-1);
      return;
    }

    // 动态搜索模式：后端已经过滤，直接使用
    setFilteredEmployees(employees.slice(0, compact ? 8 : 12));
    setHighlightedIndex(-1);
    
    // 确保输入框保持焦点
    setTimeout(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [searchTerm, employees, showDropdown, staticEmployees.length, compact]);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    
    // 显示下拉框
    setShowDropdown(true);
    
    // 如果有搜索回调，调用它
    if (onSearch) {
      onSearch(query);
    }
  };

  // 处理中文输入法开始事件
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  // 处理中文输入法结束事件
  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 处理输入框聚焦
  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  // 处理输入框点击
  const handleInputClick = () => {
    if (!value) {
      setShowDropdown(true);
    }
  };

  // 处理搜索图标点击
  const handleSearchIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(true);
    inputRef.current?.focus();
  };

  // 选择员工
  const handleEmployeeSelect = (employee: Employee) => {
    onChange(employee);
    setSearchTerm(`${employee.fullName}`);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    
    // 选择后保持输入框焦点
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
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
      setSearchTerm(`${value.fullName}`);
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
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            onClick={handleInputClick}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
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
                      onMouseDown={(e) => {
                        // 防止点击下拉选项时输入框失去焦点
                        e.preventDefault();
                        handleEmployeeSelect(employee);
                      }}
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
                
                {/* 搜索提示 */}
                {enableDynamicSearch && searchTerm.trim() && (
                  <div className={cn(
                    "text-center text-muted-foreground border-t border-border/30 bg-muted/20",
                    compact ? "py-2 text-xs" : "py-3 text-sm"
                  )}>
                    {isLoading ? "搜索中..." : `显示前${filteredEmployees.length}个结果`}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 无结果提示 */}
        {showDropdown && searchTerm.trim() && filteredEmployees.length === 0 && !isLoading && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg border">
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground text-center">
                未找到匹配的员工
              </div>
            </CardContent>
          </Card>
        )}

        {/* 空状态提示 */}
        {showDropdown && !searchTerm.trim() && filteredEmployees.length === 0 && !isLoading && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg border">
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground text-center">
                {enableDynamicSearch ? "输入姓名或部门开始搜索" : "暂无可选择的员工"}
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