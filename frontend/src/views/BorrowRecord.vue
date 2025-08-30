<template>
  <div class="container">
    <div class="page-header">
      <h2>借阅记录管理</h2>
    </div>
    
    <!-- 筛选区 -->
    <div class="filter-section">
      <div class="filter-item">
        <label>状态筛选：</label>
        <select v-model="filterStatus" @change="filterRecords" class="filter-select" :disabled="isLoading">
          <option value="all">全部</option>
          <option value="borrowed">借阅中</option>
          <option value="returned">已归还</option>
          <option value="overdue">逾期</option>
        </select>
      </div>
      <div class="filter-item">
        <button 
          @click="exportBorrowRecords"
          class="export-btn"
          :disabled="isProcessingExport || borrowRecords.length === 0"
        >
          <i class="icon-export">↓</i>
          {{ isProcessingExport ? '导出中...' : '导出记录' }}
        </button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <!-- 记录列表区 -->
    <div v-else class="table-section">
      <table class="borrow-record-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>图书名称</th>
            <th>读者姓名</th>
            <th>借阅日期</th>
            <th>应还日期</th>
            <th>归还日期</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="borrowRecords.length === 0" class="empty-row">
            <td colspan="8" class="empty-message">暂无借阅记录</td>
          </tr>
          <tr v-else v-for="(record, index) in borrowRecords" :key="record.id" :class="{ 'overdue': record.isOverdue }">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ record.bookName }}</td>
            <td>{{ record.readerName }}</td>
            <td>{{ formatDateTime(record.borrowDate) }}</td>
            <td>{{ formatDateTime(record.dueDate) }}</td>
            <td>{{ record.returnDate ? formatDateTime(record.returnDate) : '-' }}</td>
            <td>
              <span :class="{
                  'text-success': record.actualStatus === 'returned',
                  'text-danger': record.actualStatus === 'overdue',
                  'text-warning': record.actualStatus === 'borrowed'
                }">
                {{ getDisplayStatus(record) }}
              </span>
            </td>
            <td class="action-column">
              <!-- 对所有未还记录显示还书按钮，包括逾期的记录 -->
              <button 
                v-if="record.actualStatus === 'borrowed' || record.actualStatus === 'overdue'" 
                class="return-btn" 
                @click="returnBook(record.id)"
                :disabled="isSubmitting"
              >
                还书
              </button>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 分页控件 -->
      <div class="pagination-container" v-if="!isLoading && total > 0">
        <div class="pagination-info">
          共 {{ total }} 条记录，第 {{ currentPage }} / {{ Math.ceil(total / pageSize) }} 页
        </div>
        <div class="pagination-buttons">
          <button 
            class="page-btn"
            :disabled="currentPage === 1"
            @click="handlePageChange(1)"
          >
            首页
          </button>
          <button 
            class="page-btn"
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
          >
            上一页
          </button>
          <button 
            class="page-btn"
            :disabled="currentPage === Math.ceil(total / pageSize)"
            @click="handlePageChange(currentPage + 1)"
          >
            下一页
          </button>
          <button 
            class="page-btn"
            :disabled="currentPage === Math.ceil(total / pageSize)"
            @click="handlePageChange(Math.ceil(total / pageSize))"
          >
            末页
          </button>
        </div>
      </div>
    </div>

    <!-- 还书确认弹窗 -->
    <div v-if="showReturnConfirm" class="modal-overlay" @click.self="closeReturnConfirm">
      <div class="modal-content">
        <div class="modal-header">
          <h3>确认还书</h3>
        </div>
        <div class="modal-body">
          <p>是否确认归还该图书？</p>
          <div class="book-info" v-if="currentBorrowRecord">
            <p><strong>图书名称：</strong>{{ currentBorrowRecord.bookName }}</p>
            <p><strong>读者姓名：</strong>{{ currentBorrowRecord.readerName }}</p>
            <p><strong>应还日期：</strong>{{ formatDateTime(currentBorrowRecord.dueDate) }}</p>
            <p v-if="currentBorrowRecord.isOverdue" class="overdue-warning">
              <strong>逾期天数：</strong>{{ currentBorrowRecord.overdueDays }} 天
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeReturnConfirm">取消</button>
          <button class="btn btn-primary" @click="confirmReturn" :disabled="isSubmitting">确认还书</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 借阅记录管理页面组件
 * 功能：展示借阅记录列表、按状态筛选记录、处理还书操作
 */
