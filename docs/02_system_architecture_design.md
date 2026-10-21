# 图书借阅管理系统 (LibraryHub) 系统架构设计说明书

- **文档版本**：v1.0.0
- **编制日期**：2026-10-21
- **状态**：已评审 / 实施阶段

---

## 1. 架构目标与设计原则

1. **前后端完全分离**：前端纯静态单页应用 (SPA)，后端提供高内聚、松耦合的标准 RESTful API 服务，前后端通过 JSON 进行数据交换。
2. **高可用与易维护**：后端分层明确（路由层、服务层、数据访问层、模型层），核心逻辑单元测试全覆盖。
3. **极简部署与开箱即用**：采用 Docker + Docker Compose 编排，支持本地、测试机及远程 Linux 云服务器“零配置一键上线”。
4. **轻量高性能**：选用现代化异步框架 Python FastAPI + Uvicorn，前端选用 Vue 3 + Vite，保障轻量化内存占用与瞬时加载体验。

---

## 2. 系统总体架构与拓扑

系统在生产服务器部署时，对外统一暴露 Web 标准端口（如 `80` 或自定义端口 `8080`），经由 Nginx 高性能反向代理分发静态资源与后端 API 请求。

```
                     +---------------------------------------+
                     |           客户端浏览器 (Browser)       |
                     |     (PC端 / 移动端 / 微信内置浏览器)   |
                     +-------------------+-------------------+
                                         |
                                         | HTTP / HTTPS (Port: 8080)
                                         v
+-----------------------------------------------------------------------------------+
|                        Docker Compose 容器化网络 (library_net)                     |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                          Nginx 前端反向代理容器                            |   |
|   |                     (library-frontend: Port 80)                           |   |
|   |                                                                           |   |
|   |   +----------------------------+       +------------------------------+   |   |
|   |   |  Vue 3 SPA 静态资源集群    |       |   /api/v1/* 动态代理转发      |   |   |
|   |   |  (HTML / JS / CSS / 图标)  |       |   (Proxy Pass to Backend)    |   |   |
|   |   +----------------------------+       +---------------+--------------+   |   |
|   +--------------------------------------------------------|------------------+   |
|                                                            |                      |
|                                                            | HTTP (Port: 8000)    |
|                                                            v                      |
|   +---------------------------------------------------------------------------+   |
|   |                         FastAPI 后端应用容器                              |   |
|   |                     (library-backend: Port 8000)                          |   |
|   |                                                                           |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |   | 控制层 (API Endpoints): Auth / Books / Borrows / Users / Stats   |   |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |   | 业务逻辑层 (Services): 借还事务计算 / 逾期惩戒 / 库存原子并发控制  |   |   |
|   |   +-------------------------------------------------------------------+   |   |
|   |   | 数据访问层 (SQLAlchemy 2.0 ORM + Pydantic v2 Schema 校验)         |   |   |
|   |   +---------------------------------+---------------------------------+   |   |
|   +-------------------------------------|-------------------------------------+   |
|                                         |                                         |
|                                         | 本地持久化挂载 (/app/data)               |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |                      宿主机数据卷 (Docker Volume: app_data)               |   |
|   |                              library.db (SQLite3)                         |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 3. 技术栈选型明细

### 3.1 后端技术栈 (Backend)
- **核心开发语言**：Python 3.11+
- **Web 框架**：FastAPI (基于 Starlette 和 Pydantic，执行效率逼近 NodeJS 与 Go)
- **ASGI 服务器**：Uvicorn (基于 uvloop，高性能异步事件驱动)
- **ORM 框架**：SQLAlchemy 2.0 (采用现代 2.0 声明式模型语法，事务控制严谨)
- **数据序列化与验证**：Pydantic v2 (Rust 核心驱动，极致类型安全校验)
- **认证与安全**：
  - Passlib (`bcrypt`)：工业级单向安全哈希算法
  - PyJWT：JSON Web Token 签名生成与载荷校验
- **自动化测试**：Pytest + HTTPX TestClient
- **数据库**：SQLite 3 (具备 ACID 特性，WAL 预写日志模式，高并发读能力强，无额外运维成本)

### 3.2 前端技术栈 (Frontend)
- **核心框架**：Vue 3 (基于 Composition API + `<script setup>`)
- **构建工具**：Vite 5 (基于 Rollup 与原生 ESM 极速热更新构建)
- **UI 组件库**：Element Plus (成熟现代的企业级 UI 体系，全面适配图书管理场景)
- **路由管理**：Vue Router 4 (具备基于角色的动态路由、全局路由前置守卫与登录鉴权)
- **状态管理**：Pinia 2 (轻量模块化 Store，管理用户状态、Token 与全局配置)
- **数据交互**：Axios (封装全局请求拦截器、自动附加 Bearer Token、统一错误提示)
- **图标系统**：`@element-plus/icons-vue`
- **图表展示**：ECharts 5 / 轻量原生 SVG 统计组件

### 3.3 部署与运维栈 (DevOps)
- **容器引擎**：Docker & Docker Engine
- **多容器编排**：Docker Compose v2
- **网关代理**：Nginx (Alpine-based，开启 gzip 压缩、缓存控制及单页 History 模式路由重定向)

---

## 4. 后端模块逻辑分层设计

后端项目遵循清晰的整洁架构 (Clean Architecture) 原则：

```
backend/app/
├── core/                  # 基础设施与核心配置
│   ├── config.py          # 环境变量与系统配置加载 (BaseSettings)
│   ├── security.py        # 密码加密 (hash/verify)、JWT 生成与解码
│   └── deps.py            # FastAPI 依赖注入 (get_db, get_current_user, check_role)
├── db/                    # 数据库连接与生命周期
│   ├── session.py         # SQLAlchemy 引擎实例化与 Session 工厂
│   └── base.py            # ORM Base 基类与表模型统一导出
│   └── init_db.py         # 系统初次启动自动化种子数据 (预置管理员、分类、示范图书)
├── models/                # 关系映射实体类 (ORM Models)
│   ├── user.py            # 用户表 (User)
│   ├── category.py        # 图书分类表 (Category)
│   ├── book.py            # 图书表 (Book)
│   └── borrow.py          # 借阅记录表 (BorrowRecord)
├── schemas/               # 数据传输对象 (Pydantic DTO / Schemas)
│   ├── user.py            # 用户请求/响应模型
│   ├── book.py            # 图书创建/编辑/列表过滤模型
│   ├── borrow.py          # 借还请求/响应模型
│   └── token.py           # 登录鉴权返回模型
├── services/              # 领域业务服务 (Business Services)
│   ├── auth_service.py    # 注册、登录核验、凭据签发
│   ├── book_service.py    # 检索过滤、库存变更、上架下架
│   ├── borrow_service.py  # 借阅判定、库存扣减、还书核算、逾期统计
│   └── stats_service.py   # 看板统计数据聚合与热点排名
└── api/v1/                # 表现层接口路由
    ├── endpoints/         # 具体端点模块
    │   ├── auth.py
    │   ├── books.py
    │   ├── borrows.py
    │   ├── categories.py
    │   ├── users.py
    │   └── stats.py
    └── api.py             # 统一路由汇聚与版本前缀 (/api/v1)
```

---

## 5. 安全体系架构设计

1. **身份认证 (Authentication)**：
   - 客户端携带账号密码请求 `/api/v1/auth/login`。
   - 后端使用 `bcrypt.verify` 比对散列密文。
   - 验证成功生成带有过期时间 (Exp: 24小时) 及用户 ID 和角色的 JWT。
   - 客户端存储在 LocalStorage 中，后续请求在 `Authorization` 头中携带 `Bearer <token>`。
2. **细粒度角色授权 (RBAC)**：
   - 使用 FastAPI 的 Dependency Injection 机制定义 `RoleChecker(["admin", "librarian"])`。
   - 未登录请求返回 `401 Unauthorized`；越权请求返回 `403 Forbidden`。
3. **数据一致性与事务隔离**：
   - SQLite 默认启用 WAL (Write-Ahead Logging) 模式，彻底解除读写冲突。
   - 在图书借出时，开启原子事务：检查并在同事务内完成 `available_copies = available_copies - 1`，避免多用户并发借走最后一本书的超借（Race Condition）隐患。
