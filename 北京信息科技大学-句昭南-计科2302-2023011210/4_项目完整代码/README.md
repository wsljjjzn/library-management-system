# LibraryHub 智能图书借阅管理系统

> **现代化、高可用、前后端分离与容器化一键部署的智能图书借阅管理平台**  
> 严格遵循实训/课程设计各阶段要求，配备完备的设计说明书、API规范、测试报告与审查文档。

---

## 目录索引与必须交付文档导航

本项目按照规范化工程标准，在 `docs/` 目录下完整沉淀了需求设计与开发阶段的全部 8 套规范化文档：

| 阶段 | 交付文档名称 | 文件路径 | 核心内容提要 |
| :---: | :--- | :--- | :--- |
| **3.4 需求设计** | **功能规格说明书 (Spec)** | [01_functional_specification_spec.md](file:///Users/juzhaonan/WORK/PROJECT/tesAICoding/docs/01_functional_specification_spec.md) | 业务背景、用户角色(RBAC)、借还状态机流转、非功能需求 |
| **3.4 需求设计** | **系统架构设计说明书** | [02_system_architecture_design.md](file:///Users/juzhaonan/WORK/PROJECT/tesAICoding/docs/02_system_architecture_design.md) | 拓扑架构、逻辑分层、并发事务、安全体系、技术栈选型对比 |
| **3.4 需求设计** | **数据库设计说明书** | [03_database_design.md](file:///Users/juzhaonan/WORK/PROJECT/tesAICoding/docs/03_database_design.md) | Mermaid E-R实体关系图、表物理结构、索引设计、完整建表 DDL |
| **3.4 需求设计** | **API 接口设计说明书** | [04_api_interface_design.md](file:///Users/juzhaonan/WORK/PROJECT/tesAICoding/docs/04_api_interface_design.md) | RESTful API 规约、统一响应格式、错误码表、全量接口出入参 |
| **3.5 开发阶段** | **原型设计与页面布局** | [05_prototype_and_ui_layout.md](file:///Users/juzhaonan/WORK/PROJECT/tesAICoding/docs/05_prototype_and_ui_layout.md) | 布局骨架、线框原型设计、交互状态反馈、表单设计 |
| **3.4 需求设计** | **需求与设计阶段审查报告** | [06_design_review_report.md](file:///Users/juzhaonan/WORK/PROJECT/tesAICoding/docs/06_design_review_report.md) | 供导师评审的核查矩阵、风险评估防范预案、导师签字栏 |
| **3.5 开发阶段** | **系统测试文档与测试用例** | [07_system_test_documentation.md](file:///Users/juzhaonan/WORK/PROJECT/tesAICoding/docs/07_system_test_documentation.md) | 自动化集成测试用例矩阵、并发防超卖与逾期阻断测试、Pytest 日志 |
| **3.5 开发阶段** | **开发阶段审查与代码质量报告** | [08_code_review_and_qa_report.md](file:///Users/juzhaonan/WORK/PROJECT/tesAICoding/docs/08_code_review_and_qa_report.md) | 代码审查指标、SQL注入/XSS防御、安全合规度量与交付验收 |

---

## 核心技术栈

- **后端开发**：Python 3.11+ / FastAPI / SQLAlchemy 2.0 / Pydantic v2 / Uvicorn / Pytest
- **前端开发**：Vue 3 (Composition API) / Vite 5 / Element Plus / Pinia / Vue Router 4 / Axios / ECharts
- **数据库**：SQLite 3 (开启 WAL 预写日志并发模式与原子条件更新锁)
- **容器化与网关**：Docker / Docker Compose / Nginx (静态资源路由与动态反向代理)

---

## 预置系统体验账号

初次启动或容器部署后，系统将自动创建初始表结构并填充初始种子数据（包含示范图书、各类目与借还流水）：

| 角色类型 | 登录账号 | 登录密码 | 默认权限与职责 |
| :--- | :--- | :--- | :--- |
| **系统管理员** | `admin` | `admin123` | 全局最高权限：读者证额度管理、账号冻结/解冻、大屏看板监控 |
| **图书管理员** | `librarian` | `lib123` | 日常业务权限：新书采编入库、图书修改下架、分类管理、代办还书核销 |
| **注册读者** | `reader` | `reader123` | 读者服务：图书多维检索、在线一键借阅、我的在借档案、一键续借与还书 |

*注：读者亦可在前台登录页点击【读者自助注册】即刻开通专属借书证卡号。*

---

## 部署与远程访问指南 (方案一：Docker 推荐)

本项目已完成全套容器化封装，支持在任何安装了 Docker 的远程 Linux 云服务器（如阿里云、腾讯云、华为云、AWS、自建服务器）上一键启动：

### 1. 确保云服务器防火墙与安全组端口开放
在服务器安全组中，添加入方向放行规则：
- **8080** 端口（TCP，前端 Nginx 访问端口）

### 2. 将项目上传至服务器
```bash
# 在服务器终端克隆或上传解压本项目文件夹
cd tesAICoding
```

### 3. 一键执行部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```
或者直接使用 Docker Compose 运行：
```bash
docker compose up -d --build
```

### 4. 远程访问与验证
部署完成后，直接在任意联网终端的浏览器输入：
- **Web 前端访问地址**：`http://<您的服务器公网IP>:8080`
- **后端交互式 API 文档 (Swagger)**：`http://<您的服务器公网IP>:8080/api/v1/docs`

---

## 本地开发调试运行指南 (方案二：原生本地启动)

### 1. 启动后端 API 服务
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- 后端服务运行在：`http://127.0.0.1:8000`
- API 文档位于：`http://127.0.0.1:8000/docs`

### 2. 执行后端自动化测试套件
```bash
PYTHONPATH=backend pytest backend/tests/test_api.py -v
```

### 3. 启动前端 Vue 3 工程
```bash
cd frontend
npm install
npm run dev
```
- 前端本地访问地址：`http://localhost:5173`

---

## 答辩与验收主要功能截图记录指南

根据任务要求：“如果远程服务器环境受限确实有困难，可采用主要功能截图记录的方式”，建议依序截取以下核心业务界面的清晰全屏截图并附于实训报告中：

1. **系统登录与读者注册界面**：展示账号登录、体验账号填充、读者自助开通借书卡选项卡。
2. **仪表盘大屏看板界面**：展示馆藏种数、在架册数、当前借阅、超期警示4大指标卡片及近 7 天借还流转趋势折线图与读者热门借阅排行榜 Top 8。
3. **馆藏书目检索与编目管理**：展示多条件检索栏（关键词、分类、在架筛选）、图书列表（封面、ISBN、库存进度条、架位）以及新书入库编目登记对话框。
4. **读者在线借阅与一键续借**：展示读者发起借阅成功的即时反馈、借阅额度扣减，以及在“我的借阅档案”中进行“在线续借（延期30天）”与自主还书流程。
5. **超期逾期提醒与催还管理**：展示单据逾期时的超期天数计算、违约滞纳金标记与借阅权限熔断阻断警示。
6. **全馆借还流转监控大厅**：展示管理员多维度查询全校借还流水，以及柜台代还验收核销操作。
7. **读者借书证与额度管理**：展示读者卡号管理、在借上限设置（如5本调至10本）、账号冻结与解冻操作。
8. **自动化测试运行结果截图**：终端运行 `pytest` 7 项用例全部 PASSED 通过的控制台结果。
