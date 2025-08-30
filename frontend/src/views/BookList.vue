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
        
        <div v-if="showMoreConditions" class="search-row">
          <div class="form-group">
            <label for="isbn">ISBN编号</label>
            <input 
              type="text" 
              id="isbn" 
              v-model="searchParams.isbn"
              placeholder="请输入ISBN编号"
              class="form-control"
            >
          </div>
          
          <div class="form-group">
            <label for="publishYear">出版年份</label>
            <select id="publishYear" v-model="searchParams.publishYear" class="form-control">
              <option value="">全部</option>
              <option value="2024">2024年</option>
              <option value="2023">2023年</option>
              <option value="2022">2022年</option>
              <option value="2021">2021年</option>
              <option value="2020">2020年</option>
              <option value="older">更早</option>
            </select>
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
            @click="resetSearch"
            class="reset-button"
            :disabled="isLoading"
          >
            重置
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
      <!-- 搜索结果统计 -->
      <div v-if="!isLoading && filteredBooks.length > 0" class="search-stats">
        <span class="stats-text">
          找到 <strong>{{ pagination.total }}</strong> 本图书，当前显示第 
          <strong>{{ (pagination.currentPage - 1) * pagination.pageSize + 1 }}</strong> - 
          <strong>{{ Math.min(pagination.currentPage * pagination.pageSize, pagination.total) }}</strong> 本
        </span>
        <span class="available-stats">
          可借图书：<strong class="available-count">{{ getAvailableCount() }}</strong> 本
        </span>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-container">
          <div class="loading-spinner-lg"></div>
          <p>正在加载图书数据...</p>
        </div>
      </div>
      
      <!-- 无结果提示 -->
      <div v-if="!isLoading && filteredBooks.length === 0" class="no-result">
        <p>无匹配的图书</p>
      </div>
      
      <!-- 操作工具栏（导入和导出功能） -->
      <div v-if="!isLoading" class="operations-toolbar">
        <button 
          @click="exportBooks"
          class="export-btn"
          :disabled="isProcessingExport || filteredBooks.length === 0"
        >
          <i class="icon-export">↓</i>
          {{ isProcessingExport ? '导出中...' : '导出图书' }}
        </button>
        <button 
          @click="showImportDialog"
          class="import-btn"
          :disabled="isProcessingImport"
        >
          <i class="icon-import">↑</i>
          {{ isProcessingImport ? '导入中...' : '导入图书' }}
        </button>
      </div>
      
      <!-- 批量操作工具栏 -->
      <div v-if="selectedBooks.length > 0" class="batch-operations-toolbar">
        <div class="selected-info">
          <span class="selected-count">已选择 {{ selectedBooks.length }} 本图书</span>
        </div>
        <div class="batch-buttons">
          <button 
            @click="showBatchDeleteConfirm"
            class="batch-delete-btn"
            :disabled="isProcessingBatch"
          >
            {{ isProcessingBatch ? '处理中...' : '批量删除' }}
          </button>
          <button 
            @click="showBatchCategoryDialog"
            class="batch-category-btn"
            :disabled="isProcessingBatch"
          >
            修改分类
          </button>
          <button 
            @click="clearSelection"
            class="cancel-selection-btn"
          >
            取消选择
          </button>
        </div>
      </div>
      
      <!-- 图书列表 -->
        <table v-if="!isLoading && filteredBooks.length > 0" class="book-table">
          <thead>
            <tr>
              <th class="checkbox-column">
                <input 
                  type="checkbox" 
                  v-model="selectAll"
                  @change="toggleSelectAll"
                  :disabled="isLoading || !hasSelectableBooks"
                  title="全选/取消全选"
                >
              </th>
              <th>书名</th>
              <th>作者</th>
              <th>分类</th>
              <th>出版社</th>
              <th>ISBN</th>
              <th>出版日期</th>
              <th>库存/可借</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="book in filteredBooks" :key="book.book_id" :class="{ 'selected-row': selectedBooks.includes(book.book_id) }">
              <td class="checkbox-column">
                <input 
                  type="checkbox" 
                  :value="parseInt(book.book_id)"
                  v-model="selectedBooks"
                  :disabled="isBookDisabled(book)"
                  :title="isBookDisabled(book) ? '图书有借阅记录，无法批量操作' : '选择此图书'"
                >
              </td>
              <td class="book-title">{{ book.title }}</td>
              <td>{{ book.author }}</td>
              <td><span class="category-tag">{{ book.category_name }}</span></td>
              <td>{{ book.publisher || '-' }}</td>
              <td class="isbn-cell">{{ book.isbn || '-' }}</td>
              <td>{{ formatPublishDate(book.publish_date) }}</td>
              <td class="stock-cell">
                <span class="stock-info">
                  <span class="total-stock">{{ book.stock }}</span>
                  <span class="separator">/</span>
                  <span class="available-stock" :class="{ 'no-stock': book.available <= 0 }">
                    {{ book.available }}
                  </span>
                </span>
              </td>
              <td>
                <button 
                  @click="borrowBook(book)"
                  class="borrow-button"
                  :disabled="book.available <= 0"
                  :title="book.available <= 0 ? '库存不足' : '点击借阅'"
                >
                  {{ book.available <= 0 ? '无库存' : '借阅' }}
                </button>
                <button 
                  @click="viewBookDetail(book)"
                  class="detail-button"
                  title="查看详情"
                >
                  详情
                </button>
                <!-- 移除还书按钮 - 还书功能应在借阅记录页面处理 -->
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 分页控件 -->
        <div class="pagination-container">
          <div class="pagination-info">
            共 {{ pagination.total }} 条记录，当前第 {{ pagination.currentPage }} 页，共 {{ totalPages }} 页
          </div>
          
          <!-- 每页条数选择 -->
          <div class="page-size-selector">
            <label for="pageSize">每页显示：</label>
            <select id="pageSize" v-model="pagination.pageSize" @change="changePageSize" class="page-size-select">
              <option :value="10">10条</option>
              <option :value="20">20条</option>
              <option :value="50">50条</option>
              <option :value="100">100条</option>
            </select>
          </div>
          
          <div class="pagination-controls">
            <!-- 首页按钮 -->
            <button
              @click="changePage(1)"
              :disabled="pagination.currentPage === 1"
              class="pagination-button"
              title="首页"
            >
              首页
            </button>
            
            <!-- 上一页按钮 -->
            <button
              @click="changePage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              class="pagination-button"
              title="上一页"
            >
              上一页
            </button>
            
            <!-- 页码数字 -->
            <div class="page-numbers">
              <button
                v-for="page in pageNumbers"
                :key="page"
                @click="changePage(page)"
                :class="{ 'active': page === pagination.currentPage, 'ellipsis': page === '...' }"
                :disabled="page === '...'"
                class="page-button"
              >
                {{ page }}
              </button>
            </div>
            
            <!-- 下一页按钮 -->
            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage >= totalPages"
              class="pagination-button"
              title="下一页"
            >
              下一页
            </button>
            
            <!-- 末页按钮 -->
            <button
              @click="changePage(totalPages)"
              :disabled="pagination.currentPage >= totalPages"
              class="pagination-button"
              title="末页"
            >
              末页
            </button>
            
            <!-- 页码跳转 -->
            <div class="page-jump">
              <span>跳转至</span>
              <input 
                type="number" 
                v-model="jumpToPage" 
                @keyup.enter="handlePageJump"
                :min="1" 
                :max="totalPages"
                class="page-jump-input"
                placeholder="页码"
              >
              <button @click="handlePageJump" class="jump-button">跳转</button>
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

