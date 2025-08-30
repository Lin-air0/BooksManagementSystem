<template>
  <div class="container">
    <div class="page-header">
      <h1 class="text-2xl font-bold mb-6 text-center">统计分析</h1>
      <button @click="goToHome" class="home-button">
        <i class="fa fa-home"></i> 返回首页
      </button>
    </div>
    
    <!-- 报表筛选区 -->
    <div class="bg-white p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">报表筛选</h2>
      <div class="flex flex-wrap gap-4 items-center">
        <div class="form-group">
          <label for="year">年份</label>
          <select id="year" v-model="selectedYear" class="form-select">
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="month">月份</label>
          <select id="month" v-model="selectedMonth" class="form-select">
            <option v-for="month in 12" :key="month" :value="month">{{ month }}</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="popular-period">热门图书周期</label>
          <select id="popular-period" v-model="selectedPeriod" class="form-select">
            <option value="week">最近一周</option>
            <option value="month">最近一月</option>
            <option value="year">最近一年</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="popular-limit">显示数量</label>
          <select id="popular-limit" v-model="selectedLimit" class="form-select">
            <option value="5">Top 5</option>
            <option value="10" selected>Top 10</option>
            <option value="20">Top 20</option>
            <option value="50">Top 50</option>
          </select>
        </div>
        
        <div class="flex items-end">
          <button 
            @click="generateReport" 
            class="bg-blue-600"
            :disabled="isLoading"
          >
            <i class="fa fa-bar-chart"></i> {{ isLoading ? '加载中...' : '生成报表' }}
          </button>
        </div>
      </div>
      
      <!-- 
      调试信息显示区已被注释，若需要使用请取消注释
       调试信息显示区 
      <div class="mt-4 p-3 bg-gray-100 rounded">
        <h3 class="font-semibold text-sm mb-2">调试信息:</h3>
        <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ debugInfo || '暂无调试信息' }}</pre>
      </div>
     --> 
    </div>
     
    <!-- 报表展示区 - 图表可视化 -->
    <div class="bg-white p-6 mb-8" v-if="reportData && reportData.dates && reportData.dates.length > 0">
      <h2 class="text-xl font-semibold mb-4">月度借阅趋势</h2>
      <div class="chart-container">
        <div ref="monthlyChart" class="chart" style="width: 100%; height: 400px;"></div>
      </div>
    </div>
    
    <!-- 报表展示区 - 数据表格 -->
    <div class="bg-white p-6 mb-8" v-if="reportData && reportData.dates && reportData.dates.length > 0">
      <h2 class="text-xl font-semibold mb-4">月度借阅统计</h2>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>借阅量</th>
              <th>归还量</th>
              <th>逾期量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(date, index) in reportData.dates" :key="date">
              <td>{{ date }}</td>
              <td class="borrow-count">{{ reportData.borrow_counts[index] }}</td>
              <td class="borrow-count">{{ reportData.return_counts[index] }}</td>
              <td class="overdue-count">{{ reportData.overdue_counts ? reportData.overdue_counts[index] || 0 : 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 热门图书区 - 图表可视化 -->
    <div class="bg-white p-6 mb-8" v-if="popularBooks && popularBooks.length > 0">
      <h2 class="text-xl font-semibold mb-4">热门图书排行榜</h2>
      <div class="chart-container">
        <div ref="popularChart" class="chart" style="width: 100%; height: 400px;"></div>
      </div>
    </div>
    
    <!-- 热门图书区 - 数据表格 -->
    <div class="bg-white p-6" v-if="popularBooks && popularBooks.length > 0">
      <h2 class="text-xl font-semibold mb-4">热门图书列表</h2>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>排名</th>
              <th>书名</th>
              <th>作者</th>
              <th>分类</th>
              <th>借阅次数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(book, index) in popularBooks" :key="book.book_id">
              <td>
                <span class="rank-number" :class="getRankClass(index)">{{ index + 1 }}</span>
              </td>
              <td>{{ book.title }}</td>
              <td>{{ book.author }}</td>
              <td>{{ book.category_name }}</td>
              <td class="borrow-count">{{ book.borrow_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 无数据提示 -->
    <div class="bg-white p-6 mb-8" v-if="!isLoading && (!reportData || !reportData.dates || reportData.dates.length === 0)">
      <p class="text-center text-gray-500">暂无月度借阅统计数据</p>
    </div>
    
    <div class="bg-white p-6" v-if="!isLoading && (!popularBooks || popularBooks.length === 0)">
      <p class="text-center text-gray-500">暂无热门图书数据</p>
    </div>
  </div>
</template>

<script>
import { statisticsAPI } from '@/utils/api';
import * as echarts from 'echarts';

export default {
  name: 'Statistics',
  data() {
    return {
      // 选中的年份，默认2025
      selectedYear: '2025',
      // 选中的月份，默认当前月份
      selectedMonth: new Date().getMonth() + 1,
      // 热门图书统计周期，默认month
      selectedPeriod: 'month',
      // 热门图书显示数量，默认10
      selectedLimit: 10,
      // 报表数据 - 初始为空，从API获取
      reportData: {
        dates: [],
        borrow_counts: [],
        return_counts: []
      },
      // 热门图书数据 - 初始为空，从API获取
      popularBooks: [],
      // 加载状态
      isLoading: false,
      // 调试信息
      debugInfo: '',
      // ECharts实例
      monthlyChart: null,
      popularChart: null
    };
  },
  methods: {
    /**
     * 生成月度报表
     * 调用API获取数据
     */
    async generateReport() {
      this.isLoading = true;
      this.debugInfo = '开始生成报表...\n';
      try {
        const apiParams = { year: this.selectedYear, month: this.selectedMonth };
        this.debugInfo += `调用月度统计API，参数: ${JSON.stringify(apiParams, null, 2)}\n`;
        
        // 调用月度借阅趋势统计API（使用新的API获取包含逾期数据的趋势）
        const monthlyStats = await statisticsAPI.getBorrowTrends({ months: 12 });
        
        this.debugInfo += `月度趋势API返回: ${JSON.stringify(monthlyStats, null, 2)}\n`;
        
        // 使用统一响应格式处理月度趋势数据
        if (monthlyStats.success && monthlyStats.data) {
          const result = monthlyStats.data;
          this.reportData = {
            dates: result.labels || [],
            borrow_counts: result.borrow_counts || [],
            return_counts: result.return_counts || [],
            overdue_counts: result.overdue_counts || [] // 新增：逾期数据
          };
          // 更新图表
          this.updateMonthlyChart();
        }
        
        this.debugInfo += '调用热门图书统计API\n';
        // 调用热门图书统计API
        const popularBookStats = await statisticsAPI.getPopularBooks(this.selectedLimit, this.selectedPeriod);
        
        this.debugInfo += `热门图书统计API返回: ${JSON.stringify(popularBookStats, null, 2)}\n`;
        
        // 使用统一响应格式处理热门图书数据 - 参考Home.vue的成功模式
        if (popularBookStats.success && popularBookStats.data) {
          this.popularBooks = popularBookStats.data || [];
          // 更新图表
          this.updatePopularChart();
        }
        
        this.debugInfo += `成功生成${this.selectedYear}年${this.selectedMonth}月的报表\n`;
        
      } catch (error) {
        this.debugInfo += `获取统计数据失败: ${error.message}\n`;
        this.debugInfo += `完整错误对象: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}\n`;
        if (error.response) {
          this.debugInfo += `错误状态码: ${error.response.status}\n`;
          this.debugInfo += `错误响应头: ${JSON.stringify(error.response.headers, null, 2)}\n`;
          this.debugInfo += `错误响应: ${JSON.stringify(error.response.data, null, 2)}\n`;
        } else if (error.request) {
          this.debugInfo += `请求对象: ${JSON.stringify(error.request, null, 2)}\n`;
        }
        alert('获取统计数据失败，请稍后重试');
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 返回首页
     */
    goToHome() {
      this.$router.push('/');
    },
    
    /**
     * 根据排名获取样式类
     * @param {number} index - 排名索引
     * @returns {string} 样式类名
     */
    getRankClass(index) {
      if (index === 0) return 'rank-gold';
      if (index === 1) return 'rank-silver';
      if (index === 2) return 'rank-bronze';
      return '';
    },
    
    /**
     * 初始化月度统计图表
     */
    initMonthlyChart() {
      // 确保DOM元素已经挂载
      if (this.$refs.monthlyChart) {
        this.monthlyChart = echarts.init(this.$refs.monthlyChart);
        
        // 配置图表选项
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              label: {
                backgroundColor: '#6a7985'
              }
            }
          },
          legend: {
            data: ['借阅量', '归还量', '逾期量']
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: [
            {
              type: 'category',
              boundaryGap: false,
              data: this.reportData.dates
            }
          ],
          yAxis: [
            {
              type: 'value',
              name: '数量',
              min: 0,
              axisLabel: {
                formatter: '{value}'
              }
            }
          ],
          series: [
            {
              name: '借阅量',
              type: 'line',
              stack: 'Total',
              areaStyle: {},
              emphasis: {
                focus: 'series'
              },
              data: this.reportData.borrow_counts,
              lineStyle: {
                color: '#3b82f6'
              },
              itemStyle: {
                color: '#3b82f6'
              }
            },
            {
              name: '归还量',
              type: 'line',
              stack: 'Total',
              areaStyle: {},
              emphasis: {
                focus: 'series'
              },
              data: this.reportData.return_counts,
              lineStyle: {
                color: '#10b981'
              },
              itemStyle: {
                color: '#10b981'
              }
            },
            {
              name: '逾期量',
              type: 'line',
              emphasis: {
                focus: 'series'
              },
              data: this.reportData.overdue_counts || [],
              lineStyle: {
                color: '#ef4444'
              },
              itemStyle: {
                color: '#ef4444'
              }
            }
          ]
        };
        
        this.monthlyChart.setOption(option);
      }
    },
    
    /**
     * 初始化热门图书图表
     */
    initPopularChart() {
      // 确保DOM元素已经挂载
      if (this.$refs.popularChart) {
        this.popularChart = echarts.init(this.$refs.popularChart);
        
        // 准备数据
        const bookNames = this.popularBooks.map(book => book.title);
        const borrowCounts = this.popularBooks.map(book => book.borrow_count);
        
        // 配置图表选项
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: function(params) {
              const data = params[0];
              return `${data.name}<br/>借阅次数: ${data.value}`;
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'value',
            name: '借阅次数',
            min: 0
          },
          yAxis: {
            type: 'category',
            data: bookNames,
            axisLabel: {
              interval: 0,
              rotate: 0,
              formatter: function(value) {
                // 限制显示长度
                if (value.length > 10) {
                  return value.substring(0, 10) + '...';
                }
                return value;
              }
            }
          },
          series: [
            {
              name: '借阅次数',
              type: 'bar',
              data: borrowCounts,
              label: {
                show: true,
                position: 'right',
                formatter: '{c}'
              },
              itemStyle: {
                color: function(params) {
                  // 前三名使用特殊颜色
                  const colorList = ['#ffd700', '#c0c0c0', '#cd7f32'];
                  if (params.dataIndex < 3) {
                    return colorList[params.dataIndex];
                  }
                  return '#3b82f6';
                }
              }
            }
          ]
        };
        
        this.popularChart.setOption(option);
      }
    },
    
    /**
     * 更新月度统计图表
     */
    updateMonthlyChart() {
      if (this.monthlyChart) {
        this.monthlyChart.setOption({
          xAxis: {
            data: this.reportData.dates
          },
          series: [
            {
              data: this.reportData.borrow_counts
            },
            {
              data: this.reportData.return_counts
            },
            {
              data: this.reportData.overdue_counts || []
            }
          ]
        });
      } else {
        this.initMonthlyChart();
      }
    },
    
    /**
     * 更新热门图书图表
     */
    updatePopularChart() {
      if (this.popularChart) {
        const bookNames = this.popularBooks.map(book => book.title);
        const borrowCounts = this.popularBooks.map(book => book.borrow_count);
        
        this.popularChart.setOption({
          yAxis: {
            data: bookNames
          },
          series: [
            {
              data: borrowCounts
            }
          ]
        });
      } else {
        this.initPopularChart();
      }
    },
    
    /**
     * 处理窗口大小变化，重新调整图表尺寸
     */
    handleResize() {
      if (this.monthlyChart) {
        this.monthlyChart.resize();
      }
      if (this.popularChart) {
        this.popularChart.resize();
      }
    }
  },
  
  // 组件加载时自动获取默认月份的数据
  mounted() {
    this.generateReport();
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
  },
  
  // 组件卸载时清理资源
  beforeDestroy() {
    // 移除窗口大小变化监听
    window.removeEventListener('resize', this.handleResize);
    // 销毁ECharts实例
    if (this.monthlyChart) {
      this.monthlyChart.dispose();
    }
    if (this.popularChart) {
      this.popularChart.dispose();
    }
  }
};
</script>

<style scoped>
/* 全局样式 */
.container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding: 2rem;
}

/* 标题样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h1 {
  color: #1e3a8a;
  margin-bottom: 0;
  position: relative;
  padding-bottom: 0.5rem;
}

/* 首页按钮样式 */
.home-button {
  background-color: #10b981;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.home-button:hover {
  background-color: #059669;
  transform: translateY(-1px);
}

.home-button:active {
  transform: translateY(0);
}

h1::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

h2 {
  color: #334155;
  margin-bottom: 1rem;
  font-weight: 600;
}

/* 卡片样式 */
.bg-white {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.bg-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

/* 表单样式 */
.form-group {
  margin-bottom: 1rem;
  min-width: 150px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 按钮样式 */
button {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

button.bg-blue-600 {
  background-color: #2563eb;
  color: white;
}

button.bg-blue-600:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}

button.bg-blue-600:active {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* 表格样式 */
.table-container {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background-color: #f8fafc;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
}

.table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
  color: #4b5563;
}

.table tr:hover {
  background-color: #f9fafb;
}

.table tr:last-child td {
  border-bottom: none;
}

/* 热门图书排名样式 */
.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
}

/* 前三名特殊样式 */
.rank-gold {
  background-color: #ffd700 !important;
  color: #000 !important;
}

.rank-silver {
  background-color: #c0c0c0 !important;
  color: #000 !important;
}

.rank-bronze {
  background-color: #cd7f32 !important;
  color: #fff !important;
}

/* 数据可视化增强 */
.borrow-count {
  font-weight: 600;
  color: #1e40af;
}

/* 逾期数量样式 */
.overdue-count {
  font-weight: 600;
  color: #ef4444;
}

/* 图表容器样式 */
.chart-container {
  margin-bottom: 1rem;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .container {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .flex-wrap {
    flex-direction: column;
    gap: 1rem !important;
  }
  
  .form-group {
    width: 100%;
  }
  
  .bg-white {
    padding: 1.5rem;
  }
  
  h1 {
    font-size: 1.5rem;
  }
  
  h2 {
    font-size: 1.25rem;
  }
  
  .table th,
  .table td {
    padding: 0.5rem;
    font-size: 0.75rem;
  }
  
  .chart {
    height: 300px !important;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-white {
  animation: fadeIn 0.3s ease-out;
}

/* 数据加载状态 */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>