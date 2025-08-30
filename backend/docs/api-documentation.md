# 图书借阅系统 - API接口文档

## Status
- **版本**: v2.4.0
- **更新时间**: 2025-08-30
- **状态**: 已发布
- **API版本**: v1.1 (第1阶段功能新增)
- **基础URL**: `http://localhost:3001/api`

## Key Findings
- 基于Express.js框架的RESTful API设计
- 支持MySQL 9.x兼容性查询，使用现代SQL特性
- 完整的错误处理机制和参数验证
- 集成Swagger/OpenAPI 3.0文档自动生成
- 支持分页、筛选、排序等高级查询功能

## Next Actions
- 前端团队可据此进行接口对接
- 测试团队可设计API测试用例
- 运维团队可配置API监控

## Reference
- 路由实现：`backend/src/routes/`
- 业务逻辑：`后端业务逻辑文档.md`
- 数据库结构：`数据库表结构.md`

---

## 1. API概览

### 1.1 接口分类
| 分类 | 接口数量 | 说明 |
|------|----------|------|
| 图书管理 | 6个 | 图书CRUD、搜索、统计 |
| 读者管理 | 4个 | 读者注册、查询、更新 |
| 借阅管理 | 4个 | 借阅、归还、查询 |
| 统计分析 | 2个 | 月度统计、热门图书 |

### 1.2 通用规范

#### 请求格式
- **Content-Type**: `application/json`
- **字符编码**: UTF-8
- **时间格式**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

#### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

#### 错误格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

#### 分页参数
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码，从1开始 |
| limit | number | 10 | 每页数量，最大100 |
| sortBy | string | id | 排序字段 |
| sortOrder | string | ASC | 排序方向：ASC/DESC |

#### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 参数错误 |
| 404 | 资源不存在 |
| 409 | 业务冲突 |
| 500 | 服务器错误 |

---

## 2. 图书管理接口

### 2.1 图书搜索 [GET /api/books/search]

#### 功能描述
支持多条件组合搜索图书，包括标题、作者、ISBN、分类等，支持分页和排序。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| keyword | string | 否 | 搜索关键词（标题/作者/ISBN） | "JavaScript" |
| categoryId | number | 否 | 分类ID | 1 |
| author | string | 否 | 作者姓名 | "Nicholas Zakas" |
| availableOnly | boolean | 否 | 仅显示可借图书 | true |
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页数量 | 20 |

#### 请求示例
```bash
GET /api/books/search?keyword=JavaScript&categoryId=1&availableOnly=true&page=1&limit=10
```

