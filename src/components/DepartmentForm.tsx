import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DepartmentSelector } from '@/components/DepartmentSelector';
import { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from '@/config/api';
import { useDepartmentOptions } from '@/hooks/useDepartments';

interface DepartmentFormProps {
  department?: Department;
  onSubmit: (data: CreateDepartmentPayload | UpdateDepartmentPayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { options: departmentOptions } = useDepartmentOptions();
  const isEdit = !!department;

  const form = useForm<CreateDepartmentPayload | UpdateDepartmentPayload>({
    defaultValues: {
      name: department?.name || '',
      description: department?.description || '',
      parentId: department?.parentId || undefined,
      ...(isEdit && { isActive: department?.isActive ?? true }),
    },
  });

  const handleSubmit = async (data: CreateDepartmentPayload | UpdateDepartmentPayload) => {
    await onSubmit(data);
  };

  // 过滤部门选项，避免循环引用
  const availableDepartmentOptions = departmentOptions.filter(opt => {
    // 编辑时，排除当前部门（避免将自己设为上级）
    if (isEdit && department && opt.id === department.id) {
      return false;
    }
    // 可以添加更多过滤逻辑，比如排除子部门等
    return true;
  });

  // 获取当前选中的上级部门
  const selectedParent = availableDepartmentOptions.find(opt => opt.id === form.watch('parentId'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: '请输入部门名称' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门名称 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="请输入部门名称"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入部门描述（可选）"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>上级部门</FormLabel>
              <FormControl>
                <DepartmentSelector
                  value={selectedParent || null}
                  onChange={(dept) => field.onChange(dept?.id || undefined)}
                  options={availableDepartmentOptions}
                  placeholder="选择上级部门（可选）"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEdit && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">部门状态</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    启用或停用此部门
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEdit ? '更新中...' : '创建中...') : (isEdit ? '更新' : '创建')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DepartmentForm; 