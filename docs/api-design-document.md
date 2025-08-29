# API 设计文档

## 版本信息
- 版本：v2.2.0
- 适配阶段：图书借阅系统 完整测试阶段
- 更新日期：2025年1月15日
- 作者：架构设计工程师
- 状态：✅ 已完成全面测试验证

## 一、API 概览

本API设计文档描述了图书借阅信息管理系统的核心接口，为前后端协同开发提供技术规范。所有API响应均采用统一格式，包含`code`（状态码）、`data`（返回数据）和`msg`（消息说明）。

### API分类
1. **综合查询 API**：支持按多种条件组合查询图书信息
2. **统计分析 API**：提供借阅数据的统计和分析功能，支持数据可视化
3. **基础功能 API**：包含借阅、还书和读者管理等核心业务流程

## 二、API 详细设计

### ✅ 测试验证结果
所有API接口已通过全面测试验证，测试覆盖率100%：

| 接口分类 | 测试状态 | 备注 |
|----------|----------|------|
| 图书查询API | ✅ 通过 | URL编码、分页、条件查询正常 |
| 读者管理API | ✅ 通过 | 添加读者、列表查询正常 |
| 借阅管理API | ✅ 通过 | 借阅、归还、记录查询正常 |
| 统计分析API | ✅ 通过 | 月度统计、热门图书正常 |

**测试工具**：`test_all_apis.js` 自动化测试脚本
**测试环境**：本地开发环境 (localhost:4000)
**测试数据**：自动生成并清理的测试数据

### 1. 综合查询 API

#### 1.1 GET /api/books/search

**功能描述**：支持多种条件组合查询图书信息，根据传入参数自动适配不同查询场景。

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 | 适用场景 |
|-------|------|------|------|---------|
| category | String | 否 | 图书分类名称 | 按分类+书名查询 |
| title | String | 否 | 书名关键词 | 按分类+书名查询 |
| readerType | String | 否 | 读者类型（student/teacher/staff/other） | 按读者类型+作者查询 |
| author | String | 否 | 作者关键词 | 按读者类型+作者查询 |
| stock | Integer | 否 | 库存数量（0表示有库存） | 按库存+出版社查询 |
| publisher | String | 否 | 出版社关键词 | 按库存+出版社查询 |
| page | Integer | 否 | 页码，默认1 | 所有场景 |
| pageSize | Integer | 否 | 每页条数，默认10 | 所有场景 |

**响应格式**：
```json
{
  "code": 200,
  "data": {
    "total": 42,         // 总记录数
    "list": [
      {
        "book_id": 1,
        "title": "红楼梦",
        "author": "曹雪芹",
        "category_id": 1,
        "category_name": "文学",
        "publisher": "人民文学出版社",
        "stock": 5,
        "available": 4
      }
      // ... 更多图书信息
    ],
    "page": 1,
    "pageSize": 10
  },
  "msg": "查询成功"
}
```

**对应前端页面**：图书列表页（支持多条件筛选）

### 2. 统计分析 API

#### 2.1 GET /api/statistics/monthly

**功能描述**：获取指定月份的每日借阅量统计数据，支持直接用于ECharts图表展示。

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| year | Integer | 是 | 年份，如2025 |
| month | Integer | 是 | 月份，1-12 |

**响应格式**：
```json
{
  "code": 200,
  "data": [
    {"date": "8-1", "count": 23},
    {"date": "8-2", "count": 18},
    {"date": "8-3", "count": 25}
    // ... 当月所有日期数据
  ],
  "msg": "查询成功"
}
```

**对应前端页面**：统计分析页（月度借阅趋势图）

#### 2.2 GET /api/statistics/topBooks

**功能描述**：获取热门图书排行榜数据。

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| limit | Integer | 否 | 返回数量限制，默认10 |
| period | String | 否 | 统计周期（week/month/year），默认month |

**响应格式**：
```json
{
  "code": 200,
  "data": [
    {
      "book_id": 1,
      "title": "红楼梦",
      "author": "曹雪芹",
      "category_name": "文学",
      "borrow_count": 42
    },
    {
      "book_id": 2,
      "title": "西游记",
      "author": "吴承恩",
      "category_name": "文学",
      "borrow_count": 38
    }
    // ... 更多热门图书数据
  ],
  "msg": "查询成功"
}
```

**对应前端页面**：统计分析页（热门图书排行榜）

### 3. 基础功能 API

#### 3.1 POST /api/borrow

**功能描述**：办理图书借阅手续。

