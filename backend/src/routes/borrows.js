// 借阅相关路由
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db.js'); // 使用数据库配置文件中的连接池

// 查询函数（支持普通查询和事务命令）
async function query(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    // 对于事务命令，使用query而不是execute
    if (sql.includes('START TRANSACTION') || sql.includes('COMMIT') || sql.includes('ROLLBACK')) {
      const [results] = await connection.query(sql);
      return results;
    } else {
      const [results] = await connection.execute(sql, params);
      return results;
    }
  } finally {
    connection.release();
  }
}

// 导出函数
const postBorrow = async (req, res) => {

/**
 * @swagger
 * /api/borrow: 
 *   post: 
 *     summary: 借阅图书
 *     description: 办理图书借阅手续
 *     requestBody: 
 *       required: true
 *       content: 
 *         application/json: 
 *           schema: 
 *             type: 'object'
 *             properties:
 *               book_id: { type: 'integer', example: 1 }
 *               reader_id: { type: 'integer', example: 1 }
 *               borrow_days: { type: 'integer', example: 14 }
 *             required: 
 *               - book_id
 *               - reader_id
 *     responses:
 *       200: 
 *         description: 借阅成功
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: 
 *                   type: 'object'
 *                   properties:
 *                     borrow_id: { type: 'integer', example: 101 }
 *                     book_id: { type: 'integer', example: 1 }
 *                     reader_id: { type: 'integer', example: 1 }
 *                     borrow_date: { type: 'string', example: '2025-08-24 12:30:00' }
 *                     due_date: { type: 'string', example: '2025-09-07 12:30:00' }
 *                     status: { type: 'string', example: 'borrowed' }
 *                 msg: { type: 'string', example: '借阅成功' }
 *       400: 
 *         description: 参数错误或借阅条件不满足
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 400 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '读者或图书不存在' }
 *       500: 
 *         description: 服务器错误
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 500 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '借阅失败，请稍后重试' }
 */

  try {
    const { book_id, reader_id, borrow_days = 14 } = req.body;
    
    // 参数校验
    if (!reader_id || !book_id) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '缺少必要参数: book_id 或 reader_id'
      });
    }
    
    // 检查读者是否存在
    const readers = await query('SELECT * FROM readers WHERE reader_id = ?', [reader_id]);
    if (readers.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '读者不存在'
      });
    }
    
    // 检查图书是否存在
    const books = await query('SELECT * FROM books WHERE book_id = ?', [book_id]);
    if (books.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '图书不存在'
      });
    }
    
    // 检查图书是否有库存
    if (books[0].available <= 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '该图书目前无可用库存'
      });
    }
    
    // 开始事务
    await query('START TRANSACTION');
    
    // 创建借阅记录 - 使用更精确的时间格式
    const borrow_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + borrow_days); // 借阅期限
    const due_date_str = due_date.toISOString().slice(0, 19).replace('T', ' ');
    
    const borrowResult = await query(
      'INSERT INTO borrows (reader_id, book_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [reader_id, book_id, borrow_date, due_date_str, 'borrowed']
    );
    
    // 更新图书库存
    await query('UPDATE books SET available = available - 1 WHERE book_id = ?', [book_id]);
    
    // 提交事务
    await query('COMMIT');
    
    res.json({
      code: 200,
      data: {
        borrow_id: borrowResult.insertId,
        book_id,
        reader_id,
        borrow_date,
        due_date: due_date_str,
        status: 'borrowed'
      },
      msg: '借阅成功'
    });
  } catch (error) {
    // 回滚事务
    await query('ROLLBACK');
    
    console.error('借阅图书失败:', error);
    
    // 根据错误类型提供更具体的错误信息
    let errorMessage = '借阅失败，请稍后重试';
    
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = '该读者已借阅此图书，请先归还后再借';
    } else if (error.code === 'ER_NO_REFERENCED_ROW') {
      errorMessage = '图书或读者信息不存在，请检查输入信息';
    } else if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
      errorMessage = '系统繁忙，请稍后重试';
    }
    
    res.status(500).json({
        code: 500,
        data: null,
        msg: errorMessage
      });
  }
}

