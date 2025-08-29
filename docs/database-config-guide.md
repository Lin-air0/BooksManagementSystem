# 数据库配置调整指南

## 版本信息
- 版本：v1.0.0
- 适配阶段：图书借阅系统 MVP 阶段
- 创建日期：2025年8月24日
- 作者：协同开发专员

## 一、问题概述

根据当前系统检查，发现图书借阅系统存在MySQL数据库连接权限问题，导致所有数据库相关的API调用都无法正常工作。在 `API测试指南.md` 和数据库连接配置文件 `db.js` 中已确认以下问题：

1. **连接配置问题**：`backend/src/config/db.js` 文件中使用root用户连接数据库，但密码为空字符串
2. **权限限制**：MySQL的root用户当前配置不允许无密码连接或远程连接
3. **服务状态**：MySQL服务已运行，但系统无法正常连接到数据库

## 二、环境信息

- **MySQL版本**：9.3.0（根据MySQL Configurator界面显示）
- **数据库名称**：`book_management`
- **连接端口**：3306
- **服务器地址**：localhost
- **配置文件位置**：`backend/src/config/db.js`
- **后端服务端口**：3001（开发环境）

## 三、配置调整步骤

### 步骤1：检查MySQL服务状态

首先确认MySQL服务是否正常运行：

1. 打开Windows服务管理器（Win+R → services.msc）
2. 查找"MySQL80"或类似名称的服务
3. 确认服务状态为"正在运行"
   - 如果未运行，右键点击服务，选择"启动"

### 步骤2：通过MySQL Configurator修改root用户密码

1. 打开MySQL Configurator（从开始菜单搜索）
2. 在"MySQL Server 9.3.0"实例上点击"Reconfigure"
3. 进入"Accounts and Roles"配置页面
4. 输入并确认新的root用户密码
5. 点击"Next"，继续完成配置向导
6. 最后点击"Execute"应用配置更改

### 步骤3：修改项目数据库配置文件

1. 打开项目中的数据库配置文件：`backend/src/config/db.js`
2. 修改以下配置项：

```javascript
// 将原来的配置
exports.db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // 空密码
  database: 'book_management',
  port: 3306,
  // 其他配置...
});

// 修改为
exports.db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '你的新密码', // 替换为步骤2中设置的密码
  database: 'book_management',
  port: 3306,
  // 其他配置...
});

// 同时修改testConnection函数中的密码配置
```

### 步骤4：创建专用数据库用户（可选但推荐）

为了提高系统安全性，建议创建一个专用的数据库用户，而不是直接使用root用户：

1. 打开MySQL命令行客户端或MySQL Workbench
2. 登录MySQL（使用root用户和新密码）

```sql
mysql -u root -p
```

3. 创建专用数据库用户并授予权限：

```sql
-- 创建新用户
CREATE USER 'bookadmin'@'localhost' IDENTIFIED BY 'BookAdmin123!';

-- 授予权限
GRANT ALL PRIVILEGES ON book_management.* TO 'bookadmin'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

4. 修改项目配置文件使用新创建的用户：

```javascript
exports.db = mysql.createPool({
  host: 'localhost',
  user: 'bookadmin', // 使用新创建的用户
  password: 'BookAdmin123!', // 新用户的密码
  database: 'book_management',
  port: 3306,
  // 其他配置...
});
```

### 步骤5：初始化数据库（如果需要）

如果数据库尚未初始化或表结构不完整，可以执行初始化脚本：

1. 确保已创建`book_management`数据库：

```sql
CREATE DATABASE IF NOT EXISTS book_management;
USE book_management;
```

2. 执行项目中的初始化脚本：`db/init.sql`

```sql
-- 运行初始化脚本
SOURCE d:/BooksManagementSystem/db/init.sql;
```

### 步骤6：重启后端服务

1. 停止当前运行的后端服务
2. 在终端中重新启动服务：

```bash
cd d:/BooksManagementSystem/backend
npm start
```

3. 检查服务输出日志，确认数据库连接成功

## 四、验证数据库连接

可以使用以下方法验证数据库连接是否正常：

### 方法1：使用项目中的连接测试函数

1. 在`backend`目录下创建一个简单的测试脚本`test_db_connection.js`：

```javascript
const { testConnection } = require('./src/config/db');

async function testDb() {
  try {
    await testConnection();
    console.log('数据库连接测试通过！');
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  }
}

testDb();
```

2. 运行测试脚本：

```bash
node test_db_connection.js
```

### 方法2：测试API接口

使用Postman或浏览器测试图书搜索API：

```
http://localhost:4000/api/books/search?category=文学&title=三
```

如果返回图书数据，则表示数据库连接正常。

## 五、常见问题与解决方案

### 1. MySQL服务无法启动

- **问题**：MySQL服务启动失败
- **解决方案**：
  - 检查Windows事件日志，查看具体错误信息
  - 确认3306端口未被其他程序占用
  - 重新配置MySQL服务

### 2. 访问被拒绝错误

- **问题**：`Error: Access denied for user 'root'@'localhost' (using password: YES)`
- **解决方案**：
  - 确认密码是否正确
  - 检查用户是否有足够的权限访问`book_management`数据库
  - 尝试重置root用户密码

### 3. 数据库不存在错误

- **问题**：`Error: ER_NO_SUCH_DB: Unknown database 'book_management'`
- **解决方案**：
  - 使用root用户登录MySQL，手动创建数据库
  - 运行初始化脚本创建数据库结构

### 4. 连接超时错误

- **问题**：`Error: connect ETIMEDOUT`
- **解决方案**：
  - 确认MySQL服务是否正在运行
  - 检查防火墙设置，确保3306端口开放
  - 验证主机名和端口号是否正确

## 六、安全注意事项

1. **密码管理**
   - 不要在代码中硬编码数据库密码
   - 考虑使用环境变量存储敏感信息
   - 定期更换数据库密码

2. **用户权限**
   - 生产环境避免使用root用户连接数据库
   - 为不同功能分配最小必要权限的用户
   - 限制远程访问权限

3. **数据备份**
   - 定期备份数据库
   - 测试备份的可恢复性
   - 存储备份数据在安全位置

## 七、后续优化建议

1. **配置管理优化**
   - 实现多环境配置（开发、测试、生产）
   - 使用dotenv管理环境变量
   - 将数据库配置从代码中分离

2. **连接池优化**
   - 根据系统负载调整连接池大小
   - 配置合适的连接超时和空闲超时时间
   - 实现连接健康检查

3. **错误处理增强**
   - 添加更详细的数据库错误日志
   - 实现优雅的错误重试机制
   - 提供用户友好的错误信息

## 八、相关文件与资源

1. **配置文件**：`backend/src/config/db.js`
2. **初始化脚本**：`db/init.sql`
3. **API测试指南**：`API测试指南.md`
4. **MySQL官方文档**：https://dev.mysql.com/doc/