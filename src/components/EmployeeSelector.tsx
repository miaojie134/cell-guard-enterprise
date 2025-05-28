import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  department: string;
  employmentStatus: string;
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
}

export const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  value,
  onChange,
  employees,
  isLoading = false,
  placeholder = "搜索员工姓名或工号...",
  required = false,
  disabled = false,
  onSearch,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 过滤员工列表
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees.slice(0, 10)); // 默认显示前10个
      return;
    }

    const filtered = employees.filter(emp => 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // 限制显示数量

    setFilteredEmployees(filtered);
    setHighlightedIndex(-1);
  }, [searchTerm, employees]);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    setShowDropdown(true);
    
    // 如果有搜索回调，调用它
    if (onSearch) {
      onSearch(query);
    }
  };

  // 选择员工
  const handleEmployeeSelect = (employee: Employee) => {
    onChange(employee);
    setSearchTerm(employee.fullName);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  // 清除选择
  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

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
      setSearchTerm(value.fullName);
    } else {
      setSearchTerm('');
    }
  }, [value]);

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (status: string) => {
    return status === 'Active' ? '在职' : '离职';
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              "pr-20",
              error && "border-red-500",
              value && "border-green-500"
            )}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {value && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-transparent"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
        
        {value && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">{value.fullName}</p>
                <p className="text-sm text-green-600">
                  工号: {value.employeeId} | {value.department} | 
                  <span className={getStatusColor(value.employmentStatus)}>
                    {" "}{getStatusText(value.employmentStatus)}
                  </span>
                </p>
              </div>
              <Check className="h-5 w-5 text-green-600" />
            </div>
          </div>
        )}
      </div>

      {/* 下拉选项 */}
      {showDropdown && (
        <Card 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto border shadow-lg"
        >
          <CardContent className="p-0">
            {filteredEmployees.length > 0 ? (
              <div className="py-1">
                {filteredEmployees.map((employee, index) => (
                  <div
                    key={employee.id}
                    className={cn(
                      "px-3 py-2 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0",
                      highlightedIndex === index && "bg-blue-50",
                      "hover:bg-gray-50"
                    )}
                    onClick={() => handleEmployeeSelect(employee)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{employee.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          工号: {employee.employeeId} | {employee.department}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        employee.employmentStatus === 'Active' 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      )}>
                        {getStatusText(employee.employmentStatus)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="p-3 text-center text-muted-foreground">
                {isLoading ? "搜索中..." : "未找到匹配的员工"}
              </div>
            ) : (
              <div className="p-3 text-center text-muted-foreground">
                请输入员工姓名或工号进行搜索
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeSelector; 