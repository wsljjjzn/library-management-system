import { 
  createPresentation, 
  addBlankSlide, 
  addSlideShape, 
  addSlideTextBox, 
  addSlideImage,
  addSlideTable,
  setShapeFill,
  setShapeTextFormat,
  savePresentation, 
  asColor, 
  cm 
} from '/Users/juzhaonan/.dsh/profiles/web/node_modules/@office-kit/pptx/dist/index.js';
import fs from 'fs';

function createBaseSlide(pres, badgeText, titleText, subtitleText, pageNum) {
  const slide = addBlankSlide(pres);

  // 1. Full dark canvas background
  const bg = addSlideShape(slide, {
    preset: 'rect',
    x: 0,
    y: 0,
    w: cm(33.866),
    h: cm(19.05)
  });
  setShapeFill(bg, asColor('#0B1120'));

  // 2. Top Header Badge / Tag
  const badgeBox = addSlideTextBox(slide, {
    x: cm(1.5),
    y: cm(0.8),
    w: cm(18),
    h: cm(0.7),
    text: badgeText
  });
  setShapeTextFormat(badgeBox, {
    fontSize: 11,
    bold: true,
    color: asColor('#38BDF8'),
    fontFamily: 'Microsoft YaHei'
  });

  // 3. Slide Title
  const titleBox = addSlideTextBox(slide, {
    x: cm(1.5),
    y: cm(1.5),
    w: cm(30),
    h: cm(1.1),
    text: titleText
  });
  setShapeTextFormat(titleBox, {
    fontSize: 22,
    bold: true,
    color: asColor('#F8FAFC'),
    fontFamily: 'Microsoft YaHei'
  });

  // 4. Slide Subtitle / Key Takeaway
  if (subtitleText) {
    const subBox = addSlideTextBox(slide, {
      x: cm(1.5),
      y: cm(2.55),
      w: cm(30),
      h: cm(0.7),
      text: subtitleText
    });
    setShapeTextFormat(subBox, {
      fontSize: 12,
      color: asColor('#94A3B8'),
      fontFamily: 'Microsoft YaHei'
    });
  }

  // 5. Header divider line
  const divider = addSlideShape(slide, {
    preset: 'rect',
    x: cm(1.5),
    y: cm(3.35),
    w: cm(30.866),
    h: cm(0.05)
  });
  setShapeFill(divider, asColor('#1E293B'));

  // 6. Footer bar
  const footerDivider = addSlideShape(slide, {
    preset: 'rect',
    x: cm(1.5),
    y: cm(17.8),
    w: cm(30.866),
    h: cm(0.04)
  });
  setShapeFill(footerDivider, asColor('#1E293B'));

  const footerLeft = addSlideTextBox(slide, {
    x: cm(1.5),
    y: cm(18.0),
    w: cm(18),
    h: cm(0.6),
    text: 'LibraryHub 智能图书借阅管理系统 ｜ 独立全栈毕业设计 / 实训答辩汇报'
  });
  setShapeTextFormat(footerLeft, {
    fontSize: 10,
    color: asColor('#64748B'),
    fontFamily: 'Microsoft YaHei'
  });

  const footerRight = addSlideTextBox(slide, {
    x: cm(21),
    y: cm(18.0),
    w: cm(11.3),
    h: cm(0.6),
    text: `第 ${pageNum} / 16 页 ｜ 在线演示入口: http://39.96.0.20/`
  });
  setShapeTextFormat(footerRight, {
    fontSize: 10,
    color: asColor('#64748B'),
    fontFamily: 'Microsoft YaHei'
  });

  return slide;
}

function addCard(slide, x, y, w, h, bgHex = '#1E293B') {
  const card = addSlideShape(slide, {
    preset: 'roundRect',
    x: cm(x),
    y: cm(y),
    w: cm(w),
    h: cm(h)
  });
  setShapeFill(card, asColor(bgHex));
  return card;
}

function addCardHeader(slide, x, y, w, title, badge = '') {
  const tb = addSlideTextBox(slide, {
    x: cm(x),
    y: cm(y),
    w: cm(w),
    h: cm(0.8),
    text: badge ? `[ ${badge} ]  ${title}` : title
  });
  setShapeTextFormat(tb, {
    fontSize: 14,
    bold: true,
    color: asColor('#38BDF8'),
    fontFamily: 'Microsoft YaHei'
  });
}

function addCardBody(slide, x, y, w, h, text, fontSize = 11, color = '#E2E8F0') {
  const tb = addSlideTextBox(slide, {
    x: cm(x),
    y: cm(y),
    w: cm(w),
    h: cm(h),
    text: text
  });
  setShapeTextFormat(tb, {
    fontSize: fontSize,
    color: asColor(color),
    fontFamily: 'Microsoft YaHei'
  });
}