#### 成功响应
```json
{
  "success": true,
  "data": {
    "books": [
      {
        "bookId": 1,
        "title": "JavaScript高级程序设计",
        "author": "Nicholas C. Zakas",
        "isbn": "978-7-115-27579-0",
        "publisher": "人民邮电出版社",
        "publishDate": "2024-01-15",
        "stock": 10,
        "available": 8,
        "category": {
          "categoryId": 1,
          "name": "计算机科学"
        },
        "metadata": {
          "cover": "javascript.jpg",
          "pages": 800
        },
        "createdAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "搜索成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "分页参数无效",
    "details": [
      {
        "field": "limit",
        "message": "每页数量不能超过100"
      }
    ]
  },
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### 2.2 获取图书详情 [GET /api/books/:bookId]

#### 功能描述
获取单本图书的详细信息。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| bookId | number | 是 | 图书ID | 1 |

#### 成功响应
```json
{
  "success": true,
  "data": {
    "bookId": 1,
    "title": "JavaScript高级程序设计",
    "author": "Nicholas C. Zakas",
    "isbn": "978-7-115-27579-0",
    "publisher": "人民邮电出版社",
    "publishDate": "2024-01-15",
    "stock": 10,
    "available": 8,
    "category": {
      "categoryId": 1,
      "name": "计算机科学"
    },
    "metadata": {
      "cover": "javascript.jpg",
      "pages": 800
    },
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}
```

---

## 3. 读者管理接口

### 3.1 获取读者列表 [GET /api/readers]

#### 功能描述
获取所有读者信息，支持分页和关键词搜索。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 10 |
| keyword | string | 否 | 搜索关键词（姓名/邮箱/电话） | "张三" |

#### 请求示例
```bash
GET /api/readers?page=1&pageSize=10&keyword=张三
```

#### 成功响应
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "reader_id": 1,
        "name": "张三",
        "email": "zhangsan@example.com",
        "phone": "13800138000",
        "address": "北京市朝阳区",
        "registration_date": "2023-01-01"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 10
  },
  "msg": "查询成功"
}
```

### 3.2 添加读者 [POST /api/readers]

#### 功能描述
添加新的读者信息。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| name | string | 是 | 读者姓名 | "张三" |
| email | string | 是 | 邮箱地址 | "zhangsan@example.com" |
| phone | string | 否 | 手机号码 | "13800138000" |

#### 请求示例
```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000"
}
```

#### 成功响应
```json
{
  "code": 200,
  "data": {
    "reader_id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "address": "北京市朝阳区",
    "registration_date": "2023-01-01"
  },
  "msg": "添加成功"
}
```

---

## 4. 统计分析接口

### 4.1 月度借阅统计 [GET /api/statistics/monthly]

#### 功能描述
获取指定年月的每日借阅和归还统计数据，用于生成趋势图表。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| year | number | 是 | 年份 | 2024 |
| month | number | 是 | 月份 | 1 |

#### 请求示例
```bash
GET /api/statistics/monthly?year=2024&month=1
```

#### 成功响应
```json
{
  "success": true,
  "data": {
    "dates": ["2024-01-01", "2024-01-02", "2024-01-03"],
    "borrow_counts": [5, 8, 3],
    "return_counts": [2, 6, 4]
  }
}
```

### 4.2 热门图书排行 [GET /api/statistics/topBooks]

#### 功能描述
获取指定时间段内的热门借阅图书排行榜。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| period | string | 是 | 统计周期（week/month/quarter/year） | "month" |
| limit | number | 否 | 返回数量限制 | 10 |

#### 请求示例
```bash
GET /api/statistics/topBooks?period=month&limit=10
```

#### 成功响应
```json
{
  "success": true,
  "data": [
    {
      "book_id": 1,
      "title": "JavaScript高级程序设计",
      "author": "Nicholas C. Zakas",
      "borrow_count": 35
    }
  ],
  "period": "month",
  "limit": 10
}
```

---

## 5. 借阅管理接口

### 5.1 图书借阅 [POST /api/borrow]

#### 功能描述
处理图书借阅请求，包含库存检查和事务处理。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| book_id | number | 是 | 图书ID | 1 |
| reader_id | number | 是 | 读者ID | 1 |
| borrow_days | number | 否 | 借阅天数 | 14 |

#### 请求示例
```json
{
  "book_id": 1,
  "reader_id": 1,
  "borrow_days": 14
}
```

#### 成功响应
```json
{
  "borrow_id": 1,
  "book_id": 1,
  "reader_id": 1,
  "borrow_date": "2024-01-09 10:30:00",
  "due_date": "2024-01-23 10:30:00",
  "status": "borrowed"
}
```

#### 错误响应
```json
{
  "code": 400,
  "data": null,
  "msg": "该图书目前无可用库存"
}
```

### 5.2 新的还书功能 [POST /api/borrows/return]

#### 功能描述
第1阶段新增的还书API，简化了还书流程，只需要借阅记录ID。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| borrow_id | number | 是 | 借阅记录ID | 1 |

#### 请求示例
```json
{
  "borrow_id": 1
}
```

#### 成功响应
```json
{
  "code": 200,
  "data": {
    "borrow_id": 1,
    "book_id": 1,
    "reader_id": 1,
    "borrow_date": "2025-08-17T16:00:00.000Z",
    "due_date": "2025-09-17T16:00:00.000Z",
    "return_date": "2025-08-30 03:54:26",
    "status": "returned",
    "is_overdue": false,
    "overdue_days": 0
  },
  "msg": "还书成功"
}
```

#### 逾期归还响应
```json
{
  "code": 200,
  "data": {
    "borrow_id": 2,
    "book_id": 2,
    "reader_id": 2,
    "return_date": "2025-08-30 15:45:00",
    "status": "returned",
    "is_overdue": true,
    "overdue_days": 5
  },
  "msg": "还书成功"
}
```

### 5.3 逾期提醒功能 [GET /api/borrows/overdue]

#### 功能描述
第1阶段新增的逾期提醒API，获取所有逾期的借阅记录，支持分页和统计信息。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| page | number | 否 | 页码 | 1 |
| pageSize | number | 否 | 每页数量 | 10 |

#### 请求示例
```bash
GET /api/borrows/overdue?page=1&pageSize=10
```

#### 成功响应
```json
{
  "code": 200,
  "data": {
    "total": 4,
    "list": [
      {
        "borrow_id": 15,
        "reader_id": 5,
        "reader_name": "王五",
        "reader_email": "wangwu@example.com",
        "book_id": 3,
        "book_title": "Node.js开发指南",
        "book_author": "李四",
        "borrow_date": "2025-07-15T00:00:00.000Z",
        "due_date": "2025-08-15T00:00:00.000Z",
        "return_date": null,
        "status": "overdue",
        "overdue_days": 15,
        "actual_status": "overdue"
      }
    ],
    "stats": {
      "total_overdue": 4,
      "severe_overdue": 0,
      "moderate_overdue": 2,
      "mild_overdue": 2
    },
    "page": 1,
    "pageSize": 10
  },
  "msg": "查询逾期记录成功"
}
```

### 5.4 借阅记录查询增强 [GET /api/borrows]

#### 功能描述
第1阶段增强了借阅记录查询功能，支持更精确的状态筛选。

#### 新增参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| is_overdue | boolean | 否 | 是否仅查询逾期记录 | true |
| status | string | 否 | 状态筛选：borrows/returned/overdue | "borrowed" |

#### 请求示例
```bash
# 查询逾期记录
GET /api/borrows?is_overdue=true&page=1&pageSize=10

# 查询借阅中记录
GET /api/borrows?status=borrowed&page=1&pageSize=10

# 查询已归还记录
GET /api/borrows?status=returned&page=1&pageSize=10
```

### 5.5 原有还书功能 [PUT /api/return] (兼容性保持)

#### 功能描述
处理图书归还请求，计算逾期罚款并恢复库存。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| borrow_id | number | 是 | 借阅记录ID | 1 |

#### 请求示例
```json
{
  "borrow_id": 1
}
```

#### 成功响应
```json
{
  "borrow_id": 1,
  "status": "returned",
  "return_date": "2024-01-20 15:45:00",
  "overdue_days": 0,
  "fine": 0
}
```

#### 逾期归还响应
```json
{
  "borrow_id": 1,
  "status": "returned",
  "return_date": "2024-01-25 15:45:00",
  "overdue_days": 2,
  "fine": 1.0
}
```
      "name": "计算机科学",
      "description": "编程、算法、数据结构等"
    },
    "metadata": {
      "cover": "javascript.jpg",
      "pages": 800,
      "language": "中文",
      "price": 99.00
    },
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  },
  "message": "获取成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "图书不存在",
    "details": {
      "bookId": 999
    }
  },
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### 2.3 获取图书分类列表 [GET /api/books/categories]

