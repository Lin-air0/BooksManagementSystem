<template>
  <div>
    <!-- 页面标题和操作按钮 -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h1 class="text-xl font-semibold">读者管理</h1>
      <div class="flex gap-2 self-end sm:self-auto">
        <button 
          @click="showImportDialog" 
          class="bg-secondary text-textPrimary py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors"
          :disabled="isLoading || isProcessingImport"
        >
          <i class="fa fa-upload mr-2"></i>
          {{ isProcessingImport ? '导入中...' : '导入读者' }}
        </button>
        <button 
          @click="openAddModal" 
          class="bg-primary text-white py-2 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors"
          :disabled="isLoading"
        >
          <i class="fa fa-user-plus mr-2"></i>添加读者
        </button>
      </div>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm text-textSecondary mb-1">读者姓名</label>
          <div class="relative">
            <input 
              type="text" 
              v-model="searchParams.name"
              placeholder="请输入读者姓名" 
              class="w-full px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            >
          </div>
        </div>
        <div>
          <label class="block text-sm text-textSecondary mb-1">读者类型</label>
          <select 
            v-model="searchParams.type"
            class="w-full px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          >
            <option value="">全部类型</option>
            <option value="student">学生</option>
            <option value="teacher">教师</option>
            <option value="admin">职工</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-textSecondary mb-1">读者ID</label>
          <div class="relative">
            <input 
              type="text" 
              v-model="searchParams.readerId"
              placeholder="请输入读者ID" 
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
          @click="searchReaders"
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
        <p class="text-textSecondary">正在加载读者数据...</p>
      </div>
    </div>
    
    <!-- 无结果提示 -->
    <div v-if="!isLoading && readers.length === 0" class="bg-white rounded-lg border border-borderLight p-8 card-shadow text-center">
      <p class="text-textSecondary">暂无读者数据</p>
    </div>

    <!-- 读者列表 -->
    <div v-if="!isLoading && readers.length > 0" class="bg-white rounded-lg border border-borderLight card-shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-borderLight">
          <thead class="bg-secondary">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">读者ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">姓名</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">性别</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">类型</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">学号/工号</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">联系电话</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">邮箱</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">注册日期</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-textPrimary uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-borderLight">
            <tr v-for="reader in readers" :key="reader.reader_id" class="table-hover-row transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm">RD-{{ String(reader.reader_id).padStart(3, '0') }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ reader.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ reader.gender || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ getTypeText(reader.type) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ reader.student_id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ reader.phone || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ reader.email || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">{{ formatDate(reader.created_at) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button 
                  @click="viewReader(reader.reader_id)"
                  class="text-primary hover:text-primary/80 mr-3 transition-colors"
                >
                  查看
                </button>
                <button 
                  @click="editReader(reader.reader_id)"
                  class="text-primaryLight hover:text-primaryLight/80 mr-3 transition-colors"
                >
                  编辑
                </button>
                <button 
                  @click="deleteReader(reader.reader_id)"
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
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1 || isLoading"
            class="relative inline-flex items-center px-4 py-2 border border-borderMedium text-sm font-medium rounded-md text-textPrimary bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button 
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= Math.ceil(total / pageSize) || isLoading"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-borderMedium text-sm font-medium rounded-md text-textPrimary bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-textSecondary">
              共 <span class="font-medium">{{ total }}</span> 条记录，当前第 <span class="font-medium">{{ currentPage }}</span>/<span class="font-medium">{{ Math.ceil(total / pageSize) }}</span> 页
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button 
                @click="handlePageChange(1)"
                :disabled="currentPage === 1 || isLoading"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">首页</span>
                <i class="fa fa-angle-double-left text-xs"></i>
              </button>
              <button 
                @click="handlePageChange(currentPage - 1)"
                :disabled="currentPage === 1 || isLoading"
                class="relative inline-flex items-center px-2 py-2 border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">上一页</span>
                <i class="fa fa-chevron-left text-xs"></i>
              </button>
              <button 
                @click="handlePageChange(currentPage + 1)"
                :disabled="currentPage >= Math.ceil(total / pageSize) || isLoading"
                class="relative inline-flex items-center px-2 py-2 border border-borderMedium bg-white text-sm font-medium text-textSecondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">下一页</span>
                <i class="fa fa-chevron-right text-xs"></i>
              </button>
              <button 
                @click="handlePageChange(Math.ceil(total / pageSize))"
                :disabled="currentPage >= Math.ceil(total / pageSize) || isLoading"
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

      <!-- 新增读者弹窗 -->
      <div class="modal-overlay" v-if="isAddModalOpen" @click="closeAddModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>新增读者</h2>
            <button class="close-btn" @click="closeAddModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- 读者ID生成方式提示 -->
          <div class="form-note">
            <p><strong>重要提示：</strong>读者ID由系统自动生成，无需手动填写</p>
            <p>学号/工号为必填且唯一字段，重复将无法提交</p>
          </div>
            <div class="form-group">
              <label>姓名</label>
              <input type="text" v-model="newReader.name" placeholder="请输入姓名">
            </div>
            <div class="form-group">
              <label>学号/工号</label>
              <input type="text" v-model="newReader.student_id" placeholder="请输入学号或工号">
            </div>
            <div class="form-group">
              <label>类型</label>
              <select v-model="newReader.type">
                <option value="student">学生</option>
                <option value="teacher">教师</option>
                <option value="admin">职工</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeAddModal">取消</button>
            <button class="confirm-btn" @click="confirmAddReader" :disabled="isSubmitting">确认新增</button>
          </div>
        </div>
      </div>

      <!-- 编辑读者弹窗 -->
      <div class="modal-overlay" v-if="isEditModalOpen" @click="closeEditModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>编辑读者</h2>
            <button class="close-btn" @click="closeEditModal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- 读者ID生成方式提示 -->
          <div class="form-note">
            <p><strong>重要提示：</strong>读者ID由系统自动生成，无需手动填写</p>
            <p>学号/工号为必填且唯一字段，重复将无法提交</p>
          </div>
            <div class="form-group">
              <label>姓名</label>
              <input type="text" v-model="editingReader.name" placeholder="请输入姓名">
            </div>
            <div class="form-group">
              <label>学号/工号</label>
              <input type="text" v-model="editingReader.student_id" placeholder="请输入学号或工号">
            </div>
            <div class="form-group">
              <label>类型</label>
              <select v-model="editingReader.type">
                <option value="student">学生</option>
                <option value="teacher">教师</option>
                <option value="admin">职工</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeEditModal">取消</button>
            <button class="confirm-btn" @click="confirmEditReader" :disabled="isSubmitting">确认修改</button>
          </div>
        </div>
      </div>
      
      <!-- 第3阶段新增：读者导入弹窗 -->
      <div v-if="showImportModal" class="modal-overlay">
        <div class="modal-content import-modal">
          <div class="modal-header">
            <h3>导入读者数据</h3>
            <button @click="closeImportModal" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="import-steps">
              <div class="step-item" :class="{ active: !importFile }">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>下载Excel模板</h4>
                  <p>下载标准的读者导入模板，按格式填写数据</p>
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
                            <th>姓名</th>
                            <th>学号</th>
                            <th>邮箱</th>
                            <th>电话</th>
                            <th>类型</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(reader, index) in importPreview.sample" :key="index">
                            <td>{{ reader.name }}</td>
                            <td>{{ reader.student_id }}</td>
                            <td>{{ reader.email }}</td>
                            <td>{{ reader.phone }}</td>
                            <td>{{ reader.type }}</td>
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
            <button @click="closeImportModal" class="cancel-btn">取消</button>
            <button 
              v-if="importPreview && importPreview.validCount > 0"
              @click="confirmImport" 
              class="confirm-btn"
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
import { readerAPI } from '@/utils/api';
import { parseExcelFile, validateExcelData, ExcelTemplates, formatFileSize, createExcelBlob, downloadBlob } from '@/utils/excelHelper';

export default {
  name: 'ReaderManage',
  data() {
    return {
      readers: [],
      isLoading: false,
      isSubmitting: false,
      isAddModalOpen: false,
      isEditModalOpen: false,
      editingReaderId: '',
      newReader: {
        name: '',
        student_id: '',
        type: 'student'
      },
      editingReader: {
        name: '',
        student_id: '',
        type: 'student'
      },
      // 分页相关属性
      currentPage: 1,
      pageSize: 10,
      total: 0,
      // 第3阶段新增：导入相关状态
      showImportModal: false,           // 导入弹窗显示状态
      isProcessingImport: false,        // 导入处理状态
      importFile: null,                 // 选中的导入文件
      importPreview: null,              // 导入数据预览
      // 搜索参数
      searchParams: {
        name: '',
        type: '',
        readerId: ''
      },
    };
  },
  mounted() {
    // 组件加载时获取读者列表
    this.fetchReaders();
  },
  methods: {
    // 获取读者列表
    async fetchReaders() {
      this.isLoading = true;
      try {
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize
        };
        
        // 只添加非空的搜索参数
        if (this.searchParams.name && this.searchParams.name.trim()) {
          params.name = this.searchParams.name.trim();
        }
        if (this.searchParams.type && this.searchParams.type !== '') {
          params.type = this.searchParams.type;
        }
        if (this.searchParams.readerId && this.searchParams.readerId.trim()) {
          // 修复参数名映射，后端期望的是reader_id而不是readerId
          params.reader_id = this.searchParams.readerId.trim();
        }
        
        console.log('正在获取读者列表，参数:', params);
        const response = await readerAPI.getReaders(params);
        console.log('获取读者列表响应:', response);
        
        // 使用后端标准响应格式 {code, data, msg}
        if (response && (response.code === 0 || response.code === 200) && response.data) {
          // 修复数据处理逻辑，确保正确处理分页数据
          if (response.data.list) {
            // 分页数据格式 {list: [...], total: N}
            this.readers = response.data.list;
            this.total = response.data.total || 0;
          } else if (Array.isArray(response.data)) {
            // 数组格式 [...]
            this.readers = response.data;
            this.total = response.data.length;
          } else {
            // 其他格式
            this.readers = [];
            this.total = 0;
          }
          console.log('成功获取读者列表:', this.readers.length, '条记录');
          
          // 确保DOM更新完成后再执行其他操作
          this.$nextTick(() => {
            console.log('DOM更新完成，读者列表已渲染');
          });
        } else {
          console.error('响应格式异常:', response);
          throw new Error(response && response.msg ? response.msg : '获取读者列表失败');
        }
      } catch (error) {
        console.error('获取读者列表失败:', error);
        alert(error.message || '获取读者列表失败，请稍后重试');
        // 使用模拟数据避免页面空白
        this.readers = [
          { reader_id: 1, name: '张三', student_id: '20210001', type: '学生' },
          { reader_id: 2, name: '李四', student_id: '20210002', type: '学生' },
          { reader_id: 3, name: '王五', student_id: '20210003', type: '学生' },
          { reader_id: 4, name: '赵六', student_id: '20210004', type: '学生' },
          { reader_id: 5, name: '钱七', student_id: 'T0001', type: '教师' },
          { reader_id: 6, name: '孙八', student_id: 'T0002', type: '教师' },
          { reader_id: 7, name: '周九', student_id: 'T0003', type: '教师' },
          { reader_id: 8, name: '吴十', student_id: 'T0004', type: '教师' }
        ];
        this.total = this.readers.length;
      } finally {
        this.isLoading = false;
      }
    },
    
    // 打开新增读者弹窗
    openAddModal() {
      this.isAddModalOpen = true;
      // 重置表单
      this.newReader = {
        name: '',
        student_id: '',
        type: '学生'
      };
    },
    
    // 关闭新增读者弹窗
    closeAddModal() {
      this.isAddModalOpen = false;
    },
    
    // 确认新增读者
    async confirmAddReader() {
      // 验证表单
      if (!this.newReader.name || !this.newReader.student_id) {
        alert('请填写姓名和学号/工号');
        return;
      }
      
      this.isSubmitting = true;
      try {
        await readerAPI.addReader(this.newReader);
        alert('新增读者成功！');
        // 重新获取读者列表（保持在当前页）
        this.fetchReaders();
        this.closeAddModal();
      } catch (error) {
        console.error('新增读者失败:', error);
        // 更友好的错误提示
        if (error.response?.status === 400) {
          alert('新增读者失败: ' + (error.response.data?.msg || '参数错误，请检查输入'));
        } else if (error.response?.status === 500 && error.response.data?.msg?.includes('学号/工号已存在')) {
          alert('新增读者失败: 该学号/工号已被注册，请使用其他学号');
        } else {
          alert(error.message || '新增读者失败，请稍后重试');
        }
      } finally {
        this.isSubmitting = false;
      }
    },
    
    // 分页处理方法
    handlePageChange(page) {
      if (page > 0 && page <= Math.ceil(this.total / this.pageSize)) {
        this.currentPage = page;
        this.fetchReaders();
      }
    },
    
    // 切换每页显示条数
    handlePageSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1; // 重置为第一页
      this.fetchReaders();
    },
    
    // 编辑读者
    async editReader(readerId) {
      this.isLoading = true;
      try {
        const response = await readerAPI.getReader(readerId);
        if ((response.code === 0 || response.code === 200) && response.data) {
          this.editingReader = { ...response.data };
          this.editingReaderId = readerId;
          this.isEditModalOpen = true;
        } else {
          throw new Error(response.msg || '获取读者详情失败');
        }
      } catch (error) {
        console.error('获取读者详情失败:', error);
        alert(error.message || '获取读者详情失败，请稍后重试');
      } finally {
        this.isLoading = false;
      }
    },
    
    // 关闭编辑弹窗
    closeEditModal() {
      this.isEditModalOpen = false;
    },
    
    // 确认编辑读者
    async confirmEditReader() {
      // 验证表单
      if (!this.editingReader.name || !this.editingReader.student_id) {
        alert('请填写姓名和学号/工号');
        return;
      }
      
      this.isSubmitting = true;
      try {
        await readerAPI.updateReader(this.editingReaderId, this.editingReader);
        alert('编辑读者成功！');
        // 重新获取读者列表
        this.fetchReaders();
        this.closeEditModal();
      } catch (error) {
        console.error('编辑读者失败:', error);
        // 更友好的错误提示
        if (error.response?.status === 400) {
          alert('编辑读者失败: ' + (error.response.data?.msg || '参数错误，请检查输入'));
        } else if (error.response?.status === 500 && error.response.data?.msg?.includes('学号/工号已存在')) {
          alert('编辑读者失败: 该学号/工号已被其他读者使用，请使用其他学号');
        } else {
          alert(error.message || '编辑读者失败，请稍后重试');
        }
      } finally {
        this.isSubmitting = false;
      }
    },
    
    // 删除读者
    async deleteReader(readerId) {
      if (confirm('确定删除该读者？删除后无法恢复！')) {
        try {
          await readerAPI.deleteReader(readerId);
          alert('删除读者成功！');
          // 重新获取读者列表
          this.fetchReaders();
        } catch (error) {
          console.error('删除读者失败:', error);
          alert(error.message || '删除读者失败，请稍后重试');
        }
      }
    },

    // 使用模拟数据避免页面空白
    useMockData() {
      this.readers = [
        { reader_id: 1, name: '张三', student_id: '20210001', type: 'student' },
        { reader_id: 2, name: '李四', student_id: '20210002', type: 'student' },
        { reader_id: 3, name: '王五', student_id: '20210003', type: 'student' },
        { reader_id: 4, name: '赵六', student_id: '20210004', type: 'student' },
        { reader_id: 5, name: '钱七', student_id: 'T0001', type: 'teacher' },
        { reader_id: 6, name: '孙八', student_id: 'T0002', type: 'teacher' },
        { reader_id: 7, name: '周九', student_id: 'T0003', type: 'teacher' },
        { reader_id: 8, name: '吴十', student_id: 'T0004', type: 'teacher' }
      ];
      this.total = this.readers.length;
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
        const template = ExcelTemplates.readers;
        const templateData = [
          template.requiredColumns,
          ['示例姓名', '20210001', 'example@email.com', '13800138000', '学生'],
          ['张三', '20210002', 'zhangsan@email.com', '13800138001', '学生'],
          ['李老师', 'T0001', 'li@email.com', '13800138002', '教师']
        ];
        
        const blob = createExcelBlob(templateData, { sheetName: '读者导入模板' });
        downloadBlob(blob, '读者导入模板.xlsx');
        
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
        const template = ExcelTemplates.readers;
        const validation = validateExcelData(excelData, template.requiredColumns);
        
        if (!validation.isValid) {
          alert('数据格式验证失败：\n' + validation.errors.join('\n'));
          return;
        }
        
        // 转换为对象数组
        const headers = excelData[0];
        const dataRows = excelData.slice(1);
        
        const convertedData = dataRows.map((row, index) => {
          const reader = {};
          headers.forEach((header, colIndex) => {
            const fieldName = template.fieldMapping[header] || header;
            reader[fieldName] = row[colIndex] || '';
          });
          reader._rowIndex = index + 2; // Excel行号
          return reader;
        }).filter(reader => reader.name && reader.name.trim()); // 过滤空行
        
        // 验证数据内容
        const errors = [];
        const validReaders = [];
        
        convertedData.forEach(reader => {
          const readerErrors = [];
          
          // 必填字段验证
          if (!reader.name || !reader.name.trim()) {
            readerErrors.push(`第${reader._rowIndex}行: 姓名不能为空`);
          }
          if (!reader.student_id || !reader.student_id.trim()) {
            readerErrors.push(`第${reader._rowIndex}行: 学号不能为空`);
          }
          if (!reader.type || !reader.type.trim()) {
            readerErrors.push(`第${reader._rowIndex}行: 类型不能为空`);
          }
          
          // 邮箱格式验证（可选）
          if (reader.email && reader.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reader.email.trim())) {
            readerErrors.push(`第${reader._rowIndex}行: 邮箱格式不正确`);
          }
          
          // 电话格式验证（可选）
          if (reader.phone && reader.phone.trim() && !/^1[3-9]\d{9}$/.test(reader.phone.trim())) {
            readerErrors.push(`第${reader._rowIndex}行: 电话号码格式不正确`);
          }
          
          if (readerErrors.length === 0) {
            validReaders.push(reader);
          } else {
            errors.push(...readerErrors);
          }
        });
        
        this.importPreview = {
          validCount: validReaders.length,
          totalCount: convertedData.length,
          errors: errors,
          sample: validReaders.slice(0, 5), // 前5条数据作为预览
          data: validReaders // 完整数据
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
      
      const confirmMessage = `确认导入 ${this.importPreview.validCount} 条读者数据吗？`;
      if (!confirm(confirmMessage)) {
        return;
      }
      
      this.isProcessingImport = true;
      
      try {
        // 准备上传数据
        const formData = new FormData();
        formData.append('excelFile', this.importFile);
        
        // 调用导入API
        const response = await readerAPI.importReaders(formData);
        
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
          this.fetchReaders();
          
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
     * 搜索读者
     */
    searchReaders() {
      this.currentPage = 1;
      this.fetchReaders();
    },
    
    /**
     * 重置搜索
     */
    resetSearch() {
      this.searchParams = {
        name: '',
        type: '',
        readerId: ''
      };
      this.currentPage = 1;
      this.fetchReaders();
    },
    
    /**
     * 获取类型显示文本
     */
    getTypeText(type) {
      const typeMap = {
        'student': '学生',
        'teacher': '教师',
        'admin': '职工',
        'other': '其他',
        '学生': '学生',
        '教师': '教师',
        '职工': '职工',
        '普通读者': '其他'
      };
      return typeMap[type] || '未知';
    },
    
    /**
     * 格式化日期
     */
    formatDate(dateTime) {
      if (!dateTime) return '-';
      try {
        const date = new Date(dateTime);
        return date.toISOString().split('T')[0];
      } catch (error) {
        return dateTime;
      }
    },
    
    /**
     * 查看读者详情
     */
    viewReader(readerId) {
      // TODO: 实现查看读者详情功能
      console.log('查看读者:', readerId);
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

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-note {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 15px;
  font-size: 13px;
  color: #0369a1;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

/* 表格悬停效果 */
.table-hover-row:hover {
  background-color: #f9fafb;
}

/* 导入相关样式保留 */
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
}

.step-item.active {
  border-color: #2563eb;
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
  background-color: #2563eb;
  color: white;
}

.template-btn {
  background-color: #2563eb;
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
}

.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 15px;
}

.file-upload-area.has-file {
  border-color: #16a34a;
  background-color: #f0fdf4;
}

.file-input {
  display: none;
}
</style>