/**
 * @swagger
 * /api/return: 
 *   put: 
 *     summary: 归还图书
 *     description: 办理图书归还手续
 *     requestBody: 
 *       required: true
 *       content: 
 *         application/json: 
 *           schema: 
 *             type: 'object'
 *             properties:
 *               borrow_id: { type: 'integer', example: 101 }
 *             required: 
 *               - borrow_id
 *     responses:
 *       200: 
 *         description: 归还成功
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: 
 *                   type: 'object'
 *                   properties:
 *                     borrow_id: { type: 'integer', example: 101 }
 *                     book_id: { type: 'integer', example: 1 }
 *                     reader_id: { type: 'integer', example: 1 }
 *                     borrow_date: { type: 'string', example: '2025-08-24 12:30:00' }
 *                     due_date: { type: 'string', example: '2025-09-07 12:30:00' }
 *                     return_date: { type: 'string', example: '2025-09-05 10:15:00' }
 *                     status: { type: 'string', example: 'returned' }
 *                     is_overdue: { type: 'boolean', example: false }
 *                     overdue_days: { type: 'integer', example: 0 }
 *                 msg: { type: 'string', example: '归还成功' }
 *       400: 
 *         description: 参数错误或归还条件不满足
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 400 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '借阅记录不存在或已归还' }
 *       500: 
 *         description: 服务器错误
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 500 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '归还失败，请稍后重试' }
 */
const putReturn = async (req, res) => {
  let connection = null;
  try {
    // 从请求体中获取参数
    const { borrow_id, reader_id } = req.body;

    // 参数验证
    if (!borrow_id || !reader_id) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '缺少必要参数: borrow_id 或 reader_id'
      });
    }

    // 获取单个连接用于事务
    connection = await pool.getConnection();

    // 检查借阅记录是否存在且未归还，并且读者ID与借阅记录匹配
    const [borrows] = await connection.execute('SELECT * FROM borrows WHERE borrow_id = ? AND reader_id = ? AND status IN (?, ?)', [borrow_id, reader_id, 'borrowed', 'overdue']);
    if (borrows.length === 0) {
      connection.release();
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '借阅记录不存在或已归还'
      });
    }
    
    const borrow = borrows[0];
    
    // 开始事务 - 使用query而不是execute来执行事务命令
    await connection.query('START TRANSACTION');
    
    // 更新借阅记录状态
    const return_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 计算是否逾期和逾期天数
    const dueDate = new Date(borrow.due_date);
    const returnDate = new Date(return_date);
    const is_overdue = returnDate > dueDate;
    const overdue_days = is_overdue ? Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24)) : 0;
    
    await connection.execute(
      'UPDATE borrows SET status = ?, return_date = ? WHERE borrow_id = ?',
      ['returned', return_date, borrow_id]
    );
    
    // 更新图书库存
    await connection.execute('UPDATE books SET available = available + 1 WHERE book_id = ?', [borrow.book_id]);
    
    // 提交事务
    await connection.query('COMMIT');
    
    res.json({
      code: 200,
      data: {
        borrow_id: parseInt(borrow_id),
        book_id: borrow.book_id,
        reader_id: borrow.reader_id,
        borrow_date: borrow.borrow_date,
        due_date: borrow.due_date,
        return_date,
        status: 'returned',
        is_overdue,
        overdue_days
      },
      msg: '归还成功'
    });
  } catch (error) {
    // 回滚事务
    if (connection) {
      try {
        await connection.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('事务回滚失败:', rollbackError);
      }
    }
    
    console.error('归还图书失败:', error);
    
    // 根据错误类型提供更具体的错误信息
    let errorMessage = '归还失败，请稍后重试';
    
    if (error.code === 'ER_NO_REFERENCED_ROW') {
      errorMessage = '借阅记录或图书信息不存在，请检查输入信息';
    } else if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
      errorMessage = '系统繁忙，请稍后重试';
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = '归还操作重复，请勿重复提交';
    } else {
      errorMessage = '归还失败：' + (error.message || '未知错误');
    }
    
    res.status(500).json({
        code: 500,
        data: null,
        msg: errorMessage
      });
  } finally {
    // 释放连接
    if (connection) {
      connection.release();
    }
  }
}

