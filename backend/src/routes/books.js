// 图书查询相关路由
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db.js'); // 使用数据库配置文件中的连接池
const { uploadExcel, handleUploadError, cleanupTempFile } = require('../middleware/fileUpload');
const { parseExcelFile, validateExcelData, convertExcelToObjects } = require('../utils/excelHelper');
const path = require('path');

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
    const { category, title, readerType, author, stock, publisher, isbn, publish_year } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
    
    console.log('收到查询请求:', { category, title, readerType, author, stock, publisher, isbn, publish_year, page, pageSize });
    
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
    
    // 新增：ISBN搜索支持
    if (isbn && isbn.trim()) {
      whereConditions.push('b.isbn LIKE ?');
      params.push(`%${isbn.trim()}%`);
    }
    
    // 新增：出版年份搜索支持
    if (publish_year && publish_year.trim()) {
      if (publish_year === 'older') {
        whereConditions.push('YEAR(b.publish_date) < ?');
        params.push(2020);
      } else {
        whereConditions.push('YEAR(b.publish_date) = ?');
        params.push(parseInt(publish_year));
      }
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
    
    let sql = 'SELECT b.book_id, b.title, b.author, b.category_id, bc.name as category_name, b.publisher, b.isbn, b.publish_date, b.stock, b.available FROM books b LEFT JOIN book_categories bc ON b.category_id = bc.category_id WHERE 1=1 ' + whereClause + ' ORDER BY b.book_id LIMIT ' + pageSize + ' OFFSET ' + offset;
    
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

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: 获取图书详情
 *     description: 根据图书ID获取图书的完整详细信息
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 图书ID
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data:
 *                   type: 'object'
 *                   properties:
 *                     book_id: { type: 'integer', example: 1 }
 *                     title: { type: 'string', example: 'JavaScript高级程序设计' }
 *                     author: { type: 'string', example: 'Nicholas C. Zakas' }
 *                     isbn: { type: 'string', example: '978-7-115-27579-0' }
 *                     publisher: { type: 'string', example: '人民邮电出版社' }
 *                     publish_date: { type: 'string', example: '2024-01-15' }
 *                     stock: { type: 'integer', example: 10 }
 *                     available: { type: 'integer', example: 8 }
 *                     category_id: { type: 'integer', example: 1 }
 *                     category_name: { type: 'string', example: '计算机科学' }
 *                     metadata: { type: 'string', example: '{"description":"经典编程书籍"}' }
 *                     created_at: { type: 'string', example: '2024-01-15T00:00:00.000Z' }
 *                 msg: { type: 'string', example: '获取成功' }
 *       404:
 *         description: 图书不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 404 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '图书不存在' }
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '图书ID格式错误'
      });
    }
    
    console.log('获取图书详情，ID:', bookId);
    
    // 查询图书详细信息，包含分类信息
    const sql = `
      SELECT b.book_id, b.title, b.author, b.isbn, b.publisher, b.publish_date, 
             b.stock, b.available, b.category_id, b.metadata, b.created_at,
             bc.name as category_name
      FROM books b 
      LEFT JOIN book_categories bc ON b.category_id = bc.category_id
      WHERE b.book_id = ?
    `;
    
    const result = await query(sql, [bookId]);
    
    if (result.length === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '图书不存在'
      });
    }
    
    const book = result[0];
    
    // 解析metadata字段
    if (book.metadata) {
      try {
        book.metadata = JSON.parse(book.metadata);
      } catch (error) {
        console.warn('解析metadata失败:', error);
        book.metadata = {};
      }
    } else {
      book.metadata = {};
    }
    
    console.log('获取图书详情成功:', book.title);
    
    res.json({
      code: 200,
      data: book,
      msg: '获取成功'
    });
    
  } catch (error) {
    console.error('获取图书详情失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: `获取失败: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/books/batch:
 *   delete:
 *     summary: 批量删除图书
 *     description: 批量删除指定的图书，会检查借阅状态确保安全删除
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book_ids
 *             properties:
 *               book_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 要删除的图书ID数组
 *                 example: [1, 2, 3, 15, 27]
 *     responses:
 *       200:
 *         description: 批量删除成功
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
 *                     deleted_count:
 *                       type: integer
 *                       example: 3
 *                     failed_items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           book_id:
 *                             type: integer
 *                           reason:
 *                             type: string
 *                     details:
 *                       type: object
 *                       properties:
 *                         total_requested:
 *                           type: integer
 *                         successful:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                 msg:
 *                   type: string
 *                   example: "批量删除成功"
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.delete('/batch', async (req, res) => {
  try {
    console.log('收到批量删除请求:', {
      body: req.body,
      headers: req.headers['content-type'],
      method: req.method,
      url: req.url
    });
    
    const { book_ids } = req.body;
    
    console.log('提取的book_ids:', book_ids, 'type:', typeof book_ids, 'isArray:', Array.isArray(book_ids));
    
    // 参数验证
    if (!Array.isArray(book_ids) || book_ids.length === 0) {
      console.error('参数验证失败: book_ids不是非空数组');
      return res.status(400).json({
        code: 400,
        data: null,
        msg: 'book_ids必须是非空数组'
      });
    }
    
    // 限制批量操作数量
    if (book_ids.length > 100) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '批量操作数量不能超过100个'
      });
    }
    
    // 检查ID格式
    const invalidIds = book_ids.filter(id => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '包含无效的图书ID'
      });
    }
    
    console.log('批量删除图书请求:', { book_ids, count: book_ids.length });
    
    // 使用连接池获取连接并开启事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. 检查所有图书是否存在
      const bookExistsSql = `
        SELECT book_id, title
        FROM books 
        WHERE book_id IN (${book_ids.map(() => '?').join(',')}) 
      `;
      const [existingBooks] = await connection.execute(bookExistsSql, book_ids);
      const existingBookIds = existingBooks.map(book => book.book_id);
      const nonExistentIds = book_ids.filter(id => !existingBookIds.includes(id));
      
      // 2. 检查借阅状态（只检查未归还的借阅记录）
      let blockedBooks = [];
      if (existingBookIds.length > 0) {
        console.log('检查未归还借阅记录，现有图书IDs:', existingBookIds);
        
        // 只检查未归还的借阅记录（return_date IS NULL）
        const borrowCheckSql = `
          SELECT DISTINCT b.book_id, bk.title, 
                 COUNT(*) as active_borrows
          FROM borrows b
          LEFT JOIN books bk ON b.book_id = bk.book_id
          WHERE b.book_id IN (${existingBookIds.map(() => '?').join(',')}) 
          AND b.return_date IS NULL
          GROUP BY b.book_id, bk.title
        `;
        
        console.log('借阅检查SQL:', borrowCheckSql);
        console.log('借阅检查参数:', existingBookIds);
        
        const [activeBorrows] = await connection.execute(borrowCheckSql, existingBookIds);
        
        console.log('未归还借阅记录查询结果:', activeBorrows);
        
        // 只有未归还借阅记录的图书才不能删除
        blockedBooks = activeBorrows.map(row => ({
          book_id: row.book_id,
          title: row.title,
          active_borrows: row.active_borrows
        }));
        
        console.log('被阻止删除的图书（有未归还记录）:', blockedBooks);
      }
      
      // 3. 确定可以删除的图书
      const blockedBookIds = blockedBooks.map(book => book.book_id);
      const deletableBookIds = existingBookIds.filter(id => !blockedBookIds.includes(id));
      
      // 4. 执行批量删除（删除可以删除的图书及其相关借阅记录）
      let deletedCount = 0;
      if (deletableBookIds.length > 0) {
        console.log('开始删除图书及相关借阅记录:', deletableBookIds);
        
        // 首先删除相关的借阅记录（只删除已归还的记录）
        const deleteBorrowsSql = `
          DELETE FROM borrows 
          WHERE book_id IN (${deletableBookIds.map(() => '?').join(',')}) 
          AND return_date IS NOT NULL
        `;
        
        console.log('删除借阅记录SQL:', deleteBorrowsSql);
        console.log('删除借阅记录参数:', deletableBookIds);
        
        const [borrowDeleteResult] = await connection.execute(deleteBorrowsSql, deletableBookIds);
        console.log('删除借阅记录结果:', borrowDeleteResult.affectedRows, '条记录');
        
        // 然后删除图书记录
        const deleteSql = `DELETE FROM books WHERE book_id IN (${deletableBookIds.map(() => '?').join(',')}) `;
        console.log('删除图书SQL:', deleteSql);
        console.log('删除图书参数:', deletableBookIds);
        
        const [deleteResult] = await connection.execute(deleteSql, deletableBookIds);
        deletedCount = deleteResult.affectedRows;
        
        console.log('删除图书结果:', deletedCount, '条记录');
      }
      
      await connection.commit();
      
      // 5. 构建失败项目列表
      const failedItems = [
        // 不存在的图书
        ...nonExistentIds.map(id => ({
          book_id: id,
          reason: '图书不存在'
        })),
        // 有未归还借阅记录的图书
        ...blockedBooks.map(book => ({
          book_id: book.book_id,
          reason: `图书正在被借阅，无法删除（${book.active_borrows}条未归还记录）`,
          borrow_count: book.active_borrows,
          title: book.title
        }))
      ];
      
      const totalRequested = book_ids.length;
      const successful = deletedCount;
      const failed = failedItems.length;
      
      console.log(`批量删除结果: 请求${totalRequested}个，成功${successful}个，失败${failed}个`);
      
      // 6. 返回结果
      const isPartialSuccess = failed > 0 && successful > 0;
      const isCompleteFailure = successful === 0 && failed > 0;
      
      let message;
      if (isCompleteFailure) {
        message = '批量删除失败，无任何图书被删除';
      } else if (isPartialSuccess) {
        message = '部分删除成功（包括已归还的借阅记录）';
      } else {
        message = '批量删除成功（包括已归还的借阅记录）';
      }
      
      res.json({
        code: 200,
        data: {
          deleted_count: successful,
          failed_items: failedItems,
          details: {
            total_requested: totalRequested,
            successful: successful,
            failed: failed
          }
        },
        msg: message
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('批量删除图书失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: `批量删除失败: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/books/batch/category:
 *   patch:
 *     summary: 批量修改图书分类
 *     description: 批量修改指定图书的分类信息
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book_ids
 *               - new_category_id
 *             properties:
 *               book_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 要修改的图书ID数组
 *                 example: [1, 3, 8, 12]
 *               new_category_id:
 *                 type: integer
 *                 description: 新的分类ID
 *                 example: 5
 *     responses:
 *       200:
 *         description: 批量修改分类成功
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
 *                     updated_count:
 *                       type: integer
 *                       example: 3
 *                     failed_items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           book_id:
 *                             type: integer
 *                           reason:
 *                             type: string
 *                     category_info:
 *                       type: object
 *                       properties:
 *                         category_id:
 *                           type: integer
 *                         category_name:
 *                           type: string
 *                 msg:
 *                   type: string
 *                   example: "批量修改分类成功"
 *       400:
 *         description: 参数错误
 *       404:
 *         description: 分类不存在
 *       500:
 *         description: 服务器错误
 */
router.patch('/batch/category', async (req, res) => {
  try {
    const { book_ids, new_category_id } = req.body;
    
    // 参数验证
    if (!Array.isArray(book_ids) || book_ids.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: 'book_ids必须是非空数组'
      });
    }
    
    if (!Number.isInteger(new_category_id) || new_category_id <= 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: 'new_category_id必须是有效的正整数'
      });
    }
    
    // 限制批量操作数量
    if (book_ids.length > 100) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '批量操作数量不能超过100个'
      });
    }
    
    // 检查ID格式
    const invalidIds = book_ids.filter(id => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '包含无效的图书ID'
      });
    }
    
    console.log('批量修改分类请求:', { book_ids, new_category_id, count: book_ids.length });
    
    // 使用连接池获取连接并开启事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. 检查目标分类是否存在
      const categoryCheckSql = 'SELECT category_id, name FROM book_categories WHERE category_id = ?';
      const [categoryResult] = await connection.execute(categoryCheckSql, [new_category_id]);
      
      if (categoryResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          code: 404,
          data: null,
          msg: '指定的分类不存在'
        });
      }
      
      const categoryInfo = categoryResult[0];
      
      // 2. 检查所有图书是否存在
      const bookExistsSql = `
        SELECT book_id, title
        FROM books 
        WHERE book_id IN (${book_ids.map(() => '?').join(',')}) 
      `;
      const [existingBooks] = await connection.execute(bookExistsSql, book_ids);
      const existingBookIds = existingBooks.map(book => book.book_id);
      const nonExistentIds = book_ids.filter(id => !existingBookIds.includes(id));
      
      // 3. 执行批量更新（只更新存在的图书）
      let updatedCount = 0;
      if (existingBookIds.length > 0) {
        const updateSql = `
          UPDATE books 
          SET category_id = ? 
          WHERE book_id IN (${existingBookIds.map(() => '?').join(',')}) 
        `;
        const updateParams = [new_category_id, ...existingBookIds];
        const [updateResult] = await connection.execute(updateSql, updateParams);
        updatedCount = updateResult.affectedRows;
      }
      
      await connection.commit();
      
      // 4. 构建失败项目列表
      const failedItems = nonExistentIds.map(id => ({
        book_id: id,
        reason: '图书不存在'
      }));
      
      const totalRequested = book_ids.length;
      const successful = updatedCount;
      const failed = failedItems.length;
      
      console.log(`批量修改分类结果: 请求${totalRequested}个，成功${successful}个，失败${failed}个`);
      
      // 5. 返回结果
      const isPartialSuccess = failed > 0 && successful > 0;
      const isCompleteFailure = successful === 0 && failed > 0;
      
      let message;
      if (isCompleteFailure) {
        message = '批量修改失败，无任何图书被修改';
      } else if (isPartialSuccess) {
        message = '部分修改成功';
      } else {
        message = '批量修改分类成功';
      }
      
      res.json({
        code: 200,
        data: {
          updated_count: successful,
          failed_items: failedItems,
          category_info: {
            category_id: categoryInfo.category_id,
            category_name: categoryInfo.name
          },
          details: {
            total_requested: totalRequested,
            successful: successful,
            failed: failed
          }
        },
        msg: message
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('批量修改分类失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: `批量修改分类失败: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/books/import:
 *   post:
 *     summary: 批量导入图书数据
 *     description: 从 Excel 文件中导入图书数据，支持批量插入和数据验证
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: excel
 *         in: formData
 *         description: 要上传的 Excel 文件 (.xls 或 .xlsx)
 *         required: true
 *         type: file
 *     responses:
 *       200:
 *         description: 导入成功
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data:
 *                   type: 'object'
 *                   properties:
 *                     imported_count: { type: 'integer', example: 15 }
 *                     failed_items: 
 *                       type: 'array'
 *                       items:
 *                         type: 'object'
 *                         properties:
 *                           row: { type: 'integer', example: 3 }
 *                           data: { type: 'object' }
 *                           reason: { type: 'string', example: '书名不能为空' }
 *                     details:
 *                       type: 'object'
 *                       properties:
 *                         total_rows: { type: 'integer', example: 16 }
 *                         successful: { type: 'integer', example: 15 }
 *                         failed: { type: 'integer', example: 1 }
 *                 msg: { type: 'string', example: '导入成功' }
 *       400:
 *         description: 参数错误或数据格式错误
 *       500:
 *         description: 服务器错误
 */
router.post('/import', uploadExcel, handleUploadError, async (req, res) => {
  let tempFilePath = null;
  
  try {
    // 检查文件是否上传
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '请上传 Excel 文件'
      });
    }
    
    tempFilePath = req.file.path;
    console.log(`开始处理图书导入文件: ${req.file.originalname}`);
    
    // 解析 Excel 文件
    const excelData = parseExcelFile(tempFilePath);
    
    // 验证数据格式
    const requiredHeaders = ['书名', '作者', '分类'];
    const validation = validateExcelData(excelData, requiredHeaders);
    
    if (!validation.isValid) {
      return res.status(400).json({
        code: 400,
        data: {
          errors: validation.errors,
          warnings: validation.warnings
        },
        msg: '数据格式验证失败'
      });
    }
    
    // 转换为对象数组
    const fieldMapping = {
      '书名': 'title',
      '作者': 'author',
      '分类': 'category_name',
      '出版社': 'publisher',
      'ISBN': 'isbn',
      '出版日期': 'publish_date',
      '库存数量': 'stock',
      '描述': 'description'
    };
    
    const bookObjects = convertExcelToObjects(excelData, fieldMapping);
    
    if (bookObjects.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '没有找到有效的图书数据'
      });
    }
    
    console.log(`解析到 ${bookObjects.length} 条图书数据，开始批量导入`);
    
    // 开始批量导入数据库操作
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = {
        imported_count: 0,
        failed_items: [],
        details: {
          total_rows: bookObjects.length,
          successful: 0,
          failed: 0
        }
      };
      
      // 首先获取所有分类信息
      const categorySql = 'SELECT category_id, name FROM book_categories';
      const [categories] = await connection.execute(categorySql);
      const categoryMap = new Map();
      categories.forEach(cat => {
        categoryMap.set(cat.name, cat.category_id);
      });
      
      // 逐个处理每条图书数据
      for (const bookData of bookObjects) {
        try {
          // 数据验证
          const validationResult = validateBookData(bookData, categoryMap);
          
          if (!validationResult.isValid) {
            results.failed_items.push({
              row: bookData._rowIndex,
              data: bookData,
              reason: validationResult.errors.join(', ')
            });
            results.details.failed++;
            continue;
          }
          
          // 清理和格式化数据
          const cleanData = cleanBookData(bookData, categoryMap);
          
          // 插入数据库
          const insertSql = `
            INSERT INTO books (title, author, category_id, publisher, isbn, publish_date, stock, available, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `;
          
          const values = [
            cleanData.title,
            cleanData.author,
            cleanData.category_id,
            cleanData.publisher,
            cleanData.isbn,
            cleanData.publish_date,
            cleanData.stock,
            cleanData.stock, // available 初始值等于 stock
            cleanData.description
          ];
          
          await connection.execute(insertSql, values);
          
          results.imported_count++;
          results.details.successful++;
          
        } catch (error) {
          console.error(`导入第${bookData._rowIndex}行失败:`, error);
          
          results.failed_items.push({
            row: bookData._rowIndex,
            data: bookData,
            reason: `数据库操作失败: ${error.message}`
          });
          results.details.failed++;
        }
      }
      
      await connection.commit();
      
      // 返回结果
      const message = results.failed_items.length === 0 
        ? `成功导入 ${results.imported_count} 条图书数据`
        : `导入完成：成功 ${results.imported_count} 条，失败 ${results.failed_items.length} 条`;
      
      console.log(`图书导入完成: 成功${results.imported_count}条，失败${results.details.failed}条`);
      
      res.json({
        code: 200,
        data: results,
        msg: message
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('图书导入失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: `导入失败: ${error.message}`
    });
  } finally {
    // 清理临时文件
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
  }
});

