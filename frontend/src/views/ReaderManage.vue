<template>
  <div class="reader-manage-container">
    <div class="page-header">
      <h1>读者管理</h1>
      <button class="add-reader-btn" @click="openAddModal" :disabled="isLoading">新增读者</button>
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
  </div>
</template>

<script>
import { readerAPI } from '@/utils/api';

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
      total: 0
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
</style>