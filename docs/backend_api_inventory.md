# 后端接口（新盘点与员工端）

说明：以下为新增/改造接口草稿，路径均以 `/api/v1` 为前缀，返回统一使用 `{"code":0,"message":"","data":...}`。

## 认证（员工端）

- `GET /employee-auth/hint?email=alice@corp.com`
  - 功能：根据邮箱返回手机号前三位用于提示。
  - 响应：
  ```json
  {
    "code": 0,
    "data": { "exists": true, "phonePrefix": "138" }
  }
  ```
- `POST /employee-auth/login`
  - 入参：
  ```json
  { "email": "alice@corp.com", "last4": "9077" }
  ```
  - 逻辑：匹配员工邮箱，校验该员工 `phoneNumber` 末4位；成功后颁发 JWT（aud=employee），返回员工信息。
  - 响应：
  ```json
  {
    "code": 0,
    "data": {
      "token": "jwt-token",
      "employee": {
        "employeeId": "EMP0000123",
        "fullName": "Alice",
        "email": "alice@corp.com"
      }
    }
  }
  ```

## 盘点管理（管理端）

- `POST /inventory/tasks`
  - 说明：创建盘点任务。
  - 入参：
  ```json
  {
    "name": "Q2 号码盘点",
    "scopeType": "department_ids",      // department_ids | employee_ids
    "scopeValues": ["1001","1002"],     // 部门ID或员工ID列表
    "dueAt": "2024-12-31T16:00:00Z",    // 截止时间
    "note": "第二季度全员盘点"
  }
  ```
  - 响应：`{ "code":0, "data": { "taskId":"uuid" } }`

- `GET /inventory/tasks`
  - 查询参数：`page, limit, status(pending|in_progress|completed|closed), scopeType, keyword, createdFrom, createdTo`.
  - 响应：
  ```json
  {
    "code": 0,
    "data": {
      "items": [
        {
          "id": "uuid",
          "name": "Q2 号码盘点",
          "scopeType": "department_ids",
          "dueAt": "2024-12-31T16:00:00Z",
          "status": "in_progress",
          "summary": {
            "total": 120,
            "confirmed": 70,
            "unavailable": 5,
            "pending": 45,
            "unlistedReported": 3
          },
          "createdAt": "2024-10-10T02:00:00Z"
        }
      ],
      "pagination": { "page":1, "limit":20, "total":1 }
    }
  }
  ```

- `GET /inventory/tasks/{taskId}`
  - 功能：获取任务概览（含统计）。
  - 响应同上单条 `summary`，附加 `scopeValues`、`note`、`createdBy`。

- `GET /inventory/tasks/{taskId}/items`
  - 功能：查看某任务下的号码项（管理员查看）。
  - 查询参数：`page, limit, status(pending|confirmed|unavailable)`.
  - 响应：
  ```json
  {
    "code":0,
    "data":{
      "items":[
        {
          "itemId": 101,
          "mobileNumberId": 9,
          "phoneNumber": "13800009077",
          "employeeId": "EMP0000123",
          "employeeName": "Alice",
          "department": "销售部",
          "status": "pending",
          "purpose": "销售业务",
          "comment": null,
          "updatedAt": "2024-10-10T03:00:00Z"
        }
      ],
      "pagination":{"page":1,"limit":20,"total":1}
    }
  }
  ```

## 盘点（员工端）

- `GET /employee/inventory/tasks/active`
  - 功能：列出当前员工待处理的任务。
  - 响应：
  ```json
  {
    "code":0,
    "data":[
      {
        "id":"uuid",
        "name":"Q2 号码盘点",
        "dueAt":"2024-12-31T16:00:00Z",
        "progress":{"total":10,"done":6,"pending":4},
        "submitted": false,
        "unreadMessages": 1
      }
    ]
  }
  ```

- `GET /employee/inventory/tasks/{taskId}/items?page=1&limit=10`
  - 功能：获取任务内待盘点号码列表。
  - 响应：同管理员版，但仅含本人名下号码，含当前状态/用途。

- `PATCH /employee/inventory/tasks/{taskId}/items/{itemId}`
  - 功能：对单个号码执行操作。
  - 入参：
  ```json
  {
    "action": "confirm",                 // confirm | unavailable
    "purpose": "销售业务",               // confirm 时必填
    "comment": "设备丢失，已销卡"        // unavailable 时建议填
  }
  ```
  - 响应：`{ "code":0, "data": { "status":"confirmed" } }`

- `POST /employee/inventory/tasks/{taskId}/unlisted`
  - 功能：上报未列出的号码。
  - 入参：
  ```json
  { "phoneNumber": "13911112222", "purpose": "备用机", "comment": "个人购买但用于工作" }
  ```

- `POST /employee/inventory/tasks/{taskId}/submit`
  - 功能：标记该任务已完成（本员工）。
  - 响应：`{ "code":0, "data": { "submitted": true } }`

## 员工资产操作

- `GET /employee/mobile-numbers?page=1&limit=10`
  - 功能：员工查看自己名下号码，复用现有列表字段（phoneNumber/status/purpose/vendor/remarks）。

- `POST /employee/mobile-numbers/{id}/deactivate-request`
  - 功能：员工发起停机申请。
  - 入参（可选）：`{ "comment": "设备损坏" }`
  - 逻辑：号码状态置为 `pending_deactivation`，记录申请日志。

## 转移申请

- `POST /transfer-requests`
  - 功能：员工发起号码转移。
  - 入参：
  ```json
  { "mobileNumberId": 9, "toEmployeeId": "EMP0000456", "remark": "岗位调整" }
  ```

- `GET /transfer-requests/pending`
  - 功能：我待处理的转移请求（作为接收人）。

- `POST /transfer-requests/{id}/accept`
- `POST /transfer-requests/{id}/reject`
  - 功能：接收人接受/拒绝。接受时调用分配，状态改为 `in_use`，记录历史；拒绝保留 remark。

## 消息中心（员工端）

- `GET /employee/notifications?page=1&limit=20`
  - 返回通知列表（类型：`inventory_task_assigned`、`transfer_request` 等），字段：`id,title,content,type,createdAt,read`.
- `PATCH /employee/notifications/{id}/read`
- `GET /employee/notifications/unread-count`

## 数据结构要点

- 盘点任务状态：`pending | in_progress | completed | closed`
- 盘点项状态：`pending | confirmed | unavailable`
- 通用时间格式：ISO8601 UTC 字符串（例：`2024-10-10T02:00:00Z`）。