// POST方法的归还图书API
const postReturn = async (req, res) => {
  let connection = null;
  try {
    // 从请求体中获取参数
    const { borrow_id, reader_id } = req.body;

    // 参数验证
    if (!borrow_id || !reader_id) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '缺少必要参数: borrow_id 或 reader_id'
      });
    }

    // 获取单个连接用于事务
    connection = await pool.getConnection();

    // 检查借阅记录是否存在且未归还，并且读者ID与借阅记录匹配
    const [borrows] = await connection.execute('SELECT * FROM borrows WHERE borrow_id = ? AND reader_id = ? AND status IN (?, ?)', [borrow_id, reader_id, 'borrowed', 'overdue']);
    if (borrows.length === 0) {
      connection.release();
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '借阅记录不存在或已归还'
      });
    }
    
    const borrow = borrows[0];
    
    // 开始事务 - 使用query而不是execute来执行事务命令
    await connection.query('START TRANSACTION');
    
    // 更新借阅记录状态
    const return_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // 计算是否逾期和逾期天数
    const dueDate = new Date(borrow.due_date);
    const returnDate = new Date(return_date);
    const is_overdue = returnDate > dueDate;
    const overdue_days = is_overdue ? Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24)) : 0;
    
    await connection.execute(
      'UPDATE borrows SET status = ?, return_date = ? WHERE borrow_id = ?',
      ['returned', return_date, borrow_id]
    );
    
    // 更新图书库存
    await connection.execute('UPDATE books SET available = available + 1 WHERE book_id = ?', [borrow.book_id]);
    
    // 提交事务
    await connection.query('COMMIT');
    
    res.json({
      code: 200,
      data: {
        borrow_id: parseInt(borrow_id),
        book_id: borrow.book_id,
        reader_id: borrow.reader_id,
        borrow_date: borrow.borrow_date,
        due_date: borrow.due_date,
        return_date,
        status: 'returned',
        is_overdue,
        overdue_days
      },
      msg: '归还成功'
    });
  } catch (error) {
    // 回滚事务
    if (connection) {
      try {
        await connection.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('事务回滚失败:', rollbackError);
      }
    }
    
    console.error('归还图书失败:', error);
    
    // 根据错误类型提供更具体的错误信息
    let errorMessage = '归还失败，请稍后重试';
    
    if (error.code === 'ER_NO_REFERENCED_ROW') {
      errorMessage = '借阅记录或图书信息不存在，请检查输入信息';
    } else if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
      errorMessage = '系统繁忙，请稍后重试';
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = '归还操作重复，请勿重复提交';
    }
    
    res.status(500).json({
        code: 500,
        data: null,
        msg: errorMessage
      });
  } finally {
    // 释放连接
    if (connection) {
      connection.release();
    }
  }
}

