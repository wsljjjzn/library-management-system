# 图书借阅管理系统 (LibraryHub) API 接口设计说明书

- **文档版本**：v1.0.0
- **编制日期**：2026-10-21
- **状态**：已评审 / 实施阶段
- **基础路径**：`/api/v1`
- **通信协议**：HTTP / HTTPS (RESTful + JSON)

---

## 1. 接口设计原则与通用规约

1. **RESTful 资源定位**：使用名词表示资源，使用标准 HTTP 动词操作（`GET` 查询、`POST` 创建、`PUT` 全量/幂等修改、`DELETE` 删除）。
2. **身份鉴权**：
   - 保护接口需在请求头携带：`Authorization: Bearer <JWT_ACCESS_TOKEN>`。
   - 未授权返回 HTTP 401，越权访问返回 HTTP 403。
3. **统一响应结构**：
   无论成功或失败，API 返回统一包裹结构的 JSON：
   ```json
   {
     "code": 200,
     "message": "success",
     "data": {}
   }
   ```
4. **统一错误码定义**：

| HTTP Status | 业务 code | 描述与含义 | 典型触发场景 |
| :--- | :--- | :--- | :--- |
| `200 OK` | `200` | 操作成功 | 正常返回业务数据 |
| `400 Bad Request` | `400` | 业务逻辑前置拒绝 | 库存不足、借阅额度已满、存在逾期图书阻断 |
| `401 Unauthorized` | `401` | 未提供身份凭据或凭据已失效 | Token 过期、密码错误 |
| `403 Forbidden` | `403` | 权限不足 | 普通读者访问管理员后台接口 |
| `404 Not Found` | `404` | 目标资源不存在 | 查询的图书 ID 或借阅流水号不存在 |
| `422 Unprocessable`| `422` | 参数格式校验失败 | 邮箱格式非法、必填字段缺失 |
| `500 Server Error` | `500` | 服务器内部未捕获异常 | 数据库死锁、外部系统崩溃 |

---

## 2. 接口端点全览

### 2.1 认证与个人中心模块 (`/api/v1/auth`)

#### 1) 读者自主注册
- **URL**: `POST /api/v1/auth/register`
- **权限**: 公开无需登录
- **请求体**:
  ```json
  {
    "username": "zhangsan",
    "password": "Password123!",
    "full_name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000"
  }
  ```
- **响应体**:
  ```json
  {
    "code": 200,
    "message": "注册成功",
    "data": {
      "id": 2,
      "username": "zhangsan",
      "full_name": "张三",
      "role": "reader",
      "card_number": "CARD-20261021-4921",
      "max_borrow_count": 5
    }
  }
  ```

#### 2) 用户登录并换取 Token
- **URL**: `POST /api/v1/auth/login`
- **权限**: 公开
- **请求体**:
  ```json
  {
    "username": "zhangsan",
    "password": "Password123!"
  }
  ```
- **响应体**:
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer",
      "user": {
        "id": 2,
        "username": "zhangsan",
        "full_name": "张三",
        "role": "reader",
        "card_number": "CARD-20261021-4921"
      }
    }
  }
  ```

#### 3) 获取当前登录者信息
- **URL**: `GET /api/v1/auth/me`
- **权限**: 必须登录 (Bearer Token)
- **响应体**: 返回当前登录用户的完整个人资信、未还借阅数量、是否有超期限制。

---

### 2.2 图书分类模块 (`/api/v1/categories`)

- `GET /api/v1/categories`：获取全量分类列表（公开）
- `POST /api/v1/categories`：新增图书分类（需 `admin` 或 `librarian`）
- `PUT /api/v1/categories/{id}`：修改分类（需 `admin` 或 `librarian`）
- `DELETE /api/v1/categories/{id}`：删除分类（需检查该分类下是否仍有图书关联）

---

### 2.3 图书编目与检索模块 (`/api/v1/books`)

#### 1) 多条件分页检索图书列表
- **URL**: `GET /api/v1/books`
- **权限**: 公开
- **查询参数**:
  - `page`: 页码（默认 1）
  - `page_size`: 每页数量（默认 10，最大 100）
  - `keyword`: 模糊检索词（匹配书名、作者、ISBN）
  - `category_id`: 针对分类过滤（可选）
  - `available_only`: 是否只看在架可借图书（布尔值，可选）
- **响应体**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "total": 128,
      "items": [
        {
          "id": 1,
          "isbn": "9787111544937",
          "title": "深入理解计算机系统 (CS:APP)",
          "author": "Randal E. Bryant",
          "publisher": "机械工业出版社",
          "publish_date": "2016-11",
          "category_id": 1,
          "category_name": "计算机科学",
          "total_copies": 10,
          "available_copies": 7,
          "location": "3F-CS-02",
          "cover_url": "https://images.unsplash.com/photo-...",
          "summary": "从程序员的视角理解计算机系统的结构与本质..."
        }
      ]
    }
  }
  ```

