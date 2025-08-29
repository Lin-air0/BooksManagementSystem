/**
 * 完整测试数据初始化脚本
 * 合并了基础测试数据初始化和借阅记录测试数据添加功能
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'bookadmin',
  password: process.env.DB_PASSWORD || 'BookAdmin123!',
  database: process.env.DB_NAME || 'book_management',
  multipleStatements: true
};

// 测试数据 - 迁移自test.js
const testData = {
  categories: [
    { name: '计算机', description: '计算机技术和编程相关图书' },
    { name: '文学小说', description: '文学作品和小说' },
    { name: '历史', description: '历史相关书籍' },
    { name: '科学', description: '自然科学和技术书籍' },
    { name: '哲学', description: '哲学和逻辑学相关书籍' },
    { name: '艺术', description: '艺术和设计相关书籍' },
    { name: '心理学', description: '心理学和行为科学相关书籍' },
    { name: '教育心理', description: '教育和发展心理学相关书籍' }
  ],
  
  books: [
    // 分类1：计算机（4本）
    {
      title: 'JavaScript高级程序设计',
      author: 'Nicholas C. Zakas',
      isbn: '978-7-5641-2315-4',
      publisher: '人民邮电出版社',
      publish_date: '2020-01-15',
      stock: 10,
      available: 10,
      category_id: 1,
      metadata: JSON.stringify({ price: 99.00, description: '深入理解JavaScript编程语言的经典著作' })
    },
    {
      title: '算法导论',
      author: '科曼',
      isbn: '978-7-111-40701-0',
      publisher: '机械工业出版社',
      publish_date: '2013-01-01',
      stock: 7,
      available: 7,
      category_id: 1,
      metadata: JSON.stringify({ price: 128.00, description: '算法领域的经典教材' })
    },
    {
      title: '设计模式',
      author: '埃里希·伽玛',
      isbn: '978-7-111-21335-6',
      publisher: '机械工业出版社',
      publish_date: '2007-11-01',
      stock: 5,
      available: 5,
      category_id: 1,
      metadata: JSON.stringify({ price: 58.00, description: '软件开发设计模式的经典著作' })
    },
    {
      title: '深入理解计算机系统',
      author: 'Randal E. Bryant',
      isbn: '978-7-111-54493-7',
      publisher: '机械工业出版社',
      publish_date: '2016-07-01',
      stock: 6,
      available: 6,
      category_id: 1,
      metadata: JSON.stringify({ price: 128.00, description: '计算机系统底层原理讲解' })
    },

    // 分类2：文学小说（4本）
    {
      title: '百年孤独',
      author: '加西亚·马尔克斯',
      isbn: '978-7-5442-5864-5',
      publisher: '南海出版公司',
      publish_date: '2011-06-01',
      stock: 5,
      available: 5,
      category_id: 2,
      metadata: JSON.stringify({ price: 39.50, description: '魔幻现实主义文学代表作' })
    },
    {
      title: '三体',
      author: '刘慈欣',
      isbn: '978-7-5366-9293-0',
      publisher: '重庆出版社',
      publish_date: '2008-01-01',
      stock: 8,
      available: 8,
      category_id: 2,
      metadata: JSON.stringify({ price: 23.00, description: '中国科幻文学里程碑作品' })
    },
    {
      title: '活着',
      author: '余华',
      isbn: '978-7-5063-6449-1',
      publisher: '作家出版社',
      publish_date: '2012-08-01',
      stock: 7,
      available: 7,
      category_id: 2,
      metadata: JSON.stringify({ price: 20.00, description: '中国当代文学经典' })
    },
    {
      title: '追风筝的人',
      author: '卡勒德·胡赛尼',
      isbn: '978-7-5302-0802-4',
      publisher: '北京十月文艺出版社',
      publish_date: '2006-05-01',
      stock: 6,
      available: 6,
      category_id: 2,
      metadata: JSON.stringify({ price: 29.00, description: '关于友情、背叛与救赎的小说' })
    },

    // 分类3：历史（3本）
    {
      title: '人类简史',
      author: '尤瓦尔·赫拉利',
      isbn: '978-7-5086-4735-7',
      publisher: '中信出版社',
      publish_date: '2014-11-01',
      stock: 9,
      available: 9,
      category_id: 3,
      metadata: JSON.stringify({ price: 68.00, description: '从认知革命到科学革命的人类历程' })
    },
    {
      title: '明朝那些事儿',
      author: '当年明月',
      isbn: '978-7-5039-3047-5',
      publisher: '文化艺术出版社',
      publish_date: '2006-09-01',
      stock: 10,
      available: 10,
      category_id: 3,
      metadata: JSON.stringify({ price: 28.80, description: '通俗明史读物' })
    },
    {
      title: '中国通史',
      author: '吕思勉',
      isbn: '978-7-5113-3373-9',
      publisher: '中国华侨出版社',
      publish_date: '2013-01-01',
      stock: 4,
      available: 4,
      category_id: 3,
      metadata: JSON.stringify({ price: 45.00, description: '中国历史经典通史' })
    },

    // 分类4：科学（4本）
    {
      title: '时间简史',
      author: '史蒂芬·霍金',
      isbn: '978-7-5357-3230-9',
      publisher: '湖南科学技术出版社',
      publish_date: '2010-04-01',
      stock: 8,
      available: 8,
      category_id: 4,
      metadata: JSON.stringify({ price: 45.00, description: '从大爆炸到黑洞的宇宙探索' })
    },
    {
      title: '物种起源',
      author: '查尔斯·达尔文',
      isbn: '978-7-100-07885-0',
      publisher: '商务印书馆',
      publish_date: '2011-07-01',
      stock: 5,
      available: 5,
      category_id: 4,
      metadata: JSON.stringify({ price: 34.00, description: '进化论的奠基之作' })
    },
    {
      title: '相对论',
      author: '阿尔伯特·爱因斯坦',
      isbn: '978-7-5357-7507-5',
      publisher: '湖南科学技术出版社',
      publish_date: '2012-01-01',
      stock: 6,
      available: 6,
      category_id: 4,
      metadata: JSON.stringify({ price: 32.00, description: '相对论经典著作' })
    },
    {
      title: '量子物理史话',
      author: '曹天元',
      isbn: '978-7-5326-3239-8',
      publisher: '上海辞书出版社',
      publish_date: '2011-05-01',
      stock: 7,
      available: 7,
      category_id: 4,
      metadata: JSON.stringify({ price: 36.00, description: '量子物理学通俗读物' })
    },

    // 分类5：哲学（3本）
    {
      title: '论语',
      author: '孔子及其弟子',
      isbn: '978-7-101-05918-5',
      publisher: '中华书局',
      publish_date: '2006-12-01',
      stock: 10,
      available: 10,
      category_id: 5,
      metadata: JSON.stringify({ price: 18.00, description: '儒家经典著作' })
    },
    {
      title: '理想国',
      author: '柏拉图',
      isbn: '978-7-5327-5804-5',
      publisher: '上海译文出版社',
      publish_date: '2012-05-01',
      stock: 6,
      available: 6,
      category_id: 5,
      metadata: JSON.stringify({ price: 38.00, description: '西方哲学经典' })
    },
    {
      title: '存在与时间',
      author: '马丁·海德格尔',
      isbn: '978-7-100-07739-6',
      publisher: '商务印书馆',
      publish_date: '2011-04-01',
      stock: 3,
      available: 3,
      category_id: 5,
      metadata: JSON.stringify({ price: 49.00, description: '存在主义哲学代表作' })
    },

    // 分类6：艺术（3本）
    {
      title: '艺术的故事',
      author: 'E.H.贡布里希',
      isbn: '978-7-5340-3583-5',
      publisher: '浙江人民美术出版社',
      publish_date: '2012-03-01',
      stock: 5,
      available: 5,
      category_id: 6,
      metadata: JSON.stringify({ price: 138.00, description: '艺术史经典著作' })
    },
    {
      title: '设计中的设计',
      author: '原研哉',
      isbn: '978-7-5086-1510-0',
      publisher: '中信出版社',
      publish_date: '2009-01-01',
      stock: 8,
      available: 8,
      category_id: 6,
      metadata: JSON.stringify({ price: 42.00, description: '日本设计大师的设计理念' })
    },
    {
      title: '美学散步',
      author: '宗白华',
      isbn: '978-7-108-02528-1',
      publisher: '生活·读书·新知三联书店',
      publish_date: '2005-03-01',
      stock: 7,
      available: 7,
      category_id: 6,
      metadata: JSON.stringify({ price: 28.00, description: '中国美学经典' })
    },

    // 分类7：心理学（3本）
    {
      title: '心理学与生活',
      author: '理查德·格里格',
      isbn: '978-7-115-23215-8',
      publisher: '人民邮电出版社',
      publish_date: '2009-11-01',
      stock: 6,
      available: 6,
      category_id: 7,
      metadata: JSON.stringify({ price: 68.00, description: '心理学入门经典教材' })
    },
    {
      title: '社会心理学',
      author: '戴维·迈尔斯',
      isbn: '978-7-115-27378-6',
      publisher: '人民邮电出版社',
      publish_date: '2012-01-01',
      stock: 7,
      available: 7,
      category_id: 7,
      metadata: JSON.stringify({ price: 68.00, description: '社会心理学经典教材' })
    },
    {
      title: '非暴力沟通',
      author: '马歇尔·卢森堡',
      isbn: '978-7-5080-6841-1',
      publisher: '华夏出版社',
      publish_date: '2012-08-01',
      stock: 10,
      available: 10,
      category_id: 7,
      metadata: JSON.stringify({ price: 29.80, description: '心理健康经典，教你用共情方式化解沟通冲突' })
    },

    // 分类8：教育心理（3本）
    {
      title: '正面管教',
      author: '简·尼尔森',
      isbn: '978-7-5153-4788-9',
      publisher: '中国青年出版社',
      publish_date: '2018-07-01',
      stock: 9,
      available: 9,
      category_id: 8,
      metadata: JSON.stringify({ price: 49.00, description: '儿童教育经典，倡导尊重与合作的管教方式' })
    },
    {
      title: '认知觉醒',
      author: '周岭',
      isbn: '978-7-5113-8325-3',
      publisher: '中国华侨出版社',
      publish_date: '2020-10-01',
      stock: 11,
      available: 11,
      category_id: 8,
      metadata: JSON.stringify({ price: 45.00, description: '从认知科学角度，教你提升学习力与专注力' })
    },
    {
      title: '发展心理学',
      author: '戴维·谢弗',
      isbn: '978-7-115-50112-1',
      publisher: '人民邮电出版社',
      publish_date: '2019-01-01',
      stock: 4,
      available: 4,
      category_id: 8,
      metadata: JSON.stringify({ price: 128.00, description: '心理学教材，覆盖从婴儿到老年的发展历程' })
    }
  ],
  
  readers: [
    // 学生（12人，学号2024001-2024012）
    { name: '张三', student_id: '2024001', type: 'student', email: 'zhangsan@example.com', phone: '13800138001' },
    { name: '李四', student_id: '2024002', type: 'student', email: 'lisi@example.com', phone: '13800138002' },
    { name: '王五', student_id: '2024003', type: 'student', email: 'wangwu@example.com', phone: '13800138003' },
    { name: '赵六', student_id: '2024004', type: 'student', email: 'zhaoliu@example.com', phone: '13800138004' },
    { name: '钱七', student_id: '2024005', type: 'student', email: 'qianqi@example.com', phone: '13800138005' },
    { name: '孙八', student_id: '2024006', type: 'student', email: 'sunba@example.com', phone: '13800138006' },
    { name: '周九', student_id: '2024007', type: 'student', email: 'zhoujiu@example.com', phone: '13800138007' },
    { name: '吴十', student_id: '2024008', type: 'student', email: 'wushi@example.com', phone: '13800138008' },
    { name: '郑十一', student_id: '2024009', type: 'student', email: 'zheng11@example.com', phone: '13800138009' },
    { name: '王十二', student_id: '2024010', type: 'student', email: 'wang12@example.com', phone: '13800138010' },
    { name: '李十三', student_id: '2024011', type: 'student', email: 'li13@example.com', phone: '13800138011' },
    { name: '张十四', student_id: '2024012', type: 'student', email: 'zhang14@example.com', phone: '13800138012' },

    // 教师（4人，工号T2024001-T2024004）
    { name: '陈教授', student_id: 'T2024001', type: 'teacher', email: 'chenjiao@example.com', phone: '13900139001' },
    { name: '刘老师', student_id: 'T2024002', type: 'teacher', email: 'liulaoshi@example.com', phone: '13900139002' },
    { name: '黄讲师', student_id: 'T2024003', type: 'teacher', email: 'huangjiang@example.com', phone: '13900139003' },
    { name: '赵助教', student_id: 'T2024004', type: 'teacher', email: 'zhaozhu@example.com', phone: '13900139004' },

    // 职工（2人，工号S2024001-S2024002）
    { name: '马行政', student_id: 'S2024001', type: 'staff', email: 'maxingzheng@example.com', phone: '13700137001' },
    { name: '杨后勤', student_id: 'S2024002', type: 'staff', email: 'yanghouqin@example.com', phone: '13700137002' }
  ]
};

/**
 * 初始化基础测试数据（分类、图书、读者）
 * @returns {Promise<void>}
 */
