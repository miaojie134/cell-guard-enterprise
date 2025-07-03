# Cell Guard Enterprise 部署指南

## 📋 项目概述

企业级手机号码管理 web 系统，提供手机号码分配、员工管理、部门管理等功能。

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5.x
- **UI 组件库**: shadcn/ui + Radix UI
- **样式框架**: Tailwind CSS
- **状态管理**: Zustand + React Query
- **路由**: React Router DOM
- **表单处理**: React Hook Form + Zod
- **图表**: Recharts

## 📋 系统要求

### 基础环境要求

- **Node.js**: >= 18.0.0 (推荐 18.x LTS)
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **服务器**: Linux/Windows/macOS
- **Web 服务器**: Nginx/Apache (生产环境推荐)

### 后端服务要求

- 后端服务需运行并可通过 API 访问
- 默认后端地址: `http://localhost:8081`
- API 基础路径: `/api/v1`

## 🚀 部署流程

### 1. 代码获取

```bash
# 克隆项目
git clone <your-repository-url>
cd cell-guard-enterprise

# 检查分支
git branch -a
git checkout main
```

### 2. 依赖安装

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

```

### 3. 环境配置

在项目根目录创建环境配置文件：

#### 开发环境 (.env.development)

```env
# API 配置
VITE_API_BASE_URL=http://localhost:8081/api/v1
VITE_APP_TITLE=Cell Guard Enterprise (开发)

# 其他配置
VITE_DEBUG=true
```

#### 生产环境 (.env.production)

```env
# API 配置 - 根据实际后端地址修改
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
VITE_APP_TITLE=Cell Guard Enterprise

# 生产环境配置
VITE_DEBUG=false
```

### 4. 构建配置

#### 开发构建

```bash
# 开发模式构建（包含 debug 信息）
npm run build:dev
```

#### 生产构建

```bash
# 生产模式构建（优化版本）
npm run build
```

构建产物将生成在 `dist/` 目录中。

### 5. 本地测试

```bash
# 启动开发服务器
npm run dev

# 预览生产构建
npm run preview
```

## 📦 部署方案

### Nginx 部署

#### 1. 构建项目

```bash
npm run build
```

#### 2. 上传构建产物

将 `dist/` 目录中的所有文件上传到服务器的 web 根目录：

```bash
# 示例：使用 scp 上传
scp -r dist/* user@your-server:/var/www/html/
```

#### 3. Nginx 配置

创建或编辑 Nginx 配置文件 `/etc/nginx/sites-available/cell-guard-enterprise`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API 代理（如果后端和前端在同一服务器）
    location /api/ {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS 处理
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全配置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 4. 启用站点

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/cell-guard-enterprise /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx
```

#### 3. 启用站点

```bash
# 启用站点
sudo a2ensite cell-guard-enterprise
sudo a2enmod rewrite headers proxy proxy_http
sudo systemctl restart apache2
```

### API 配置

系统使用代理方式处理 API 请求，需要确保：

1. **开发环境**: Vite 开发服务器已配置代理到 `localhost:8081`
2. **生产环境**: Web 服务器（Nginx/Apache）需要配置 API 代理
3. **API 基础路径**: `/api/v1`

### 权限配置

系统支持多级权限管理：

- `super_admin`: 超级管理员
- `regional_admin`: 区域管理员
- 部门级权限: `manage` | `view`

确保后端提供正确的权限数据结构。

### 环境变量配置

| 变量名              | 说明          | 示例值                               |
| ------------------- | ------------- | ------------------------------------ |
| `VITE_API_BASE_URL` | 后端 API 地址 | `https://api.yourcompany.com/api/v1` |
| `VITE_APP_TITLE`    | 应用标题      | `Cell Guard Enterprise`              |
| `VITE_DEBUG`        | 调试模式      | `false`                              |

## 📊 性能优化

### 1. 构建优化

在 `vite.config.ts` 中添加优化配置：

```typescript
export default defineConfig({
  build: {
    // 分包策略
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-select"],
          utils: ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
    // 压缩配置
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

### 2. 缓存策略

```nginx
# 在 Nginx 中设置缓存
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(png|jpg|jpeg|gif|ico|svg)$ {
    expires 6M;
    add_header Cache-Control "public";
}
```

## 🔄 更新部署

### 标准更新流程

```bash
# 1. 备份当前版本
sudo cp -r /var/www/html /var/www/html.backup.$(date +%Y%m%d_%H%M%S)

# 2. 获取最新代码
git pull origin main

# 3. 安装依赖（如有更新）
npm install

# 4. 构建新版本
npm run build

# 5. 部署新版本
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# 6. 重启服务（如需要）
sudo systemctl reload nginx
```
