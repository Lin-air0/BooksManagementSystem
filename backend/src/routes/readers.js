// 读者管理相关路由
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
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    connection.release();
  }
}

/**
 * @swagger
 * /api/readers:
 *   get:
 *     summary: 获取读者列表
 *     description: 获取所有读者信息，支持分页
 *     parameters:
 *       - name: page
 *         in: query
 *         description: 页码
 *         required: false
 *         schema: { type: 'integer', default: 1 }
 *       - name: pageSize
 *         in: query
 *         description: 每页数量
 *         required: false
 *         schema: { type: 'integer', default: 10 }
 *       - name: keyword
 *         in: query
 *         description: 搜索关键词（姓名、邮箱、电话）
 *         required: false
 *         schema: { type: 'string' }
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
 *                     list:
 *                       type: 'array'
 *                       items:
 *                         type: 'object'
 *                         properties:
 *                           reader_id: { type: 'integer', example: 1 }
 *                           name: { type: 'string', example: '张三' }
 *                           email: { type: 'string', example: 'zhangsan@example.com' }
 *                           phone: { type: 'string', example: '13800138000' }
 *                           address: { type: 'string', example: '北京市朝阳区' }
 *                           registration_date: { type: 'string', example: '2023-01-01' }
 *                     total: { type: 'integer', example: 15 }
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
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';
    
    let sql = 'SELECT * FROM readers';
    const params = [];
    
    if (keyword) {
      sql += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    // 添加分页 - 修复MySQL 9.x兼容性问题
    const offset = (page - 1) * pageSize;
    
    // 验证参数安全性
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
        !Number.isInteger(offset) || offset < 0) {
      throw new Error('分页参数无效');
    }
    
    sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
    
    const readers = await query(sql, params);
    
    // 获取总条数
    let countSql = 'SELECT COUNT(*) as total FROM readers';
    const countParams = [];
    
    if (keyword) {
      countSql += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;
    
    res.json({
      code: 200,
      data: {
        list: readers,
        total,
        page,
        pageSize
      },
      msg: '查询成功'
    });
  } catch (error) {
    console.error('更新读者失败:', error);
    let errorMsg = '更新读者失败';
    
    // 处理数据库错误
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('student_id')) {
        errorMsg = '学号/工号已存在，请使用其他学号';
      } else if (error.sqlMessage.includes('email')) {
        errorMsg = '邮箱已存在，请使用其他邮箱';
      }
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMsg = '读者分类无效，请选择正确的分类';
    } else {
      errorMsg = '更新读者失败：' + (error.message || '未知错误');
    }
    
    res.status(500).json({
      code: 500,
      data: null,
      msg: errorMsg
    });
  }
});

/**
 * @swagger
 * /api/readers:
 *   post:
 *     summary: 添加读者
 *     description: 添加新的读者信息
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             properties:
 *               name: { type: 'string', example: '张三' }
 *               email: { type: 'string', example: 'zhangsan@example.com' }
 *               phone: { type: 'string', example: '13800138000' }
 *             required:
 *               - name
 *               - email
 *     responses:
 *       200:
 *         description: 添加成功
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data:
 *                   type: 'object'
 *                   properties:
 *                     reader_id: { type: 'integer', example: 1 }
 *                     name: { type: 'string', example: '张三' }
 *                     email: { type: 'string', example: 'zhangsan@example.com' }
 *                     phone: { type: 'string', example: '13800138000' }
 *                     address: { type: 'string', example: '北京市朝阳区' }
 *                     registration_date: { type: 'string', example: '2023-01-01' }
 *                 msg: { type: 'string', example: '添加成功' }
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 400 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '缺少必要参数: name' }
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 500 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '添加失败，请稍后重试' }
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, student_id, type } = req.body;
    
    // 参数校验 - 确保所有必要参数都存在
    if (!name || name.trim() === '') {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '姓名不能为空'
      });
    }
    
    if (!student_id || student_id.trim() === '') {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '学号/工号不能为空'
      });
    }
    
    if (!type || type.trim() === '') {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '读者类型不能为空'
      });
    }
    
    // 确保所有参数都有值，避免undefined
    const safeName = name ? name.trim() : '';
    const safeEmail = email ? email.trim() : null;
    const safePhone = phone ? phone.trim() : null;
    const safeStudentId = student_id ? student_id.trim() : '';
    const safeType = type ? type.trim() : '';
    
    // 将中文类型映射到数据库类型
    const typeMapping = {
      '学生': 'student',
      '教师': 'teacher',
      '普通读者': 'other',
      'staff': 'staff',
      'student': 'student',
      'teacher': 'teacher',
      'other': 'other'
    };
    const dbType = typeMapping[type] || type;
    
    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existing = await query('SELECT * FROM readers WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({
          code: 400,
          data: null,
          msg: '该邮箱已被注册'
        });
      }
    }
    
    // 检查学号是否已存在
    const studentIdCheck = await query('SELECT * FROM readers WHERE student_id = ?', [student_id]);
    if (studentIdCheck.length > 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '该学号已被注册'
      });
    }

    const result = await query(
      'INSERT INTO readers (name, email, student_id, type) VALUES (?, ?, ?, ?)',
      [safeName, safeEmail, safeStudentId, dbType]
    );
    
    const newReader = await query('SELECT * FROM readers WHERE reader_id = ?', [result.insertId]);
    
    res.json({
      code: 200,
      data: newReader[0],
      msg: '添加成功'
    });
  } catch (error) {
    console.error('添加读者失败:', error);
    
    // 根据错误类型提供更具体的错误信息
    let errorMessage = '添加失败，请稍后重试';
    
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage && error.sqlMessage.includes('email')) {
        errorMessage = '邮箱已被其他读者使用';
      } else if (error.sqlMessage && error.sqlMessage.includes('student_id')) {
        errorMessage = '学号/工号已被其他读者使用';
      } else {
        errorMessage = '读者信息已存在，请检查邮箱或学号是否重复';
      }
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = '输入内容过长，请检查字段长度';
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = '输入格式不正确，请检查邮箱格式';
    }
    
    res.status(500).json({
      code: 500,
      data: null,
      msg: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/readers/{id}:
 *   put:
 *     summary: 更新读者信息
 *     description: 更新指定读者的信息
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 读者ID
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             properties:
 *               name: { type: 'string', example: '张三' }
 *               email: { type: 'string', example: 'zhangsan@example.com' }
 *               phone: { type: 'string', example: '13800138000' }

 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data:
 *                   type: 'object'
 *                   properties:
 *                     reader_id: { type: 'integer', example: 1 }
 *                     name: { type: 'string', example: '张三' }
 *                     email: { type: 'string', example: 'zhangsan@example.com' }
 *                     phone: { type: 'string', example: '13800138000' }
 *                     address: { type: 'string', example: '北京市朝阳区' }
 *                 msg: { type: 'string', example: '更新成功' }
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 400 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '读者不存在' }
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 500 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '更新失败，请稍后重试' }
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, student_id, type } = req.body;
    
    // 检查读者是否存在
    const existing = await query('SELECT * FROM readers WHERE reader_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '读者不存在'
      });
    }
    
    // 验证读者类型是否有效，并映射前端类型到数据库类型
    const typeMapping = {
      '学生': 'student',
      '教师': 'teacher',
      '普通读者': 'other',
      'staff': 'staff',
      'student': 'student',
      'teacher': 'teacher',
      'other': 'other'
    };
    
    const validTypes = ['学生', '教师', '普通读者', 'student', 'teacher', 'staff', 'other'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '读者类型无效，请选择：学生、教师、普通读者'
      });
    }
    
    // 将中文类型映射到数据库类型
    const dbType = typeMapping[type] || type;
    
    // 检查邮箱是否被其他读者使用
    if (email) {
      const emailCheck = await query('SELECT * FROM readers WHERE email = ? AND reader_id != ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(400).json({
          code: 400,
          data: null,
          msg: '该邮箱已被其他读者使用'
        });
      }
    }
    
    // 检查学号是否被其他读者使用
    if (student_id) {
      const studentIdCheck = await query('SELECT * FROM readers WHERE student_id = ? AND reader_id != ?', [student_id, id]);
      if (studentIdCheck.length > 0) {
        return res.status(400).json({
          code: 400,
          data: null,
          msg: '该学号已被其他读者使用'
        });
      }
    }
    
    // 构建更新语句
    const fields = [];
    const values = [];
    
    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (student_id) {
      fields.push('student_id = ?');
      values.push(student_id);
    }
    if (type) {
      fields.push('type = ?');
      values.push(dbType);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '没有提供要更新的字段'
      });
    }
    
    values.push(id);
    
    await query(`UPDATE readers SET ${fields.join(', ')} WHERE reader_id = ?`, values);
    
    const updatedReader = await query('SELECT * FROM readers WHERE reader_id = ?', [id]);
    
    res.json({
      code: 200,
      data: updatedReader[0],
      msg: '更新成功'
    });
  } catch (error) {
    console.error('更新读者失败:', error);
    
    // 根据错误类型提供更具体的错误信息
    let errorMessage = '更新失败，请稍后重试';
    
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage && error.sqlMessage.includes('email')) {
        errorMessage = '邮箱已被其他读者使用';
      } else if (error.sqlMessage && error.sqlMessage.includes('student_id')) {
        errorMessage = '学号/工号已被其他读者使用';
      } else {
        errorMessage = '读者信息已存在，请检查邮箱或学号是否重复';
      }
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = '输入内容过长，请检查字段长度';
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = '输入格式不正确，请检查邮箱格式';
    }
    
    res.status(500).json({
      code: 500,
      data: null,
      msg: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/readers/{id}:
 *   delete:
 *     summary: 删除读者
 *     description: 删除指定读者（检查是否有未归还的图书）
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 读者ID
 *         required: true
 *         schema: { type: 'integer' }
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 200 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '删除成功' }
 *       400:
 *         description: 参数错误或删除条件不满足
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 400 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '该读者有未归还的图书' }
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 500 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '删除失败，请稍后重试' }
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查读者是否存在
    const existing = await query('SELECT * FROM readers WHERE reader_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '读者不存在'
      });
    }
    
    // 检查该读者是否有未归还的图书
    const [borrowedBooks] = await query(
      'SELECT COUNT(*) as count FROM borrows WHERE reader_id = ? AND status IN ("borrowed", "overdue")',
      [id]
    );

    if (borrowedBooks.count > 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '该读者存在未还图书，无法删除'
      });
    }
    
    // 删除读者
    await query('DELETE FROM readers WHERE reader_id = ?', [id]);
    
    res.json({
      code: 200,
      data: null,
      msg: '删除成功'
    });
  } catch (error) {
    console.error('删除读者失败:', error);
    let errorMsg = '删除读者失败';
    
    // 处理外键约束错误
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      errorMsg = '该读者有关联数据（借阅记录等），无法删除';
    } else {
      errorMsg = '删除读者失败：' + (error.message || '未知错误');
    }
    
    res.status(500).json({
      code: 500,
      data: null,
      msg: errorMsg
    });
  }
});

/**
 * @swagger
 * /api/readers/{id}:
 *   get:
 *     summary: 获取读者详情
 *     description: 获取指定读者的详细信息
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 读者ID
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
 *                 code: { type: 'integer', example: 200 }
 *                 data:
 *                   type: 'object'
 *                   properties:
 *                     reader_id: { type: 'integer', example: 1 }
 *                     name: { type: 'string', example: '张三' }
 *                     email: { type: 'string', example: 'zhangsan@example.com' }
 *                     phone: { type: 'string', example: '13800138000' }
 *                     address: { type: 'string', example: '北京市朝阳区' }
 *                     registration_date: { type: 'string', example: '2023-01-01' }
 *                 msg: { type: 'string', example: '查询成功' }
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               type: 'object'
 *               properties:
 *                 code: { type: 'integer', example: 400 }
 *                 data: { type: 'null' }
 *                 msg: { type: 'string', example: '读者不存在' }
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const reader = await query('SELECT * FROM readers WHERE reader_id = ?', [id]);
    if (reader.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '读者不存在'
      });
    }
    
    res.json({
      code: 200,
      data: reader[0],
      msg: '查询成功'
    });
  } catch (error) {
    console.error('新增读者失败:', error);
    let errorMsg = '新增读者失败';
    
    // 处理数据库错误
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('student_id')) {
        errorMsg = '学号/工号已存在，请使用其他学号';
      } else if (error.sqlMessage.includes('email')) {
        errorMsg = '邮箱已存在，请使用其他邮箱';
      }
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMsg = '读者分类无效，请选择正确的分类';
    } else {
      errorMsg = '新增读者失败：' + (error.message || '未知错误');
    }
    
    res.status(500).json({
      code: 500,
      data: null,
      msg: errorMsg
    });
  }
});

/**
 * @swagger
 * /api/readers/import:
 *   post:
 *     summary: 批量导入读者数据
 *     description: 从 Excel 文件中导入读者数据，支持批量插入和数据验证
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
 *                     imported_count: { type: 'integer', example: 12 }
 *                     failed_items: 
 *                       type: 'array'
 *                       items:
 *                         type: 'object'
 *                         properties:
 *                           row: { type: 'integer', example: 3 }
 *                           data: { type: 'object' }
 *                           reason: { type: 'string', example: '学号已存在' }
 *                     details:
 *                       type: 'object'
 *                       properties:
 *                         total_rows: { type: 'integer', example: 15 }
 *                         successful: { type: 'integer', example: 12 }
 *                         failed: { type: 'integer', example: 3 }
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
    console.log(`开始处理读者导入文件: ${req.file.originalname}`);
    
    // 解析 Excel 文件
    const excelData = parseExcelFile(tempFilePath);
    
    // 验证数据格式
    const requiredHeaders = ['姓名', '学号', '邮箱', '电话'];
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
      '姓名': 'name',
      '学号': 'student_id',
      '邮箱': 'email',
      '电话': 'phone',
      '类型': 'type',
      '地址': 'address'
    };
    
    const readerObjects = convertExcelToObjects(excelData, fieldMapping);
    
    if (readerObjects.length === 0) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '没有找到有效的读者数据'
      });
    }
    
    console.log(`解析到 ${readerObjects.length} 条读者数据，开始批量导入`);
    
    // 开始批量导入数据库操作
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = {
        imported_count: 0,
        failed_items: [],
        details: {
          total_rows: readerObjects.length,
          successful: 0,
          failed: 0
        }
      };
      
      // 逐个处理每条读者数据
      for (const readerData of readerObjects) {
        try {
          // 数据验证
          const validationResult = validateReaderData(readerData);
          
          if (!validationResult.isValid) {
            results.failed_items.push({
              row: readerData._rowIndex,
              data: readerData,
              reason: validationResult.errors.join(', ')
            });
            results.details.failed++;
            continue;
          }
          
          // 检查学号唤一性
          const existingReaderSql = 'SELECT reader_id FROM readers WHERE student_id = ?';
          const [existingReaders] = await connection.execute(existingReaderSql, [readerData.student_id]);
          
          if (existingReaders.length > 0) {
            results.failed_items.push({
              row: readerData._rowIndex,
              data: readerData,
              reason: `学号 '${readerData.student_id}' 已存在`
            });
            results.details.failed++;
            continue;
          }
          
          // 检查邮箱唤一性
          const existingEmailSql = 'SELECT reader_id FROM readers WHERE email = ?';
          const [existingEmails] = await connection.execute(existingEmailSql, [readerData.email]);
          
          if (existingEmails.length > 0) {
            results.failed_items.push({
              row: readerData._rowIndex,
              data: readerData,
              reason: `邮箱 '${readerData.email}' 已存在`
            });
            results.details.failed++;
            continue;
          }
          
          // 清理和格式化数据
          const cleanData = cleanReaderData(readerData);
          
          // 插入数据库
          const insertSql = `
            INSERT INTO readers (name, student_id, email, phone, type, address, registration_date)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
          `;
          
          const values = [
            cleanData.name,
            cleanData.student_id,
            cleanData.email,
            cleanData.phone,
            cleanData.type,
            cleanData.address
          ];
          
          await connection.execute(insertSql, values);
          
          results.imported_count++;
          results.details.successful++;
          
        } catch (error) {
          console.error(`导入第${readerData._rowIndex}行失败:`, error);
          
          let errorMessage = `数据库操作失败: ${error.message}`;
          
          // 处理具体错误类型
          if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage && error.sqlMessage.includes('student_id')) {
              errorMessage = `学号 '${readerData.student_id}' 已存在`;
            } else if (error.sqlMessage && error.sqlMessage.includes('email')) {
              errorMessage = `邮箱 '${readerData.email}' 已存在`;
            } else {
              errorMessage = '数据已存在，跳过重复数据';
            }
          }
          
          results.failed_items.push({
            row: readerData._rowIndex,
            data: readerData,
            reason: errorMessage
          });
          results.details.failed++;
        }
      }
      
      await connection.commit();
      
      // 返回结果
      const message = results.failed_items.length === 0 
        ? `成功导入 ${results.imported_count} 条读者数据`
        : `导入完成：成功 ${results.imported_count} 条，失败 ${results.failed_items.length} 条`;
      
      console.log(`读者导入完成: 成功${results.imported_count}条，失败${results.details.failed}条`);
      
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
    console.error('读者导入失败:', error);
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
 * 验证读者数据
 */