/**
 * 验证图书数据
 */
function validateBookData(bookData, categoryMap) {
  const result = {
    isValid: true,
    errors: []
  };
  
  // 检查必填字段
  if (!bookData.title || bookData.title.trim() === '') {
    result.isValid = false;
    result.errors.push('书名不能为空');
  }
  
  if (!bookData.author || bookData.author.trim() === '') {
    result.isValid = false;
    result.errors.push('作者不能为空');
  }
  
  if (!bookData.category_name || bookData.category_name.trim() === '') {
    result.isValid = false;
    result.errors.push('分类不能为空');
  } else if (!categoryMap.has(bookData.category_name.trim())) {
    result.isValid = false;
    result.errors.push(`分类 '${bookData.category_name}' 不存在`);
  }
  
  // 验证库存数量
  if (bookData.stock) {
    const stock = parseInt(bookData.stock);
    if (isNaN(stock) || stock < 0) {
      result.isValid = false;
      result.errors.push('库存数量必须是非负整数');
    }
  }
  
  // 验证ISBN格式（如果提供）
  if (bookData.isbn && bookData.isbn.trim() !== '') {
    const isbn = bookData.isbn.replace(/[-\s]/g, ''); // 移除连字符和空格
    if (isbn.length !== 10 && isbn.length !== 13) {
      result.isValid = false;
      result.errors.push('ISBN 格式不正确（应为10位或13位数字）');
    }
  }
  
  return result;
}

/**
 * 清理和格式化图书数据
 */
function cleanBookData(bookData, categoryMap) {
  const cleaned = {};
  
  // 必填字段
  cleaned.title = bookData.title.trim();
  cleaned.author = bookData.author.trim();
  cleaned.category_id = categoryMap.get(bookData.category_name.trim());
  
  // 可选字段
  cleaned.publisher = bookData.publisher ? bookData.publisher.trim() : null;
  cleaned.isbn = bookData.isbn ? bookData.isbn.trim() : null;
  cleaned.description = bookData.description ? bookData.description.trim() : null;
  
  // 库存数量
  cleaned.stock = bookData.stock ? parseInt(bookData.stock) : 1;
  
  // 出版日期处理
  cleaned.publish_date = null;
  if (bookData.publish_date && bookData.publish_date.trim() !== '') {
    try {
      const dateStr = bookData.publish_date.trim();
      // 尝试解析日期格式
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        cleaned.publish_date = date.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      }
    } catch (error) {
      console.warn(`日期解析失败: ${bookData.publish_date}`);
    }
  }
  
  return cleaned;
}

module.exports = router;