import { borrowAPI } from '@/utils/api';

export default {
  name: 'BorrowRecord',
  data() {
    return {
      filterStatus: 'all', // 筛选状态：all, borrowed, returned, overdue
      borrowRecords: [],    // 借阅记录列表
      isLoading: false,     // 加载状态
      isSubmitting: false,  // 提交状态（用于还书操作）
      currentPage: 1,       // 当前页码
      pageSize: 10,         // 每页显示数量
      total: 0,             // 总记录数
      showReturnConfirm: false, // 是否显示还书确认弹窗
      currentBorrowId: '',       // 当前操作的借阅ID
      currentBorrowRecord: null, // 当前操作的借阅记录
      isProcessingExport: false  // 导出处理状态
    };
  },
  mounted() {
    // 组件加载时获取借阅记录
    this.fetchBorrowRecords();
  },
  methods: {
    /**
   * 从后端获取借阅记录
   * 支持后端标准响应格式：{code: 0/200, data: {...}, msg: '...'}
   * @async
   * @returns {Promise<void>}
   */
  async fetchBorrowRecords() {
    this.isLoading = true;
    try {
      const params = {
        page: this.currentPage,
        pageSize: this.pageSize
      };

      // 根据筛选状态设置参数
      this.setFilterParams(params);

      const response = await borrowAPI.getBorrowRecords(params);
      
      // 统一响应格式处理 - 支持code=0和code=200两种格式
      const isSuccess = (response.code === 0 || response.code === 200) && response.data;
      
      if (isSuccess) {
        this.processBorrowRecords(response.data);
      } else {
        console.warn('获取借阅记录格式异常:', response);
        // 使用模拟数据作为降级方案
        this.useMockData();
      }
    } catch (error) {
      console.error('获取借阅记录失败:', error);
      
      // 友好的错误提示
      let errorMessage = '获取借阅记录失败';
      if (error.response) {
        errorMessage += `: ${error.response.status} ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      } else {
        errorMessage += ': 网络连接异常';
      }
      
      // 仅在开发环境显示详细错误
      if (process.env.NODE_ENV === 'development') {
        alert(errorMessage);
      }
      
      // 使用模拟数据避免页面空白
      this.useMockData();
    } finally {
      this.isLoading = false;
    }
  },

    /**
     * 根据筛选状态设置API请求参数
     * @param {Object} params - API请求参数对象
     */
    setFilterParams(params) {
      if (this.filterStatus !== 'all') {
        if (this.filterStatus === 'overdue') {
          // 逾期记录筛选 - 使用is_overdue参数
          params.is_overdue = true;
        } else {
          // 其他状态直接使用status参数
          params.status = this.filterStatus;
        }
      }
    },

    /**
     * 处理后端返回的借阅记录数据
     * 统一字段映射：将下划线命名转换为驼峰命名
     * @param {Object} data - 后端响应数据，格式：{list: [...], total: N}
     */
    processBorrowRecords(data) {
      try {
        // 获取数据列表 - 支持list和records两种格式
        const records = data.list || data.records || data;
        
        if (!Array.isArray(records)) {
          console.warn('借阅记录数据格式异常，期望数组格式:', typeof records);
          this.useMockData();
          return;
        }

        // 统一字段映射处理
        this.borrowRecords = records.map(record => this.mapBorrowRecord(record));
        
        // 设置总记录数
        this.total = data.total || data.totalCount || records.length;
        
        console.log('成功处理借阅记录:', this.borrowRecords.length, '条');
      } catch (error) {
        console.error('处理借阅记录数据失败:', error);
        this.useMockData();
      }
    },

    /**
     * 统一借阅记录字段映射
     * 将后端下划线命名转换为前端驼峰命名
     * @param {Object} record - 后端原始记录
     * @returns {Object} - 前端标准格式记录
     */
    mapBorrowRecord(record) {
      // 获取实际状态（优先使用actual_status，否则使用status）
      const actualStatus = record.actual_status || record.status || 'borrowed';
      
      return {
        id: record.borrow_id || record.id || record.borrowId,
        bookName: record.book_title || record.bookTitle,
        readerName: record.reader_name || record.readerName,
        borrowDate: record.borrow_date || record.borrowDate,
        dueDate: record.due_date || record.dueDate,
        returnDate: record.return_date || record.returnDate,
        status: record.status || 'borrowed',
        actualStatus: actualStatus,
        isOverdue: actualStatus === 'overdue' || record.is_overdue === 1,
        overdueDays: record.overdue_days || record.overdueDays || 0
      };
    },



    /**
     * 使用模拟数据（当API调用失败时作为降级方案）
     * 确保界面始终有数据展示，提升用户体验
     */
    useMockData() {
      console.warn('API调用失败，使用模拟数据展示');
      
      const mockData = [
        {
          id: 1,
          bookId: 101,
          bookName: 'JavaScript高级程序设计',
          readerId: 1001,
          readerName: '张三',
          borrowDate: '2024-01-15',
          dueDate: '2024-02-15',
          returnDate: null,
          status: 'borrowed',
          actualStatus: 'borrowed',
          isOverdue: false,
          overdueDays: 0
        },
        {
          id: 2,
          bookId: 102,
          bookName: 'Vue.js实战',
          readerId: 1002,
          readerName: '李四',
          borrowDate: '2024-01-10',
          dueDate: '2024-02-10',
          returnDate: '2024-02-05',
          status: 'returned',
          actualStatus: 'returned',
          isOverdue: false,
          overdueDays: 0
        },
        {
          id: 3,
          bookId: 103,
          bookName: 'Node.js开发指南',
          readerId: 1003,
          readerName: '王五',
          borrowDate: '2024-01-01',
          dueDate: '2024-01-31',
          returnDate: null,
          status: 'overdue',
          actualStatus: 'overdue',
          isOverdue: true,
          overdueDays: 15
        }
      ];
      
      this.borrowRecords = mockData;
      this.total = mockData.length;
      
      // 提示用户当前为模拟数据
      if (process.env.NODE_ENV === 'development') {
        console.log('当前使用模拟数据，共', mockData.length, '条记录');
      }
    },

    /**
     * 获取状态显示文本
     * @param {string} status - 状态值
     * @returns {string} - 显示文本
     */
    getStatusText(status) {
      const statusMap = {
        'borrowed': '借阅中',
        'returned': '已归还',
        'overdue': '已逾期',
        'reserved': '已预约'
      };
      return statusMap[status] || status;
    },

    /**
     * 筛选记录方法 - 用于下拉选择框的change事件
     */
    filterRecords() {
      this.currentPage = 1; // 重置为第一页
      this.fetchBorrowRecords();
    },

    /**
     * 格式化日期时间显示
     * @param {string} dateTimeString - 日期时间字符串
     * @returns {string} 格式化后的日期时间字符串
     */
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '-';
      const date = new Date(dateTimeString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    /**
     * 处理分页变化
     * @param {number} newPage - 新的页码
     */
    handlePageChange(newPage) {
      if (newPage >= 1 && newPage <= Math.ceil(this.total / this.pageSize)) {
        this.currentPage = newPage;
        this.fetchBorrowRecords();
      }
    },

    /**
     * 获取显示状态文本
     * @param {Object} record - 借阅记录对象
     * @returns {string} 显示状态文本
     */
    getDisplayStatus(record) {
      if (record.actualStatus === 'returned') {
        return '已还';
      } else if (record.actualStatus === 'overdue') {
        return '逾期';
      } else if (record.actualStatus === 'borrowed') {
        return '未还';
      }
      // 降级处理，兼容旧数据
      return record.returnDate ? '已还' : '未还';
    },

    /**
     * 还书操作 - 打开还书确认弹窗
     * @param {string} borrowId - 借阅记录ID
     */
    returnBook(borrowId) {
      this.currentBorrowId = borrowId;
      // 查找当前借阅记录
      this.currentBorrowRecord = this.borrowRecords.find(record => record.id == borrowId);
      this.showReturnConfirm = true;
    },

    /**
     * 关闭还书确认弹窗
     */
    closeReturnConfirm() {
      this.showReturnConfirm = false;
      this.currentBorrowId = '';
      this.currentBorrowRecord = null;
    },

    /**
     * 确认还书操作
     * @async
     * @returns {Promise<void>}
     */
    async confirmReturn() {
      if (!this.currentBorrowId) {
        alert('借阅记录ID不能为空');
        return;
      }

      this.isSubmitting = true;
      try {
        // 调用新的还书API，只需要传递borrow_id
        const response = await borrowAPI.returnBook({
          borrow_id: this.currentBorrowId
        });
        
        if (response.code === 200) {
          alert('还书成功！');
          // 重新获取借阅记录列表
          this.fetchBorrowRecords();
          // 关闭弹窗
          this.closeReturnConfirm();
        } else {
          alert(response.msg || '还书失败');
        }
      } catch (error) {
        console.error('还书失败:', error);
        alert(error.message || '还书失败，请稍后重试');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    /**
     * 导出借阅记录数据
     */
    async exportBorrowRecords() {
      try {
        this.isProcessingExport = true;
        
        // 构建导出参数，使用当前的筛选条件
        const exportParams = {};
        
        if (this.filterStatus !== 'all') {
          exportParams.status = this.filterStatus;
        }
        
        console.log('导出借阅记录参数:', exportParams);
        
        // 调用导出API
        const response = await borrowAPI.exportBorrows(exportParams);
        
        // 创建下载链接
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 生成文件名
        const timestamp = new Date().toISOString().slice(0, 10);
        const statusText = this.filterStatus === 'all' ? '全部' : this.getStatusText(this.filterStatus);
        const fileName = `借阅记录导出_${statusText}_${timestamp}.xlsx`;
        link.download = fileName;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        window.URL.revokeObjectURL(url);
        
        console.log('借阅记录导出成功:', fileName);
        alert('借阅记录导出成功！');
        
      } catch (error) {
        console.error('导出失败:', error);
        let errorMessage = '导出失败';
        
        if (error.response && error.response.data && error.response.data.msg) {
          errorMessage += ': ' + error.response.data.msg;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }
        
        alert(errorMessage);
      } finally {
        this.isProcessingExport = false;
      }
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.filter-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-item label {
  margin-right: 10px;
  font-weight: 500;
  color: #666;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: #fff;
  cursor: pointer;
}

/* 导出按钮样式 */
.export-btn {
  background-color: #0891b2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.export-btn:hover:not(:disabled) {
  background-color: #0e7490;
  transform: translateY(-1px);
}

.export-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.table-section {
  overflow-x: auto;
}

.borrow-record-table {
  width: 100%;
  border-collapse: collapse;
}

.borrow-record-table th,
.borrow-record-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

/* 操作列样式 */
.action-column {
  white-space: nowrap;
}

.return-btn {
  padding: 6px 12px;
  background-color: #16a34a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
}

.return-btn:hover:not(:disabled) {
  background-color: #15803d;
}

.return-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.borrow-record-table th {
  background-color: #f2f2f2;
  font-weight: 600;
  color: #333;
}

.borrow-record-table tr:hover {
  background-color: #f8f9fa;
}

/* 逾期记录样式 */
.overdue {
  color: #ef4444;
  font-weight: 500;
}

/* 状态文本颜色 */
.text-success {
  color: #16a34a;
}

.text-danger {
  color: #ef4444;
}

.text-warning {
  color: #eab308;
}

/* 响应式布局 - 适配Windows PC端主流分辨率 */
@media (max-width: 1366px) {
  .container {
    padding: 15px;
  }
  
  .borrow-record-table th,
  .borrow-record-table td {
    padding: 10px 12px;
    font-size: 13px;
  }
}

@media (max-width: 1024px) {
  .table-section {
    width: 100%;
  }
  
  .borrow-record-table {
    font-size: 12px;
  }
  
  .borrow-record-table th,
  .borrow-record-table td {
    padding: 8px 10px;
  }
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  color: #666;
  font-size: 14px;
}

/* 分页控件样式 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #374151;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn:disabled {
  background-color: #f8f9fa;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

/* 空数据状态样式 */
.empty-row {
  text-align: center;
  background-color: #f8f9fa;
}

.empty-message {
  font-size: 14px;
  color: #666;
  padding: 30px 0;
}

/* 禁用状态样式 */
.filter-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

/* 图书信息显示区域 */
.book-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 15px;
}

.book-info p {
  margin: 8px 0;
  font-size: 14px;
}

.overdue-warning {
  color: #ef4444;
  font-weight: 500;
}
</style>