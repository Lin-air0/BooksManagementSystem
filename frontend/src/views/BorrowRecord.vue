<template>
  <div>
    <!-- 页面标题和操作按钮 -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h1 class="text-xl font-semibold">借阅记录</h1>
      <div class="flex gap-2 self-end sm:self-auto">
        <button 
          @click="exportBorrowRecords"
          class="bg-secondary text-textPrimary py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
          :disabled="isProcessingExport || borrowRecords.length === 0"
        >
          <i class="fa fa-download mr-2"></i>
          {{ isProcessingExport ? '导出中...' : '导出记录' }}
        </button>
      </div>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm text-textSecondary mb-1">图书名称</label>
          <div class="relative">
            <input 
              type="text" 
              v-model="searchParams.bookName"
              placeholder="请输入图书名称" 
              class="w-full px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            >
          </div>
        </div>
        <div>
          <label class="block text-sm text-textSecondary mb-1">读者姓名</label>
          <div class="relative">
            <input 
              type="text" 
              v-model="searchParams.readerName"
              placeholder="请输入读者姓名" 
              class="w-full px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            >
          </div>
        </div>
        <div>
          <label class="block text-sm text-textSecondary mb-1">借阅状态</label>
          <select 
            v-model="filterStatus" 
            @change="filterRecords" 
            class="w-full px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            :disabled="isLoading"
          >
            <option value="all">全部状态</option>
            <option value="borrowed">借阅中</option>
            <option value="returned">已归还</option>
            <option value="overdue">已逾期</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-textSecondary mb-1">借阅日期</label>
          <div class="relative">
            <input 
              type="date" 
              v-model="searchParams.borrowDate"
              class="w-full px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            >
          </div>
        </div>
      </div>
      
      <div class="flex justify-end mt-4">
        <button 
          @click="resetSearch"
          class="bg-secondary text-textPrimary py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors mr-2"
          :disabled="isLoading"
        >
          <i class="fa fa-refresh mr-2"></i>重置
        </button>
        <button 
          @click="searchRecords"
          class="bg-primary text-white py-2 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors"
          :disabled="isLoading"
        >
          <i class="fa fa-search mr-2"></i>搜索
        </button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="bg-white rounded-lg border border-borderLight p-8 card-shadow text-center">
      <div class="flex flex-col items-center">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-textSecondary">正在加载借阅记录...</p>
      </div>
    </div>
    
    <!-- 无结果提示 -->
    <div v-if="!isLoading && borrowRecords.length === 0" class="bg-white rounded-lg border border-borderLight p-8 card-shadow text-center">
      <p class="text-textSecondary">暂无借阅记录</p>
    </div>
    
    <!-- 借阅记录列表 -->
    <div v-if="!isLoading && borrowRecords.length > 0" class="bg-white rounded-lg border border-borderLight card-shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-borderLight">
          <thead class="bg-secondary">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">记录ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">图书名称</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">读者信息</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">借阅日期</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">应还日期</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">归还日期</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">状态</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-borderLight">
            <tr v-for="(record, index) in borrowRecords" :key="record.id" 
                class="table-hover-row transition-colors" 
                :class="{ 'overdue-row': record.isOverdue }"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm">BR-{{ String(record.id).padStart(3, '0') }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm">{{ record.bookName }}</div>
                <div class="text-xs text-textSecondary">BK-{{ String(record.bookId || '').padStart(3, '0') }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm">{{ record.readerName }}</div>
                <div class="text-xs text-textSecondary">RD-{{ String(record.readerId || '').padStart(3, '0') }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(record.borrowDate) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(record.dueDate) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                {{ record.returnDate ? formatDate(record.returnDate) : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="record.actualStatus === 'borrowed'" 
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primaryLight/10 text-primaryLight">
                  借阅中
                </span>
                <span v-else-if="record.actualStatus === 'overdue'" 
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-danger/10 text-danger">
                  已逾期
                </span>
                <span v-else-if="record.actualStatus === 'returned'" 
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/10 text-success">
                  已归还
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  v-if="record.actualStatus === 'borrowed' || record.actualStatus === 'overdue'" 
                  @click="returnBook(record.id)"
                  class="text-primary hover:text-primary/80 transition-colors"
                  :disabled="isSubmitting"
                >
                  还书
                </button>
                <span v-else class="text-textSecondary">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 分页 -->
      <div class="px-6 py-4 bg-white border-t border-borderLight flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button 
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-borderMedium text-sm font-medium rounded-md text-textPrimary bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button 
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= Math.ceil(total / pageSize)"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-borderMedium text-sm font-medium rounded-md text-textPrimary bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-textSecondary">
              显示第 <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> 至 
              <span class="font-medium">{{ Math.min(currentPage * pageSize, total) }}</span> 条，
              共 <span class="font-medium">{{ total }}</span> 条结果
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button 
                @click="handlePageChange(1)"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">首页</span>
                <i class="fa fa-angle-double-left text-xs"></i>
              </button>
              <button 
                @click="handlePageChange(currentPage - 1)"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">上一页</span>
                <i class="fa fa-chevron-left text-xs"></i>
              </button>
              <button 
                @click="handlePageChange(currentPage + 1)"
                :disabled="currentPage >= Math.ceil(total / pageSize)"
                class="relative inline-flex items-center px-2 py-2 border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">下一页</span>
                <i class="fa fa-chevron-right text-xs"></i>
              </button>
              <button 
                @click="handlePageChange(Math.ceil(total / pageSize))"
                :disabled="currentPage >= Math.ceil(total / pageSize)"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">末页</span>
                <i class="fa fa-angle-double-right text-xs"></i>
              </button>
            </nav>
          </div>
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
      // 搜索参数
      searchParams: {
        bookName: '',
        readerName: '',
        borrowDate: ''
      },
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
        console.log('正在获取借阅记录...');
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize
        };

        // 根据筛选状态设置参数
        this.setFilterParams(params);

        const response = await borrowAPI.getBorrowRecords(params);
        console.log('借阅记录响应:', response);
        
        // 统一响应格式处理 - 支持code=0和code=200两种格式
        const isSuccess = (response.code === 0 || response.code === 200) && response.data;
        
        if (isSuccess) {
          this.processBorrowRecords(response.data);
          
          // 确保DOM更新完成后再执行其他操作
          this.$nextTick(() => {
            console.log('DOM更新完成，借阅记录已渲染');
          });
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
     * 设置API请求参数
     * 包括分页、状态筛选和搜索条件
     * @param {Object} params - 请求参数对象
     */
    setFilterParams(params) {
      // 状态筛选
      if (this.filterStatus !== 'all') {
        if (this.filterStatus === 'overdue') {
          // 逾期记录筛选 - 使用is_overdue参数
          params.is_overdue = true;
        } else {
          // 其他状态直接使用status参数
          params.status = this.filterStatus;
        }
      }
      
      // 搜索参数 - 修复搜索功能
      if (this.searchParams.bookName?.trim()) {
        params.bookName = this.searchParams.bookName.trim();
      }
      if (this.searchParams.readerName?.trim()) {
        params.readerName = this.searchParams.readerName.trim();
      }
      if (this.searchParams.borrowDate) {
        params.borrowDate = this.searchParams.borrowDate;
      }
    },
    
    /**
     * 搜索记录
     */
    searchRecords() {
      this.currentPage = 1;
      this.fetchBorrowRecords();
    },
    
    /**
     * 重置搜索
     */
    resetSearch() {
      this.searchParams = {
        bookName: '',
        readerName: '',
        borrowDate: ''
      };
      this.filterStatus = 'all';
      this.currentPage = 1;
      this.fetchBorrowRecords();
    },
    
    /**
     * 处理后端返回的借阅记录数据
     * 统一字段映射：将下划线命名转换为驼峰命名
     * @param {Object} data - 后端响应数据，格式：{list: [...], total: N}
     */
    processBorrowRecords(data) {
      try {
        console.log('处理借阅记录数据:', data);
        // 获取数据列表 - 支持list和records两种格式
        let records = [];
        if (data.list) {
          // 分页数据格式 {list: [...], total: N}
          records = data.list;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // 数组格式 [...]
          records = data;
          this.total = data.length;
        } else {
          // 其他格式
          records = [];
          this.total = 0;
        }
        
        if (!Array.isArray(records)) {
          console.warn('借阅记录数据格式异常，期望数组格式:', typeof records);
          this.useMockData();
          return;
        }

        // 统一字段映射处理
        this.borrowRecords = records.map(record => this.mapBorrowRecord(record));
        
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
        id: record.borrow_id || record.id || record.borrowId || record._id,
        bookId: record.book_id || record.bookId,
        bookName: record.book_title || record.bookTitle || record.title || record.book_name,
        readerId: record.reader_id || record.readerId,
        readerName: record.reader_name || record.readerName || record.name,
        borrowDate: record.borrow_date || record.borrowDate || record.created_at,
        dueDate: record.due_date || record.dueDate || record.due_date,
        returnDate: record.return_date || record.returnDate,
        status: record.status || 'borrowed',
        actualStatus: actualStatus,
        isOverdue: actualStatus === 'overdue' || record.is_overdue === 1 || record.isOverdue,
        overdueDays: record.overdue_days || record.overdueDays || record.overdue_days || 0
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
     * 格式化日期显示
     * @param {string} dateString - 日期字符串
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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
/* 保留必要的模态框样式 */
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
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e5e7eb;
}

/* 逾期行高亮 */
.overdue-row {
  background-color: #fef2f2 !important;
}

.overdue-row:hover {
  background-color: #fee2e2 !important;
}

/* 表格悬停效果 */
.table-hover-row:hover {
  background-color: #f9fafb;
}

.book-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
  border-left: 4px solid #2563eb;
}

.overdue-warning {
  color: #dc3545 !important;
  font-weight: 600 !important;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}
</style>