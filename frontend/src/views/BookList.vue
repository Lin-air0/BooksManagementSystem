<!-- 图书列表页组件 -->
<!-- 版本：v1.0.0 -->
<template>
  <div class="book-list-container">
    <h1 class="page-title">图书列表</h1>
    
    <!-- 查询条件区 -->
    <div class="search-section">
      <div class="search-form">
        <!-- 第一组查询条件：分类 + 书名 -->
        <div class="search-row">
          <div class="form-group">
            <label for="category">分类</label>
            <select id="category" v-model="searchParams.category" class="form-control">
              <option value="">全部</option>
              <option value="计算机">计算机</option>
              <option value="文学小说">文学小说</option>
              <option value="历史">历史</option>
              <option value="科学">科学</option>
              <option value="哲学">哲学</option>
              <option value="艺术">艺术</option>
              <option value="心理学">心理学</option>
              <option value="教育心理">教育心理</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="bookName">书名</label>
            <input 
              type="text" 
              id="bookName" 
              v-model="searchParams.bookName"
              placeholder="请输入书名"
              class="form-control"
            >
          </div>
        </div>
        
        <!-- 第二、三组查询条件：默认隐藏 -->
        <div v-if="showMoreConditions" class="search-row">
          <div class="form-group">
            <label for="readerType">读者类型</label>
            <select id="readerType" v-model="searchParams.readerType" class="form-control">
              <option value="">全部</option>
              <option value="学生">学生</option>
              <option value="教师">教师</option>
              <option value="普通读者">普通读者</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="author">作者</label>
            <input 
              type="text" 
              id="author" 
              v-model="searchParams.author"
              placeholder="请输入作者"
              class="form-control"
            >
          </div>
        </div>
        
        <div v-if="showMoreConditions" class="search-row">
          <div class="form-group">
            <label for="stock">库存</label>
            <input 
              type="number" 
              id="stock" 
              v-model="searchParams.stock"
              placeholder="请输入库存数量"
              class="form-control"
              min="0"
            >
          </div>
          
          <div class="form-group">
            <label for="publisher">出版社</label>
            <input 
              type="text" 
              id="publisher" 
              v-model="searchParams.publisher"
              placeholder="请输入出版社"
              class="form-control"
            >
          </div>
        </div>
        
        <!-- 按钮区域 -->
        <div class="button-group">
          <button 
            @click="searchBooks"
            class="search-button"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? '查询中...' : '查询' }}
          </button>
          <button 
            @click="toggleMoreConditions"
            class="toggle-button"
          >
            {{ showMoreConditions ? '收起' : '展开更多条件' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 结果列表区 -->
    <div class="result-section">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-container">
          <div class="loading-spinner-lg"></div>
          <p>正在加载图书数据...</p>
        </div>
      </div>
      
      <!-- 无结果提示 -->
      <div v-else-if="filteredBooks.length === 0" class="no-result">
        <p>无匹配的图书</p>
      </div>
      
      <!-- 图书列表 -->
        <table v-else class="book-table">
          <thead>
            <tr>
              <th>书名</th>
              <th>作者</th>
              <th>分类</th>
              <th>总库存</th>
              <th>可借数量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in filteredBooks" :key="book.book_id">
              <td>{{ book.title }}</td>
              <td>{{ book.author }}</td>
              <td>{{ book.category_name }}</td>
              <td>{{ book.stock }}</td>
              <td>{{ book.available }}</td>
              <td>
                <button 
                  @click="borrowBook(book)"
                  class="borrow-button"
                  :disabled="book.available <= 0"
                  :title="book.available <= 0 ? '库存不足' : '点击借阅'"
                >
                  借阅
                </button>
                <!-- 移除还书按钮 - 还书功能应在借阅记录页面处理 -->
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 分页控件 -->
        <div class="pagination-container">
          <div class="pagination-info">
            共 {{ pagination.total }} 条记录，当前第 {{ pagination.currentPage }} 页
          </div>
          <div class="pagination-controls">
            <button
              @click="changePage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="pagination-button"
            >
              上一页
            </button>
            <div class="page-numbers">
              <button
                v-for="page in pageNumbers"
                :key="page"
                @click="changePage(page)"
                :class="{ 'active': page === pagination.currentPage }"
                class="page-button"
              >
                {{ page }}
              </button>
            </div>
            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage >= totalPages"
              class="pagination-button"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    
    <!-- 借阅确认弹窗 -->
    <div v-if="isBorrowModalVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>借阅确认</h3>
          <button @click="closeBorrowModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <p>您确定要借阅以下图书吗？</p>
          <p><strong>书名：</strong>{{ currentBook?.title }}</p>
          <p><strong>作者：</strong>{{ currentBook?.author }}</p>
          <p><strong>分类：</strong>{{ currentBook?.category_name }}</p>
          <div class="form-group">
            <label for="readerId">读者ID</label>
            <input 
              type="text" 
              id="readerId" 
              v-model="readerId"
              placeholder="请输入您的读者ID"
              class="form-control"
              required
            >
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeBorrowModal" class="cancel-button">取消</button>
          <button 
            @click="confirmBorrow"
            class="confirm-button"
            :disabled="!readerId.trim()"
          >
            确认借阅
          </button>
        </div>
      </div>
    </div>
    
    <!-- 移除还书相关弹窗 - 还书功能应在借阅记录页面处理 -->
  </div>
</template>

<script>
import { bookAPI, borrowAPI } from '@/utils/api';

export default {
  name: 'BookList',
  data() {
    return {
      // 搜索参数
      searchParams: {
        category: '',
        bookName: '',
        readerType: '',
        author: '',
        stock: '',
        publisher: ''
      },
      // 是否显示更多查询条件
      showMoreConditions: false,
      // 过滤后的图书列表
      filteredBooks: [],
      // 加载状态
      isLoading: false,
      // 分页参数
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      // 借阅弹窗状态
      isBorrowModalVisible: false,
      // 当前选中的借阅图书
      currentBook: null,
      // 读者ID输入
      readerId: '',
      // 移除还书相关状态 - 还书功能应在借阅记录页面处理
    };
  },
  
  // 组件加载时初始化数据
  mounted() {
    // 初始加载全部图书
    this.fetchBooks();
  },
  
  computed: {
    // 总页数计算
    totalPages() {
      return Math.ceil(this.pagination.total / this.pagination.pageSize);
    },
    
    // 生成分页数字
    pageNumbers() {
      const pages = [];
      const total = this.totalPages;
      const current = this.pagination.currentPage;
      
      // 显示当前页前后各2页，以及第一页和最后一页
      if (total <= 5) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        
        if (current > 3) {
          pages.push('...');
        }
        
        const start = Math.max(2, current - 2);
        const end = Math.min(total - 1, current + 2);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        if (current < total - 2) {
          pages.push('...');
        }
        
        pages.push(total);
      }
      
      return pages;
    }
  },
  
  methods: {
    /**
     * 使用模拟数据避免页面空白
     */
    useMockData() {
      this.filteredBooks = [
        {
          book_id: 'B001',
          title: 'JavaScript高级程序设计',
          author: 'Nicholas C. Zakas',
          category_name: '编程',
          stock: 10,
          available: 8,
          isbn: '9787115275790'
        },
        {
          book_id: 'B002',
          title: '算法导论',
          author: 'Thomas H. Cormen',
          category_name: '计算机',
          stock: 5,
          available: 3,
          isbn: '9787111407010'
        },
        {
          book_id: 'B003',
          title: '深入理解计算机系统',
          author: 'Randal E. Bryant',
          category_name: '计算机',
          stock: 8,
          available: 6,
          isbn: '9787111321330'
        }
      ];
      this.pagination.total = this.filteredBooks.length;
    },

    // 移除loadCurrentBorrows方法 - 借阅记录管理应在BorrowRecord.vue中处理
    
    /**
     * 切换页码
     */
    changePage(page) {
      if (page === '...') return;
      
      if (page >= 1 && page <= this.totalPages) {
        this.pagination.currentPage = page;
        this.fetchBooks();
      }
    },
    
    /**
     * 获取图书列表 - 参考读者管理界面的成功模式
     * 支持后端标准响应格式：{code: 0/200, data: {...}, msg: '...'}
     */
    async fetchBooks() {
      this.isLoading = true;
      try {
        // 构建查询参数 - 使用后端期望的参数名
        const params = {
          page: this.pagination.currentPage,
          pageSize: this.pagination.pageSize,
          ...this.searchParams
        };

        // 清理空值参数
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key];
          }
        });

        // 字段映射 - 将前端参数名转换为后端参数名
        if (params.bookName) {
          params.keyword = params.bookName.trim();
          delete params.bookName;
        }
        if (params.author) params.author = params.author.trim();
        if (params.publisher) params.publisher = params.publisher.trim();
        if (params.category) params.category = params.category;
        if (params.stock && !isNaN(params.stock)) {
          params.stock = Number(params.stock);
        } else {
          delete params.stock;
        }

        console.log('获取图书列表，参数:', params);
        
        // 调用API获取图书数据
        const response = await bookAPI.getBooks(params);
        
        // 统一响应格式处理 - 支持code=0和code=200两种格式
        const isSuccess = (response.code === 0 || response.code === 200) && response.data;
        
        if (isSuccess) {
          // 标准化字段映射 - 将后端字段映射到前端需要的格式
          const bookList = response.data.list || response.data.books || [];
          this.filteredBooks = bookList.map(book => ({
            id: book.book_id,           // 后端book_id -> 前端id
            title: book.title,          // 后端title -> 前端title
            author: book.author,        // 后端author -> 前端author
            category_name: book.category_name, // 后端category_name -> 前端category_name
            stock: book.stock,          // 后端stock -> 前端stock
            available: book.available   // 后端available -> 前端available
          }));
          
          this.pagination.total = response.data.total || 0;
          
          console.log('成功获取图书数据:', {
            books: this.filteredBooks.length,
            total: this.pagination.total,
            sample: this.filteredBooks[0]
          });
        } else {
          console.warn('获取图书数据格式异常:', response);
          // 使用模拟数据作为降级方案
          this.useMockData();
        }
      } catch (error) {
        console.error('获取图书列表失败:', error);
        
        // 友好的错误提示
        let errorMessage = '获取图书列表失败';
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
     * 使用模拟数据作为降级方案
     */
    useMockData() {
      this.filteredBooks = [
        {
          id: 1,
          title: 'JavaScript高级程序设计',
          author: 'Nicholas C. Zakas',
          category_name: '计算机',
          stock: 10,
          available: 8
        },
        {
          id: 2,
          title: '算法导论',
          author: 'Thomas H. Cormen',
          category_name: '计算机',
          stock: 5,
          available: 3
        },
        {
          id: 3,
          title: '红楼梦',
          author: '曹雪芹',
          category_name: '文学小说',
          stock: 20,
          available: 15
        }
      ];
      this.pagination.total = this.filteredBooks.length;
    },

    /**
     * 搜索按钮触发
     */
    searchBooks() {
      this.pagination.currentPage = 1;
      this.fetchBooks();
    },
    
    /**
     * 切换更多查询条件的显示/隐藏
     */
    toggleMoreConditions() {
      this.showMoreConditions = !this.showMoreConditions;
    },
    
    /**
     * 打开借阅确认弹窗
     * @param {Object} book - 要借阅的图书信息
     */
    borrowBook(book) {
      // 使用available字段而非stock进行库存校验（与后端逻辑一致）
      if (book.available <= 0) {
        alert('该图书库存不足，无法借阅');
        return;
      }
      
      this.currentBook = book;
      this.readerId = '';
      this.isBorrowModalVisible = true;
      
      console.log('准备借阅图书:', book);
    },
    
    /**
     * 关闭借阅确认弹窗
     */
    closeBorrowModal() {
      this.isBorrowModalVisible = false;
      this.currentBook = null;
      this.readerId = '';
    },
    
    /**
     * 确认借阅操作 - 简化前端逻辑，由后端处理业务规则
     */
    async confirmBorrow() {
      if (!this.readerId || !this.readerId.trim()) {
        alert('请输入读者ID');
        return;
      }
      
      const readerId = this.readerId.trim();
      
      try {
        // 直接调用后端借阅接口，由后端处理所有业务逻辑
        const response = await borrowAPI.borrowBook({
          book_id: this.currentBook.id,
          reader_id: readerId,
          borrow_days: 30 // 默认30天借阅期
        });
        
        if (response.code === 200 || response.code === 0) {
          const dueDate = response.data?.due_date || '30天后';
          alert(`借阅成功！请在${dueDate}前归还`);
          this.closeBorrowModal();
          this.fetchBooks(); // 重新获取图书列表更新库存
        } else {
          // 后端返回的具体错误信息
          alert(response.msg || '借阅失败');
        }
      } catch (error) {
        console.error('借阅失败:', error);
        alert('网络错误，请稍后重试');
      }
    },
    
    // 移除还书相关方法 - 还书功能应在BorrowRecord.vue中处理
  }
};


