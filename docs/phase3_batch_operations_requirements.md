# 第3阶段批量操作功能需求分析

## 📋 功能概述

第3阶段的目标是实现P2级管理功能增强，提升批量操作效率。主要包含两大功能模块：
1. **批量操作功能**：批量删除图书、批量修改分类
2. **数据导入导出功能**：Excel格式的图书和读者数据导入导出

## 🎯 批量操作功能设计

### 1. 批量删除图书

#### 业务需求
- **用户场景**：图书管理员需要批量清理过期图书、损坏图书或重复图书
- **操作流程**：选择多本图书 → 确认删除 → 执行批量删除
- **安全考虑**：删除前检查是否有未归还的借阅记录

#### API设计
```javascript
// 批量删除图书API
DELETE /api/books/batch
Content-Type: application/json

// 请求体
{
  "book_ids": [1, 2, 3, 15, 27]  // 要删除的图书ID数组
}

// 成功响应
{
  "code": 200,
  "data": {
    "deleted_count": 5,           // 成功删除的数量
    "failed_items": [],           // 删除失败的项目
    "details": {
      "total_requested": 5,       // 请求删除的总数
      "successful": 5,            // 成功删除的数量
      "failed": 0                 // 失败数量
    }
  },
  "msg": "批量删除成功"
}

// 部分成功响应
{
  "code": 200,
  "data": {
    "deleted_count": 3,
    "failed_items": [
      {
        "book_id": 2,
        "reason": "图书正在被借阅，无法删除",
        "borrow_count": 1
      },
      {
        "book_id": 15,
        "reason": "图书不存在"
      }
    ],
    "details": {
      "total_requested": 5,
      "successful": 3,
      "failed": 2
    }
  },
  "msg": "部分删除成功"
}
```

#### 业务逻辑
1. **参数验证**：检查book_ids数组是否有效、非空
2. **权限检查**：验证用户是否有删除权限（预留）
3. **借阅状态检查**：检查图书是否有未归还的借阅记录
4. **事务处理**：使用数据库事务确保数据一致性
5. **级联处理**：删除图书时处理相关的借阅历史记录（可选）

### 2. 批量修改分类

#### 业务需求
- **用户场景**：图书分类调整，需要将多本图书重新分类
- **操作流程**：选择多本图书 → 选择新分类 → 确认修改 → 执行批量更新
- **业务规则**：新分类必须存在，支持移动到已有分类

#### API设计
```javascript
// 批量修改分类API
PATCH /api/books/batch/category
Content-Type: application/json

// 请求体
{
  "book_ids": [1, 3, 8, 12],     // 要修改的图书ID数组
  "new_category_id": 5           // 新的分类ID
}

// 成功响应
{
  "code": 200,
  "data": {
    "updated_count": 4,
    "failed_items": [],
    "category_info": {
      "category_id": 5,
      "category_name": "计算机科学"
    },
    "details": {
      "total_requested": 4,
      "successful": 4,
      "failed": 0
    }
  },
  "msg": "批量修改分类成功"
}

// 部分成功响应
{
  "code": 200,
  "data": {
    "updated_count": 3,
    "failed_items": [
      {
        "book_id": 12,
        "reason": "图书不存在"
      }
    ],
    "category_info": {
      "category_id": 5,
      "category_name": "计算机科学"
    },
    "details": {
      "total_requested": 4,
      "successful": 3,
      "failed": 1
    }
  },
  "msg": "部分修改成功"
}
```

#### 业务逻辑
1. **参数验证**：检查book_ids和new_category_id的有效性
2. **分类存在性验证**：确认新分类ID存在于book_categories表
3. **图书存在性检查**：验证每个book_id都存在
4. **批量更新**：使用SQL IN语句进行批量更新
5. **统计反馈**：返回成功和失败的详细信息

## 🔄 前端交互设计

### 1. 图书列表页面增强