function validateReaderData(readerData) {
  const result = {
    isValid: true,
    errors: []
  };
  
  // 检查必填字段
  if (!readerData.name || readerData.name.trim() === '') {
    result.isValid = false;
    result.errors.push('姓名不能为空');
  }
  
  if (!readerData.student_id || readerData.student_id.trim() === '') {
    result.isValid = false;
    result.errors.push('学号不能为空');
  }
  
  if (!readerData.email || readerData.email.trim() === '') {
    result.isValid = false;
    result.errors.push('邮箱不能为空');
  } else {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(readerData.email.trim())) {
      result.isValid = false;
      result.errors.push('邮箱格式不正确');
    }
  }
  
  if (!readerData.phone || readerData.phone.trim() === '') {
    result.isValid = false;
    result.errors.push('电话不能为空');
  } else {
    // 验证电话格式（中国手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(readerData.phone.trim())) {
      result.isValid = false;
      result.errors.push('电话格式不正确（应为11位中国手机号）');
    }
  }
  
  // 验证读者类型
  if (readerData.type && readerData.type.trim() !== '') {
    const validTypes = ['学生', '教师', '工作人员', '其他'];
    if (!validTypes.includes(readerData.type.trim())) {
      result.isValid = false;
      result.errors.push(`读者类型只能是: ${validTypes.join(', ')}`);
    }
  }
  
  return result;
}

/**
 * 清理和格式化读者数据
 */
function cleanReaderData(readerData) {
  const cleaned = {};
  
  // 必填字段
  cleaned.name = readerData.name.trim();
  cleaned.student_id = readerData.student_id.trim();
  cleaned.email = readerData.email.trim().toLowerCase();
  cleaned.phone = readerData.phone.trim();
  
  // 可选字段
  cleaned.type = readerData.type ? readerData.type.trim() : '学生'; // 默认为学生
  cleaned.address = readerData.address ? readerData.address.trim() : null;
  
  return cleaned;
}

module.exports = router;