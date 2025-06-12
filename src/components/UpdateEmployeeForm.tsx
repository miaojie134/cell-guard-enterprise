import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UpdateEmployeeRequest } from '@/config/api';
import { Employee } from '@/types';
import { DepartmentSelector } from '@/components/DepartmentSelector';
import { useDepartmentOptions } from '@/hooks/useDepartments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UpdateEmployeeFormProps {
  employee: Employee;
  onSubmit: (data: UpdateEmployeeRequest) => Promise<void>;
  isLoading: boolean;
}

export const UpdateEmployeeForm: React.FC<UpdateEmployeeFormProps> = ({
  employee,
  onSubmit,
  isLoading,
}) => {
  const { options: departmentOptions } = useDepartmentOptions();
  
  const form = useForm<UpdateEmployeeRequest>({
    defaultValues: {
      departmentId: undefined, // 将根据部门名称查找对应的ID
      email: '',
      phoneNumber: '',
      employmentStatus: employee.status === 'active' ? 'Active' : 'Departed',
      hireDate: employee.joinDate || '',
      terminationDate: employee.leaveDate || '',
    },
  });

  // 根据员工当前部门名称查找对应的部门选项
  const currentDepartment = departmentOptions.find(opt => 
    opt.name === employee.department || opt.path === employee.department
  );

  // 如果找到了对应的部门，设置默认值
  React.useEffect(() => {
    if (currentDepartment && !form.getValues('departmentId')) {
      form.setValue('departmentId', currentDepartment.id);
    }
  }, [currentDepartment, form]);

  // 当员工数据变化时，更新表单的所有字段值
  React.useEffect(() => {
    form.setValue('email', employee.email || '');
    form.setValue('phoneNumber', employee.phoneNumber || '');
    form.setValue('employmentStatus', employee.status === 'active' ? 'Active' : 'Departed');
    form.setValue('hireDate', employee.joinDate || '');
    form.setValue('terminationDate', employee.leaveDate || '');
    
    // 重新查找并设置部门
    const dept = departmentOptions.find(opt => 
      opt.name === employee.department || opt.path === employee.department
    );
    if (dept) {
      form.setValue('departmentId', dept.id);
    }
  }, [employee, departmentOptions, form]);

  const handleSubmit = async (data: UpdateEmployeeRequest) => {
    // 如果离职日期为空，从数据中移除
    const submitData = { ...data };
    if (!submitData.terminationDate) {
      delete submitData.terminationDate;
    }
    // 如果邮箱或手机号为空，设置为空字符串以便清空
    if (!submitData.email) {
      submitData.email = '';
    }
    if (!submitData.phoneNumber) {
      submitData.phoneNumber = '';
    }
    await onSubmit(submitData);
  };

  // 获取当前选中的部门
  const selectedDepartment = departmentOptions.find(opt => opt.id === form.watch('departmentId'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">姓名</label>
            <p className="text-lg font-medium">{employee.name}</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门</FormLabel>
                <FormControl>
                <DepartmentSelector
                  value={selectedDepartment || null}
                  onChange={(dept) => field.onChange(dept?.id || undefined)}
                  placeholder="选择部门"
                />
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          rules={{
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: '请输入有效的邮箱地址'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="请输入邮箱地址（可留空）"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          rules={{
            pattern: {
              value: /^1[3-9]\d{1,2}\*{4}\d{4}$/,
              message: '请输入脱敏手机号格式（如：138****7890）'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>手机号</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="请输入脱敏手机号（如：138****7890）"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="employmentStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>在职状态</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择在职状态" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">在职</SelectItem>
                  <SelectItem value="Departed">离职</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hireDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>入职日期</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terminationDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>离职日期</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '更新中...' : '更新员工'}
          </Button>
        </div>
      </form>
    </Form>
  );
}; 