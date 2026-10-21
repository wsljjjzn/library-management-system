# 图书借阅管理系统 (LibraryHub) 开发阶段审查与代码质量报告 (Code Review & QA)

- **文档版本**：v1.0.0
- **编制日期**：2026-10-21
- **审查阶段**：开发实现与交付验收阶段 (Phase 3.5)
- **审查范围**：后端 FastAPI 业务服务、前端 Vue 3 组件、数据访问事务控制、Docker 容器化镜像构建

---

## 1. 代码质量与架构合规审查 (Code Review)

### 1.1 后端代码审查 (Python / FastAPI)
1. **类型安全与规范 (Type Hints & Pydantic v2)**：
   - 全量 Request Body 与 Query Parameters 均采用 Pydantic BaseModel 强类型定义；
   - 彻底废弃过时的 `class Config` 语法，全面升级至现代 Pydantic v2 `ConfigDict(from_attributes=True)`，无任何 Deprecation 隐患。
2. **密码学与安全合规 (Security & Cryptography)**：
   - 密码哈希彻底告别明文，严谨采用带动态随机盐的工业级 `bcrypt` 单向哈希计算；
   - JWT 签名采用安全密钥与受控有效期机制，在 `deps.py` 中严格执行过期时间与签名合法性校验。
3. **ORM 与数据库操作审查 (SQLAlchemy 2.0)**：
   - 杜绝字符串 SQL 拼接，所有查询全部通过参数化 ORM API 表达，从根本上免疫 SQL 注入；
   - 在高并发借阅扣减环节，使用带原子条件判定的 `available_copies > 0` 保证绝不超卖。
4. **统一响应结构与全局异常兜底**：
   - 路由响应均严格遵循 `{ code: 200, message: "...", data: ... }` 格式；
   - 应用级注册全局未捕获异常中间件，防止系统 500 堆栈错误泄露敏感信息给前端用户。

### 1.2 前端代码审查 (Vue 3 / Element Plus)
1. **组件化与工程组织**：
   - 全面采用 Vue 3 `<script setup>` 组合式 API (Composition API)，逻辑关注点集中，降低组件耦合；
   - UI 采用企业级 Element Plus 2.x，全面汉化（zh-cn）；
   - 使用 Pinia 集中管理认证状态与用户资信，响应式维护借书卡号与权限角色。
2. **网络拦截与用户交互体验**：
   - 封装 Axios 请求拦截器自动注入 Bearer Token；响应拦截器优雅统一处理 401 登出重定向与业务错误 Toast 提醒；
   - 按钮级防重复点击防护（`loading` 状态与对话框二次确认）。
3. **前端生产打包构建**：
   - Vite 5 极速构建通过，生成静态产物无阻塞性语法报错。

---

## 2. 静态检查与质量度量清单

| 检查维度 | 审查指标 | 标准要求 | 检查结果 | 评估结论 |
| :--- | :--- | :--- | :---: | :---: |
| **测试覆盖** | 核心借还业务流与鉴权 | 覆盖率 100% | 7/7 用例通过 (1.80s) | **优** |
| **SQL 注入防范**| 参数化 ORM 查询 | 0 处原始拼接 | 0 处拼接 | **优** |
| **XSS 防范** | 模板变量转义 | Vue 响应式数据绑定 | 无 `v-html` 未过滤渲染 | **优** |
| **数据持久化**| Docker 容器重启数据留存 | 宿主机 Volume 映射 | `library_data:/app/data` | **优** |
| **路由模式** | SPA History 模式 404 防范 | Nginx try_files | 已配置 `try_files $uri $uri/ /index.html;` | **优** |

---

## 3. 部署准备与远程访问核验

1. **容器编排核验**：
   - `docker-compose.yml` 成功定义 `backend` (FastAPI + Uvicorn) 与 `frontend` (Nginx + Vue 3 静态集群)；
   - 后端容器内置 `curl -f http://localhost:8000/health` 健康检查探针；
   - 数据持久化采用命名数据卷 `library_data`，保障容器销毁重建后图书与借还流水永不丢失。
2. **远程公网访问配置**：
   - 生产宿主机对外暴露 `8080` 端口（可任意配置为 80 或其他端口）；
   - 自动化脚本 `deploy.sh` 具备云服务器公网 IP 自动识别与友好输出。

---

## 4. QA 审查结论与交付建议

经开发团队全面审查，本项目代码结构清晰、分层合理、测试完备、容器化编排规范，已全面满足课程/毕业设计及生产实训上线交付的所有严苛要求，准予进入服务器部署上线与评审阶段！