// 查询借阅记录
/**
 * @swagger
 * /api/borrows:
 *   get:
 *     summary: 查询借阅记录
 *     description: 获取借阅记录列表，支持分页和状态筛选
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [borrowed, returned, all]
 *           default: all
 *         description: 借阅状态筛选
 *       - in: query
 *         name: reader_id
 *         schema:
 *           type: integer
 *         description: 读者ID筛选
 *       - in: query
 *         name: is_overdue
 *         schema:
 *           type: boolean
 *         description: 是否仅查询逾期记录
 *       - in: query
 *         name: not_overdue
 *         schema:
 *           type: boolean
 *         description: 是否仅查询未逾期记录
 *     responses:
 *       200:
 *         description: 查询成功
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
 *                     total:
 *                       type: integer
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           borrow_id:
 *                             type: integer
 *                           reader_id:
 *                             type: integer
 *                           reader_name:
 *                             type: string
 *                           book_id:
 *                             type: integer
 *                           book_title:
 *                             type: string
 *                           borrow_date:
 *                             type: string
 *                           due_date:
 *                             type: string
 *                           return_date:
 *                             type: string
 *                           status:
 *                             type: string
 *                           is_overdue:
 *                             type: integer
 *                           actual_status:
 *                             type: string
 *                           overdue_days:
 *                             type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                 msg:
 *                   type: string
 *                   example: 查询成功
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status || 'all';
    const reader_id = req.query.reader_id;
    const is_overdue = req.query.is_overdue === 'true';
    const not_overdue = req.query.not_overdue === 'true';

    // 参数验证
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '分页参数无效'
      });
    }

    const offset = (page - 1) * pageSize;
    let params = [];
    let whereConditions = [];

    // 构建查询条件
    if (status !== 'all') {
      whereConditions.push('b.status = ?');
      params.push(status);
    }

    if (reader_id) {
      whereConditions.push('b.reader_id = ?');
      params.push(reader_id);
    }

    // 处理逾期筛选 - 包含两种情况：状态为borrowed且已逾期，或状态直接为overdue
    if (is_overdue) {
      whereConditions.push('(b.status = ? AND b.due_date < NOW()) OR b.status = ?');
      params.push('borrowed', 'overdue');
    }
    
    // 处理非逾期筛选
    if (not_overdue) {
      whereConditions.push('b.status = ? AND b.due_date >= NOW()');
      params.push('borrowed');
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // 查询总记录数
    const countSql = `
      SELECT COUNT(*) as total
      FROM borrows b
      JOIN readers r ON b.reader_id = r.reader_id
      JOIN books bk ON b.book_id = bk.book_id
      ${whereClause}
    `;
    const [countResult] = await query(countSql, params);
    const total = countResult.total;

    // 查询分页数据，包含逾期状态计算
    const sql = `
      SELECT 
        b.borrow_id,
        b.reader_id,
        r.name as reader_name,
        b.book_id,
        bk.title as book_title,
        b.borrow_date,
        b.due_date,
        b.return_date,
        b.status,
        -- 计算是否逾期和逾期天数
        CASE 
          WHEN (b.status = 'borrowed' AND b.due_date < NOW()) OR b.status = 'overdue' THEN 1
          ELSE 0
        END as is_overdue,
        -- 确保状态为borrowed但已逾期的记录被正确标识
        CASE 
          WHEN b.status = 'borrowed' AND b.due_date < NOW() THEN 'overdue'
          ELSE b.status
        END as actual_status,
        CASE 
          WHEN b.status = 'borrowed' AND b.due_date < NOW() THEN DATEDIFF(NOW(), b.due_date)
          ELSE 0
        END as overdue_days
      FROM borrows b
      JOIN readers r ON b.reader_id = r.reader_id
      JOIN books bk ON b.book_id = bk.book_id
      ${whereClause}
      ORDER BY b.borrow_date DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const data = await query(sql, params);

    // 调试日志：输出查询参数和结果数量
      console.log('查询借阅记录参数:', { page, pageSize, status, reader_id, is_overdue, not_overdue });
      console.log('查询到的记录数量:', data.length);
      console.log('逾期记录数量:', data.filter(item => item.is_overdue === 1).length);

      res.json({
        code: 200,
        data: {
          total,
          list: data,
          page,
          pageSize
        },
        msg: '查询成功'
      });

  } catch (error) {
    console.error('查询借阅记录失败:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '查询失败，请稍后重试'
    });
  }
});
// 添加路由到router对象
router.post('/borrow', postBorrow);
router.post('/return', postReturn);
router.put('/return', putReturn);

// 导出router和函数以便直接调用
module.exports = router;
module.exports.postBorrow = postBorrow;
module.exports.postReturn = postReturn;
module.exports.putReturn = putReturn;