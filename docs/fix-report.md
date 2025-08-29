# 图书借阅和归还功能400错误修复报告

## Status
✅ **已修复** - 借阅和归还功能现在可以正常工作，API调用返回200状态码

## 问题现象
用户界面在执行借阅和归还操作时显示400错误，但测试脚本直接调用后端API却能成功执行这些操作。

## 根本原因
通过代码分析，发现了以下几个关键问题：

### 1. 前端API封装参数处理错误
在 `frontend/src/utils/api.js` 文件中，`borrowAPI.returnBook` 函数的参数处理存在问题：
```javascript
// 原代码（错误）
returnBook: (borrowId) => api.put('/return', { borrow_id: borrowId }),
```
当组件调用 `borrowAPI.returnBook({ borrow_id: xxx })` 时，实际传递给后端的是 `{ borrow_id: { borrow_id: xxx } }`，导致参数格式错误。

### 2. 前端组件使用错误的字段名
在 `BookList.vue` 组件中：
- 显示图书信息时使用了 `name` 而不是正确的 `title` 字段
- 显示图书分类时使用了 `category` 而不是正确的 `category_name` 字段
- 借阅操作时传递了 `book_id: this.currentBook.id` 而不是正确的 `book_id: this.currentBook.book_id`

## 修复措施

### 1. 修正API参数处理
将 `borrowAPI.returnBook` 函数修改为直接传递请求体数据：
```javascript
// 修复后代码
returnBook: (data) => api.put('/return', data),
```

### 2. 修正组件中的字段名
- 将弹窗中显示的 `currentBook?.name` 和 `currentReturnBook?.name` 改为 `currentBook?.title` 和 `currentReturnBook?.title`
- 将弹窗中显示的 `currentBook?.category` 和 `currentReturnBook?.category` 改为 `currentBook?.category_name` 和 `currentReturnBook?.category_name`
- 将借阅操作中的 `book_id: this.currentBook.id` 改为 `book_id: this.currentBook.book_id`

## 验证结果
通过创建并运行 `frontend/test_fix.js` 测试脚本，验证了修复效果：
- ✅ 查询图书信息成功（返回200状态码）
- ✅ 借阅功能成功（返回200状态码，生成了借阅记录）
- ✅ 归还功能成功（返回200状态码，更新了借阅记录状态）

## 预防措施
1. 前后端团队应统一字段命名规范，避免类似的字段名不一致问题
2. 添加API参数验证和更详细的错误提示
3. 为核心功能编写自动化测试，确保功能正常运行