</script>

<style scoped>
.book-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.search-section {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.search-button {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.search-button:hover {
  background-color: #1d4ed8;
}

.search-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.toggle-button {
  background-color: #f3f4f6;
  color: #333;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-button:hover {
  background-color: #e5e7eb;
}

.result-section {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-container {
  text-align: center;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

.loading-spinner-lg {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(37, 99, 235, 0.3);
  border-radius: 50%;
  border-top-color: #2563eb;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
  margin-left: auto;
  margin-right: auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 无结果提示样式 */
.no-result {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #6b7280;
  font-size: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.book-table {
  width: 100%;
  border-collapse: collapse;
  flex-grow: 1;
}

.book-table th,
.book-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.book-table th {
  background-color: #f3f4f6;
  font-weight: 500;
  color: #333;
}

.borrow-button {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
}

.return-button {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.return-button:hover {
  background-color: #059669;
}

.borrow-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.borrow-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* 借阅弹窗样式 */
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
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #6b7280;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin-bottom: 10px;
  color: #4b5563;
}

.modal-body .form-group {
  margin-top: 20px;
  width: 100%;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-button {
  background-color: #f3f4f6;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-button:hover {
  background-color: #e5e7eb;
}

.confirm-button {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.confirm-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.confirm-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
  }
  
  .form-group {
    min-width: 100%;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .book-table {
    display: block;
    overflow-x: auto;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>