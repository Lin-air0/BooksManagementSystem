## 4. 数据模型和API映射

### 4.1 路由修复
- 将`/api/books/export`路由注册放在`/api/books/:id`之前
- 删除`statistics.js`中重复的路由定义

### 4.2 数据库连接统一
- 修改`statistics.js`使用`db.js`中的连接池配置

### 4.3 API响应格式统一
- 统一前端API拦截器的响应处理逻辑

## 5. 业务逻辑层

### 5.1 路由顺序修复
```
// 修复前 - server.js
app.use('/api/books', require('./src/routes/books'));
// 这会导致books.js中的路由按顺序注册，其中/:id在/export之前

// 修复后 - server.js
app.use('/api/books/export', require('./src/routes/books'));
app.use('/api/books', require('./src/routes/books'));
```

### 5.2 统计模块路由去重
在`statistics.js`文件中，删除重复定义的相同路径路由，保留功能最完整的版本。

### 5.3 数据库连接统一
修改`statistics.js`文件，使用统一的数据库连接配置：
```
// 修复前
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'bookadmin',
  password: process.env.DB_PASSWORD || 'BookAdmin123!',
  database: process.env.DB_NAME || 'book_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 修复后
const { pool } = require('../config/db.js');
```

## 6. 中间件和拦截器

### 6.1 API响应拦截器统一
修改前端`api.js`文件中的响应拦截器，确保对所有响应格式都能正确处理：
```
// 统一处理API响应
api.interceptors.response.use(
  response => {
    // 处理后端统一响应格式 {code, data, msg}
    if (response.data && typeof response.data.code !== 'undefined') {
      if (response.data.code === 0 || response.data.code === 200) {
        return response.data;
      } else {
        return Promise.reject(new Error(response.data.msg || '业务处理失败'));
      }
    }
    // 处理统计分析API的特殊格式 {success, data, message}
    else if (response.data && typeof response.data.success !== 'undefined') {
      if (response.data.success) {
        // 统一格式为 {code: 200, data, msg}
        return {
          code: 200,
          data: response.data.data,
          msg: response.data.message || '操作成功'
        };
      } else {
        return Promise.reject(new Error(response.data.message || '业务处理失败'));
      }
    }
    // 直接返回数据
    return response.data;
  },
  error => {
    // 统一错误处理
    return Promise.reject(error);
  }
);
```

## 7. 测试方案

### 7.1 单元测试
- 测试路由注册顺序是否正确
- 验证API响应处理逻辑是否统一
- 检查数据库连接是否统一使用

### 7.2 集成测试
- 测试图书导出功能是否正常工作
- 验证统计分析API是否能正确返回数据
- 检查借阅相关功能是否正常

### 7.3 端到端测试
- 测试前端页面功能是否完整实现
- 验证前后端交互是否正常

## 8. 实施步骤

### 8.1 后端修复
1. 修改`server.js`文件，调整路由注册顺序
2. 修改`statistics.js`文件，删除重复路由定义
3. 修改`statistics.js`文件，使用统一的数据库连接配置

### 8.2 前端修复
1. 完善API拦截器的响应处理逻辑
2. 为未实现的前端功能添加事件处理

### 8.3 测试验证
1. 运行单元测试验证修复
2. 进行集成测试确保功能正常
3. 执行端到端测试验证用户体验
