
import React, { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useData } from "@/context/DataContext";
import { Employee } from "@/types";

interface EmployeeComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function EmployeeCombobox({
  value,
  onValueChange,
  placeholder = "选择员工...",
  className,
  disabled = false,
}: EmployeeComboboxProps) {
  const { employees } = useData();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  // 防抖处理搜索值
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // 过滤员工列表
  const filteredEmployees = useMemo(() => {
    if (!debouncedSearchValue) {
      return employees.filter(emp => emp.status === "active");
    }
    
    return employees.filter(employee => 
      employee.status === "active" &&
      (employee.name.toLowerCase().includes(debouncedSearchValue.toLowerCase()) ||
       employee.employeeId.toLowerCase().includes(debouncedSearchValue.toLowerCase()) ||
       employee.department.toLowerCase().includes(debouncedSearchValue.toLowerCase()))
    );
  }, [employees, debouncedSearchValue]);

  // 获取选中员工的显示信息
  const selectedEmployee = employees.find(emp => emp.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedEmployee ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selectedEmployee.name}</span>
              <span className="text-muted-foreground text-sm">
                ({selectedEmployee.employeeId})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" side="bottom" align="start">
        <Command>
          <CommandInput
            placeholder="输入员工姓名搜索..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {debouncedSearchValue ? "未找到匹配的员工" : "输入员工姓名进行搜索"}
            </CommandEmpty>
            <CommandGroup>
              {filteredEmployees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={employee.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === employee.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{employee.name}</span>
                      <span className="text-muted-foreground text-sm">
                        ({employee.employeeId})
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {employee.department}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