#### 新增UI组件
```html
<!-- 批量操作工具栏 -->
<div class="batch-operations-toolbar" v-show="selectedBooks.length > 0">
  <div class="selected-info">
    已选择 {{ selectedBooks.length }} 本图书
  </div>
  <div class="batch-buttons">
    <button class="batch-delete-btn" @click="showBatchDeleteConfirm">
      批量删除
    </button>
    <button class="batch-category-btn" @click="showBatchCategoryDialog">
      修改分类
    </button>
    <button class="cancel-selection-btn" @click="clearSelection">
      取消选择
    </button>
  </div>
</div>

<!-- 表格头部全选 -->
<thead>
  <tr>
    <th>
      <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
    </th>
    <th>书名</th>
    <th>作者</th>
    <!-- ... 其他列 -->
  </tr>
</thead>

<!-- 表格行复选框 -->
<tbody>
  <tr v-for="book in filteredBooks" :key="book.book_id">
    <td>
      <input 
        type="checkbox" 
        :value="book.book_id" 
        v-model="selectedBooks"
        :disabled="book.available < book.stock"
      >
    </td>
    <!-- ... 其他列 -->
  </tr>
</tbody>
```

#### 数据状态管理
```javascript
data() {
  return {
    // ... 现有数据
    // 批量操作相关状态
    selectedBooks: [],              // 选中的图书ID数组
    selectAll: false,              // 全选状态
    showBatchDeleteModal: false,   // 批量删除确认弹窗
    showBatchCategoryModal: false, // 批量分类修改弹窗
    batchCategories: [],           // 分类选项
    selectedCategoryId: null,      // 选中的新分类ID
  }
}
```

### 2. 批量操作确认弹窗

#### 删除确认弹窗
```html
<!-- 批量删除确认弹窗 -->
<div v-if="showBatchDeleteModal" class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h3>确认批量删除</h3>
    </div>
    <div class="modal-body">
      <p>您确定要删除选中的 {{ selectedBooks.length }} 本图书吗？</p>
      <div class="warning-message">
        <i class="warning-icon">⚠️</i>
        删除后无法恢复，请谨慎操作！
      </div>
      <div class="selected-books-preview">
        <h4>将要删除的图书：</h4>
        <ul>
          <li v-for="book in getSelectedBooksInfo()" :key="book.book_id">
            {{ book.title }} - {{ book.author }}
          </li>
        </ul>
      </div>
    </div>
    <div class="modal-footer">
      <button @click="closeBatchDeleteModal" class="cancel-button">取消</button>
      <button @click="confirmBatchDelete" class="danger-button">确认删除</button>
    </div>
  </div>
</div>
```

#### 分类修改弹窗
```html
<!-- 批量分类修改弹窗 -->
<div v-if="showBatchCategoryModal" class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h3>批量修改分类</h3>
    </div>
    <div class="modal-body">
      <p>为选中的 {{ selectedBooks.length }} 本图书指定新分类：</p>
      <div class="form-group">
        <label for="newCategory">选择新分类：</label>
        <select id="newCategory" v-model="selectedCategoryId" class="form-control">
          <option value="">请选择分类</option>
          <option 
            v-for="category in batchCategories" 
            :key="category.category_id" 
            :value="category.category_id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button @click="closeBatchCategoryModal" class="cancel-button">取消</button>
      <button 
        @click="confirmBatchCategoryUpdate" 
        class="confirm-button"
        :disabled="!selectedCategoryId"
      >
        确认修改
      </button>
    </div>
  </div>
</div>
```

## 🛠️ 技术实现要点

### 1. 后端实现关键点