async function initializeBaseTestData() {
  let connection;
  
  try {
    console.log('🚀 开始初始化基础测试数据...');
    
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    
    // 清空现有数据
    console.log('🧹 清空现有测试数据...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE borrows');
    await connection.execute('TRUNCATE TABLE books');
    await connection.execute('TRUNCATE TABLE readers');
    await connection.execute('TRUNCATE TABLE book_categories');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // 插入图书分类
    console.log('📚 插入图书分类数据...');
    for (const category of testData.categories) {
      await connection.execute(
        'INSERT INTO book_categories (name, description) VALUES (?, ?)',
        [category.name, category.description]
      );
    }
    
    // 插入图书
    console.log('📖 插入图书数据...');
    for (const book of testData.books) {
      await connection.execute(
        `INSERT INTO books (title, author, isbn, publisher, publish_date, stock, available, category_id, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [book.title, book.author, book.isbn, book.publisher, book.publish_date, book.stock, book.available, book.category_id, book.metadata]
      );
    }
    
    // 插入读者
    console.log('👥 插入读者数据...');
    for (const reader of testData.readers) {
      await connection.execute(
        'INSERT INTO readers (name, student_id, type, email, phone) VALUES (?, ?, ?, ?, ?)',
        [reader.name, reader.student_id, reader.type, reader.email, reader.phone]
      );
    }
    
    // 验证数据插入
    console.log('✅ 验证数据插入结果...');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM book_categories');
    const [books] = await connection.execute('SELECT COUNT(*) as count FROM books');
    const [readers] = await connection.execute('SELECT COUNT(*) as count FROM readers');
    
    console.log(`📊 基础测试数据初始化完成：`);
    console.log(`   图书分类: ${categories[0].count} 个`);
    console.log(`   图书: ${books[0].count} 本`);
    console.log(`   读者: ${readers[0].count} 人`);
    
    // 显示示例数据
    console.log('\n📋 基础测试数据示例：');
    const [sampleBooks] = await connection.execute('SELECT book_id, title, stock FROM books LIMIT 3');
    const [sampleReaders] = await connection.execute('SELECT reader_id, name, email FROM readers LIMIT 2');
    
    console.log('图书示例：');
    sampleBooks.forEach(book => {
      console.log(`  - ID: ${book.book_id}, 书名: ${book.title}, 库存: ${book.stock}`);
    });
    
    console.log('读者示例：');
    sampleReaders.forEach(reader => {
      console.log(`  - ID: ${reader.reader_id}, 姓名: ${reader.name}, 邮箱: ${reader.email}`);
    });
    
  } catch (error) {
    console.error('❌ 初始化基础数据失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * 添加借阅测试数据（36条，含3种状态：borrowed在借/returned已还/overdue逾期）
 * @returns {Promise<void>}
 */
async function addBorrowTestData() {
  const pool = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    port: dbConfig.port
  });

  try {
    // 先查询现有读者和可借图书（确保数据关联有效）
    const [readers] = await pool.execute('SELECT reader_id, name, type FROM readers');
    const [books] = await pool.execute('SELECT book_id, title, available, category_id FROM books WHERE available > 0');
    
    if (readers.length === 0 || books.length === 0) {
      console.log('❌ 请先执行基础数据初始化（--only-base）');
      return;
    }

    console.log(`\n🔍 数据准备完成：读者${readers.length}人，可借图书${books.length}本`);

    // 4. 借阅记录：36条（覆盖3种状态，每条记录关联真实读者和图书）
    // 创建日期函数，生成与当前时间相符的测试数据
    const getDateString = (daysFromNow) => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const borrowRecords = [
      // 状态1：borrowed（在借，12条，最近12天借出，还未到期）
      { reader_id: readers[0].reader_id, book_id: books[0].book_id, borrow_date: getDateString(-11), due_date: getDateString(20), return_date: null, status: 'borrowed' },
      { reader_id: readers[1].reader_id, book_id: books[1].book_id, borrow_date: getDateString(-10), due_date: getDateString(21), return_date: null, status: 'borrowed' },
      { reader_id: readers[2].reader_id, book_id: books[2].book_id, borrow_date: getDateString(-9), due_date: getDateString(22), return_date: null, status: 'borrowed' },
      { reader_id: readers[3].reader_id, book_id: books[3].book_id, borrow_date: getDateString(-8), due_date: getDateString(23), return_date: null, status: 'borrowed' },
      { reader_id: readers[4].reader_id, book_id: books[4].book_id, borrow_date: getDateString(-7), due_date: getDateString(24), return_date: null, status: 'borrowed' },
      { reader_id: readers[5].reader_id, book_id: books[5].book_id, borrow_date: getDateString(-6), due_date: getDateString(25), return_date: null, status: 'borrowed' },
      { reader_id: readers[6].reader_id, book_id: books[6].book_id, borrow_date: getDateString(-5), due_date: getDateString(26), return_date: null, status: 'borrowed' },
      { reader_id: readers[7].reader_id, book_id: books[7].book_id, borrow_date: getDateString(-4), due_date: getDateString(27), return_date: null, status: 'borrowed' },
      { reader_id: readers[8].reader_id, book_id: books[8].book_id, borrow_date: getDateString(-3), due_date: getDateString(28), return_date: null, status: 'borrowed' },
      { reader_id: readers[9].reader_id, book_id: books[9].book_id, borrow_date: getDateString(-2), due_date: getDateString(29), return_date: null, status: 'borrowed' },
      { reader_id: readers[10].reader_id, book_id: books[10].book_id, borrow_date: getDateString(-1), due_date: getDateString(30), return_date: null, status: 'borrowed' },
      { reader_id: readers[11].reader_id, book_id: books[11].book_id, borrow_date: getDateString(0), due_date: getDateString(31), return_date: null, status: 'borrowed' },

      // 状态2：returned（已还，20条，历史记录）
      { reader_id: readers[12].reader_id, book_id: books[12].book_id, borrow_date: getDateString(-60), due_date: getDateString(-30), return_date: getDateString(-40), status: 'returned' },
      { reader_id: readers[13].reader_id, book_id: books[13].book_id, borrow_date: getDateString(-59), due_date: getDateString(-29), return_date: getDateString(-39), status: 'returned' },
      { reader_id: readers[14].reader_id, book_id: books[14].book_id, borrow_date: getDateString(-58), due_date: getDateString(-28), return_date: getDateString(-38), status: 'returned' },
      { reader_id: readers[15].reader_id, book_id: books[15].book_id, borrow_date: getDateString(-57), due_date: getDateString(-27), return_date: getDateString(-37), status: 'returned' },
      { reader_id: readers[16].reader_id, book_id: books[16].book_id, borrow_date: getDateString(-56), due_date: getDateString(-26), return_date: getDateString(-36), status: 'returned' },
      { reader_id: readers[17].reader_id, book_id: books[17].book_id, borrow_date: getDateString(-55), due_date: getDateString(-25), return_date: getDateString(-35), status: 'returned' },
      { reader_id: readers[0].reader_id, book_id: books[18].book_id, borrow_date: getDateString(-54), due_date: getDateString(-24), return_date: getDateString(-34), status: 'returned' },
      { reader_id: readers[1].reader_id, book_id: books[19].book_id, borrow_date: getDateString(-53), due_date: getDateString(-23), return_date: getDateString(-33), status: 'returned' },
      { reader_id: readers[2].reader_id, book_id: books[20].book_id, borrow_date: getDateString(-52), due_date: getDateString(-22), return_date: getDateString(-32), status: 'returned' },
      { reader_id: readers[3].reader_id, book_id: books[21].book_id, borrow_date: getDateString(-51), due_date: getDateString(-21), return_date: getDateString(-31), status: 'returned' },
      { reader_id: readers[4].reader_id, book_id: books[22].book_id, borrow_date: getDateString(-50), due_date: getDateString(-20), return_date: getDateString(-30), status: 'returned' },
      { reader_id: readers[5].reader_id, book_id: books[23].book_id, borrow_date: getDateString(-49), due_date: getDateString(-19), return_date: getDateString(-29), status: 'returned' },
      { reader_id: readers[6].reader_id, book_id: books[24].book_id, borrow_date: getDateString(-48), due_date: getDateString(-18), return_date: getDateString(-28), status: 'returned' },
      { reader_id: readers[7].reader_id, book_id: books[25].book_id, borrow_date: getDateString(-47), due_date: getDateString(-17), return_date: getDateString(-27), status: 'returned' },
      { reader_id: readers[8].reader_id, book_id: books[26].book_id, borrow_date: getDateString(-46), due_date: getDateString(-16), return_date: getDateString(-26), status: 'returned' },
      { reader_id: readers[9].reader_id, book_id: books[0].book_id, borrow_date: getDateString(-45), due_date: getDateString(-15), return_date: getDateString(-25), status: 'returned' },
      { reader_id: readers[10].reader_id, book_id: books[0].book_id, borrow_date: getDateString(-44), due_date: getDateString(-14), return_date: getDateString(-24), status: 'returned' },
      { reader_id: readers[11].reader_id, book_id: books[1].book_id, borrow_date: getDateString(-43), due_date: getDateString(-13), return_date: getDateString(-23), status: 'returned' },
      { reader_id: readers[12].reader_id, book_id: books[2].book_id, borrow_date: getDateString(-42), due_date: getDateString(-12), return_date: getDateString(-22), status: 'returned' },
      { reader_id: readers[13].reader_id, book_id: books[3].book_id, borrow_date: getDateString(-41), due_date: getDateString(-11), return_date: getDateString(-21), status: 'returned' },

      // 状态3：overdue（逾期，4条，已到期，显示不同的逾期天数）
      { reader_id: readers[14].reader_id, book_id: books[4].book_id, borrow_date: getDateString(-40), due_date: getDateString(-10), return_date: null, status: 'overdue' },
      { reader_id: readers[15].reader_id, book_id: books[5].book_id, borrow_date: getDateString(-35), due_date: getDateString(-8), return_date: null, status: 'overdue' },
      { reader_id: readers[16].reader_id, book_id: books[6].book_id, borrow_date: getDateString(-30), due_date: getDateString(-5), return_date: null, status: 'overdue' },
      { reader_id: readers[17].reader_id, book_id: books[7].book_id, borrow_date: getDateString(-25), due_date: getDateString(-3), return_date: null, status: 'overdue' }
    ];

    // 插入借阅记录
    console.log(`📝 开始插入借阅记录（${borrowRecords.length}条）...`);
    for (const record of borrowRecords) {
      await pool.execute(
        'INSERT INTO borrows (reader_id, book_id, borrow_date, due_date, return_date, status) VALUES (?, ?, ?, ?, ?, ?)',
        [record.reader_id, record.book_id, record.borrow_date, record.due_date, record.return_date, record.status]
      );
    }

    // 更新图书库存（仅“在借”和“逾期”状态减少可借数量）
    const borrowedBooks = borrowRecords.filter(r => ['borrowed', 'overdue'].includes(r.status));
    console.log(`📦 更新图书库存（${borrowedBooks.length}本图书被借出）...`);
    for (const record of borrowedBooks) {
      await pool.execute('UPDATE books SET available = available - 1 WHERE book_id = ?', [record.book_id]);
    }

    // 验证借阅数据
    const [totalBorrows] = await pool.execute('SELECT COUNT(*) as count FROM borrows');
    const [borrowStatus] = await pool.execute('SELECT status, COUNT(*) as count FROM borrows GROUP BY status');
    
    console.log('\n📊 借阅记录统计：');
    console.log(`   总借阅记录: ${totalBorrows[0].count} 条`);
    borrowStatus.forEach(status => {
      console.log(`   ${status.status}状态: ${status.count} 条`);
    });

    // 验证库存更新
    const [availableBooks] = await pool.execute('SELECT SUM(available) as total_available FROM books');
    const [totalStock] = await pool.execute('SELECT SUM(stock) as total_stock FROM books');
    console.log(`\n📦 图书库存统计：`);
    console.log(`   总库存: ${totalStock[0].total_stock} 本`);
    console.log(`   可借数量: ${availableBooks[0].total_available} 本`);
    console.log(`   已借出: ${totalStock[0].total_stock - availableBooks[0].total_available} 本`);

  } catch (e) {
    console.error('❌ 添加借阅数据错误:', e.message);
    throw e;
  } finally {
    if (pool) {
      pool.end().catch(err => console.error('关闭连接池错误:', err));
    }
  }
}

/**
 * 完整测试数据初始化（包含基础数据和借阅数据）
 * @returns {Promise<void>}
 */
async function initializeCompleteTestData() {
  try {
    // 先初始化基础数据
    await initializeBaseTestData();
    
    // 然后添加借阅数据
    await addBorrowTestData();
    
    console.log('\n🎉 完整测试数据初始化完成！');
    console.log('现在可以使用Postman进行API测试了。');
  } catch (error) {
    console.error('❌ 完整测试数据初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--only-base')) {
    // 只初始化基础数据
    initializeBaseTestData()
      .then(() => {
        console.log('\n🎉 基础测试数据初始化完成！');
      })
      .catch(error => {
        console.error('初始化失败:', error);
        process.exit(1);
      });
  } else if (args.includes('--only-borrow')) {
    // 只添加借阅数据
    addBorrowTestData()
      .then(() => {
        console.log('\n🎉 借阅测试数据添加完成！');
      })
      .catch(error => {
        console.error('添加借阅数据失败:', error);
        process.exit(1);
      });
  } else {
    // 默认执行完整初始化
    initializeCompleteTestData();
  }
}

module.exports = {
  initializeBaseTestData,
  addBorrowTestData,
  initializeCompleteTestData,
  testData
};