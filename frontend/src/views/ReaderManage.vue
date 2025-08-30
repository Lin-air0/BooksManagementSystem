<template>
  <div class="reader-manage-container">
    <div class="page-header">
      <h1>读者管理</h1>
      <div class="header-buttons">
        <button class="import-btn" @click="showImportDialog" :disabled="isLoading || isProcessingImport">
          {{ isProcessingImport ? '导入中...' : '导入读者' }}
        </button>
        <button class="add-reader-btn" @click="openAddModal" :disabled="isLoading">新增读者</button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-container" v-if="isLoading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 读者列表区 -->
    <div class="reader-list-section" v-else>
      <table class="reader-table">
        <thead>
          <tr>
            <th>读者ID</th>
            <th>姓名</th>
            <th>学号/工号</th>
            <th>类型</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="readers.length === 0">
            <td colspan="5" class="empty-message">暂无读者数据</td>
          </tr>
          <tr v-else v-for="reader in readers" :key="reader.reader_id">
            <td>{{ reader.reader_id }}</td>
            <td>{{ reader.name }}</td>
            <td>{{ reader.student_id }}</td>
            <td>{{ reader.type === 'student' ? '学生' : reader.type === 'teacher' ? '教师' : '普通读者' }}</td>
            <td class="action-buttons">
              <button class="edit-btn" @click="editReader(reader.reader_id)">编辑</button>
              <button class="delete-btn" @click="deleteReader(reader.reader_id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 分页控件 -->
      <div class="pagination-container" v-if="total > 0">
        <div class="pagination-info">
          共 {{ total }} 条记录，当前第 {{ currentPage }}/{{ Math.ceil(total / pageSize) }} 页
        </div>
        <div class="pagination-buttons">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1 || isLoading"
            @click="handlePageChange(1)"
          >
            首页
          </button>
          <button 
            class="page-btn" 
            :disabled="currentPage === 1 || isLoading"
            @click="handlePageChange(currentPage - 1)"
          >
            上一页
          </button>
          <button 
            class="page-btn" 
            :disabled="currentPage === Math.ceil(total / pageSize) || isLoading"
            @click="handlePageChange(currentPage + 1)"
          >
            下一页
          </button>
          <button 
            class="page-btn" 
            :disabled="currentPage === Math.ceil(total / pageSize) || isLoading"
            @click="handlePageChange(Math.ceil(total / pageSize))"
          >
            末页
          </button>
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
              <option value="学生">学生</option>
              <option value="教师">教师</option>
              <option value="普通读者">普通读者</option>
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
              <option value="学生">学生</option>
              <option value="教师">教师</option>
              <option value="普通读者">普通读者</option>
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
        type: '学生'
      },
      editingReader: {
        name: '',
        student_id: '',
        type: '学生'
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
        
        const response = await readerAPI.getReaders(params);
        
        // 使用后端标准响应格式 {code, data, msg}
        if ((response.code === 0 || response.code === 200) && response.data) {
          this.readers = response.data.list || [];
          this.total = response.data.total || 0;
        } else {
          throw new Error(response.msg || '获取读者列表失败');
        }
      } catch (error) {
        console.error('获取读者列表失败:', error);
        alert(error.message || '获取读者列表失败，请稍后重试');
        // 使用模拟数据避免页面空白
        this.readers = [
          { id: 'R001', name: '张三', student_id: '20210001', type: '学生' },
          { id: 'R002', name: '李四', student_id: '20210002', type: '学生' },
          { id: 'R003', name: '王五', student_id: '20210003', type: '学生' },
          { id: 'R004', name: '赵六', student_id: '20210004', type: '学生' },
          { id: 'R005', name: '钱七', student_id: 'T0001', type: '教师' },
          { id: 'R006', name: '孙八', student_id: 'T0002', type: '教师' },
          { id: 'R007', name: '周九', student_id: 'T0003', type: '教师' },
          { id: 'R008', name: '吴十', student_id: 'T0004', type: '教师' }
        ];
        this.total = 20; // 模拟总记录数
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
    }
  }
};
</script>

<style scoped>
/* 容器样式 */
.reader-manage-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.add-reader-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-reader-btn:hover {
  background-color: #40a9ff;
}

.import-btn {
  background-color: #16a34a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
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

/* 读者列表 */
.reader-list-section {
  background: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.reader-table {
  width: 100%;
  border-collapse: collapse;
}

.reader-table th,
.reader-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.reader-table th {
  background-color: #fafafa;
  font-weight: 500;
  color: #666;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.edit-btn {
  background-color: #52c41a;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-btn:hover {
  background-color: #73d13d;
}

.delete-btn {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-btn:hover {
  background-color: #ff7875;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 4px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn {
  background-color: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  color: #333;
  border-color: #40a9ff;
}

.confirm-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.confirm-btn:hover {
  background-color: #40a9ff;
}

/* 分页控件样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  color: #40a9ff;
  border-color: #40a9ff;
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  color: #999;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .reader-manage-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .reader-list-section {
    padding: 12px;
    overflow-x: auto;
  }
  
  .reader-table th,
  .reader-table td {
    padding: 8px;
    font-size: 14px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  /* 分页响应式调整 */
  .pagination-container {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  
  .pagination-info {
    order: 2;
  }
  
  .pagination-buttons {
    order: 1;
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .edit-btn,
  .delete-btn {
    width: 100%;
  }
}

/* 第3阶段新增：导入功能样式 */

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

/* 响应式设计增强 */
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
  
  .header-buttons {
    flex-direction: column;
    gap: 8px;
  }
}</style>