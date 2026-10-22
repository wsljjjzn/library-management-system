from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import Category
from app.models.book import Book
from app.models.borrow import BorrowRecord

def init_db(db: Session) -> None:
    # 1. 初始化用户
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="系统总管理员",
            email="admin@libraryhub.com",
            phone="13800000001",
            role="admin",
            card_number="CARD-20260001-ADMIN",
            max_borrow_count=10,
            is_active=True
        )
        db.add(admin_user)

    librarian_user = db.query(User).filter(User.username == "librarian").first()
    if not librarian_user:
        librarian_user = User(
            username="librarian",
            hashed_password=get_password_hash("lib123"),
            full_name="图书管理员(李老师)",
            email="librarian@libraryhub.com",
            phone="13800000002",
            role="librarian",
            card_number="CARD-20260002-LIB",
            max_borrow_count=10,
            is_active=True
        )
        db.add(librarian_user)

    reader_user = db.query(User).filter(User.username == "reader").first()
    if not reader_user:
        reader_user = User(
            username="reader",
            hashed_password=get_password_hash("reader123"),
            full_name="张三同学",
            email="zhangsan@student.edu.cn",
            phone="13912345678",
            role="reader",
            card_number="CARD-20261021-0001",
            max_borrow_count=5,
            is_active=True
        )
        db.add(reader_user)

    db.commit()

    # 2. 初始化图书分类
    categories_data = [
        {"name": "计算机与信息技术", "code": "TP312", "description": "软硬件架构、操作系统、AI与算法、网络通信", "sort_order": 1},
        {"name": "文学与艺术经典", "code": "I247", "description": "古今中外经典名著、科幻小说、散文随笔", "sort_order": 2},
        {"name": "经济金融与企业管理", "code": "F270", "description": "宏观微观经济学、企业战略商业实战", "sort_order": 3},
        {"name": "自然科学与基础物理", "code": "O4", "description": "数学、现代物理学、量子计算与生命科学", "sort_order": 4},
        {"name": "历史哲学与人文社科", "code": "K207", "description": "世界通史、中西方哲学思辨、社会认知", "sort_order": 5},
    ]
    cat_map = {}
    for c in categories_data:
        cat = db.query(Category).filter(Category.code == c["code"]).first()
        if not cat:
            cat = Category(**c)
            db.add(cat)
            db.flush()
        cat_map[c["name"]] = cat.id
    db.commit()

    # 3. 初始化示范图书
    books_data = [
        {
            "isbn": "9787111544937",
            "title": "深入理解计算机系统 (原书第3版 CS:APP)",
            "author": "Randal E. Bryant / David R. O'Hallaron",
            "publisher": "机械工业出版社",
            "publish_date": "2016-11",
            "category_id": cat_map.get("计算机与信息技术", 1),
            "total_copies": 8,
            "available_copies": 6,
            "location": "3F-CS-A01",
            "cover_url": "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=500&auto=format&fit=crop&q=60",
            "summary": "程序员必读殿堂级圣经，透彻理解硬件体系、汇编、虚拟内存、网络编程及并发核心本质。"
        },
        {
            "isbn": "9787115546081",
            "title": "Python编程：从入门到实践 (第3版)",
            "author": "Eric Matthes",
            "publisher": "人民邮电出版社",
            "publish_date": "2023-05",
            "category_id": cat_map.get("计算机与信息技术", 1),
            "total_copies": 12,
            "available_copies": 10,
            "location": "3F-CS-B03",
            "cover_url": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&auto=format&fit=crop&q=60",
            "summary": "全美最畅销的Python编程零起点实战著作，涵盖数据可视化、Web开发和经典游戏开发。"
        },
        {
            "isbn": "9787544253994",
            "title": "百年孤独 (典藏精装本)",
            "author": "加西亚·马尔克斯",
            "publisher": "南海出版公司",
            "publish_date": "2011-06",
            "category_id": cat_map.get("文学与艺术经典", 2),
            "total_copies": 6,
            "available_copies": 4,
            "location": "2F-LIT-C12",
            "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
            "summary": "魔幻现实主义文学巅峰丰碑，描写布恩迪亚家族七代人在马孔多小镇的百年兴衰与宿命轮回。"
        },
        {
            "isbn": "9787536692909",
            "title": "三体全集 (地球往事三部曲)",
            "author": "刘慈欣",
            "publisher": "重庆出版社",
            "publish_date": "2008-01",
            "category_id": cat_map.get("文学与艺术经典", 2),
            "total_copies": 10,
            "available_copies": 7,
            "location": "2F-SF-D08",
            "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60",
            "summary": "第73届雨果奖最佳长篇小说，中国科幻文学里程碑作品，阐述黑暗森林法则与宇宙社会学。"
        },
        {
            "isbn": "9787508660752",
            "title": "原则 (Principles)",
            "author": "瑞·达利欧 (Ray Dalio)",
            "publisher": "中信出版社",
            "publish_date": "2018-01",
            "category_id": cat_map.get("经济金融与企业管理", 3),
            "total_copies": 7,
            "available_copies": 5,
            "location": "4F-MGT-A05",
            "cover_url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60",
            "summary": "桥水基金创始人半个世纪的处事与投资原则，极度求真、极度透明的高效决策法则。"
        },
        {
            "isbn": "9787544385152",
            "title": "时间简史 (插图珍藏版)",
            "author": "史蒂芬·霍金",
            "publisher": "海南出版社",
            "publish_date": "2019-04",
            "category_id": cat_map.get("自然科学与基础物理", 4),
            "total_copies": 5,
            "available_copies": 3,
            "location": "5F-SCI-B01",
            "cover_url": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500&auto=format&fit=crop&q=60",
            "summary": "探索宇宙奥秘的科普旷世巨作，讲述黑洞、大爆炸奇点以及时间箭头的终极物理定律。"
        },
    ]

    for b in books_data:
        book = db.query(Book).filter(Book.isbn == b["isbn"]).first()
        if not book:
            book = Book(**b)
            db.add(book)
    db.commit()

    # 4. 初始化示范借阅记录（生成活跃在借与历史已还记录）
    book1 = db.query(Book).filter(Book.isbn == "9787111544937").first()
    book3 = db.query(Book).filter(Book.isbn == "9787544253994").first()
    now = datetime.now(timezone.utc)

    if book1 and reader_user:
        exist_rec = db.query(BorrowRecord).filter(
            BorrowRecord.user_id == reader_user.id,
            BorrowRecord.book_id == book1.id
        ).first()
        if not exist_rec:
            rec = BorrowRecord(
                record_no="BR-20261015-00101",
                user_id=reader_user.id,
                book_id=book1.id,
                borrow_date=now - timedelta(days=6),
                due_date=now + timedelta(days=24),
                status="BORROWED",
                renew_count=0,
                overdue_days=0,
                penalty_fee=0.0,
                remark="读者自助线上借阅"
            )
            db.add(rec)

    if book3 and reader_user:
        exist_rec2 = db.query(BorrowRecord).filter(
            BorrowRecord.user_id == reader_user.id,
            BorrowRecord.book_id == book3.id
        ).first()
        if not exist_rec2:
            rec2 = BorrowRecord(
                record_no="BR-20260920-00088",
                user_id=reader_user.id,
                book_id=book3.id,
                borrow_date=now - timedelta(days=35),
                due_date=now - timedelta(days=5),
                return_date=now - timedelta(days=4),
                status="RETURNED",
                renew_count=0,
                overdue_days=1,
                penalty_fee=0.5,
                remark="已按时归还结清"
            )
            db.add(rec2)
    db.commit()
