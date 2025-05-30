import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Search, X, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDepartmentOptions } from '@/hooks/useDepartments';
import { DepartmentOption } from '@/config/api';

export interface DepartmentSelectorProps {
  value: DepartmentOption | null;
  onChange: (department: DepartmentOption | null) => void;
  options?: DepartmentOption[];
  isLoading?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  compact?: boolean;
  label?: string;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  value,
  onChange,
  options: customOptions = [],
  isLoading: externalLoading = false,
  placeholder = "搜索部门名称...",
  required = false,
  disabled = false,
  error,
  compact = false,
  label,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<DepartmentOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取部门选项
  const { options: defaultOptions, isLoading: optionsLoading } = useDepartmentOptions();
  const isLoading = externalLoading || optionsLoading;

  // 使用自定义选项或默认选项
  const options = customOptions.length > 0 ? customOptions : defaultOptions;

  // 过滤部门选项
  useEffect(() => {
    if (!searchTerm.trim() && !showDropdown) {
      setFilteredOptions([]);
      return;
    }

    // 如果没有搜索词但显示下拉框，显示所有选项
    if (!searchTerm.trim() && showDropdown) {
      setFilteredOptions(options.slice(0, compact ? 8 : 15));
      setHighlightedIndex(-1);
      return;
    }

    const filtered = options.filter(option => 
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.path.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, compact ? 5 : 10); // 紧凑模式显示更少结果

    setFilteredOptions(filtered);
    setHighlightedIndex(-1);
  }, [searchTerm, options, compact, showDropdown]);

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    
    // 只有在输入内容时才显示下拉框
    setShowDropdown(query.trim().length > 0);
  };

  // 处理输入框点击
  const handleInputClick = () => {
    // 点击时切换下拉显示状态
    setShowDropdown(!showDropdown);
  };

  // 处理搜索图标点击
  const handleSearchIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
    inputRef.current?.focus();
  };

  // 选择部门
  const handleDepartmentSelect = (option: DepartmentOption) => {
    onChange(option);
    setSearchTerm(option.path);
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
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleDepartmentSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 显示当前选中的值
  useEffect(() => {
    if (value) {
      setSearchTerm(value.path);
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
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "pr-20",
              error && "border-red-500 focus-visible:ring-red-500",
              compact && "h-8 text-sm"
            )}
            onClick={handleInputClick}
          />
          
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            
            {value && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={handleSearchIconClick}
              disabled={disabled || isLoading}
            >
              <Search className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* 下拉选项 */}
        {showDropdown && filteredOptions.length > 0 && (
          <Card 
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 shadow-lg border"
          >
            <CardContent className="p-0">
              <div className={cn("max-h-60 overflow-auto", compact && "max-h-40")}>
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent",
                      index === highlightedIndex && "bg-accent",
                      compact && "py-1.5 text-sm"
                    )}
                    onClick={() => handleDepartmentSelect(option)}
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.name}</div>
                      {option.path !== option.name && (
                        <div className="text-xs text-muted-foreground truncate">
                          {option.path}
                        </div>
                      )}
                    </div>
                    {value?.id === option.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 无结果提示 */}
        {showDropdown && searchTerm && filteredOptions.length === 0 && !isLoading && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg border">
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground text-center">
                未找到匹配的部门
              </div>
            </CardContent>
          </Card>
        )}

        {/* 无部门数据提示 */}
        {showDropdown && !searchTerm && options.length === 0 && !isLoading && (
          <Card className="absolute z-50 w-full mt-1 shadow-lg border">
            <CardContent className="p-3">
              <div className="text-sm text-muted-foreground text-center">
                暂无可选择的部门
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