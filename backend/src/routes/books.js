// 图书查询相关路由
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db.js'); // 使用数据库配置文件中的连接池

// 查询函数
async function query(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    console.log('执行SQL:', sql, '参数:', params);
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('SQL执行错误:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * @swagger
 * /api/books/search:
 *   get:
 *     summary: 综合查询图书
 *     description: 支持多种条件组合查询图书信息，根据传入参数自动适配不同查询场景
 *     parameters:
 *       - name: category
 *         in: query
 *         description: 图书分类名称
 *         required: false
 *         schema: { type: 'string' }
 *       - name: title
 *         in: query
 *         description: 书名关键词
 *         required: false
 *         schema: { type: 'string' }
 *       - name: readerType
 *         in: query
 *         description: 读者类型（student/teacher/staff/other）
 *         required: false
 *         schema: { type: 'string' }
 *       - name: author
 *         in: query
 *         description: 作者关键词
 *         required: false
 *         schema: { type: 'string' }
 *       - name: stock
 *         in: query
 *         description: 库存数量（0表示有库存）
 *         required: false
 *         schema: { type: 'integer' }
 *       - name: publisher
 *         in: query
 *         description: 出版社关键词
 *         required: false
 *         schema: { type: 'string' }
 *       - name: page
 *         in: query
 *         description: 页码，默认1
 *         required: false
 *         schema: { type: 'integer', default: 1 }
 *       - name: pageSize
 *         in: query
 *         description: 每页条数，默认10
 *         required: false
 *         schema: { type: 'integer', default: 10 }
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data:
 *                   type: 'object'
 *                   properties:
 *                     total: { type: 'integer', example: 42 }
 *                     list:
 *                       type: 'array'
 *                       items:
 *                         type: 'object'
 *                         properties:
 *                           book_id: { type: 'integer', example: 1 }
 *                           title: { type: 'string', example: '红楼梦' }
 *                           author: { type: 'string', example: '曹雪芹' }
 *                           category_id: { type: 'integer', example: 1 }
 *                           category_name: { type: 'string', example: '文学' }
 *                           publisher: { type: 'string', example: '人民文学出版社' }
 *                           stock: { type: 'integer', example: 5 }
 *                           available: { type: 'integer', example: 4 }
 *                     page: { type: 'integer', example: 1 }
 *                     pageSize: { type: 'integer', example: 10 }
 *                 msg: { type: 'string', example: '查询成功' }
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 500 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '查询失败，请稍后重试' }
 */
router.get('/search', async (req, res) => {
  try {
    const { category, title, readerType, author, stock, publisher } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
    
    console.log('收到查询请求:', { category, title, readerType, author, stock, publisher, page, pageSize });
    
    // 构建基础SQL
    let whereConditions = [];
    let params = [];
    
    if (category && category.trim()) {
      whereConditions.push('bc.name LIKE ?');
      params.push(`%${category.trim()}%`);
    }
    
    if (title && title.trim()) {
      whereConditions.push('b.title LIKE ?');
      params.push(`%${title.trim()}%`);
    }
    
    if (author && author.trim()) {
      whereConditions.push('b.author LIKE ?');
      params.push(`%${author.trim()}%`);
    }
    
    if (publisher && publisher.trim()) {
      whereConditions.push('b.publisher LIKE ?');
      params.push(`%${publisher.trim()}%`);
    }
    
    if (stock !== undefined) {
      const stockValue = parseInt(stock);
      if (!isNaN(stockValue)) {
        if (stockValue === 0) {
          whereConditions.push('b.available > ?');
          params.push(0);
        } else {
          whereConditions.push('b.available >= ?');
          params.push(stockValue);
        }
      }
    }
    
    // 忽略readerType参数，因为它不直接影响图书查询
    
    const whereClause = whereConditions.length > 0 ? ' AND ' + whereConditions.join(' AND ') : '';
    
    // 获取总条数
    let countSql = 'SELECT COUNT(*) as total FROM books b LEFT JOIN book_categories bc ON b.category_id = bc.category_id WHERE 1=1 ' + whereClause;
    
    // 获取分页数据 - 修复MySQL 9.x兼容性问题
    const offset = (page - 1) * pageSize;
    
    // 验证参数安全性
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
        !Number.isInteger(offset) || offset < 0) {
      throw new Error('分页参数无效');
    }
    
    let sql = 'SELECT b.book_id, b.title, b.author, b.category_id, bc.name as category_name, b.publisher, b.stock, b.available FROM books b LEFT JOIN book_categories bc ON b.category_id = bc.category_id WHERE 1=1 ' + whereClause + ' ORDER BY b.book_id LIMIT ' + pageSize + ' OFFSET ' + offset;
    
    console.log('计数SQL:', countSql);
    console.log('计数参数:', params);
    console.log('查询SQL:', sql);
    console.log('查询参数:', params);
    
    // 执行查询
    const [books, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, params)
    ]);
    
    const total = countResult[0].total;
    
    console.log(`查询完成: 找到 ${books.length} 条记录，总共 ${total} 条`);
    
    res.json({
      code: 200,
      data: {
        total,
        list: books,
        page,
        pageSize
      },
      msg: '查询成功'
    });
  } catch (error) {
    console.error('查询图书失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: `查询失败: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: 新增图书
 *     description: 添加新的图书信息到系统
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - stock
 *               - category_id
 *             properties:
 *               title:
 *                 type: string
 *                 description: 书名
 *               author:
 *                 type: string
 *                 description: 作者
 *               isbn:
 *                 type: string
 *                 description: ISBN号
 *               publisher:
 *                 type: string
 *                 description: 出版社
 *               publish_date:
 *                 type: string
 *                 format: date
 *                 description: 出版日期
 *               stock:
 *                 type: integer
 *                 description: 总库存数量
 *               category_id:
 *                 type: integer
 *                 description: 图书分类ID
 *               description:
 *                 type: string
 *                 description: 图书描述
 *     responses:
 *       200:
 *         description: 图书添加成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     book_id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "新图书"
 *                     author:
 *                       type: string
 *                       example: "新作者"
 *                     stock:
 *                       type: integer
 *                       example: 5
 *                     available:
 *                       type: integer
 *                       example: 5
 *                 msg:
 *                   type: string
 *                   example: "图书添加成功"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 data:
 *                   type: null
 *                 msg:
 *                   type: string
 *                   example: "添加失败，请稍后重试"
 */
router.post('/', async (req, res) => {
  try {
    const { title, author, isbn, publisher, publish_date, stock, category_id, description } = req.body;
    
    // 参数验证
    if (!title || !author || stock === undefined || category_id === undefined) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '缺少必要参数：title, author, stock, category_id 为必填项'
      });
    }

    const stockNum = parseInt(stock);
    const categoryNum = parseInt(category_id);
    
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '库存数量必须为有效的非负整数'
      });
    }

    if (isNaN(categoryNum) || categoryNum <= 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '分类ID必须为有效的正整数'
      });
    }

    console.log('收到新增图书请求:', { title, author, isbn, publisher, publish_date, stock: stockNum, category_id: categoryNum, description });

    // 插入新图书记录
    const sql = `
      INSERT INTO books (title, author, isbn, publisher, publish_date, stock, available, category_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      title.trim(),
      author.trim(),
      isbn || null,
      publisher || null,
      publish_date || null,
      stockNum,
      stockNum, // 初始可用库存等于总库存
      categoryNum,
      JSON.stringify({ description: description || '' })
    ];

    console.log('执行SQL:', sql);
    console.log('参数:', params);

    const result = await query(sql, params);
    const bookId = result.insertId;

    // 获取刚创建的图书记录
    const getBookSql = `
      SELECT b.book_id, b.title, b.author, b.isbn, b.publisher, b.publish_date, 
             b.stock, b.available, b.category_id, b.metadata, b.created_at,
             bc.name as category_name
      FROM books b 
      LEFT JOIN book_categories bc ON b.category_id = bc.category_id
      WHERE b.book_id = ?
    `;

    const [book] = await query(getBookSql, [bookId]);

    if (!book) {
      throw new Error('创建图书后查询失败');
    }

    console.log(`图书创建成功: ID=${bookId}, 书名=${title}`);

    res.json({
      code: 200,
      data: book,
      msg: '图书添加成功'
    });

  } catch (error) {
    console.error('添加图书失败:', error);
    
    // 处理外键约束错误
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '指定的图书分类不存在'
      });
    }

    res.status(500).json({
      code: 500,
      data: null,
      msg: `添加失败: ${error.message}`
    });
  }
});

module.exports = router;