/* 分页控件样式 - 增强版 */
.pagination-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  margin-top: 20px;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.pagination-info {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.page-size-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.page-size-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.page-size-select:hover {
  border-color: #9ca3af;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-button {
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 80px;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
  color: #1f2937;
}

.pagination-button:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.page-button {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
  transition: all 0.2s;
}

.page-button:hover:not(:disabled):not(.active):not(.ellipsis) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
  color: #1f2937;
}

.page-button.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
  font-weight: 600;
}

.page-button.ellipsis {
  background-color: transparent;
  border: none;
  cursor: default;
  color: #9ca3af;
  font-weight: normal;
}

.page-button:disabled {
  cursor: not-allowed;
  background-color: transparent;
  border: none;
  color: #9ca3af;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 15px;
  padding-left: 15px;
  border-left: 1px solid #d1d5db;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.page-jump-input {
  width: 70px;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  transition: all 0.2s;
}

.page-jump-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.page-jump-input:hover {
  border-color: #9ca3af;
}

.jump-button {
  padding: 8px 14px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.jump-button:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.jump-button:active {
  background-color: #1d4ed8;
  transform: translateY(0);
}

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

/* 第3阶段新增：批量操作相关样式 */

/* 批量操作工具栏 */
.batch-operations-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.selected-info {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.selected-count {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

.batch-delete-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.batch-delete-btn:hover:not(:disabled) {
  background-color: #dc2626;
  transform: translateY(-1px);
}

.batch-delete-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.batch-category-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.batch-category-btn:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.batch-category-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.cancel-selection-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-selection-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 表格复选框列 */
.checkbox-column {
  width: 50px;
  text-align: center;
}

.checkbox-column input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  transform: scale(1.2);
}

.checkbox-column input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 选中行高亮 */
.selected-row {
  background-color: #eff6ff !important;
  border-left: 4px solid #3b82f6;
}

.selected-row:hover {
  background-color: #dbeafe !important;
}

/* 批量操作弹窗样式 */
.warning-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 15px;
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 20px;
  margin-top: 2px;
}

.warning-message p {
  margin: 0;
  color: #92400e;
  font-weight: 500;
}

.danger-text {
  color: #b91c1c !important;
  font-weight: 600 !important;
  margin-top: 5px !important;
}

.info-text {
  color: #059669 !important;
  font-weight: 500 !important;
  margin-top: 8px !important;
  font-size: 14px !important;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-icon {
  font-size: 16px;
}

.selected-books-preview {
  margin-top: 20px;
}

.selected-books-preview h4 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
}

.book-list {
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: #f9fafb;
}

.book-item {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #374151;
}

.book-item:last-child {
  border-bottom: none;
}

.book-item:nth-child(even) {
  background-color: #f3f4f6;
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
  transition: all 0.2s;
}

.danger-button:hover:not(:disabled) {
  background-color: #dc2626;
}

.danger-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.loading-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 5px;
  font-style: italic;
}