#### 数据库事务处理
```javascript
// 批量删除事务示例
async function batchDeleteBooks(bookIds) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. 检查借阅状态
    const borrowCheckSql = `
      SELECT book_id, COUNT(*) as active_borrows 
      FROM borrows 
      WHERE book_id IN (${bookIds.map(() => '?').join(',')}) 
      AND return_date IS NULL 
      GROUP BY book_id
    `;
    const activeborrows = await connection.execute(borrowCheckSql, bookIds);
    
    // 2. 分离可删除和不可删除的图书
    const blockedBooks = activeborrows[0].map(row => row.book_id);
    const deletableBooks = bookIds.filter(id => !blockedBooks.includes(id));
    
    // 3. 执行批量删除
    if (deletableBooks.length > 0) {
      const deleteSql = `DELETE FROM books WHERE book_id IN (${deletableBooks.map(() => '?').join(',')})`;
      await connection.execute(deleteSql, deletableBooks);
    }
    
    await connection.commit();
    return {
      deleted_count: deletableBooks.length,
      failed_items: blockedBooks.map(id => ({
        book_id: id,
        reason: "图书正在被借阅，无法删除"
      }))
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

#### 参数验证中间件
```javascript
// 批量操作参数验证
function validateBatchRequest(req, res, next) {
  const { book_ids } = req.body;
  
  // 检查参数格式
  if (!Array.isArray(book_ids) || book_ids.length === 0) {
    return res.status(400).json({
      code: 400,
      data: null,
      msg: 'book_ids必须是非空数组'
    });
  }
  
  // 检查数组长度限制
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
  
  next();
}
```

### 2. 前端实现关键点

#### 全选功能实现
```javascript
methods: {
  // 切换全选状态
  toggleSelectAll() {
    if (this.selectAll) {
      // 全选：选择当前页面所有可选的图书
      this.selectedBooks = this.filteredBooks
        .filter(book => book.available === book.stock) // 只选择可删除的图书
        .map(book => book.book_id);
    } else {
      // 取消全选
      this.selectedBooks = [];
    }
  },
  
  // 监听单个选择变化，更新全选状态
  updateSelectAllState() {
    const selectableBooks = this.filteredBooks.filter(book => book.available === book.stock);
    this.selectAll = selectableBooks.length > 0 && 
                    selectableBooks.every(book => this.selectedBooks.includes(book.book_id));
  }
}

watch: {
  selectedBooks: {
    handler() {
      this.updateSelectAllState();
    },
    deep: true
  }
}
```

#### 批量操作结果处理
```javascript
// 批量删除结果处理
async handleBatchDeleteResult(response) {
  if (response.code === 200) {
    const { deleted_count, failed_items } = response.data;
    
    if (failed_items.length === 0) {
      // 全部成功
      this.$message.success(`成功删除 ${deleted_count} 本图书`);
    } else {
      // 部分成功
      const successMessage = `成功删除 ${deleted_count} 本图书`;
      const failureMessage = `${failed_items.length} 本图书删除失败`;
      this.$message.warning(`${successMessage}，${failureMessage}`);
      
      // 显示失败详情
      this.showFailureDetails(failed_items);
    }
    
    // 清除选择并刷新列表
    this.clearSelection();
    this.fetchBooks();
  }
}
```

## 📊 数据库索引优化

为了提高批量操作的性能，需要确保相关字段有适当的索引：

```sql
-- 图书表相关索引
ALTER TABLE books ADD INDEX idx_category_id (category_id);
ALTER TABLE books ADD INDEX idx_title_author (title, author);

-- 借阅表相关索引
ALTER TABLE borrows ADD INDEX idx_book_return (book_id, return_date);
ALTER TABLE borrows ADD INDEX idx_status_book (status, book_id);

-- 分类表索引
ALTER TABLE book_categories ADD INDEX idx_name (name);
```

## 🔐 安全考虑

### 1. 权限控制
- 批量操作需要管理员权限
- 记录操作日志用于审计
- 限制单次批量操作的数量

### 2. 数据完整性
- 使用数据库事务确保操作原子性
- 删除前检查外键约束
- 提供操作回滚机制（预留）

### 3. 性能保护
- 限制批量操作的最大数量（建议100个）
- 使用连接池避免数据库连接耗尽
- 实现操作超时控制

## 📝 测试用例设计

### 1. 批量删除测试用例
- 正常批量删除（5本图书，无借阅记录）
- 部分删除失败（有图书正在被借阅）
- 边界测试（删除1本图书、删除100本图书）
- 异常测试（无效ID、空数组、超长数组）

### 2. 批量分类修改测试用例
- 正常批量分类修改
- 分类不存在的错误情况
- 部分图书不存在的情况
- 分类ID格式错误测试

这个需求分析为第3阶段的开发提供了清晰的技术方案和实现路径。接下来将按照这个设计开始具体的API开发工作。