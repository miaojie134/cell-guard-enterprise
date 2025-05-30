import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CreateEmployeeRequest } from '@/config/api';
import { DepartmentSelector } from '@/components/DepartmentSelector';
import { useDepartmentOptions } from '@/hooks/useDepartments';

interface AddEmployeeFormProps {
  onSubmit: (data: CreateEmployeeRequest) => Promise<void>;
  isLoading: boolean;
}

export const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const { options: departmentOptions } = useDepartmentOptions();
  
  const form = useForm<CreateEmployeeRequest>({
    defaultValues: {
      fullName: '',
      departmentId: undefined,
      email: '',
      phoneNumber: '',
      hireDate: '',
    },
  });

  const handleSubmit = async (data: CreateEmployeeRequest) => {
    await onSubmit(data);
  };

  // 获取当前选中的部门
  const selectedDepartment = departmentOptions.find(opt => opt.id === form.watch('departmentId'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          rules={{ required: '请输入姓名' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入员工姓名"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="departmentId"
          rules={{ required: '请选择部门' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门 *</FormLabel>
                <FormControl>
                <DepartmentSelector
                  value={selectedDepartment || null}
                  onChange={(dept) => field.onChange(dept?.id || undefined)}
                  placeholder="请选择部门"
                  required
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
            required: '请输入邮箱',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: '请输入有效的邮箱地址'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入邮箱地址"
                  type="email"
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
            required: '请输入手机号码',
            pattern: {
              value: /^1[3-9]\d{9}$/,
              message: '请输入有效的手机号码'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>手机号码 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入手机号码"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hireDate"
          rules={{ required: '请选择入职日期' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>入职日期 *</FormLabel>
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
            {isLoading ? '创建中...' : '创建员工'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
