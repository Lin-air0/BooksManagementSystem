import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 使用代理配置，指向后端4000端口
  timeout: 10000,
});

// 添加请求拦截器
api.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    console.log('API请求开始:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      params: config.params,
      data: config.data
    });
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('API请求准备错误:', error);
    return Promise.reject(error);
  }
);

  // 响应拦截器
  api.interceptors.response.use(
    response => {
      // 统一处理API响应
      console.log('API响应成功:', {
        status: response.status,
        data: response.data,
        config: response.config
      });
      
      // 处理后端统一响应格式 {code, data, msg}
      if (response.data && typeof response.data.code !== 'undefined') {
        if (response.data.code === 0 || response.data.code === 200) {
          return response.data;
        } else {
          console.error('API业务错误:', response.data);
          return Promise.reject(new Error(response.data.msg || '业务处理失败'));
        }
      }
      // 处理统计分析API的特殊格式 {success, data, message}
      else if (response.data && typeof response.data.success !== 'undefined') {
        if (response.data.success) {
          return response.data;
        } else {
          console.error('API业务错误:', response.data);
          return Promise.reject(new Error(response.data.message || '业务处理失败'));
        }
      }
      // 直接返回数据
      return response.data;
    },
    error => {
      // 对响应错误做点什么
      console.error('API请求错误:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : '无响应',
        config: error.config
      });
      return Promise.reject(error);
    }
  );

// 图书相关API - 与后端v2.2.0规范完全一致
export const bookAPI = {
  // 获取图书列表（支持分页和复合搜索）
  getBooks: (params) => api.get('/books/search', { params }),
  // 获取图书详情
  getBookDetail: (bookId) => api.get(`/books/${bookId}`),
  // 新增图书
  addBook: (data) => api.post('/books', data),
  // 更新图书信息
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  // 删除图书
  deleteBook: (id) => api.delete(`/books/${id}`),
  // 第3阶段新增：批量删除图书
  batchDeleteBooks: (bookIds) => {
    console.log('API调用 - 批量删除图书:', { bookIds, type: typeof bookIds[0] });
    return api.delete('/books/batch', { 
      data: { book_ids: bookIds },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  // 第3阶段新增：批量修改分类
  batchUpdateCategory: (bookIds, categoryId) => api.patch('/books/batch/category', { 
    book_ids: bookIds, 
    new_category_id: categoryId 
  }),
  // 第3阶段新增：图书导入
  importBooks: (formData) => api.post('/books/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  // 第3阶段新增：图书导出
  exportBooks: (params) => api.get('/books/export', { 
    params,
    responseType: 'blob' // 重要：设置响应类型为blob
  }),
};

// 借阅相关API - 根据后端实际接口配置（已修正）
export const borrowAPI = {
  // 获取所有借阅记录（支持分页）
  getBorrowRecords: (params) => api.get('/borrows', { params }),
  // 获取读者借阅记录 - 使用查询参数方式
  getReaderBorrows: (readerId, status) => api.get('/borrows', { params: { reader_id: readerId, status } }),
  // 获取当前借阅记录 - 使用查询参数方式
  getCurrentBorrows: (readerId) => api.get('/borrows', { params: { reader_id: readerId, status: 'borrowed' } }),
  // 借阅图书
  borrowBook: (data) => api.post('/borrow', data),
  // 归还图书 - 使用新的POST /api/borrows/return端点（第1阶段新增）
  returnBook: (data) => api.post('/borrows/return', data),
  // 归还图书（旧接口保持兼容性）
  returnBookOld: (data) => api.put('/return', data),
  // 获取逾期记录 - 第1阶段新增
  getOverdueRecords: (params) => api.get('/borrows/overdue', { params }),
  // 第3阶段新增：借阅记录导出
  exportBorrows: (params) => api.get('/borrows/export', { 
    params,
    responseType: 'blob' // 重要：设置响应类型为blob
  }),
};

// 读者相关API - 支持登录认证
export const readerAPI = {
  // 读者登录
  login: (credentials) => api.post('/readers/login', credentials),
  // 获取读者信息
  getReader: (readerId) => api.get(`/readers/${readerId}`),
  // 获取读者列表（支持分页）
  getReaders: (params) => api.get('/readers', { params }),
  // 添加读者
  addReader: (data) => api.post('/readers', data),
  // 更新读者信息
  updateReader: (id, data) => api.put(`/readers/${id}`, data),
  // 删除读者
  deleteReader: (id) => api.delete(`/readers/${id}`),
  // 第3阶段新增：读者导入
  importReaders: (formData) => api.post('/readers/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
};

// 统计相关API - 根据后端实际接口配置（已修正）
export const statisticsAPI = {
  // 获取借阅统计 - 修正为正确的后端路径
  getBorrowStats: () => api.get('/statistics/monthly'),
  // 获取热门图书 - 保持原有接口兼容性
  getPopularBooks: (limit = 10) => api.get('/statistics/topBooks', { params: { limit, period: 'month' } }),
  // 获取月度统计
  getMonthlyStats: (params) => api.get('/statistics/monthly', { params }),
  // 第2阶段新增：获取图书分类分布统计（用于饼图）
  getCategoriesStats: () => api.get('/statistics/categories'),
  // 第2阶段新增：获取月度借阅趋势统计（用于折线图）
  getBorrowTrends: (params) => api.get('/statistics/borrows/monthly', { params }),
  // 获取逾期统计 - 使用borrows接口的查询参数
  getOverdueStats: (params) => api.get('/borrows', { params: { ...params, is_overdue: true } }),
  
  // 第4阶段新增：热门图书排行榜API
  getPopularBooksRanking: (params = {}) => {
    const { limit = 10, period = 'all' } = params;
    return api.get('/statistics/books/popular', { 
      params: { limit, period }
    });
  },
  
  // 第4阶段新增：读者借阅分析API
  getReaderBorrowAnalysis: (params = {}) => {
    const { period = 'all' } = params;
    return api.get('/statistics/readers/borrows', {
      params: { period }
    });
  },
  
  // 第4阶段新增：月度借阅趋势分析（扩展版）
  getBorrowTrendAnalysis: (params = {}) => {
    const { months = 6 } = params;
    return api.get('/statistics/borrows/monthly', {
      params: { months }
    });
  },
  
  // 第4阶段第2天新增：借阅趋势分析API（支持多种时间范围）
  getBorrowTrend: (params = {}) => {
    const { range = 'month', count = 12, start_date, end_date } = params;
    return api.get('/statistics/borrows/trend', {
      params: { range, count, start_date, end_date }
    });
  },
  
  // 第4阶段第2天新增：图书库存周转率统计API
  getBookTurnoverRate: (params = {}) => {
    const { period = 'all', category_id, limit = 20 } = params;
    return api.get('/statistics/books/turnover', {
      params: { period, category_id, limit }
    });
  },
};
export default api;