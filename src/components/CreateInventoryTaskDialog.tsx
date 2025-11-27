import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DepartmentTreeSelector } from '@/components/DepartmentTreeSelector';
import { useInventoryTaskActions } from '@/hooks/useInventoryTasks';
import { CreateInventoryTaskPayload, InventoryTaskScopeType } from '@/types/index';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { EmployeeSelector, Employee } from '@/components/EmployeeSelector';

interface CreateInventoryTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

export const CreateInventoryTaskDialog: React.FC<CreateInventoryTaskDialogProps> = ({
  open,
  onOpenChange,
  onTaskCreated,
}) => {
  const [name, setName] = useState('');
  const [dueAt, setDueAt] = useState<Date | undefined>();
  const [scopeType, setScopeType] = useState<InventoryTaskScopeType>('department_ids');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Array<{ id: string; name: string; department?: string }>>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { createInventoryTask, isCreating } = useInventoryTaskActions();

  useEffect(() => {
    // Reset state when dialog opens
    if (open) {
      setName('');
      setDueAt(undefined);
      setScopeType('department_ids');
      setSelectedDeptIds([]);
      setSelectedEmployees([]);
      setSelectedEmployee(null);
      setFormError(null);
    }
  }, [open]);

  const handleDeptChange = (deptId: string, checked: boolean) => {
    setSelectedDeptIds(prev => 
      checked ? [...prev, deptId] : prev.filter(id => id !== deptId)
    );
  };

  const handleEmployeeChange = (empId: string, checked: boolean) => {
    setSelectedEmployees(prev => 
      checked ? [...prev, { id: empId, name: empId }] : prev.filter(emp => emp.id !== empId)
    );
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!name.trim()) {
      setFormError('任务名称不能为空。');
      return;
    }
    if (!dueAt) {
      setFormError('必须选择一个截止日期。');
      return;
    }
    const scopeValues = scopeType === 'department_ids' 
      ? selectedDeptIds
      : selectedEmployees.map(emp => emp.id);
    if (scopeValues.length === 0) {
      setFormError('必须至少选择一个部门或员工。');
      return;
    }

    const payload: CreateInventoryTaskPayload = {
      name,
      dueAt: dueAt.toISOString(),
      scopeType,
      scopeValues,
    };

    createInventoryTask(payload, {
      onSuccess: () => {
        onTaskCreated();
        onOpenChange(false);
      },
      onError: (error) => {
        setFormError(error.message || '创建任务失败，请稍后再试。');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新增盘点任务</DialogTitle>
          <DialogDescription>
            创建一个新的手机号码盘点任务，可以按部门或指定员工下发。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task-name" className="text-right">任务名称</Label>
            <Input id="task-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="due-date" className="text-right">截止日期</Label>
            <Input
              id="due-date"
              type="date"
              className="col-span-3"
              value={dueAt ? format(dueAt, 'yyyy-MM-dd') : ''}
              onChange={(e) => setDueAt(e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
          <Tabs value={scopeType} onValueChange={(value) => setScopeType(value as InventoryTaskScopeType)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="department_ids">按部门选择</TabsTrigger>
              <TabsTrigger value="employee_ids">按员工选择</TabsTrigger>
            </TabsList>
            <TabsContent value="department_ids" className="min-h-[260px]">
              <div className="h-full">
                <DepartmentTreeSelector
                  selectedDepartmentIds={selectedDeptIds}
                  onDepartmentChange={handleDeptChange}
                />
              </div>
            </TabsContent>
            <TabsContent value="employee_ids" className="min-h-[260px]">
              <div className="space-y-3 h-full">
                <EmployeeSelector
                  value={selectedEmployee}
                  onChange={(emp) => {
                    if (emp) {
                      setSelectedEmployees(prev => prev.some(e => e.id === emp.employeeId) ? prev : [...prev, { id: emp.employeeId, name: emp.fullName, department: emp.department }]);
                    }
                    setSelectedEmployee(null);
                  }}
                  placeholder="搜索并添加员工"
                />
                {selectedEmployees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployees.map(emp => (
                      <Badge key={emp.id} variant="secondary" className="flex items-center gap-1 py-1">
                        <div className="flex flex-col items-start leading-tight">
                          <span className="text-sm font-medium">{emp.name || emp.id}</span>
                          {emp.department && <span className="text-[11px] text-muted-foreground">{emp.department}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEmployees(prev => prev.filter(e => e.id !== emp.id))}
                          className="hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {formError && <p className="text-sm text-red-500 text-center">{formError}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCreating}>
              取消
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