#### 功能描述
获取所有图书分类列表。

#### 成功响应
```json
{
  "success": true,
  "data": [
    {
      "categoryId": 1,
      "name": "计算机科学",
      "description": "编程、算法、数据结构等"
    },
    {
      "categoryId": 2,
      "name": "文学小说",
      "description": "小说、散文、诗歌等"
    },
    {
      "categoryId": 3,
      "name": "历史",
      "description": "中国历史、世界历史等"
    }
  ],
  "message": "获取成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

## 3. 借阅管理接口

### 3.1 图书借阅 [POST /api/borrow]

#### 功能描述
处理图书借阅请求，包含库存检查、读者权限验证等。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| readerId | number | 是 | 读者ID | 1 |
| bookId | number | 是 | 图书ID | 1 |

#### 请求示例
```json
{
  "readerId": 1,
  "bookId": 1
}
```

#### 成功响应
```json
{
  "success": true,
  "data": {
    "borrowId": 100,
    "reader": {
      "readerId": 1,
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "book": {
      "bookId": 1,
      "title": "JavaScript高级程序设计",
      "author": "Nicholas C. Zakas"
    },
    "borrowDate": "2025-01-09T10:30:00.000Z",
    "dueDate": "2025-01-23T10:30:00.000Z",
    "status": "borrowed"
  },
  "message": "借阅成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "库存不足",
    "details": {
      "bookId": 1,
      "available": 0
    }
  },
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

#### 业务错误码
| 错误码 | 说明 |
|--------|------|
| READER_NOT_FOUND | 读者不存在 |
| BOOK_NOT_FOUND | 图书不存在 |
| INSUFFICIENT_STOCK | 库存不足 |
| READER_SUSPENDED | 读者账户已暂停 |
| DUPLICATE_BORROW | 已借阅该图书 |

---

### 3.2 图书归还 [PUT /api/return]

#### 功能描述
处理图书归还请求，更新借阅状态并计算逾期罚款。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| borrowId | number | 是 | 借阅记录ID | 100 |

#### 请求示例
```json
{
  "borrowId": 100
}
```

#### 成功响应
```json
{
  "success": true,
  "data": {
    "borrowId": 100,
    "returnDate": "2025-01-15T14:30:00.000Z",
    "status": "returned",
    "fine": 0.00,
    "isOverdue": false,
    "daysOverdue": 0
  },
  "message": "归还成功",
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

#### 逾期归还响应
```json
{
  "success": true,
  "data": {
    "borrowId": 101,
    "returnDate": "2025-01-20T16:00:00.000Z",
    "status": "returned",
    "fine": 2.50,
    "isOverdue": true,
    "daysOverdue": 5
  },
  "message": "归还成功，已产生逾期费用",
  "timestamp": "2025-01-20T16:00:00.000Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "BORROW_NOT_FOUND",
    "message": "借阅记录不存在",
    "details": {
      "borrowId": 999
    }
  },
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### 3.3 查询借阅记录 [GET /api/borrows]

#### 功能描述
查询借阅记录，支持按读者、图书、状态等条件筛选。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| readerId | number | 否 | 读者ID | 1 |
| bookId | number | 否 | 图书ID | 1 |
| status | string | 否 | 借阅状态 | "borrowed" |
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页数量 | 20 |

#### 成功响应
```json
{
  "success": true,
  "data": {
    "borrows": [
      {
        "borrowId": 100,
        "reader": {
          "readerId": 1,
          "name": "张三",
          "email": "zhangsan@example.com"
        },
        "book": {
          "bookId": 1,
          "title": "JavaScript高级程序设计",
          "author": "Nicholas C. Zakas"
        },
        "borrowDate": "2025-01-01T10:00:00.000Z",
        "dueDate": "2025-01-15T10:00:00.000Z",
        "returnDate": null,
        "status": "borrowed",
        "fine": 0.00
      },
      {
        "borrowId": 101,
        "reader": {
          "readerId": 2,
          "name": "李四",
          "email": "lisi@example.com"
        },
        "book": {
          "bookId": 2,
          "title": "算法导论",
          "author": "Thomas H. Cormen"
        },
        "borrowDate": "2024-12-20T14:30:00.000Z",
        "dueDate": "2025-01-03T14:30:00.000Z",
        "returnDate": "2025-01-05T16:00:00.000Z",
        "status": "returned",
        "fine": 1.00
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  },
  "message": "查询成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

## 4. 统计分析接口

### 4.1 月度借阅统计 [GET /api/statistics/monthly]

#### 功能描述
按日统计指定时间范围内的借阅和归还数量，用于数据可视化。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| startDate | string | 否 | 开始日期 | "2025-01-01" |
| endDate | string | 否 | 结束日期 | "2025-01-31" |
| period | string | 否 | 统计周期 | "daily" |

#### 成功响应
```json
{
  "success": true,
  "data": {
    "statistics": [
      {
        "date": "2025-01-01",
        "borrows": 5,
        "returns": 3,
        "totalBorrows": 5,
        "totalReturns": 3
      },
      {
        "date": "2025-01-02",
        "borrows": 8,
        "returns": 2,
        "totalBorrows": 13,
        "totalReturns": 5
      },
      {
        "date": "2025-01-03",
        "borrows": 3,
        "returns": 7,
        "totalBorrows": 16,
        "totalReturns": 12
      }
    ],
    "summary": {
      "totalBorrows": 16,
      "totalReturns": 12,
      "period": "2025-01-01 to 2025-01-31"
    }
  },
  "message": "获取成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### 4.2 热门图书排行 [GET /api/statistics/top-books]

#### 功能描述
获取借阅次数最多的热门图书排行榜。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| limit | number | 否 | 返回数量 | 10 |
| period | string | 否 | 统计周期 | "month" |

#### 成功响应
```json
{
  "success": true,
  "data": {
    "topBooks": [
      {
        "bookId": 1,
        "title": "JavaScript高级程序设计",
        "author": "Nicholas C. Zakas",
        "category": "计算机科学",
        "borrowCount": 25,
        "available": 8,
        "stock": 10
      },
      {
        "bookId": 2,
        "title": "算法导论",
        "author": "Thomas H. Cormen",
        "category": "计算机科学",
        "borrowCount": 18,
        "available": 5,
        "stock": 5
      },
      {
        "bookId": 3,
        "title": "百年孤独",
        "author": "加西亚·马尔克斯",
        "category": "文学小说",
        "borrowCount": 15,
        "available": 8,
        "stock": 8
      }
    ],
    "period": "month"
  },
  "message": "获取成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

## 5. 读者管理接口

### 5.1 读者注册 [POST /api/readers]

#### 功能描述
注册新的读者账户。

#### 请求参数
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| name | string | 是 | 姓名 | "张三" |
| email | string | 是 | 邮箱地址 | "zhangsan@example.com" |
| phone | string | 否 | 手机号码 | "13800138001" |
| type | string | 否 | 读者类型 | "student" |

#### 请求示例
```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138001",
  "type": "student"
}
```

#### 成功响应
```json
{
  "success": true,
  "data": {
    "readerId": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138001",
    "type": "student",
    "status": "active",
    "createdAt": "2025-01-09T10:30:00.000Z"
  },
  "message": "注册成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

### 5.2 获取读者信息 [GET /api/readers/:readerId]

#### 功能描述
获取指定读者的详细信息，包括当前借阅记录。

#### 成功响应
```json
{
  "success": true,
  "data": {
    "readerId": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138001",
    "type": "student",
    "status": "active",
    "currentBorrows": [
      {
        "borrowId": 100,
        "book": {
          "bookId": 1,
          "title": "JavaScript高级程序设计"
        },
        "dueDate": "2025-01-23T10:30:00.000Z",
        "status": "borrowed"
      }
    ],
    "createdAt": "2025-01-09T10:30:00.000Z"
  },
  "message": "获取成功",
  "timestamp": "2025-01-09T10:30:00.000Z"
}
```

---

## 6. 错误处理规范

### 6.1 错误码定义

#### 系统错误码
| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| DATABASE_ERROR | 500 | 数据库操作失败 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| AUTHENTICATION_ERROR | 401 | 认证失败 |
| AUTHORIZATION_ERROR | 403 | 权限不足 |

#### 业务错误码
| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| READER_NOT_FOUND | 404 | 读者不存在 |
| BOOK_NOT_FOUND | 404 | 图书不存在 |
| CATEGORY_NOT_FOUND | 404 | 分类不存在 |
| BORROW_NOT_FOUND | 404 | 借阅记录不存在 |
| INSUFFICIENT_STOCK | 409 | 库存不足 |
| READER_SUSPENDED | 409 | 读者账户已暂停 |
| DUPLICATE_BORROW | 409 | 重复借阅 |
| DUPLICATE_EMAIL | 409 | 邮箱已注册 |
| DUPLICATE_ISBN | 409 | ISBN已存在 |

### 6.2 异常处理流程

#### 客户端处理建议
1. **参数验证**: 在客户端进行基础参数验证
2. **错误提示**: 根据错误码显示友好提示
3. **重试机制**: 网络错误可自动重试3次
4. **日志记录**: 记录关键操作的错误信息

#### 服务端处理原则
```javascript
// 错误处理中间件示例
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message || '服务器内部错误';
  
  res.status(status).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: message,
      details: error.details || null
    },
    timestamp: new Date().toISOString()
  });
});
```

---

## 7. 性能优化

### 7.1 查询优化

#### 分页查询
```sql
-- 使用MySQL 9.x的优化分页查询
SELECT b.*, c.name as category_name
FROM books b
LEFT JOIN book_categories c ON b.category_id = c.category_id
WHERE b.available > 0
ORDER BY b.book_id
LIMIT 20 OFFSET 0;
```

#### 索引使用
- **图书搜索**: 使用复合索引 `(title, author)`
- **借阅查询**: 使用索引 `(reader_id, status)`
- **库存查询**: 使用索引 `(available)`

### 7.2 缓存策略

#### 缓存层次
| 层级 | 缓存内容 | 过期时间 | 说明 |
|------|----------|----------|------|
| 数据库查询缓存 | 热门图书列表 | 5分钟 | Redis缓存 |
| 应用层缓存 | 图书详情 | 30分钟 | 内存缓存 |
| CDN缓存 | 静态资源 | 1小时 | 封面图片等 |

---

## 8. 测试示例

### 8.1 测试环境配置
```bash
# 启动测试服务器
npm run test:server

# 运行API测试
npm run test:api
```

### 8.2 测试用例示例

#### 图书搜索测试
```javascript
// 测试多条件搜索
describe('GET /api/books/search', () => {
  it('应该返回匹配的图书列表', async () => {
    const res = await request(app)
      .get('/api/books/search')
      .query({
        keyword: 'JavaScript',
        categoryId: 1,
        page: 1,
        limit: 10
      });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.books).toBeInstanceOf(Array);
    expect(res.body.data.pagination).toHaveProperty('total');
  });
});
```

#### 借阅流程测试
```javascript
// 测试完整借阅流程
describe('借阅流程测试', () => {
  let readerId, bookId;
  
  beforeAll(async () => {
    // 创建测试读者
    const reader = await createTestReader();
    readerId = reader.readerId;
    
    // 创建测试图书
    const book = await createTestBook({ stock: 5, available: 5 });
    bookId = book.bookId;
  });
  
  it('应该成功完成借阅和归还', async () => {
    // 借阅
    const borrowRes = await request(app)
      .post('/api/borrow')
      .send({ readerId, bookId });
    
    expect(borrowRes.status).toBe(201);
    expect(borrowRes.body.data.status).toBe('borrowed');
    
    // 归还
    const returnRes = await request(app)
      .put('/api/return')
      .send({ borrowId: borrowRes.body.data.borrowId });
    
    expect(returnRes.status).toBe(200);
    expect(returnRes.body.data.status).toBe('returned');
  });
});
```

---

## 9. 部署与监控

### 9.1 生产环境配置

#### 环境变量
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=library_system
DB_USER=library_user
DB_PASSWORD=secure_password

# 应用配置
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### 9.2 监控指标
| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| API响应时间 | 平均响应时间 | > 500ms |
| 错误率 | 5xx错误比例 | > 1% |
| 数据库连接数 | 活跃连接数 | > 80% |
| 缓存命中率 | Redis缓存命中率 | < 80% |

### 9.3 健康检查
```bash
# 健康检查端点
GET /api/health

# 响应示例
{
  "status": "healthy",
  "timestamp": "2025-01-09T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```