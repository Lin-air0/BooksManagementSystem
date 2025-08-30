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
 * /api/statistics/categories:
 *   get:
 *     summary: 图书分类分布统计
 *     description: 获取图书分类分布数据，用于饼图展示
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
 *                       category_name: { type: 'string', example: '文学' }
 *                       book_count: { type: 'integer', example: 125 }
 *                       percentage: { type: 'number', example: 25.5 }
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: false }
 *                 error: { type: 'string', example: '获取分类统计数据失败' }
 */
router.get('/categories', async (req, res) => {
  try {
    // 获取图书分类分布统计
    const sql = `
      SELECT 
        COALESCE(bc.name, '未分类') as category_name,
        COUNT(b.book_id) as book_count
      FROM books b
      LEFT JOIN book_categories bc ON b.category_id = bc.category_id
      GROUP BY b.category_id, bc.name
      ORDER BY book_count DESC
    `;
    
    const results = await query(sql);
    
    // 计算总数和百分比
    const totalBooks = results.reduce((sum, item) => sum + item.book_count, 0);
    
    const data = results.map(item => ({
      category_name: item.category_name,
      book_count: item.book_count,
      percentage: totalBooks > 0 ? Math.round((item.book_count / totalBooks) * 100 * 10) / 10 : 0
    }));
    
    res.json({
      success: true,
      data: data,
      total_books: totalBooks
    });
    
  } catch (error) {
    console.error('获取图书分类统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类统计数据失败，请稍后重试'
    });
  }
});

/**
 * @swagger
 * /api/statistics/borrows/monthly:
 *   get:
 *     summary: 月度借阅趋势统计
 *     description: 获取最近12个月的借阅趋势数据，用于折线图展示
 *     parameters:
 *       - name: months
 *         in: query
 *         description: 统计月份数量，默认12个月
 *         required: false
 *         schema: { type: 'integer', default: 12 }
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
 *                   type: 'object'
 *                   properties:
 *                     months: 
 *                       type: 'array'
 *                       items: { type: 'string', example: '2024-01' }
 *                     borrow_counts:
 *                       type: 'array'
 *                       items: { type: 'integer', example: 45 }
 *                     return_counts:
 *                       type: 'array'
 *                       items: { type: 'integer', example: 42 }
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: false }
 *                 error: { type: 'string', example: '获取月度趋势数据失败' }
 */
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

/**
 * @swagger
 * /api/statistics/categories:
 *   get:
 *     summary: 图书分类分布统计
 *     description: 获取各分类下图书数量的分布统计，用于饼图展示
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
 *                       category_id: { type: 'integer', example: 1 }
 *                       category_name: { type: 'string', example: '计算机科学' }
 *                       book_count: { type: 'integer', example: 25 }
 *                       total_stock: { type: 'integer', example: 150 }
 *                       available_stock: { type: 'integer', example: 120 }
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: false }
 *                 error: { type: 'string', example: '获取分类统计数据失败' }
 */