/* 响应式批量操作 */
@media (max-width: 768px) {
  .batch-operations-toolbar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .batch-buttons {
    justify-content: center;
  }
  
  .checkbox-column {
    width: 40px;
  }
  
  .book-list {
    max-height: 150px;
  }
}

/* 第3阶段新增：导入功能样式 */

/* 操作工具栏样式 */
.operations-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
}

/* 导入按钮样式 */
.import-btn {
  background-color: #16a34a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-right: 10px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.import-btn:hover:not(:disabled) {
  background-color: #15803d;
  transform: translateY(-1px);
}

.import-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
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
  margin-right: 10px;
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

.icon-import {
  font-size: 16px;
  margin-right: 4px;
}

/* 导入弹窗样式 */
.import-modal {
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
}

.import-steps {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s;
}

.step-item.active {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.step-item.active .step-number {
  background-color: #3b82f6;
  color: white;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.step-content p {
  margin: 0 0 15px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

/* 模板下载按钮 */
.template-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.template-btn:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.icon-download {
  font-size: 16px;
}

/* 文件上传区域 */
.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
  margin-bottom: 15px;
}

.file-upload-area:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.file-upload-area.has-file {
  border-color: #16a34a;
  background-color: #f0fdf4;
}

.file-input {
  display: none;
}

.upload-content {
  cursor: pointer;
}

.upload-placeholder {
  color: #6b7280;
}

.upload-placeholder .icon-upload {
  font-size: 24px;
  margin-bottom: 10px;
  display: block;
}

.upload-placeholder p {
  margin: 5px 0;
}

.file-hint {
  font-size: 12px;
  color: #9ca3af;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #16a34a;
  font-weight: 500;
}

.icon-file {
  font-size: 20px;
}

.file-name {
  font-weight: 600;
}

.file-size {
  color: #6b7280;
  font-size: 12px;
  font-weight: normal;
}

.clear-file-btn {
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.clear-file-btn:hover {
  background-color: #dc2626;
}

/* 解析按钮 */
.parse-btn {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.parse-btn:hover:not(:disabled) {
  background-color: #d97706;
  transform: translateY(-1px);
}

.parse-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

/* 预览区域 */
.preview-section {
  margin-top: 15px;
}

.preview-summary {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.preview-summary p {
  margin: 0 0 10px 0;
  color: #0369a1;
  font-weight: 500;
}

.preview-errors {
  margin-top: 15px;
}

.preview-errors h5 {
  margin: 0 0 10px 0;
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
}

.preview-errors ul {
  margin: 0;
  padding-left: 20px;
}

.error-item {
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 5px;
}

.preview-table h5 {
  margin: 0 0 15px 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
}

.sample-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  background-color: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sample-table th,
.sample-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.sample-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sample-table td {
  color: #6b7280;
}

.sample-table tr:last-child td {
  border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-modal {
    width: 100%;
    margin: 10px;
    max-width: calc(100% - 20px);
  }
  
  .step-item {
    flex-direction: column;
    text-align: center;
  }
  
  .step-number {
    align-self: center;
  }
  
  .file-upload-area {
    padding: 20px 15px;
  }
  
  .sample-table {
    font-size: 10px;
  }
  
  .sample-table th,
  .sample-table td {
    padding: 6px 8px;
  }
}</style>