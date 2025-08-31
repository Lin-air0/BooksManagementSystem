<!-- 图书列表页组件 -->
<!-- 版本：v1.0.0 -->
<template>
  <div>
    <!-- 页面标题和操作按钮 -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    <h1 class="text-xl font-semibold">图书管理</h1>
    <button class="bg-primary text-white py-2 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors self-end sm:self-auto" @click="showAddBookModal">
      <i class="fa fa-plus mr-2"></i>添加图书
    </button>
  </div>
  
  <!-- 搜索和筛选区域 -->
  <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow mb-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <label class="block text-sm text-textSecondary mb-1">图书分类</label>
        <select 
          v-model="searchParams.category"
          class="w-full px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        >
          <option value="">全部分类</option>
          <option value="计算机">计算机科学</option>
          <option value="文学小说">文学</option>
          <option value="历史">历史</option>
          <option value="哲学">哲学</option>
          <option value="艺术">艺术</option>
          <option value="心理学">心理学</option>
        </select>
      </div>
      <div>
        <label class="block text-sm text-textSecondary mb-1">图书状态</label>
        <select 
          v-model="searchParams.stock"
          class="w-full px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        >
          <option value="">全部状态</option>
          <option value="available">可借阅</option>
          <option value="borrowed">已借出</option>
          <option value="maintenance">维护中</option>
        </select>
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
        @click="searchBooks"
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
      <p class="text-textSecondary">正在加载图书数据...</p>
    </div>
  </div>
  
  <!-- 无结果提示 -->
  <div v-if="!isLoading && filteredBooks.length === 0" class="bg-white rounded-lg border border-borderLight p-8 card-shadow text-center">
    <p class="text-textSecondary">无匹配的图书</p>
  </div>
  
  <!-- 操作工具栏（导入和导出功能） -->
  <div v-if="!isLoading && filteredBooks.length > 0" class="flex justify-between items-center mb-4">
    <div class="text-sm text-textSecondary">
      找到 <strong>{{ pagination.total }}</strong> 本图书，当前显示第 
      <strong>{{ (pagination.currentPage - 1) * pagination.pageSize + 1 }}</strong> - 
      <strong>{{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }}</strong> 本
      ，可借图书：<strong class="text-success">{{ getAvailableCount() }}</strong> 本
    </div>
    <div class="flex gap-2">
      <button 
        @click="exportBooks"
        class="bg-secondary text-textPrimary py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
        :disabled="isProcessingExport || filteredBooks.length === 0"
      >
        <i class="fa fa-download mr-2"></i>
        {{ isProcessingExport ? '导出中...' : '导出图书' }}
      </button>
      <button 
        @click="showImportDialog"
        class="bg-secondary text-textPrimary py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
        :disabled="isProcessingImport"
      >
        <i class="fa fa-upload mr-2"></i>
        {{ isProcessingImport ? '导入中...' : '导入图书' }}
      </button>
    </div>
  </div>
  
  <!-- 批量操作工具栏 -->
  <div v-if="selectedBooks.length > 0" class="bg-primaryLight/10 border border-primaryLight rounded-lg p-4 mb-4">
    <div class="flex justify-between items-center">
      <div class="text-sm text-primary">
        已选择 <strong>{{ selectedBooks.length }}</strong> 本图书
      </div>
      <div class="flex gap-2">
        <button 
          @click="showBatchDeleteConfirm"
          class="bg-danger text-white py-2 px-4 rounded-md font-medium hover:bg-danger/90 transition-colors"
          :disabled="isProcessingBatch"
        >
          {{ isProcessingBatch ? '处理中...' : '批量删除' }}
        </button>
        <button 
          @click="showBatchCategoryDialog"
          class="bg-primaryLight text-white py-2 px-4 rounded-md font-medium hover:bg-primaryLight/90 transition-colors"
          :disabled="isProcessingBatch"
        >
          修改分类
        </button>
        <button 
          @click="clearSelection"
          class="bg-secondary text-textPrimary py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
        >
          取消选择
        </button>
      </div>
    </div>
  </div>
  
  <!-- 图书列表 -->
  <div v-if="!isLoading && filteredBooks.length > 0" class="bg-white rounded-lg border border-borderLight card-shadow overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-borderLight">
        <thead class="bg-secondary">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">
              <input 
                type="checkbox" 
                v-model="selectAll"
                @change="toggleSelectAll"
                :disabled="isLoading || !hasSelectableBooks"
                class="rounded border-borderMedium"
              >
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">ID</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">图书名称</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">作者</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">分类</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">出版社</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">ISBN</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">状态</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-borderLight">
          <tr v-for="book in filteredBooks" :key="book.book_id" class="table-hover-row transition-colors" :class="{ 'bg-primary/5': selectedBooks.includes(book.book_id) }">
            <td class="px-6 py-4 whitespace-nowrap">
              <input 
                type="checkbox" 
                :value="parseInt(book.book_id)"
                v-model="selectedBooks"
                :disabled="isBookDisabled(book)"
                class="rounded border-borderMedium"
              >
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">BK-{{ String(book.book_id).padStart(3, '0') }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ book.title }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ book.author }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ book.category_name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ book.publisher || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ book.isbn || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                v-if="book.available > 0"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/10 text-success"
              >
                可借阅
              </span>
              <span 
                v-else
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-danger/10 text-danger"
              >
                已借出
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button 
                @click="borrowBook(book)"
                class="text-primary hover:text-primary/80 mr-3 transition-colors"
                :disabled="book.available <= 0"
              >
                借阅
              </button>
              <button 
                @click="viewBookDetail(book)"
                class="text-primaryLight hover:text-primaryLight/80 mr-3 transition-colors"
              >
                详情
              </button>
              <button 
                class="text-danger hover:text-danger/80 transition-colors"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 分页 -->
    <div class="px-6 py-4 bg-white border-t border-borderLight flex items-center justify-between">
      <div class="flex-1 flex justify-between sm:hidden">
        <button 
          @click="changePage(pagination.currentPage - 1)"
          :disabled="pagination.currentPage === 1"
          class="relative inline-flex items-center px-4 py-2 border border-borderMedium text-sm font-medium rounded-md text-textPrimary bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        <button 
          @click="changePage(pagination.currentPage + 1)"
          :disabled="pagination.currentPage >= totalPages"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-borderMedium text-sm font-medium rounded-md text-textPrimary bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-textSecondary">
            显示第 <span class="font-medium">{{ (pagination.currentPage - 1) * pagination.pageSize + 1 }}</span> 至 
            <span class="font-medium">{{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }}</span> 条，
            共 <span class="font-medium">{{ pagination.total }}</span> 条结果
          </p>
        </div>
        <div class="flex items-center gap-4">
          <!-- 每页条数选择 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-textSecondary">每页显示：</label>
            <select 
              v-model="pagination.pageSize" 
              @change="changePageSize" 
              class="border border-borderMedium rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              <option :value="10">10条</option>
              <option :value="20">20条</option>
              <option :value="50">50条</option>
              <option :value="100">100条</option>
            </select>
          </div>
          
          <!-- 分页按钮 -->
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button 
              @click="changePage(1)"
              :disabled="pagination.currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="sr-only">首页</span>
              <i class="fa fa-angle-double-left text-xs"></i>
            </button>
            <button 
              @click="changePage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="sr-only">上一页</span>
              <i class="fa fa-chevron-left text-xs"></i>
            </button>
            
            <!-- 页码 -->
            <span v-for="page in pageNumbers" :key="page">
              <span v-if="page === '...'" class="relative inline-flex items-center px-4 py-2 border border-borderMedium bg-white text-sm font-medium text-textSecondary">
                ...
              </span>
              <button 
                v-else
                @click="changePage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === pagination.currentPage 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-white border-borderMedium text-textPrimary hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
            </span>
            
            <button 
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage >= totalPages"
              class="relative inline-flex items-center px-2 py-2 border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="sr-only">下一页</span>
              <i class="fa fa-chevron-right text-xs"></i>
            </button>
            <button 
              @click="changePage(totalPages)"
              :disabled="pagination.currentPage >= totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="sr-only">末页</span>
              <i class="fa fa-angle-double-right text-xs"></i>
            </button>
          </nav>
          
          <!-- 页码跳转 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-textSecondary">跳转至</span>
            <input 
              type="number" 
              v-model="jumpToPage" 
              @keyup.enter="handlePageJump"
              :min="1" 
              :max="totalPages"
              class="w-16 px-2 py-1 border border-borderMedium rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              placeholder="页码"
            >
            <button 
              @click="handlePageJump" 
              class="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary/90 transition-colors"
            >
              跳转
            </button>
          </div>
        </div>
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
    
    <!-- 图书详情弹窗 -->
    <div v-if="isDetailModalVisible" class="modal-overlay">
      <div class="modal-content detail-modal">
        <div class="modal-header">
          <h3>图书详情</h3>
          <button @click="closeDetailModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body" v-if="bookDetail">
          <div class="detail-grid">
            <div class="detail-row">
              <label>书名：</label>
              <span class="detail-value">{{ bookDetail.title }}</span>
            </div>
            <div class="detail-row">
              <label>作者：</label>
              <span class="detail-value">{{ bookDetail.author }}</span>
            </div>
            <div class="detail-row">
              <label>分类：</label>
              <span class="detail-value category-tag">{{ bookDetail.category_name || '未分类' }}</span>
            </div>
            <div class="detail-row">
              <label>出版社：</label>
              <span class="detail-value">{{ bookDetail.publisher || '-' }}</span>
            </div>
            <div class="detail-row">
              <label>ISBN：</label>
              <span class="detail-value isbn-text">{{ bookDetail.isbn || '-' }}</span>
            </div>
            <div class="detail-row">
              <label>出版日期：</label>
              <span class="detail-value">{{ formatPublishDate(bookDetail.publish_date) }}</span>
            </div>
            <div class="detail-row">
              <label>库存信息：</label>
              <span class="detail-value stock-info">
                <span class="total-stock">总库存: {{ bookDetail.stock }}</span>
                <span class="separator"> | </span>
                <span class="available-stock" :class="{ 'no-stock': bookDetail.available <= 0 }">
                  可借: {{ bookDetail.available }}
                </span>
              </span>
            </div>
            <div class="detail-row" v-if="bookDetail.metadata && bookDetail.metadata.description">
              <label>描述：</label>
              <span class="detail-value description">{{ bookDetail.metadata.description }}</span>
            </div>
            <div class="detail-row">
              <label>创建时间：</label>
              <span class="detail-value">{{ formatDateTime(bookDetail.created_at) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-body" v-else>
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>正在加载图书详情...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailModal" class="cancel-button">关闭</button>
          <button 
            v-if="bookDetail && bookDetail.available > 0"
            @click="borrowBookFromDetail"
            class="confirm-button"
          >
            借阅该书
          </button>
        </div>
      </div>
    </div>
    
    <!-- 移除还书相关弹窗 - 还书功能应在借阅记录页面处理 -->
    
    <!-- 批量删除确认弹窗 -->
    <div v-if="showBatchDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>确认批量删除</h3>
        </div>
        <div class="modal-body">
          <div class="warning-message">
            <i class="warning-icon">⚠️</i>
            <p>您确定要删除选中的 {{ selectedBooks.length }} 本图书吗？</p>
            <p class="danger-text">删除后无法恢复，请谨慎操作！</p>
            <p class="info-text">
              <i class="info-icon">ℹ️</i>
              注意：正在被借阅的图书将被跳过，不会被删除
            </p>
            <p class="info-text">
              <i class="info-icon">ℹ️</i>
              删除图书将同时删除相关的已归还借阅记录
            </p>
          </div>
          <div class="selected-books-preview">
            <h4>将要删除的图书：</h4>
            <ul class="book-list">
              <li v-for="book in getSelectedBooksInfo()" :key="book.book_id" class="book-item">
                {{ book.title }} - {{ book.author }}
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeBatchDeleteModal" class="cancel-button">取消</button>
          <button 
            @click="confirmBatchDelete" 
            class="danger-button"
            :disabled="isProcessingBatch"
          >
            {{ isProcessingBatch ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 批量修改分类弹窗 -->
    <div v-if="showBatchCategoryModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>批量修改分类</h3>
        </div>
        <div class="modal-body">
          <p>为选中的 {{ selectedBooks.length }} 本图书指定新分类：</p>
          <div class="form-group">
            <label for="newCategory">选择新分类：</label>
            <select 
              id="newCategory" 
              v-model="selectedCategoryId" 
              class="form-control"
              :disabled="isLoadingCategories"
            >
              <option value="">请选择分类</option>
              <option 
                v-for="category in batchCategories" 
                :key="category.category_id" 
                :value="category.category_id"
              >
                {{ category.category_name }}
              </option>
            </select>
            <div v-if="isLoadingCategories" class="loading-text">加载分类中...</div>
          </div>
          <div class="selected-books-preview">
            <h4>将要修改的图书：</h4>
            <ul class="book-list">
              <li v-for="book in getSelectedBooksInfo()" :key="book.book_id" class="book-item">
                {{ book.title }} - 当前分类：{{ book.category_name }}
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeBatchCategoryModal" class="cancel-button">取消</button>
          <button 
            @click="confirmBatchCategoryUpdate" 
            class="confirm-button"
            :disabled="!selectedCategoryId || isProcessingBatch"
          >
            {{ isProcessingBatch ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 第3阶段新增：图书导入弹窗 -->
    <div v-if="showImportModal" class="modal-overlay">
      <div class="modal-content import-modal">
        <div class="modal-header">
          <h3>导入图书数据</h3>
          <button @click="closeImportModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="import-steps">
            <div class="step-item" :class="{ active: !importFile }">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>下载Excel模板</h4>
                <p>下载标准的图书导入模板，按格式填写数据</p>
                <button @click="downloadTemplate" class="template-btn">
                  <i class="icon-download">↓</i> 下载Excel模板
                </button>
              </div>
            </div>
            
            <div class="step-item" :class="{ active: importFile && !importPreview }">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>上传Excel文件</h4>
                <p>选择填写好数据的Excel文件（支持.xls和.xlsx格式）</p>
                <div class="file-upload-area" :class="{ 'has-file': importFile }">
                  <input 
                    type="file" 
                    ref="fileInput" 
                    @change="handleFileSelect"
                    accept=".xls,.xlsx"
                    class="file-input"
                  >
                  <div class="upload-content" @click="$refs.fileInput.click()">
                    <div v-if="!importFile" class="upload-placeholder">
                      <i class="icon-upload">↑</i>
                      <p>点击选择Excel文件</p>
                      <p class="file-hint">支持 .xls, .xlsx 格式，最大 10MB</p>
                    </div>
                    <div v-else class="file-selected">
                      <i class="icon-file">📄</i>
                      <span class="file-name">{{ importFile.name }}</span>
                      <span class="file-size">({{ formatFileSize(importFile.size) }})</span>
                      <button @click.stop="clearFile" class="clear-file-btn">&times;</button>
                    </div>
                  </div>
                </div>
                <button 
                  v-if="importFile && !importPreview" 
                  @click="parseImportFile" 
                  class="parse-btn"
                  :disabled="isProcessingImport"
                >
                  {{ isProcessingImport ? '解析中...' : '解析文件' }}
                </button>
              </div>
            </div>
            
            <div class="step-item" :class="{ active: importPreview }">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>数据预览与确认</h4>
                <div v-if="importPreview" class="preview-section">
                  <div class="preview-summary">
                    <p>解析成功！共发现 <strong>{{ importPreview.validCount }}</strong> 条有效数据</p>
                    <div v-if="importPreview.errors && importPreview.errors.length > 0" class="preview-errors">
                      <h5>数据验证错误：</h5>
                      <ul>
                        <li v-for="(error, index) in importPreview.errors" :key="index" class="error-item">
                          {{ error }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div class="preview-table" v-if="importPreview.sample && importPreview.sample.length > 0">
                    <h5>数据预览（前5条）：</h5>
                    <table class="sample-table">
                      <thead>
                        <tr>
                          <th>书名</th>
                          <th>作者</th>
                          <th>分类</th>
                          <th>出版社</th>
                          <th>ISBN</th>
                          <th>库存</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(book, index) in importPreview.sample" :key="index">
                          <td>{{ book.title }}</td>
                          <td>{{ book.author }}</td>
                          <td>{{ book.category_name }}</td>
                          <td>{{ book.publisher }}</td>
                          <td>{{ book.isbn }}</td>
                          <td>{{ book.stock }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeImportModal" class="cancel-button">取消</button>
          <button 
            v-if="importPreview && importPreview.validCount > 0"
            @click="confirmImport" 
            class="confirm-button"
            :disabled="isProcessingImport"
          >
            {{ isProcessingImport ? '导入中...' : `确认导入 ${importPreview.validCount} 条数据` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { bookAPI, borrowAPI, statisticsAPI } from '@/utils/api';
import { parseExcelFile, validateExcelData, ExcelTemplates, formatFileSize, createExcelBlob, downloadBlob } from '@/utils/excelHelper';

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
        publisher: '',
        isbn: '',
        publishYear: ''
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
      // 页码跳转输入
      jumpToPage: null,
      // 借阅弹窗状态
      isBorrowModalVisible: false,
      // 当前选中的借阅图书
      currentBook: null,
      // 读者ID输入
      readerId: '',
      // 图书详情弹窗状态
      isDetailModalVisible: false,
      // 当前查看的图书详情
      bookDetail: null,
      // 第3阶段新增：批量操作相关状态
      selectedBooks: [],                // 选中的图书ID数组
      selectAll: false,                 // 全选状态
      showBatchDeleteModal: false,      // 批量删除确认弹窗
      showBatchCategoryModal: false,    // 批量分类修改弹窗
      batchCategories: [],              // 分类选项
      selectedCategoryId: null,         // 选中的新分类ID
      isProcessingBatch: false,         // 批量操作处理中
      isLoadingCategories: false,       // 加载分类中
      // 第3阶段新增：导入相关状态
      showImportModal: false,           // 导入弹窗显示状态
      isProcessingImport: false,        // 导入处理状态
      importFile: null,                 // 选中的导入文件
      importPreview: null,              // 导入数据预览
      // 第3阶段新增：导出相关状态
      isProcessingExport: false,        // 导出处理状态
      // 添加图书相关状态
      showAddBookModal: false,          // 添加图书弹窗显示状态
      isProcessingAdd: false,           // 添加图书处理状态
      newBook: {                        // 新图书信息
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        category_id: '',
        stock: 1,
        description: ''
      },
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
    
    // 是否有可选择的图书
    hasSelectableBooks() {
      return this.filteredBooks.some(book => !this.isBookDisabled(book));
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
        // 翻页时清空当前选择，避免跨页选择的混乱
        this.clearSelection();
        
        this.pagination.currentPage = page;
        this.jumpToPage = null; // 清空跳转输入框
        this.fetchBooks();
      }
    },
    
    /**
     * 切换每页显示数量
     */
    changePageSize() {
      // 重置到第一页并清空选择
      this.clearSelection();
      this.pagination.currentPage = 1;
      this.jumpToPage = null;
      this.fetchBooks();
    },
    
    /**
     * 处理页码跳转
     */
    handlePageJump() {
      const targetPage = parseInt(this.jumpToPage);
      
      if (isNaN(targetPage)) {
        alert('请输入有效的页码');
        return;
      }
      
      if (targetPage < 1 || targetPage > this.totalPages) {
        alert(`页码范围为 1 - ${this.totalPages}`);
        return;
      }
      
      this.changePage(targetPage);
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
          params.title = params.bookName.trim(); // 后端使用title参数
          delete params.bookName;
        }
        if (params.author) params.author = params.author.trim();
        if (params.publisher) params.publisher = params.publisher.trim();
        if (params.category) params.category = params.category;
        if (params.isbn) params.isbn = params.isbn.trim();
        if (params.publishYear) params.publish_year = params.publishYear;
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
            book_id: book.book_id,      // 保持原字段用于表格显示
            title: book.title,          // 后端title -> 前端title
            author: book.author,        // 后端author -> 前端author
            category_name: book.category_name, // 后端category_name -> 前端category_name
            publisher: book.publisher,  // 新增：出版社
            isbn: book.isbn,           // 新增：ISBN
            publish_date: book.publish_date, // 新增：出版日期
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
      // 搜索时清空选择并重置到第一页
      this.clearSelection();
      this.pagination.currentPage = 1;
      this.fetchBooks();
    },
    
    /**
     * 重置搜索条件
     */
    resetSearch() {
      // 重置搜索时清空选择
      this.clearSelection();
      
      this.searchParams = {
        category: '',
        bookName: '',
        readerType: '',
        author: '',
        stock: '',
        publisher: '',
        isbn: '',
        publishYear: ''
      };
      this.pagination.currentPage = 1;
      this.fetchBooks();
    },
    
    /**
     * 获取可借图书数量
     */
    getAvailableCount() {
      return this.filteredBooks.filter(book => book.available > 0).length;
    },
    
    /**
     * 格式化出版日期
     */
    formatPublishDate(dateString) {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.getFullYear() + '年' + (date.getMonth() + 1) + '月';
      } catch (error) {
        return '-';
      }
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
    
    /**
     * 查看图书详情
     * @param {Object} book - 图书对象
     */
    async viewBookDetail(book) {
      console.log('查看图书详情:', book.title);
      
      this.bookDetail = null;
      this.isDetailModalVisible = true;
      
      try {
        // 调用API获取图书详情
        const response = await bookAPI.getBookDetail(book.book_id);
        
        if (response.code === 200 && response.data) {
          this.bookDetail = response.data;
          console.log('获取图书详情成功:', this.bookDetail.title);
        } else {
          alert('获取图书详情失败');
          this.closeDetailModal();
        }
      } catch (error) {
        console.error('获取图书详情失败:', error);
        alert('获取图书详情失败，请稍后重试');
        this.closeDetailModal();
      }
    },
    
    /**
     * 关闭图书详情弹窗
     */
    closeDetailModal() {
      this.isDetailModalVisible = false;
      this.bookDetail = null;
    },
    
    /**
     * 从详情弹窗借阅图书
     */
    borrowBookFromDetail() {
      if (this.bookDetail) {
        // 关闭详情弹窗，打开借阅弹窗
        this.closeDetailModal();
        // 将详情数据转换为借阅所需的格式
        const bookForBorrow = {
          id: this.bookDetail.book_id,
          book_id: this.bookDetail.book_id,
          title: this.bookDetail.title,
          author: this.bookDetail.author,
          category_name: this.bookDetail.category_name,
          available: this.bookDetail.available
        };
        this.borrowBook(bookForBorrow);
      }
    },
    
    /**
     * 格式化日期时间显示
     * @param {string} dateTimeString - 日期时间字符串
     * @returns {string} 格式化后的日期时间
     */
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '-';
      try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        return dateTimeString;
      }
    },
    
    // 移除还书相关方法 - 还书功能应在BorrowRecord.vue中处理
    
    // 第3阶段新增：批量操作相关方法
    
    /**
     * 切换全选状态
     */
    toggleSelectAll() {
      if (this.selectAll) {
        // 全选：选择当前页面所有可选择的图书（排除被禁用的）
        this.selectedBooks = this.filteredBooks
          .filter(book => !this.isBookDisabled(book)) // 使用统一的禁用判断逻辑
          .map(book => parseInt(book.book_id)); // 确保是数字类型
      } else {
        // 取消全选
        this.selectedBooks = [];
      }
    },
    
    /**
     * 判断图书是否被禁用选择
     * @param {Object} book - 图书对象
     * @returns {Boolean} 是否禁用
     */
    isBookDisabled(book) {
      // 仅在加载中时禁用，允许选择所有图书进行批量操作
      return this.isLoading;
    },
    
    /**
     * 监听单个选择变化，更新全选状态
     */
    updateSelectAllState() {
      const selectableBooks = this.filteredBooks.filter(book => !this.isBookDisabled(book));
      
      if (selectableBooks.length === 0) {
        // 没有可选择的图书
        this.selectAll = false;
      } else {
        // 检查所有可选择的图书是否都被选中
        this.selectAll = selectableBooks.every(book => this.selectedBooks.includes(book.book_id));
      }
    },
    
    /**
     * 获取选中图书的信息
     * @returns {Array} 选中图书的详细信息
     */
    getSelectedBooksInfo() {
      return this.filteredBooks.filter(book => this.selectedBooks.includes(book.book_id));
    },
    
    /**
     * 清除所有选择
     */
    clearSelection() {
      this.selectedBooks = [];
      this.selectAll = false;
    },
    
    /**
     * 显示批量删除确认弹窗
     */
    showBatchDeleteConfirm() {
      if (this.selectedBooks.length === 0) {
        alert('请先选择要删除的图书');
        return;
      }
      this.showBatchDeleteModal = true;
    },
    
    /**
     * 关闭批量删除弹窗
     */
    closeBatchDeleteModal() {
      this.showBatchDeleteModal = false;
    },
    
    /**
     * 确认批量删除
     */
    async confirmBatchDelete() {
      if (this.selectedBooks.length === 0) {
        alert('没有选中的图书');
        return;
      }
      
      console.log('开始批量删除操作:', {
        selectedBooks: this.selectedBooks,
        selectedBooksLength: this.selectedBooks.length,
        selectedBooksTypes: this.selectedBooks.map(id => ({ id, type: typeof id })),
        selectedBooksInfo: this.getSelectedBooksInfo()
      });
      
      this.isProcessingBatch = true;
      
      try {
        // 确保所有ID都是数字类型
        const bookIds = this.selectedBooks.map(id => {
          const numId = typeof id === 'string' ? parseInt(id) : id;
          console.log('转ID:', { original: id, originalType: typeof id, converted: numId, convertedType: typeof numId });
          return numId;
        }).filter(id => {
          const isValid = !isNaN(id) && Number.isInteger(id) && id > 0;
          if (!isValid) {
            console.warn('过滤无效ID:', id);
          }
          return isValid;
        });
        
        console.log('准备发送批量删除请求:', {
          originalSelectedBooks: this.selectedBooks,
          processedBookIds: bookIds,
          requestData: { book_ids: bookIds }
        });
        
        if (bookIds.length === 0) {
          console.error('没有有效的图书ID');
          alert('没有有效的图书ID，请重新选择');
          return;
        }
        
        const response = await bookAPI.batchDeleteBooks(bookIds);
        
        console.log('批量删除响应:', {
          response,
          responseCode: response?.code,
          responseData: response?.data,
          responseMsg: response?.msg
        });
        
        if (response.code === 200) {
          const { deleted_count, failed_items, details } = response.data;
          
          console.log('批量删除结果处理:', { deleted_count, failed_items, details });
          
          if (failed_items.length === 0) {
            // 全部成功
            alert(`成功删除 ${deleted_count} 本图书！`);
          } else if (deleted_count > 0) {
            // 部分成功
            let message = `部分成功：\n• 成功删除 ${deleted_count} 本图书\n• ${failed_items.length} 本图书删除失败\n\n失败原因：`;
            failed_items.forEach((item, index) => {
              message += `\n${index + 1}. ${item.reason}`;
            });
            alert(message);
          } else {
            // 全部失败
            let message = `批量删除失败，无任何图书被删除\n\n失败原因：`;
            failed_items.forEach((item, index) => {
              message += `\n${index + 1}. ${item.reason}`;
            });
            alert(message);
          }
          
          // 清除选择并刷新列表
          this.clearSelection();
          this.fetchBooks();
          this.closeBatchDeleteModal();
        } else {
          console.error('批量删除失败 - 后端返回错误:', response);
          alert(response.msg || '批量删除失败，请稍后重试');
        }
      } catch (error) {
        console.error('批量删除失败 - 详细错误信息:', {
          error,
          errorMessage: error.message,
          errorStack: error.stack,
          errorResponse: error.response,
          errorResponseData: error.response?.data,
          errorResponseStatus: error.response?.status
        });
        
        let errorMsg = '批量删除失败，请稍后重试';
        
        if (error.response) {
          // 服务器响应错误
          if (error.response.data && error.response.data.msg) {
            errorMsg = error.response.data.msg;
          } else if (error.response.status === 400) {
            errorMsg = '请求参数错误';
          } else if (error.response.status === 500) {
            errorMsg = '服务器内部错误';
          }
        } else if (error.request) {
          // 网络请求错误
          errorMsg = '网络连接失败，请检查网络连接';
        }
        
        alert(errorMsg + ': ' + (error.message || error));
      } finally {
        this.isProcessingBatch = false;
      }
    },
    
    /**
     * 显示批量修改分类弹窗
     */
    async showBatchCategoryDialog() {
      if (this.selectedBooks.length === 0) {
        alert('请先选择要修改的图书');
        return;
      }
      
      // 加载分类列表
      await this.loadCategories();
      this.selectedCategoryId = null;
      this.showBatchCategoryModal = true;
    },
    
    /**
     * 关闭批量修改分类弹窗
     */
    closeBatchCategoryModal() {
      this.showBatchCategoryModal = false;
      this.selectedCategoryId = null;
    },
    
    /**
     * 加载分类列表
     */
    async loadCategories() {
      if (this.batchCategories.length > 0) {
        return; // 已经加载过
      }
      
      this.isLoadingCategories = true;
      
      try {
        // 使用统计API获取分类信息，然后转换为所需格式
        const response = await statisticsAPI.getCategoriesStats();
        
        if (response.success && response.data) {
          // 将统计数据转换为分类选项格式
          // 由于统计API不返回category_id，我们需要从现有图书数据中提取分类信息
          const categorySet = new Set();
          const categoryMap = new Map();
          
          // 从当前图书列表中提取分类信息
          this.filteredBooks.forEach(book => {
            if (book.category_name && book.category_id) {
              categoryMap.set(book.category_name, book.category_id);
            }
          });
          
          // 结合统计数据和现有分类信息
          this.batchCategories = response.data
            .filter(item => categoryMap.has(item.category_name))
            .map(item => ({
              category_id: categoryMap.get(item.category_name),
              category_name: item.category_name
            }));
          
          // 如果从图书数据中获取的分类不足，添加一些默认分类
          if (this.batchCategories.length === 0) {
            this.batchCategories = [
              { category_id: 1, category_name: '计算机' },
              { category_id: 2, category_name: '文学小说' },
              { category_id: 3, category_name: '历史' },
              { category_id: 4, category_name: '科学' },
              { category_id: 5, category_name: '哲学' },
              { category_id: 6, category_name: '艺术' }
            ];
          }
          
          console.log('加载分类列表成功:', this.batchCategories.length, this.batchCategories);
        } else {
          console.warn('加载分类失败:', response);
          // 使用默认分类列表
          this.batchCategories = [
            { category_id: 1, category_name: '计算机' },
            { category_id: 2, category_name: '文学小说' },
            { category_id: 3, category_name: '历史' },
            { category_id: 4, category_name: '科学' },
            { category_id: 5, category_name: '哲学' },
            { category_id: 6, category_name: '艺术' }
          ];
        }
      } catch (error) {
        console.error('加载分类失败:', error);
        // 使用默认分类列表
        this.batchCategories = [
          { category_id: 1, category_name: '计算机' },
          { category_id: 2, category_name: '文学小说' },
          { category_id: 3, category_name: '历史' },
          { category_id: 4, category_name: '科学' },
          { category_id: 5, category_name: '哲学' },
          { category_id: 6, category_name: '艺术' }
        ];
      } finally {
        this.isLoadingCategories = false;
      }
    },
    
    /**
     * 显示添加图书弹窗
     */
    async showAddBookModal() {
      console.log('显示添加图书弹窗');
      // 加载分类列表
      await this.loadCategories();
      // 重置表单数据
      this.newBook = {
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        category_id: '',
        stock: 1,
        description: ''
      };
      this.showAddBookModal = true;
    },
    
    /**
     * 关闭添加图书弹窗
     */
    closeAddBookModal() {
      this.showAddBookModal = false;
    },
    
    /**
     * 确认添加图书
     */
    async confirmAddBook() {
      // 表单验证
      if (!this.newBook.title.trim()) {
        alert('请输入书名');
        return;
      }
      
      if (!this.newBook.author.trim()) {
        alert('请输入作者');
        return;
      }
      
      if (!this.newBook.category_id) {
        alert('请选择分类');
        return;
      }
      
      if (!this.newBook.stock || this.newBook.stock < 1) {
        alert('库存数量必须大于0');
        return;
      }
      
      this.isProcessingAdd = true;
      
      try {
        // 准备数据
        const bookData = {
          title: this.newBook.title.trim(),
          author: this.newBook.author.trim(),
          isbn: this.newBook.isbn.trim() || null,
          publisher: this.newBook.publisher.trim() || null,
          category_id: parseInt(this.newBook.category_id),
          stock: parseInt(this.newBook.stock),
          description: this.newBook.description.trim() || null
        };
        
        console.log('添加图书数据:', bookData);
        
        // 调用API添加图书
        const response = await bookAPI.addBook(bookData);
        
        if (response.code === 200) {
          alert('图书添加成功！');
          this.closeAddBookModal();
          // 刷新图书列表
          await this.fetchBooks();
        } else {
          alert('添加失败: ' + (response.msg || '未知错误'));
        }
      } catch (error) {
        console.error('添加图书失败:', error);
        alert('添加图书失败: ' + (error.message || '网络错误'));
      } finally {
        this.isProcessingAdd = false;
      }
    },

    /**
     * 显示导入对话框
     */
    showImportDialog() {
      console.log('显示导入对话框');
      // TODO: 实现导入功能
      alert('导入图书功能正在开发中...');
    },

    /**
     * 导出图书数据
     */
    async exportBooks() {
      console.log('导出图书数据');
      // TODO: 实现导出功能
      alert('导出图书功能正在开发中...');
    },

    /**
     * 确认批量修改分类
     */
    async confirmBatchCategoryUpdate() {
      if (this.selectedBooks.length === 0) {
        alert('没有选中的图书');
        return;
      }
      
      if (!this.selectedCategoryId) {
        alert('请选择新的分类');
        return;
      }
      
      this.isProcessingBatch = true;
      
      try {
        const response = await bookAPI.batchUpdateCategory(this.selectedBooks, this.selectedCategoryId);
        
        if (response.code === 200) {
          const { updated_count, failed_items, category_info } = response.data;
          
          if (failed_items.length === 0) {
            // 全部成功
            alert(`成功将 ${updated_count} 本图书修改为「${category_info.category_name}」分类`);
          } else {
            // 部分成功
            const successMessage = `成功修改 ${updated_count} 本图书的分类`;
            const failureMessage = `${failed_items.length} 本图书修改失败`;
            let detailMessage = '\n失败原因：\n';
            failed_items.forEach(item => {
              detailMessage += `- ${item.reason}\n`;
            });
            alert(`${successMessage}，${failureMessage}${detailMessage}`);
          }
          
          // 清除选择并刷新列表
          this.clearSelection();
          this.fetchBooks();
          this.closeBatchCategoryModal();
        } else {
          alert(response.msg || '批量修改分类失败');
        }
      } catch (error) {
        console.error('批量修改分类失败:', error);
        alert('批量修改分类失败，请稍后重试');
      } finally {
        this.isProcessingBatch = false;
      }
    },
    
    // 第3阶段新增：导入相关方法
    
    /**
     * 显示导入弹窗
     */
    showImportDialog() {
      this.showImportModal = true;
      this.importFile = null;
      this.importPreview = null;
    },
    
    /**
     * 关闭导入弹窗
     */
    closeImportModal() {
      this.showImportModal = false;
      this.importFile = null;
      this.importPreview = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    
    /**
     * 下载导入模板
     */
    downloadTemplate() {
      try {
        const template = ExcelTemplates.books;
        const templateData = [
          template.requiredColumns,
          ['示例图书名称', '示例作者', '计算机', '示例出版社', '9787111407010', '10'],
          ['JavaScript高级程序设计', 'Nicholas C. Zakas', '编程', '人民邮电出版社', '9787115275790', '5']
        ];
        
        const blob = createExcelBlob(templateData, { sheetName: '图书导入模板' });
        downloadBlob(blob, '图书导入模板.xlsx');
        
        alert('模板下载成功！请填写数据后上传。');
      } catch (error) {
        console.error('下载模板失败:', error);
        alert('下载模板失败，请稍后重试');
      }
    },
    
    /**
     * 处理文件选择
     */
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 清理之前的预览数据
      this.importPreview = null;
      
      // 文件类型验证
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const isValidType = validTypes.includes(file.type) || 
                         file.name.toLowerCase().endsWith('.xls') || 
                         file.name.toLowerCase().endsWith('.xlsx');
      
      if (!isValidType) {
        alert('请选择有效的Excel文件（.xls 或 .xlsx）');
        return;
      }
      
      // 文件大小验证（10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('文件大小不能超过10MB');
        return;
      }
      
      this.importFile = file;
      console.log('文件选择成功:', file.name);
    },
    
    /**
     * 清除文件选择
     */
    clearFile() {
      this.importFile = null;
      this.importPreview = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    
    /**
     * 解析导入文件
     */
    async parseImportFile() {
      if (!this.importFile) {
        alert('请先选择Excel文件');
        return;
      }
      
      this.isProcessingImport = true;
      
      try {
        // 解析Excel文件
        const excelData = await parseExcelFile(this.importFile);
        console.log('Excel解析成功:', excelData.length, '行数据');
        
        // 验证数据格式
        const template = ExcelTemplates.books;
        const validation = validateExcelData(excelData, template.requiredColumns);
        
        if (!validation.isValid) {
          alert('数据格式验证失败：\n' + validation.errors.join('\n'));
          return;
        }
        
        // 转换为对象数组
        const headers = excelData[0];
        const dataRows = excelData.slice(1);
        
        const convertedData = dataRows.map((row, index) => {
          const book = {};
          headers.forEach((header, colIndex) => {
            const fieldName = template.fieldMapping[header] || header;
            book[fieldName] = row[colIndex] || '';
          });
          book._rowIndex = index + 2; // Excel行号
          return book;
        }).filter(book => book.title && book.title.trim()); // 过滤空行
        
        // 验证数据内容
        const errors = [];
        const validBooks = [];
        
        convertedData.forEach(book => {
          const bookErrors = [];
          
          // 必填字段验证
          if (!book.title || !book.title.trim()) {
            bookErrors.push(`第${book._rowIndex}行: 书名不能为空`);
          }
          if (!book.author || !book.author.trim()) {
            bookErrors.push(`第${book._rowIndex}行: 作者不能为空`);
          }
          if (!book.category_name || !book.category_name.trim()) {
            bookErrors.push(`第${book._rowIndex}行: 分类不能为空`);
          }
          
          // 库存数量验证
          if (book.stock) {
            const stock = parseInt(book.stock);
            if (isNaN(stock) || stock < 0) {
              bookErrors.push(`第${book._rowIndex}行: 库存数量必须为非负整数`);
            } else {
              book.stock = stock;
            }
          } else {
            book.stock = 1; // 默认库存
          }
          
          if (bookErrors.length === 0) {
            validBooks.push(book);
          } else {
            errors.push(...bookErrors);
          }
        });
        
        this.importPreview = {
          validCount: validBooks.length,
          totalCount: convertedData.length,
          errors: errors,
          sample: validBooks.slice(0, 5), // 前5条数据作为预览
          data: validBooks // 完整数据
        };
        
        console.log('数据验证完成:', this.importPreview);
        
      } catch (error) {
        console.error('Excel文件解析失败:', error);
        alert('文件解析失败: ' + error.message);
      } finally {
        this.isProcessingImport = false;
      }
    },
    
    /**
     * 确认导入数据
     */
    async confirmImport() {
      if (!this.importPreview || this.importPreview.validCount === 0) {
        alert('没有有效数据可导入');
        return;
      }
      
      const confirmMessage = `确认导入 ${this.importPreview.validCount} 条图书数据吗？`;
      if (!confirm(confirmMessage)) {
        return;
      }
      
      this.isProcessingImport = true;
      
      try {
        // 准备上传数据
        const formData = new FormData();
        formData.append('excelFile', this.importFile);
        
        // 调用导入API
        const response = await bookAPI.importBooks(formData);
        
        if (response.code === 200) {
          const { success_count, failed_items, total_processed } = response.data;
          
          let message = `导入完成！\n处理总数: ${total_processed} 条\n成功导入: ${success_count} 条`;
          
          if (failed_items && failed_items.length > 0) {
            message += `\n导入失败: ${failed_items.length} 条`;
            if (failed_items.length <= 5) {
              message += '\n\n失败原因：';
              failed_items.forEach((item, index) => {
                message += `\n${index + 1}. ${item.reason}`;
              });
            }
          }
          
          alert(message);
          
          // 关闭弹窗并刷新列表
          this.closeImportModal();
          this.fetchBooks();
          
        } else {
          alert('导入失败: ' + (response.msg || '未知错误'));
        }
        
      } catch (error) {
        console.error('导入失败:', error);
        let errorMessage = '导入失败';
        
        if (error.response && error.response.data && error.response.data.msg) {
          errorMessage += ': ' + error.response.data.msg;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }
        
        alert(errorMessage);
      } finally {
        this.isProcessingImport = false;
      }
    },
    
    /**
     * 格式化文件大小显示
     */
    formatFileSize(bytes) {
      return formatFileSize(bytes);
    },
    
    /**
     * 导出图书数据
     */
    async exportBooks() {
      try {
        this.isProcessingExport = true;
        
        // 构建导出参数，使用当前的筛选条件
        const exportParams = {};
        
        if (this.searchParams.category) {
          exportParams.category = this.searchParams.category;
        }
        
        if (this.searchParams.author) {
          exportParams.author = this.searchParams.author;
        }
        
        if (this.searchParams.publisher) {
          exportParams.publisher = this.searchParams.publisher;
        }
        
        console.log('导出参数:', exportParams);
        
        // 调用导出API
        const response = await bookAPI.exportBooks(exportParams);
        
        // 创建下载链接
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 生成文件名
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `图书数据导出_${timestamp}.xlsx`;
        link.download = fileName;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        window.URL.revokeObjectURL(url);
        
        console.log('图书数据导出成功:', fileName);
        alert('图书数据导出成功！');
        
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
  },
  
  // 第3阶段新增：监听选中状态变化
  watch: {
    selectedBooks: {
      handler(newValue, oldValue) {
        // 当选中的图书发生变化时，更新全选状态
        this.$nextTick(() => {
          this.updateSelectAllState();
        });
      },
      deep: true
    },
    
    // 当图书列表发生变化时（如翻页、搜索），重新计算选择状态
    filteredBooks: {
      handler() {
        this.$nextTick(() => {
          this.updateSelectAllState();
        });
      },
      deep: true
    }
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

.reset-button {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.reset-button:hover:not(:disabled) {
  background-color: #4b5563;
}

.reset-button:disabled {
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

/* 搜索统计信息样式 */
.search-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #3b82f6;
}

.stats-text {
  color: #4b5563;
  font-size: 14px;
}

.available-stats {
  color: #059669;
  font-size: 14px;
  font-weight: 500;
}

.available-count {
  color: #059669;
  font-weight: 600;
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
  font-size: 14px;
}

.book-table th,
.book-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.book-table th {
  background-color: #f3f4f6;
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

/* 书名列样式 */
.book-title {
  font-weight: 500;
  color: #1f2937;
  max-width: 200px;
  word-wrap: break-word;
}

/* 分类标签样式 */
.category-tag {
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* ISBN显示样式 */
.isbn-cell {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #6b7280;
  max-width: 120px;
  word-break: break-all;
}

/* 库存信息样式 */
.stock-cell {
  text-align: center;
}

.stock-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.total-stock {
  color: #6b7280;
  font-weight: 500;
}

.separator {
  color: #d1d5db;
}

.available-stock {
  color: #059669;
  font-weight: 600;
  font-size: 16px;
}

.available-stock.no-stock {
  color: #ef4444;
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

/* 详情按钮样式 */
.detail-button {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 8px;
}

.detail-button:hover {
  background-color: #059669;
}

/* 详情弹窗独特样式 */
.detail-modal {
  max-width: 600px;
  width: 95%;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
  margin-right: 15px;
  margin-bottom: 0;
}

.detail-value {
  color: #6b7280;
  word-wrap: break-word;
  flex: 1;
}

.detail-value.category-tag {
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.detail-value.isbn-text {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  background-color: #f8fafc;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.detail-value.description {
  line-height: 1.6;
  padding: 10px;
  background-color: #f8fafc;
  border-radius: 6px;
  border-left: 4px solid #3b82f6;
}

.detail-value .stock-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-value .total-stock {
  color: #6b7280;
  font-weight: 500;
}

.detail-value .separator {
  color: #d1d5db;
}

.detail-value .available-stock {
  color: #059669;
  font-weight: 600;
  font-size: 16px;
}

.detail-value .available-stock.no-stock {
  color: #ef4444;
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

/* 简化：使用Tailwind CSS替代自定义分页样式 */

/* 响应式设计 */
@media (max-width: 768px) {
  .pagination-container {
    gap: 10px;
    padding: 15px;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .page-jump {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #d1d5db;
    padding-top: 10px;
  }
}

/* 简化：使用Tailwind CSS替代自定义批量操作样式 */

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

.danger-button {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

/* 简化：已移除导入相关样式，使用Tailwind CSS */

/* 添加图书表单样式 */
.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>

<!-- 添加图书弹窗 -->
<div v-if="showAddBookModal" class="modal-overlay">
  <div class="modal-content" style="max-width: 600px;">
    <div class="modal-header">
      <h3>添加图书</h3>
      <button @click="closeAddBookModal" class="close-button">&times;</button>
    </div>
    <div class="modal-body">
      <form @submit.prevent="confirmAddBook">
        <div class="form-group">
          <label for="bookTitle">书名 *</label>
          <input 
            type="text" 
            id="bookTitle" 
            v-model="newBook.title"
            class="form-control"
            required
            placeholder="请输入书名"
          >
        </div>
        
        <div class="form-group">
          <label for="bookAuthor">作者 *</label>
          <input 
            type="text" 
            id="bookAuthor" 
            v-model="newBook.author"
            class="form-control"
            required
            placeholder="请输入作者"
          >
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="bookIsbn">ISBN</label>
            <input 
              type="text" 
              id="bookIsbn" 
              v-model="newBook.isbn"
              class="form-control"
              placeholder="请输入ISBN号"
            >
          </div>
          
          <div class="form-group">
            <label for="bookStock">库存数量 *</label>
            <input 
              type="number" 
              id="bookStock" 
              v-model.number="newBook.stock"
              class="form-control"
              min="1"
              required
            >
          </div>
        </div>
        
        <div class="form-group">
          <label for="bookCategory">分类 *</label>
          <select 
            id="bookCategory" 
            v-model="newBook.category_id"
            class="form-control"
            required
          >
            <option value="">请选择分类</option>
            <option 
              v-for="category in batchCategories" 
              :key="category.category_id" 
              :value="category.category_id"
            >
              {{ category.category_name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="bookPublisher">出版社</label>
          <input 
            type="text" 
            id="bookPublisher" 
            v-model="newBook.publisher"
            class="form-control"
            placeholder="请输入出版社"
          >
        </div>
        
        <div class="form-group">
          <label for="bookDescription">描述</label>
          <textarea 
            id="bookDescription" 
            v-model="newBook.description"
            class="form-control"
            rows="3"
            placeholder="请输入图书描述"
          ></textarea>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button @click="closeAddBookModal" class="cancel-button">取消</button>
      <button 
        @click="confirmAddBook" 
        class="confirm-button"
        :disabled="isProcessingAdd"
      >
        {{ isProcessingAdd ? '添加中...' : '确认添加' }}
      </button>
    </div>
  </div>
</div>