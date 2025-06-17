// 认证相关API类型定义

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponsePayload { // 原LoginResponse，代表成功登录响应中的data部分
  token: string;
  userInfo: {
    id?: string; // id 字段可选
    username: string;
    name?: string; // 用户姓名
    role: string; // 用户角色：super_admin | regional_admin
    departmentPermissions?: Array<{
      departmentId: number;
      departmentName: string;
      permissionType: 'manage' | 'view';
    }>; // 多部门权限列表
  };
} 