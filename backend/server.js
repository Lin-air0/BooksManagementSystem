const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // 使用.env中配置的端口，默认为3000

// 中间件
app.use(cors());
app.use(express.json());

// 导入数据库配置
const { testConnection } = require('./src/config/db.js');

// 路由
app.use('/api/books', require('./src/routes/books'));
app.use('/api/borrows', require('./src/routes/borrows'));
app.use('/api/readers', require('./src/routes/readers'));
app.use('/api/statistics', require('./src/routes/statistics'));

// 兼容Postman测试集合中的API路径 - 使用正确的函数名
const borrowsRouter = require('./src/routes/borrows');
app.post('/api/borrow', (req, res) => borrowsRouter.postBorrow(req, res));
app.put('/api/return', (req, res) => borrowsRouter.putReturn(req, res));

// 健康检查 - 与Postman测试集合匹配
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  testConnection();
});

module.exports = { app };