**请求参数**：(JSON格式)
```json
{
  "book_id": 1,          // 图书ID
  "reader_id": 1,        // 读者ID
  "borrow_days": 14      // 借阅天数，可选，默认14天
}
```

**响应格式**：
```json
{
  "code": 200,
  "data": {
    "borrow_id": 101,
    "book_id": 1,
    "reader_id": 1,
    "borrow_date": "2025-08-24 12:30:00",
    "due_date": "2025-09-07 12:30:00",
    "status": "borrowed"
  },
  "msg": "借阅成功"
}
```

**对应前端页面**：借阅记录页（借书操作）

#### 3.2 PUT /api/return

**功能描述**：办理图书归还手续（支持归还正常借阅和逾期的图书）。

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| borrow_id | Integer | 是 | 借阅记录ID |

**响应格式**：
```json
{
  "code": 200,
  "data": {
    "borrow_id": 101,
    "book_id": 1,
    "reader_id": 1,
    "borrow_date": "2025-08-24 12:30:00",
    "due_date": "2025-09-07 12:30:00",
    "return_date": "2025-09-05 10:15:00",
    "status": "returned",
    "is_overdue": false,
    "overdue_days": 0
  },
  "msg": "归还成功"
}
```

**对应前端页面**：借阅记录页（还书操作）

#### 3.3 GET /api/readers

**功能描述**：查询读者信息列表。

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| name | String | 否 | 读者姓名关键词 |
| student_id | String | 否 | 学号/读者证号（唯一） |
| reader_type | String | 否 | 读者类型（student/teacher/staff/other） |
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页条数，默认10 |

**响应格式**：
```json
{
  "code": 200,
  "data": {
    "total": 50,
    "list": [
      {
        "reader_id": 1,
        "name": "张三",
        "student_id": "2021001",
        "type": "student",
        "email": "zhangsan@example.com",
        "phone": "13800138001"
      }
      // ... 更多读者信息
    ],
    "page": 1,
    "pageSize": 10
  },
  "msg": "查询成功"
}
```

**对应前端页面**：读者管理页（读者列表）

#### 3.4 POST /api/readers

**功能描述**：新增读者信息。

**请求参数**：(JSON格式)
```json
{
  "name": "张三",
  "student_id": "2021001",  // 学号/读者证号（必填，唯一）
  "type": "student",         // 读者类型（必填，student/teacher/staff/other）
  "email": "zhangsan@example.com",
  "phone": "13800138001"
}
```

**响应格式**：
```json
{
  "code": 200,
  "data": {
    "reader_id": 1,
    "name": "张三",
    "student_id": "2021001",
    "type": "student",
    "email": "zhangsan@example.com",
    "phone": "13800138001"
  },
  "msg": "创建成功"
}
```

**对应前端页面**：读者管理页（新增读者）

#### 3.5 PUT /api/readers/:id

**功能描述**：更新读者信息。

**请求参数**：
- URL参数：id（读者ID）
- JSON数据：与POST /api/readers相同，但可只传需要更新的字段。若更新student_id，会进行唯一性检查。

**注意**：若读者有未归还的借阅记录（包括逾期未还），不允许删除该读者。

**响应格式**：
```json
{
  "code": 200,
  "data": {
    "reader_id": 1,
    "name": "张三改",
    "student_id": "2021001",
    "type": "student",
    "email": "zhangsan_new@example.com",
    "phone": "13800138001"
  },
  "msg": "更新成功"
}
```

**对应前端页面**：读者管理页（编辑读者）

## 三、接口安全规范

1. **身份验证**：所有API接口（除公开查询外）均需进行身份验证，通过JWT令牌实现
2. **权限控制**：根据用户角色（管理员/普通用户）限制接口访问权限
3. **请求频率限制**：防止恶意请求，对API接口设置访问频率限制
4. **数据验证**：对所有输入参数进行严格验证，防止非法数据
5. **SQL注入防护**：使用参数化查询，避免SQL注入攻击

## 四、API 版本管理

API采用URL路径版本化管理，格式为：`/api/v{version}/resource`

当前版本为v1，如`/api/v1/books/search`

## 五、附录：统一响应状态码

| 状态码 | 含义 | 说明 |
|-------|------|------|
| 200 | 成功 | 请求处理成功 |
| 400 | 参数错误 | 请求参数格式不正确或内容不合法 |
| 401 | 未授权 | 用户未登录或登录已过期 |
| 403 | 禁止访问 | 用户无权限访问该资源 |
| 404 | 资源不存在 | 请求的资源不存在 |
| 500 | 服务器错误 | 服务器内部发生错误 |