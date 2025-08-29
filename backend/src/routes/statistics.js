// 统计分析相关路由
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'bookadmin',
  password: process.env.DB_PASSWORD || 'BookAdmin123!',
  database: process.env.DB_NAME || 'book_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 查询函数
async function query(sql, params = []) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

/**
 * @swagger
 * /api/statistics/monthly: 
 *   get: 
 *     summary: 月度借阅统计
 *     description: 获取指定月份的借阅统计数据
 *     parameters:
 *       - name: year
 *         in: query
 *         description: 年份
 *         required: true
 *         schema: { type: 'integer' }
 *       - name: month
 *         in: query
 *         description: 月份
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200: 
 *         description: 查询成功
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: true }
 *                 data: 
 *                   type: 'array'
 *                   items: 
 *                     type: 'object'
 *                     properties:
 *                       date: { type: 'string', example: '2023-10-01' }
 *                       borrow_count: { type: 'integer', example: 15 }
 *                       return_count: { type: 'integer', example: 12 }
 *       400: 
 *         description: 参数错误
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: false }
 *                 message: { type: 'string', example: '缺少必要参数: year' }
 *       500: 
 *         description: 服务器错误
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: false }
 *                 error: { type: 'string', example: '获取统计数据失败，请稍后重试' }
 */
router.get('/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // 参数校验
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: year 或 month'
      });
    }
    
    // 构建查询
    const sql = `
      SELECT 
        DATE(borrow_date) as date, 
        COUNT(borrow_id) as borrow_count,
        (SELECT COUNT(*) FROM borrows WHERE DATE(return_date) = DATE(borrow_date) AND YEAR(return_date) = ? AND MONTH(return_date) = ?) as return_count
      FROM borrows 
      WHERE YEAR(borrow_date) = ? AND MONTH(borrow_date) = ?
      GROUP BY DATE(borrow_date)
      ORDER BY date
    `;
    
    const results = await query(sql, [year, month, year, month]);
    
    // 转换数据格式以匹配前端期望
    const dates = [];
    const borrow_counts = [];
    const return_counts = [];
    
    results.forEach(item => {
      dates.push(item.date);
      borrow_counts.push(item.borrow_count);
      return_counts.push(item.return_count || 0);
    });
    
    res.json({
      success: true,
      data: {
        dates,
        borrow_counts,
        return_counts
      }
    });
  } catch (error) {
    console.error('获取月度统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败，请稍后重试'
    });
  }
});

/**
 * @swagger
 * /api/statistics/topBooks: 
 *   get: 
 *     summary: 热门图书统计
 *     description: 获取指定时间段内的热门借阅图书排行榜
 *     parameters:
 *       - name: period
 *         in: query
 *         description: 统计周期（week/month/quarter/year）
 *         required: true
 *         schema: { type: 'string' }
 *       - name: limit
 *         in: query
 *         description: 返回数量限制
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
 *                 success: { type: 'boolean', example: true }
 *                 data: 
 *                   type: 'array'
 *                   items: 
 *                     type: 'object'
 *                     properties:
 *                       book_id: { type: 'integer', example: 1 }
 *                       title: { type: 'string', example: '测试图书' }
 *                       author: { type: 'string', example: '测试作者' }
 *                       borrow_count: { type: 'integer', example: 35 }
 *       400: 
 *         description: 参数错误
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: false }
 *                 message: { type: 'string', example: '参数 period 无效' }
 *       500: 
 *         description: 服务器错误
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: false }
 *                 error: { type: 'string', example: '获取热门图书数据失败，请稍后重试' }
 */
router.get('/topBooks', async (req, res) => {
  try {
    // 改进参数处理：如果没有提供period参数，默认为'month'
    const { period = 'month', limit = 10 } = req.query;
    
    // 参数校验
    if (!['week', 'month', 'quarter', 'year'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: '参数 period 无效，有效值为：week/month/quarter/year'
      });
    }
    
    // 构建日期范围
    let dateCondition = '';
    const now = new Date();
    
    switch (period) {
      case 'week':
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateCondition = `AND borrow_date >= '${lastWeek.toISOString().split('T')[0]}'`;
        break;
      case 'month':
        dateCondition = `AND borrow_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`;
        break;
      case 'quarter':
        dateCondition = `AND borrow_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)`;
        break;
      case 'year':
        dateCondition = `AND borrow_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`;
        break;
    }
    
    try {
      // 安全地处理limit参数，确保它是一个有效的正整数
      const safeLimit = parseInt(limit) || 10;
      const clampedLimit = Math.min(Math.max(safeLimit, 1), 100); // 限制在1-100之间
      
      // 构建查询，直接在SQL中嵌入limit值，避免参数传递问题
      const sql = `
        SELECT 
          b.book_id, 
          b.title, 
          b.author, 
          COUNT(br.borrow_id) as borrow_count
        FROM borrows br
        JOIN books b ON br.book_id = b.book_id
        WHERE 1=1 ${dateCondition}
        GROUP BY br.book_id, b.title, b.author
        ORDER BY borrow_count DESC
        LIMIT ${clampedLimit}
      `;
      
      const results = await query(sql);
      
      res.json({
        success: true,
        data: results,
        period: period,
        limit: clampedLimit
      });
    } catch (dbError) {
      // 捕获并处理数据库查询错误
      console.error('数据库查询失败:', dbError);
      // 检查是否是由于表不存在或数据为空导致的错误
      if (dbError.code === 'ER_NO_SUCH_TABLE' || dbError.code === 'ER_BAD_TABLE_ERROR') {
        return res.status(500).json({
          success: false,
          error: '数据库表不存在，请先初始化数据库'
        });
      }
      // 返回更友好的错误信息
      res.status(500).json({
        success: false,
        error: '获取热门图书数据失败，请稍后重试',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (error) {
    console.error('获取热门图书数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取热门图书数据失败，请稍后重试'
    });
  }
});

module.exports = router;