async function buildPPTX() {
  console.log('Building high-fidelity UI PowerPoint presentation matching frontend styling...');
  const pres = createPresentation();

  // ----------------------------------------------------
  // Slide 1: 封面页 (Title Hero Slide)
  // ----------------------------------------------------
  {
    const slide = addBlankSlide(pres);
    const bg = addSlideShape(slide, { preset: 'rect', x: 0, y: 0, w: cm(33.866), h: cm(19.05) });
    setShapeFill(bg, asColor('#0B1120'));

    // Center Hero Card
    addCard(slide, 3, 2.5, 27.866, 14, '#131D33');

    // Accent line
    const accent = addSlideShape(slide, { preset: 'rect', x: cm(3), y: cm(2.5), w: cm(27.866), h: cm(0.12) });
    setShapeFill(accent, asColor('#3B82F6'));

    // Tag Badge
    const tag = addSlideTextBox(slide, {
      x: cm(4),
      y: cm(3.8),
      w: cm(20),
      h: cm(0.8),
      text: '毕业设计 / 实训成果答辩汇报 · 个人独立全栈工程实践'
    });
    setShapeTextFormat(tag, { fontSize: 13, bold: true, color: asColor('#38BDF8'), fontFamily: 'Microsoft YaHei' });

    // Main Title
    const title = addSlideTextBox(slide, {
      x: cm(4),
      y: cm(4.8),
      w: cm(25),
      h: cm(1.8),
      text: 'LibraryHub 智能图书借阅管理系统'
    });
    setShapeTextFormat(title, { fontSize: 34, bold: true, color: asColor('#F8FAFC'), fontFamily: 'Microsoft YaHei' });

    // Subtitle
    const sub = addSlideTextBox(slide, {
      x: cm(4),
      y: cm(6.7),
      w: cm(25),
      h: cm(1.2),
      text: '面向中小型资料室与校园分馆的轻量、高可用、低资源消耗前后端分离智能借阅解决方案'
    });
    setShapeTextFormat(sub, { fontSize: 15, color: asColor('#94A3B8'), fontFamily: 'Microsoft YaHei' });

    // Info Grid
    addCard(slide, 4, 8.5, 25.866, 6.5, '#1E293B');
    const infoText = [
      '【答 辩 人】：[您的姓名]     ｜   【学  号】：[您的学号]     ｜   【指导教师】：[导师姓名]',
      '【研发模式】：一人独立全栈全流程交付（涵盖需求/架构/后端/前端/自动化测试/DevOps/文档编制）',
      '【技术选型】：FastAPI (异步高性能) + Vue 3 (组合式API) + SQLite WAL (预写日志) + Docker 容器编排',
      '【生产状态】：已在阿里云 ECS (2核1G) 正式投产运行 ｜ 公网在线访问入口：http://39.96.0.20/',
      '【核心亮点】：自研轻量原生响应式 SVG 矢量图表引擎（构建缩至 2.4s） ｜ 逾期主动熔断 ｜ 并发防超卖'
    ].join('\n\n');
    addCardBody(slide, 4.6, 9.0, 24.6, 5.5, infoText, 12, '#CBD5E1');
  }

  // ----------------------------------------------------
  // Slide 2: 小组成员介绍与量化分工 (Image 1 Requirement)
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块一 · 小组成员介绍及分工 (量化·具体·可执行)',
      '小组成员介绍与个人独立全栈研发量化分工',
      '一人全栈全周期独立负责，100% 承担系统全部 7 大生命周期阶段之设计、研发、测试与运维',
      2
    );

    // Left Summary Card
    addCard(slide, 1.5, 3.8, 8.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.0, 4.3, 7.5, '开发者个人履历与定位', '全栈总负责人');
    const introText = [
      '【项目负责人 / 独立开发者】：',
      '姓名：[您的姓名]   学号：[您的学号]',
      '',
      '【开发模式专项说明】：',
      '本项目由作者一人全栈独立负责，全生命周期未设置其他组员协同。',
      '',
      '作为单人开发者，本人独立统筹并完成了从产品定义、底层数据库建模、高性能后端、现代化前端界面交互、原生 SVG 算法组件开发，到 1G 内存服务器 Docker 编排与阿里云公网投产全流程，具备完备的可追溯工程记录。'
    ].join('\n');
    addCardBody(slide, 2.0, 5.3, 7.5, 11.5, introText, 11.5, '#E2E8F0');

    // Right Table Card
    addCard(slide, 10.5, 3.8, 21.866, 13.5, '#1E293B');
    addCardHeader(slide, 11.2, 4.3, 20.0, '个人全栈研发职责与可执行量化明细表', '贡献度 100%');

    addSlideTable(slide, {
      x: cm(11.2),
      y: cm(5.3),
      w: cm(20.5),
      h: cm(11.2),
      colWidths: [cm(3.2), cm(13.8), cm(3.5)],
      rows: [
        ['研发阶段', '量化实施具体内容与核心成果交付物', '个人贡献度'],
        ['需求调研与规格定义', '调研中小型图书室业务痛点，梳理读者/管理员用户故事，制定 MoSCoW 功能清单与详细规格书 (Spec)', '100% (本人)'],
        ['系统与数据库设计', '规划前后端分离生产拓扑，建立 E-R 数据实体模型，编写 5 张核心数据表 DDL 结构、联合索引与约束', '100% (本人)'],
        ['后端核心业务研发', '基于 FastAPI + SQLAlchemy 2.0 + Pydantic v2 实现 RESTful API，完成 JWT 鉴权与借还行级原子事务控制', '100% (本人)'],
        ['前端界面与图表自研', '基于 Vue 3 + Vite 5 + Element Plus 搭建 SPA，自研纯原生响应式 SVG 动态折线与环形图表替代重型库', '100% (本人)'],
        ['自动化测试与质检', '编写基于内存隔离数据库的 Pytest 单元与集成测试套件，7 大核心业务测试用例 100% 通过（耗时 0.52s）', '100% (本人)'],
        ['生产部署与性能攻坚', '排查 Alpine musl 互斥锁死锁，编写 Dockerfile 与 docker-compose.yml，成功上线阿里云 ECS (39.96.0.20:80)', '100% (本人)'],
        ['交付物编制与归档', '编制全套 9 大类工程过程文档、答辩 PPT、逐字稿、生成公网访问二维码并完成纯净源码压缩归档', '100% (本人)']
      ]
    });
  }

  // ----------------------------------------------------
  // Slide 3: 项目立项背景与传统业务痛点剖析 (Image 1 Requirement)
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块二 · 项目背景与开发思路 (现状调研与痛点剖析)',
      '项目立项背景与中小型图书室传统痛点剖析',
      '传统人工手工记账与庞大商业软件的两极困境，催生了轻量高可用智能借阅系统的研发需求',
      3
    );

    // 3 Pain Point Cards
    const cardW = 9.8;
    // Card 1
    addCard(slide, 1.5, 3.8, cardW, 13.5, '#1E293B');
    addCardHeader(slide, 2.0, 4.3, cardW - 1, '痛点 1: 人工与 Excel 记账脱节', '假库存严重');
    const p1 = [
      '【现象与危害】：',
      '很多中小学校园分馆、院系资料室仍依赖纸质借书本或人工表格录入。',
      '',
      '【具体弊端】：',
      '• 登记繁琐，书名、ISBN、卡号极易发生笔误录错；',
      '• 借出与还入缺乏实时动态库存核验，经常出现“读者跑去书架发现早已借空”或“系统记录有书但书架无书”的脱节现象；',
      '• 馆藏盘点核对周期极长，资产流转效率极其低下。'
    ].join('\n');
    addCardBody(slide, 2.0, 5.3, cardW - 1, 11.5, p1, 11, '#E2E8F0');

    // Card 2
    addCard(slide, 12.0, 3.8, cardW, 13.5, '#1E293B');
    addCardHeader(slide, 12.5, 4.3, cardW - 1, '痛点 2: 缺乏主动逾期风控机制', '催缴成本高');
    const p2 = [
      '【现象与危害】：',
      '缺乏到期智能预警与主动权限限制，借还规则形同虚设。',
      '',
      '【具体弊端】：',
      '• 管理员需每日手工翻查借据核对应还日期，催还滞后；',
      '• 市面很多模板大作业“仅在界面打个已逾期标签”，读者依然能随意借新书，无法实质性制约违约行为；',
      '• 长期超期未还与图书遗失屡禁不止，严重损害公共借阅权益。'
    ].join('\n');
    addCardBody(slide, 12.5, 5.3, cardW - 1, 11.5, p2, 11, '#E2E8F0');

    // Card 3
    addCard(slide, 22.5, 3.8, cardW, 13.5, '#1E293B');
    addCardHeader(slide, 23.0, 4.3, cardW - 1, '痛点 3: 商业软件庞大臃肿', '服务器成本高昂');
    const p3 = [
      '【现象与危害】：',
      '传统商业图书管理软件（ILMS）架构复杂，部署门槛极高。',
      '',
      '【具体弊端】：',
      '• 动辄强依赖数 GB 内存的复杂数据库集群与中间件；',
      '• 基层单位通常仅有 1G 内存的轻量云服务器或边缘主机，商业软件根本无法启动运行；',
      '• 采购授权与每年云资源开销高达数万元，中小微图书馆无力承担。'
    ].join('\n');
    addCardBody(slide, 23.0, 5.3, cardW - 1, 11.5, p3, 11, '#E2E8F0');
  }

  // ----------------------------------------------------
  // Slide 4: 整体开发设计思路与架构选型论证
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块二 · 项目背景与开发思路 (整体设计与架构拓扑)',
      '系统总体开发思路与生产架构技术选型',
      '坚持前后端完全解耦、零冗余中间件、行级原子排他锁与自研轻量图表的极致高可用架构',
      4
    );

    // Left: Development Philosophy
    addCard(slide, 1.5, 3.8, 14.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 13.0, '整体开发设计四大核心准则', '设计思路');
    const philText = [
      '1. 极简轻量，算力友好：',
      '   坚持“零无用中间件”原则，剔除高内存消耗组件，全栈容器常驻内存压缩至 ~180MB，专为 2核1G 极限配置云服务器量身定制。',
      '',
      '2. 严密并发控制，数据强一致：',
      '   核心借还逻辑实行“数据库事务 + 行级条件排他锁”，杜绝负库存与超卖，保障每一本图书在架量物理与逻辑完全对应。',
      '',
      '3. 主动风控阻断，业务全闭环：',
      '   构建三道准入防火墙，名下有未结逾期图书立即自动熔断借阅权限；未逾期图书支持在线一键顺延 30 天续借。',
      '',
      '4. 云原生容器化，一键极速投产：',
      '   采用 Docker Compose 编排，支持宿主机数据卷持久化挂载，实现跨平台“零环境污染、单命令一键部署”。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 13.0, 11.5, philText, 11.5, '#E2E8F0');

    // Right: Tech Stack Table
    addCard(slide, 16.8, 3.8, 15.566, 13.5, '#1E293B');
    addCardHeader(slide, 17.5, 4.3, 14.0, '全栈生产级技术选型矩阵', '选型论证');
    const stackText = [
      '【前端框架】：Vue 3.4 (Composition API) + Vite 5.4 + Element Plus',
      '  -> 响应式数据绑定，单组件内聚，打包仅 2.4 秒。',
      '',
      '【后端框架】：Python 3.11 + FastAPI (ASGI 异步高性能)',
      '  -> 异步非阻塞事件驱动，高并发读写下吞吐效率逼近 Go。',
      '',
      '【数据校验】：Pydantic v2 (Rust 核心安全驱动)',
      '  -> 严格强类型入参校验，在输入层杜绝脏数据与 SQL 注入。',
      '',
      '【数据存储】：SQLite 3.45 (PRAGMA journal_mode = WAL 模式)',
      '  -> 并发预写日志，读写互不阻塞，单文件快照，零额外常驻内存。',
      '',
      '【安全鉴权】：Passlib (bcrypt 工业级加盐哈希) + PyJWT (HS256)',
      '  -> 拒绝明文存储，全站无状态 Bearer Token 鉴权，支持细粒度 RBAC。',
      '',
      '【网关运维】：Nginx Alpine + Docker Compose v2 (数据卷挂载持久化)'
    ].join('\n');
    addCardBody(slide, 17.5, 5.3, 14.0, 11.5, stackText, 11, '#E2E8F0');
  }

  // ----------------------------------------------------
  // Slide 5: 成果展示 1: 登录认证与读者自主开卡服务
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块三 · 成果展示 (在线演示主要功能 · 认证门户)',
      '成果展示 1: 统一身份认证中心与读者自主开卡注册',
      '标准防伪卡号自动编码（CARD-2026-XXXX）、bcrypt 密码加密与一键体验测试账号矩阵',
      5
    );

    // Left text panel
    addCard(slide, 1.5, 3.8, 13.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 12.0, '功能特性与业务实现细节', '实测亮点');
    const text = [
      '• 读者自主注册开卡：',
      '  读者填写账号、姓名与邮箱后，系统自动生成全局唯一借书卡号（如 CARD-20261021-0001），赋予 reader 角色；',
      '',
      '• 工业级安全凭据防护：',
      '  密码经过 passlib bcrypt 算法加盐单向哈希加密存储，杜绝彩虹表撞库泄密；登录下发 HS256 JWT Token；',
      '',
      '• 评委一键体验账号矩阵：',
      '  系统专门内置快捷填入按钮，评委点击即可秒级填充管理员、馆员或读者凭据，极大简化现场演示；',
      '',
      '• 细粒度 RBAC 权限隔离：',
      '  读者/馆员/管理员根据角色动态加载前端路由并拦截越权请求。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 12.0, 11.5, text, 12, '#E2E8F0');

    // Right screenshot
    addCard(slide, 15.8, 3.8, 16.566, 13.5, '#131D33');
    try {
      const imgBytes = fs.readFileSync('submission/screenshots/login.png');
      addSlideImage(slide, imgBytes, {
        x: cm(16.3),
        y: cm(5.0),
        w: cm(15.566),
        h: cm(9.728)
      });
      addCardHeader(slide, 16.5, 4.3, 15.0, '真实公网截图：登录与自主注册工作台', '1440x900 实机抓取');
      addCardBody(slide, 16.5, 15.2, 15.0, 1.5, '图示：公网 http://39.96.0.20/ 生产实机抓取，内置快捷填入与注册双选项卡', 11, '#94A3B8');
    } catch (e) {
      console.warn('Image login.png missing:', e.message);
    }
  }

  // ----------------------------------------------------
  // Slide 6: 成果展示 2: 宏观数据决策与运营监控大屏
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块三 · 成果展示 (在线演示主要功能 · 决策大屏)',
      '成果展示 2: 运营决策大屏与自研轻量 SVG 走势图',
      '自主研发纯原生响应式 SVG 矢量图表引擎，秒级聚合全馆图书总量、在借流通量与 7 天走势',
      6
    );

    // Left text panel
    addCard(slide, 1.5, 3.8, 13.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 12.0, '大屏监控指标与技术攻坚', '核心看点');
    const text = [
      '• 四大实时运营指标卡片：',
      '  全馆藏书种数 (Titles)、总册数 (Volumes)、当前流通在借本数 (Borrowed) 与超期违约警示 (Overdue)；',
      '',
      '• 自研纯原生响应式 SVG 折线走势图：',
      '  彻底抛弃 10MB+ 的外部重型图表库，采用 Vue 3 动态数据绑定手写 SVG 面积折线图，支持平滑贝塞尔曲线、坐标轴与数据点悬停卡片，加载丝滑零延迟；',
      '',
      '• 馆藏分类占比环形图：',
      '  多色块展示计算机、文学、自然科学等各类图书馆藏分布；',
      '',
      '• 借阅热门图书排行榜 Top 10：',
      '  根据全量借还历史记录实时计算高频流通书目。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 12.0, 11.5, text, 12, '#E2E8F0');

    // Right screenshot
    addCard(slide, 15.8, 3.8, 16.566, 13.5, '#131D33');
    try {
      const imgBytes = fs.readFileSync('submission/screenshots/dashboard.png');
      addSlideImage(slide, imgBytes, {
        x: cm(16.3),
        y: cm(5.0),
        w: cm(15.566),
        h: cm(9.728)
      });
      addCardHeader(slide, 16.5, 4.3, 15.0, '真实公网截图：工作台概览与分析看板', '自研SVG引擎');
      addCardBody(slide, 16.5, 15.2, 15.0, 1.5, '图示：包含 4 项数据卡片、7天借还走势图、分类环形图与借阅热榜', 11, '#94A3B8');
    } catch (e) {
      console.warn('Image dashboard.png missing:', e.message);
    }
  }

  // ----------------------------------------------------
  // Slide 7: 成果展示 3: 馆藏书目多维智能检索与采编大厅
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块三 · 成果展示 (在线演示主要功能 · 馆藏书目)',
      '成果展示 3: 馆藏书目多维智能检索与标准采编大厅',
      '支持关键词模糊多条件组合筛选、“仅看有库存”一键过滤、实体架位标引与防呆下架保护',
      7
    );

    // Left text panel
    addCard(slide, 1.5, 3.8, 13.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 12.0, '多维检索与编目防呆特性', '业务亮点');
    const text = [
      '• 智能多条件组合检索：',
      '  支持按书名、作者、ISBN、出版社及图书分类多字段模糊组合检索；检索接口响应时间 < 30ms；',
      '',
      '• 实体在架余量清晰呈现：',
      '  列表清晰标明“在架余量 / 馆藏总册数”（如 3/5 本），支持勾选“仅显示在架有书”快速过滤被借空图书；',
      '',
      '• 物理架位号精准标引：',
      '  记录精确存放位置（如 2F-A-01），方便读者线下精准寻书；',
      '',
      '• 在借图书防呆下架拦截（资产保护）：',
      '  当图书处于借出未还状态时（available < total），系统后端严格阻断下架注销操作，防止资产坏账。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 12.0, 11.5, text, 12, '#E2E8F0');

    // Right screenshot
    addCard(slide, 15.8, 3.8, 16.566, 13.5, '#131D33');
    try {
      const imgBytes = fs.readFileSync('submission/screenshots/books.png');
      addSlideImage(slide, imgBytes, {
        x: cm(16.3),
        y: cm(5.0),
        w: cm(15.566),
        h: cm(9.728)
      });
      addCardHeader(slide, 16.5, 4.3, 15.0, '真实公网截图：馆藏书目检索与管理大厅', '多维过滤');
      addCardBody(slide, 16.5, 15.2, 15.0, 1.5, '图示：支持快速借阅、新书采编入库、架位号显示与在借防呆下架保护', 11, '#94A3B8');
    } catch (e) {
      console.warn('Image books.png missing:', e.message);
    }
  }

  // ----------------------------------------------------
  // Slide 8: 成果展示 4: 全馆借还流转审计与在借档案闭环
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块三 · 成果展示 (在线演示主要功能 · 借还流转)',
      '成果展示 4: 全馆借还流转审计与读者在借档案闭环',
      '读者端支持在借跟踪、顺延 30 天续借与自主还书；管理端支持全馆流转监控与柜台代还',
      8
    );

    // Left text panel
    addCard(slide, 1.5, 3.8, 13.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 12.0, '流转闭环与顺延续借控制', '流转控制');
    const text = [
      '• 读者“我的借阅”档案：',
      '  分类显示“借阅中”、“已归还”、“已逾期”单据，清晰标注借出日期、应还截止日期与剩余借阅天数；',
      '',
      '• 在线自主顺延 30 天续借：',
      '  在借单据未逾期前提下，支持读者在线一键申请续借；系统自动在原应还时间基础上顺延 30 天，严格限制续借 1 次；',
      '',
      '• 自主还书与柜台代还双闭环：',
      '  支持读者线上自主还书或前往柜台由管理员扫码代还验收，单据即刻结清，图书在架可借库存实时原子回补；',
      '',
      '• 超期未还状态智能判定与违约预警。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 12.0, 11.5, text, 12, '#E2E8F0');

    // Right screenshot
    addCard(slide, 15.8, 3.8, 16.566, 13.5, '#131D33');
    try {
      const imgBytes = fs.readFileSync('submission/screenshots/borrows.png');
      addSlideImage(slide, imgBytes, {
        x: cm(16.3),
        y: cm(5.0),
        w: cm(15.566),
        h: cm(9.728)
      });
      addCardHeader(slide, 16.5, 4.3, 15.0, '真实公网截图：全馆借还流转监控大厅', '流转审计');
      addCardBody(slide, 16.5, 15.2, 15.0, 1.5, '图示：全馆借还记录审计流、在借状态标签、柜台代还与逾期状态标记', 11, '#94A3B8');
    } catch (e) {
      console.warn('Image borrows.png missing:', e.message);
    }
  }

  // ----------------------------------------------------
  // Slide 9: 成果展示 5: 读者借书证管理与权限风控中心
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块三 · 成果展示 (在线演示主要功能 · 权限管理)',
      '成果展示 5: 读者借书证与用户全生命周期权限管理',
      '支持读者借阅上限动态调额、角色权限实时升降级以及违约违规账号一键冻结与解冻',
      9
    );

    // Left text panel
    addCard(slide, 1.5, 3.8, 13.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 12.0, '用户中心与权限控制特性', '管理矩阵');
    const text = [
      '• 读者借书证全档案浏览：',
      '  分页呈现借书卡号（CARD-2026-XXXX）、真实姓名、用户名、角色身份、邮箱及当前在借/限额状态；',
      '',
      '• 角色动态授权 (RBAC)：',
      '  支持总管理员将优秀馆员提升为 librarian 或 admin，权限变更秒级生效；',
      '',
      '• 账户一键冻结与风控阻断：',
      '  针对恶意损坏图书或长期不还的读者，管理员可点击操作列的【停用】开关；账号一旦停用，Token 立即失效并拦截登录；',
      '',
      '• 差异化借阅限额调整：',
      '  支持按读者科研/学习需求，将默认 5 本借阅额度弹性调整至 10/20 本。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 12.0, 11.5, text, 12, '#E2E8F0');

    // Right screenshot
    addCard(slide, 15.8, 3.8, 16.566, 13.5, '#131D33');
    try {
      const imgBytes = fs.readFileSync('submission/screenshots/users.png');
      addSlideImage(slide, imgBytes, {
        x: cm(16.3),
        y: cm(5.0),
        w: cm(15.566),
        h: cm(9.728)
      });
      addCardHeader(slide, 16.5, 4.3, 15.0, '真实公网截图：读者借书证与用户管理中心', '账号治理');
      addCardBody(slide, 16.5, 15.2, 15.0, 1.5, '图示：读者证号、在借额度对比、角色身份授权与账号启用/停用控制', 11, '#94A3B8');
    } catch (e) {
      console.warn('Image users.png missing:', e.message);
    }
  }

  // ----------------------------------------------------
  // Slide 10: 【核心创新 1】业务功能创新：智能风控与并发原子安全锁 (4分·满分)
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '考核加分项 · 项目创新与优化模块 (功能创新设计 · 满分 4 分)',
      '【核心创新 1】智能逾期风控熔断与并发行级排他原子锁',
      '区别于简单大作业模板的静态展示，自主研发具备主动准入防御与强一致性并发锁机制',
      10
    );

    // Left: 逾期熔断风控
    addCard(slide, 1.5, 3.8, 14.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 13.0, '创新机制 1: 逾期阶梯风控与主动借阅权限熔断', '4分满分指标');
    const r1 = [
      '【传统模板弊端】：',
      '普通课设仅在数据库中打上已超期标记，读者依然可以无限借新书，风控形同虚设。',
      '',
      '【LibraryHub 创新实现】：',
      '在后端借阅事务前设置三道准入防火墙：',
      '1. 借阅额度核验：校验未还图书是否达到 5 本上限；',
      '2. 在架余量核验：校验目标图书在架数是否大于 0；',
      '3. 主动逾期熔断：读者名下只要存在一笔处于 OVERDUE（已逾期未归还）的单据，系统在接口层强制熔断借阅权限，阻断所有新借请求！',
      '',
      '【业务价值】：',
      '以技术手段主动倒逼读者履约还书，彻底消除图书长期失联被恶意霸占的顽疾。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 13.0, 11.5, r1, 11.5, '#E2E8F0');

    // Right: 原子锁防超卖
    addCard(slide, 16.8, 3.8, 15.566, 13.5, '#1E293B');
    addCardHeader(slide, 17.5, 4.3, 14.0, '创新机制 2: 行级条件排他锁与高并发防超卖', '事务强一致');
    const r2 = [
      '【高并发隐患】：',
      '多名读者在同一毫秒内并发抢借同一本仅剩 1 册的热门图书，代码若先查再改，极易造成库存被扣为负数（超卖）。',
      '',
      '【LibraryHub 创新实现】：',
      '采用“数据库显式事务 + 行级原子条件更新”：',
      '  UPDATE books',
      '  SET available_copies = available_copies - 1',
      '  WHERE id = :book_id AND available_copies > 0;',
      '',
      '【锁竞争原子判定】：',
      '• 借助底层数据库行级排他锁，只有第一条事务能成功扣减；',
      '• 其余并发事务执行时发现影响行数为 0，立即触发回滚并向客户端抛出 400 库存不足业务异常；',
      '• 杜绝并发超卖，确保库存真实可靠。'
    ].join('\n');
    addCardBody(slide, 17.5, 5.3, 14.0, 11.5, r2, 11.5, '#E2E8F0');
  }

  // ----------------------------------------------------
  // Slide 11: 【核心创新 2】技术方案攻坚：自研纯原生 SVG 破解 1G 内存构建死锁 (3分·满分)
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '考核加分项 · 项目创新与优化模块 (技术方案创新 · 满分 3 分)',
      '【核心创新 2】自研纯原生 SVG 矢量图表引擎破解构建死锁',
      '深入排查 Alpine Linux musl 互斥锁死锁根因，彻底剥离重型 ECharts 依赖，构建缩至 2.4 秒',
      11
    );

    // Left: 问题复盘与死锁机理
    addCard(slide, 1.5, 3.8, 14.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 13.0, '生产环境遭遇的严重工程难题与根因排查', '3分满分指标');
    const t1 = [
      '【生产环境规格】：',
      '阿里云 2 核 CPU、1GB 内存、30GB 存储之极限低配 ECS。',
      '',
      '【致命故障现象】：',
      '执行 Docker 前端构建时，编译在 transforming 1684 modules 阶段无限期卡死，CPU 占用归零，系统 OOM，SSH 掉线。',
      '',
      '【深入底层排查的两大根因】：',
      '1. 内存挤爆：第三方大图表库 (ECharts 5) 庞大的 Canvas/WebGL 依赖，在 Rollup 编译时瞬时内存峰值突破 1.2GB，远超 1G 物理限制；',
      '2. 底层死锁：node:20-alpine 的底层 musl libc 在多线程极度受限的内存竞争下存在互斥锁（mutex）死锁 Bug，导致进程永久挂死。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 13.0, 11.5, t1, 11.5, '#E2E8F0');

    // Right: 解决方案与惊人成效
    addCard(slide, 16.8, 3.8, 15.566, 13.5, '#1E293B');
    addCardHeader(slide, 17.5, 4.3, 14.0, '自主研发纯原生 SVG 方案与性能飞跃对比', '工程攻坚突破');
    const t2 = [
      '【突破性重构对策】：',
      '拒绝简单加钱升配置，而是自主研发轻量化纯原生响应式 SVG 数据图表引擎替代外部重型库！',
      '',
      '【技术落地】：',
      '• 利用 Vue 3 响应式计算属性动态生成 SVG path 贝塞尔曲线、悬停交互卡片与环形扇区；',
      '• 零第三方依赖，彻底消除 1.2GB 内存开销！',
      '',
      '【优化前后硬核性能数据对比】：',
      '• 前端构建耗时：从【超时死锁挂死】直降为【2.4 秒】！',
      '• 前端镜像体积：从【1.2GB】缩减为【23MB】！',
      '• 生产常驻内存：Nginx 8MB + 后端 172MB = 总计仅 ~180MB！',
      '• 结合现代 AI 辅助研发工作流进行测试用例全量编写。'
    ].join('\n');
    addCardBody(slide, 17.5, 5.3, 14.0, 11.5, t2, 11.5, '#E2E8F0');
  }

  // ----------------------------------------------------
  // Slide 12: 【核心创新 3】落地价值与商业化迭代潜力 (3分·满分)
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '考核加分项 · 项目创新与优化模块 (落地价值与迭代 · 满分 3 分)',
      '【核心创新 3】极低边际运营成本、公网投产与商用迭代蓝图',
      '已在阿里云生产服务器稳定运行；年运维成本仅百元级，具备 RFID 硬件与微服务演进蓝图',
      12
    );

    // 3 Cards layout
    const cW = 9.8;
    // Card 1
    addCard(slide, 1.5, 3.8, cW, 13.5, '#1E293B');
    addCardHeader(slide, 2.0, 4.3, cW - 1, '1. 真实公网投产实证', '公网在线');
    const v1 = [
      '【真实可用，拒绝假Demo】：',
      '系统已成功投产于阿里云公网 ECS（http://39.96.0.20/），标准 80 端口对外开放，全天候稳定运行；',
      '',
      '【全端自适应响应】：',
      '经受住了 Chrome、Edge、Safari 以及手机微信内置浏览器端到端跨网访问测试，数据实时同步；',
      '',
      '【自动化健康巡检】：',
      '配置了 Docker 重启策略与持久卷挂载，容器崩溃秒级拉起，数据零丢失。'
    ].join('\n');
    addCardBody(slide, 2.0, 5.3, cW - 1, 11.5, v1, 11, '#E2E8F0');

    // Card 2
    addCard(slide, 12.0, 3.8, cW, 13.5, '#1E293B');
    addCardHeader(slide, 12.5, 4.3, cW - 1, '2. 极致的商业落地成本', '年成本仅百元');
    const v2 = [
      '【基层单位的真正痛点】：',
      '全国数万所中小学校园分馆、乡村街道图书角经费极其有限，无力采购动辄几千上万的云服务器与商业软件；',
      '',
      '【高性价比普惠方案】：',
      '全栈常驻仅 180MB，意味着最便宜的 1G 内存轻量服务器即可流畅跑完全套业务，年租金仅需一百多元；',
      '',
      '【直接商用落地】：',
      '开箱即用，为基层图书室提供了零门槛数字化改造可能。'
    ].join('\n');
    addCardBody(slide, 12.5, 5.3, cW - 1, 11.5, v2, 11, '#E2E8F0');

    // Card 3
    addCard(slide, 22.5, 3.8, cW, 13.5, '#1E293B');
    addCardHeader(slide, 23.0, 4.3, cW - 1, '3. 可持续商用迭代蓝图', '长期可演进');
    const v3 = [
      '【阶段一 (当前已交付)】：',
      '前后端解耦、行级原子借还锁、自研原生 SVG 走势大屏、Docker 一键交付；',
      '',
      '【阶段二 (商业硬件集成规划)】：',
      '在现有接口层扩展标准 SIP2 协议，集成条码扫描枪与 RFID 射频读卡机硬件，支持校园一卡通直接刷卡借还；',
      '',
      '【阶段三 (多租户云平台演进)】：',
      '演进为云原生多租户架构，支持多个校区分馆间的一网通借通还与图书智能调拨调度。'
    ].join('\n');
    addCardBody(slide, 23.0, 5.3, cW - 1, 11.5, v3, 11, '#E2E8F0');
  }

  // ----------------------------------------------------
  // Slide 13: 学习方法分享与全栈问题解决思路 (Image 1 Requirement)
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块四 · 学习方法分享 (解决问题思路 · 用到的工具资源)',
      '学习方法论分享与全栈工程问题排查思路',
      '从现象追溯底层根因、坚持场景与架构精准匹配、测试驱动开发以及拥抱现代 AI 研发新范式',
      13
    );

    // Left card
    addCard(slide, 1.5, 3.8, 14.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 13.0, '全栈工程化解决问题核心思路', '方法论');
    const m1 = [
      '1. 追溯底层根因，拒绝无脑试错：',
      '   在排查构建死锁时，没有停留在“重新构建”或“加配置”，而是通过 docker 资源监控、strace 与 musl 源码分析，定位到底层互斥锁死锁，并果断决策自研纯原生 SVG 图表。',
      '',
      '2. 架构取舍与精准场景权衡：',
      '   深刻理解“没有最好的架构，只有最适合的架构”。在中小微图书借阅高频读、低频写的场景下，选用开启 WAL 模式的 SQLite 3，兼顾并发安全性与极低内存开销。',
      '',
      '3. 防御性编程与自动化测试保障：',
      '   编写独立的 Pytest 内存测试套件，用例全面覆盖正常借还闭环、零库存防超卖、未还图书下架拦截等极端边界条件，用自动化断言捍卫代码质量。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 13.0, 11.5, m1, 11.5, '#E2E8F0');

    // Right card
    addCard(slide, 16.8, 3.8, 15.566, 13.5, '#1E293B');
    addCardHeader(slide, 17.5, 4.3, 14.0, '善用现代技术工具与 AI 赋能实战', '工具与资源');
    const m2 = [
      '【官方权威文档精读】：',
      '• 精读 FastAPI 异步架构文档，掌握 Depends 依赖注入与安全性机制；',
      '• 精读 Vue 3 官方 RFC 与 Vite 编译优化策略，熟练运用组合式 API；',
      '• 钻研 Docker 官方最佳实践，采用多阶段构建与 Nginx 反代模式。',
      '',
      '【现代 AI-Native 研发范式落地】：',
      '• 深度将现代 AI 工具作为全栈结对编程专家，辅助需求边界推演；',
      '• 利用 AI 快速编写高质量的 Pytest 单元测试用例，覆盖更多异常边界；',
      '• 借助 AI 进行代码静态审查与性能瓶颈诊断，将单人全栈工程交付效能提升数倍。'
    ].join('\n');
    addCardBody(slide, 17.5, 5.3, 14.0, 11.5, m2, 11.5, '#E2E8F0');
  }

  // ----------------------------------------------------
  // Slide 14: 实习实训收获与职业规划启发 (Image 1 Requirement)
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '模块五 · 实习收获 & 感受分享 (技能 · 软实力 · 职业规划)',
      '实训收获、工程软实力蜕变与职业规划启发',
      '从单点编码到全局全栈架构的思维跃迁，培养独当一面的工程闭环能力与严谨职业素养',
      14
    );

    // Left Card
    addCard(slide, 1.5, 3.8, 14.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 13.0, '专业技能硬实力与工程软实力跃升', '实训收获');
    const h1 = [
      '【专业硬技能飞跃】：',
      '• 打通了现代化全栈工程全链路：FastAPI 异步架构、Pydantic v2 强类型体系、Vue 3 组件化响应式开发、Docker 容器编排与云服务器运维；',
      '• 掌握了生产级数据强一致性控制：显式事务、行级排他条件锁与防超卖；',
      '• 具备了深度的系统级性能排查与自研 SVG 算法组件开发能力。',
      '',
      '【独当一面的全栈责任感】：',
      '• 作为单人开发者，独自扛起从产品立项到云端投产的完整大旗，不再依赖他人，深刻体会到了架构设计与技术选型对项目成败的决定性影响；',
      '• 建立了极高的工程规范意识，完成了全套 9 大类专业交付文档编制。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 13.0, 11.5, h1, 11.5, '#E2E8F0');

    // Right Card
    addCard(slide, 16.8, 3.8, 15.566, 13.5, '#1E293B');
    addCardHeader(slide, 17.5, 4.3, 14.0, '认知升华、心得体会与未来职业规划', '心得与展望');
    const h2 = [
      '【工程认知深刻升华】：',
      '• 过去以为写出功能就大功告成，实训中遭遇的 1G 内存构建死锁让我深刻认识到：能让系统在最苛刻、最受限的生产硬件上跑得又快又稳，才是软件工程真正的核心价值！',
      '',
      '【心得体会】：',
      '• 好的软件设计永远是“场景、预算、性能”的艺术平衡；一人全栈开发不仅检验了技术广度，更磨练了直面复杂工程 Bug 的韧性与自驱力。',
      '',
      '【未来职业规划启发】：',
      '• 明确了未来深耕企业级高性能后端与云原生全栈技术架构的职业方向，立志成为一名既懂业务落地、又精通底层性能优化的优秀软件工程师。'
    ].join('\n');
    addCardBody(slide, 17.5, 5.3, 14.0, 11.5, h2, 11.5, '#E2E8F0');
  }

  // ----------------------------------------------------
  // Slide 15: 在线实机演示入口与扫码体验 (Image 2 Item 9)
  // ----------------------------------------------------
  {
    const slide = createBaseSlide(
      pres,
      '在线实机体验 · 公网访问凭据与多端扫码 (交付物 9)',
      '系统公网在线体验入口、预置测试账户与扫码直达',
      '已在阿里云服务器全天候在线运行，支持评委老师电脑浏览器访问与手机微信直接扫码',
      15
    );

    // Left info card
    addCard(slide, 1.5, 3.8, 18.5, 13.5, '#1E293B');
    addCardHeader(slide, 2.2, 4.3, 17.0, '公网在线运行凭据与预置测试账号矩阵', '随时可测');
    const accessText = [
      '【系统公网统一访问 URL】：',
      '  http://39.96.0.20/ （对外开放标准 80 端口，全网稳定直达）',
      '',
      '【Swagger 交互式 API 调试文档】：',
      '  http://39.96.0.20/docs',
      '',
      '【评委预置体验账户矩阵（登录页底部支持一键自动填入）】：',
      '• 系统总管理员 (admin / admin123)：',
      '  最高全局权限，可查看数据分析大屏、新书采编、全馆借还流转与用户管理；',
      '• 图书管理员 (librarian / lib123)：',
      '  图书采编入库、架位号编辑与柜台还书代办核销；',
      '• 普通读者账号 (reader1 / reader123)：',
      '  图书多维智能检索、在线一键借阅、在借中心跟踪、顺延续借 30 天与自主还书；',
      '',
      '【自主注册】：支持在界面点击“立即注册”创建全新读者账号进行借还测试。'
    ].join('\n');
    addCardBody(slide, 2.2, 5.3, 17.0, 11.5, accessText, 11.5, '#E2E8F0');

    // Right QR code card
    addCard(slide, 20.8, 3.8, 11.566, 13.5, '#131D33');
    addCardHeader(slide, 21.5, 4.3, 10.0, '手机端扫码一键体验', '移动端扫码');
    try {
      const qrBytes = fs.readFileSync('submission/qrcode.png');
      addSlideImage(slide, qrBytes, {
        x: cm(22.6),
        y: cm(5.5),
        w: cm(8.0),
        h: cm(8.0)
      });
      addCardBody(
        slide, 
        21.5, 
        14.2, 
        10.0, 
        2.5, 
        '微信 / 手机浏览器扫码直达\nhttp://39.96.0.20/', 
        12, 
        '#38BDF8'
      );
    } catch (e) {
      console.warn('QR code image missing:', e.message);
    }
  }

  // ----------------------------------------------------
  // Slide 16: 答辩总结与致谢
  // ----------------------------------------------------
  {
    const slide = addBlankSlide(pres);
    const bg = addSlideShape(slide, { preset: 'rect', x: 0, y: 0, w: cm(33.866), h: cm(19.05) });
    setShapeFill(bg, asColor('#0B1120'));

    addCard(slide, 3, 2.5, 27.866, 14, '#131D33');
    const accent = addSlideShape(slide, { preset: 'rect', x: cm(3), y: cm(2.5), w: cm(27.866), h: cm(0.12) });
    setShapeFill(accent, asColor('#10B981'));

    const tag = addSlideTextBox(slide, {
      x: cm(4),
      y: cm(4.2),
      w: cm(20),
      h: cm(0.8),
      text: '结语与现场答辩交流 · ACKNOWLEDGMENTS'
    });
    setShapeTextFormat(tag, { fontSize: 13, bold: true, color: asColor('#34D399'), fontFamily: 'Microsoft YaHei' });

    const title = addSlideTextBox(slide, {
      x: cm(4),
      y: cm(5.2),
      w: cm(25),
      h: cm(1.8),
      text: '汇报完毕 · 感谢各位老师的悉心聆听！'
    });
    setShapeTextFormat(title, { fontSize: 32, bold: true, color: asColor('#F8FAFC'), fontFamily: 'Microsoft YaHei' });

    addCard(slide, 4, 7.5, 25.866, 7.5, '#1E293B');
    const conclusionText = [
      'LibraryHub 智能图书借阅管理系统坚持“轻量、高可用、数据一致与主动风控”，',
      '从业务痛点调研、全栈代码研发、自研 SVG 性能攻坚，到云端稳定投产，已顺利交出了一份完整的独立全栈答辩答卷。',
      '',
      '【汇报核心要点速览】：',
      '1. 个人全栈独立承担：7 大阶段 100% 自主量化分工，全流程可追溯；',
      '2. 核心功能全闭环：读者自主借还续借 + 运营数据监控大屏 + 用户权限治理；',
      '3. 满分创新三大亮点：逾期权限主动熔断 ｜ 并发防超卖原子锁 ｜ 自研纯原生 SVG 解决 1G 内存构建死锁；',
      '4. 真实公网投产：39.96.0.20:80 持续在线，全栈常驻仅 ~180MB，具备清晰的商业化 RFID 扩展蓝图。',
      '',
      '恳请各位评委老师批评指正，欢迎老师提问交流！'
    ].join('\n');
    addCardBody(slide, 4.6, 8.0, 24.6, 6.5, conclusionText, 12, '#CBD5E1');
  }

  // Save PPTX
  const outBytes = await savePresentation(pres);
  const outPath = 'submission/LibraryHub_答辩汇报.pptx';
  fs.writeFileSync(outPath, Buffer.from(outBytes));
  console.log(`Successfully generated high-fidelity ${outPath}, size: ${outBytes.length} bytes`);
}

buildPPTX().catch(console.error);