router.get('/categories', async (req, res) => {
  try {
    // 查询各分类下的图书统计信息
    const sql = `
      SELECT 
        bc.category_id,
        bc.name as category_name,
        bc.description,
        COALESCE(COUNT(b.book_id), 0) as book_count,
        COALESCE(SUM(b.stock), 0) as total_stock,
        COALESCE(SUM(b.available), 0) as available_stock
      FROM book_categories bc
      LEFT JOIN books b ON bc.category_id = b.category_id
      GROUP BY bc.category_id, bc.name, bc.description
      ORDER BY book_count DESC, bc.name
    `;
    
    const results = await query(sql);
    
    // 计算总数用于百分比计算
    const totalBooks = results.reduce((sum, item) => sum + parseInt(item.book_count), 0);
    
    // 为每个分类添加百分比信息
    const categoriesWithPercentage = results.map(item => ({
      category_id: item.category_id,
      category_name: item.category_name,
      description: item.description,
      book_count: parseInt(item.book_count),
      total_stock: parseInt(item.total_stock),
      available_stock: parseInt(item.available_stock),
      percentage: totalBooks > 0 ? ((parseInt(item.book_count) / totalBooks) * 100).toFixed(1) : '0.0'
    }));
    
    res.json({
      success: true,
      data: categoriesWithPercentage,
      summary: {
        total_categories: results.length,
        total_books: totalBooks,
        total_stock: results.reduce((sum, item) => sum + parseInt(item.total_stock), 0),
        available_stock: results.reduce((sum, item) => sum + parseInt(item.available_stock), 0)
      }
    });
  } catch (error) {
    console.error('获取图书分类统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类统计数据失败，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/statistics/borrows/monthly:
 *   get:
 *     summary: 月度借阅趋势统计
 *     description: 获取指定时间范围内的月度借阅趋势数据，用于折线图展示
 *     parameters:
 *       - name: year
 *         in: query
 *         description: 年份（可选，默认为当前年份）
 *         required: false
 *         schema: { type: 'integer', example: 2024 }
 *       - name: months
 *         in: query
 *         description: 查询月份数（可选，默认为12个月）
 *         required: false
 *         schema: { type: 'integer', example: 6 }
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
 *                   type: 'object'
 *                   properties:
 *                     labels: 
 *                       type: 'array'
 *                       items: { type: 'string' }
 *                       example: ['2024-01', '2024-02', '2024-03']
 *                     borrow_counts:
 *                       type: 'array'
 *                       items: { type: 'integer' }
 *                       example: [45, 38, 52]
 *                     return_counts:
 *                       type: 'array'
 *                       items: { type: 'integer' }
 *                       example: [42, 35, 48]
 *                     overdue_counts:
 *                       type: 'array'
 *                       items: { type: 'integer' }
 *                       example: [3, 3, 4]
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 success: { type: 'boolean', example: false }
 *                 error: { type: 'string', example: '获取月度借阅趋势数据失败' }
 */
router.get('/borrows/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), months = 12 } = req.query;
    
    // 参数校验
    const yearNum = parseInt(year);
    const monthsNum = Math.min(Math.max(parseInt(months) || 12, 1), 24); // 限制在1-24个月之间
    
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return res.status(400).json({
        success: false,
        message: '年份参数无效，应在2020-2030之间'
      });
    }
    
    // 生成查询的月份范围
    const monthRanges = [];
    for (let i = monthsNum - 1; i >= 0; i--) {
      const targetDate = new Date(yearNum, new Date().getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      monthRanges.push({
        year,
        month,
        label: `${year}-${month.toString().padStart(2, '0')}`
      });
    }
    
    // 查询每个月的借阅、归还、逾期统计
    const sql = `
      SELECT 
        YEAR(borrow_date) as year,
        MONTH(borrow_date) as month,
        COUNT(*) as borrow_count,
        SUM(CASE WHEN return_date IS NOT NULL THEN 1 ELSE 0 END) as return_count,
        SUM(CASE 
          WHEN return_date IS NULL AND due_date < NOW() THEN 1 
          WHEN return_date IS NOT NULL AND return_date > due_date THEN 1
          ELSE 0 
        END) as overdue_count
      FROM borrows
      WHERE (YEAR(borrow_date) = ? AND MONTH(borrow_date) BETWEEN ? AND ?)
         OR (YEAR(borrow_date) = ? AND MONTH(borrow_date) BETWEEN ? AND ?)
      GROUP BY YEAR(borrow_date), MONTH(borrow_date)
      ORDER BY year, month
    `;
    
    // 构建查询参数，支持跨年查询
    const startMonth = monthRanges[0];
    const endMonth = monthRanges[monthRanges.length - 1];
    
    const queryParams = [
      startMonth.year, startMonth.month, 12,
      endMonth.year, 1, endMonth.month
    ];
    
    const results = await query(sql, queryParams);
    
    // 创建结果映射
    const resultMap = {};
    results.forEach(row => {
      const key = `${row.year}-${row.month.toString().padStart(2, '0')}`;
      resultMap[key] = {
        borrow_count: parseInt(row.borrow_count),
        return_count: parseInt(row.return_count),
        overdue_count: parseInt(row.overdue_count)
      };
    });
    
    // 构建完整的数据数组，补充缺失月份的数据
    const labels = [];
    const borrowCounts = [];
    const returnCounts = [];
    const overdueCounts = [];
    
    monthRanges.forEach(range => {
      const data = resultMap[range.label] || {
        borrow_count: 0,
        return_count: 0,
        overdue_count: 0
      };
      
      labels.push(range.label);
      borrowCounts.push(data.borrow_count);
      returnCounts.push(data.return_count);
      overdueCounts.push(data.overdue_count);
    });
    
    res.json({
      success: true,
      data: {
        labels,
        borrow_counts: borrowCounts,
        return_counts: returnCounts,
        overdue_counts: overdueCounts
      },
      summary: {
        total_borrows: borrowCounts.reduce((sum, count) => sum + count, 0),
        total_returns: returnCounts.reduce((sum, count) => sum + count, 0),
        total_overdue: overdueCounts.reduce((sum, count) => sum + count, 0),
        period: `${labels[0]} 至 ${labels[labels.length - 1]}`
      }
    });
  } catch (error) {
    console.error('获取月度借阅趋势失败:', error);
    res.status(500).json({
      success: false,
      error: '获取月度借阅趋势数据失败，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;