#### 2) 图书详情查询
- **URL**: `GET /api/v1/books/{id}`
- **权限**: 公开

#### 3) 新增录入图书
- **URL**: `POST /api/v1/books`
- **权限**: `admin` 或 `librarian`
- **请求体**: 包含 ISBN、标题、作者、出版社、分类ID、总册数、架位、简介等。

#### 4) 更新图书资料
- **URL**: `PUT /api/v1/books/{id}`
- **权限**: `admin` 或 `librarian`

#### 5) 下架或删除图书
- **URL**: `DELETE /api/v1/books/{id}`
- **权限**: `admin`（要求 `available_copies == total_copies`，即全部在架方可安全移除）

---

### 2.4 借阅与归还管理模块 (`/api/v1/borrows`)

#### 1) 读者借阅图书
- **URL**: `POST /api/v1/borrows/borrow`
- **权限**: 必须登录 (`reader` / `librarian` / `admin`)
- **请求体**:
  ```json
  {
    "book_id": 1,
    "user_id": 2  // 可选，管理员代借时指定；普通读者则自动取当前登录ID
  }
  ```
- **核心校验逻辑**:
  1. 检查图书在架可借数是否 $> 0$；
  2. 检查用户是否有尚未解决的逾期图书；
  3. 检查用户在借图书总数是否达到上限；
- **响应体**:
  ```json
  {
    "code": 200,
    "message": "借阅成功",
    "data": {
      "record_no": "BR-20261021-93108",
      "book_title": "深入理解计算机系统 (CS:APP)",
      "borrow_date": "2026-10-21 08:30:00",
      "due_date": "2026-11-20 08:30:00",
      "status": "BORROWED"
    }
  }
  ```

#### 2) 归还图书
- **URL**: `POST /api/v1/borrows/return/{record_id}`
- **权限**: 借阅本人 或 管理员
- **业务处理**:
  - 判定是否超时，计算超期天数及滞纳金；
  - 变更记录状态为 `RETURNED`，记录归还时间；
  - 增加对应图书物理在架数量 `available_copies + 1`；
- **响应体**: 返回归还单据详情及结清罚金金额。

#### 3) 申请延期续借
- **URL**: `POST /api/v1/borrows/renew/{record_id}`
- **权限**: 借阅本人 或 管理员
- **业务限制**:
  - `status == 'BORROWED'` 且当前未超期；
  - `renew_count == 0`（仅允许续借一次，顺延30天）；
- **响应体**: 返回更新后的 `due_date`。

#### 4) 查询当前登录者的借阅记录
- **URL**: `GET /api/v1/borrows/my`
- **参数**: `status` 筛选 (`BORROWED`, `RETURNED`, `OVERDUE`)，分页参数 `page`, `page_size`。

#### 5) 全馆借还流转大厅监控
- **URL**: `GET /api/v1/borrows/all`
- **权限**: `admin` 或 `librarian`
- **参数**: 支持按读者借书卡号、图书名称、状态、起止时间综合检索。

---

### 2.5 统计看板与决策大屏 (`/api/v1/stats`)

#### 1) 宏观指标卡片数据
- **URL**: `GET /api/v1/stats/overview`
- **响应体**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "total_titles": 86,
      "total_volumes": 520,
      "available_volumes": 412,
      "borrowed_volumes": 108,
      "total_readers": 340,
      "active_borrows": 108,
      "overdue_borrows": 4
    }
  }
  ```

#### 2) 趋势与排行数据
- **URL**: `GET /api/v1/stats/trends`
- **响应体**: 返回近 7 天借书与还书数量曲线数据，以及借阅次数排名前 10 的热门图书榜单。
