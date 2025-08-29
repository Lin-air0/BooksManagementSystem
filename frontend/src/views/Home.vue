<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>图书管理系统仪表盘</h1>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>数据加载中...</p>
    </div>
    
    <div v-else>
      <!-- 统计卡片区域 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon book-icon"></div>
          <div class="stat-content">
            <div class="stat-title">总图书数</div>
            <div class="stat-value">{{ totalBooks }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon borrow-icon"></div>
          <div class="stat-content">
            <div class="stat-title">在借图书数</div>
            <div class="stat-value">{{ borrowedBooks }}</div>
          </div>
        </div>
      </div>
    
    <!-- 可视化图表区 -->
    <div class="charts-container">
      <div class="chart-section">
        <div class="chart-title">图书分类占比</div>
        <div id="bookCategoryChart" class="chart"></div>
      </div>
      <div class="chart-section">
        <div class="chart-title">{{ trendChartTitle }}</div>
        <div id="borrowTrendChart" class="chart"></div>
      </div>
    </div>
    </div> <!-- 闭合v-else的div -->
  </div>
</template>

<script>
// 导入ECharts库
import * as echarts from 'echarts';
// 导入API接口
import { statisticsAPI, bookAPI, borrowAPI } from '@/utils/api';

/**
 * 首页仪表盘组件
 * 包含统计卡片和可视化图表
 */
export default {
  name: 'Home',
  data() {
    return {
      // 统计数据
      totalBooks: 0,
      borrowedBooks: 0,
      // 图表数据
      bookCategoryData: {
        legend: [],
        series: []
      },
      borrowTrendData: {
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value'
        },
        series: []
      },
      // 图表标题
      trendChartTitle: '近30天借阅量',
      // 加载状态
      isLoading: true,
      // 图表实例
      bookCategoryChart: null,
      borrowTrendChart: null
    };
  },
  mounted() {
    // 从后端获取数据
    this.fetchDashboardData();
    
    // 监听窗口大小变化，重新调整图表尺寸
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    // 移除窗口大小变化监听器
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    /**
     * 从后端获取仪表盘数据
     */
    async fetchDashboardData() {
      this.isLoading = true;
      try {
        // 准备月度统计API的参数
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // 并发请求所有需要的数据
        const [booksResponse, borrowsResponse] = await Promise.all([
          bookAPI.getBooks({ page: 1, pageSize: 100 }), // 获取所有图书
          borrowAPI.getBorrowRecords({ page: 1, pageSize: 100 }) // 获取所有借阅记录，修正pageSize限制
        ]);
        
        // 更新统计数据 - 使用后端标准响应格式
        this.totalBooks = booksResponse.data.total || booksResponse.data.length || 0;
        // 计算在借图书数量（状态为borrowed的记录）
        const borrowedRecords = borrowsResponse.data.list || borrowsResponse.data || [];
        this.borrowedBooks = borrowedRecords.filter(record => record.status === 'borrowed').length;
        
        // 处理图书分类数据
        this.processBookCategoryData(booksResponse.data.list);
        
        // 尝试获取当月数据，如果没有则尝试获取最近有数据的月份
        let monthlyStats = await statisticsAPI.getMonthlyStats({ year: currentYear, month: currentMonth });
        
        // 后端返回格式：{ code: 0, message: "success", data: { dates: [...], borrow_counts: [...] } }
        // 检查当月是否有数据
        if (!monthlyStats.data || !monthlyStats.data.dates || monthlyStats.data.dates.length === 0) {
          console.log('当月无数据，尝试获取上个月数据');
          // 尝试获取上个月数据
          const lastMonth = new Date(currentDate);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          const lastYear = lastMonth.getFullYear();
          const lastMonthNum = lastMonth.getMonth() + 1;
          
          const lastMonthStats = await statisticsAPI.getMonthlyStats({ year: lastYear, month: lastMonthNum });
          
          if (lastMonthStats.code === 0 && lastMonthStats.data && lastMonthStats.data.dates && lastMonthStats.data.dates.length > 0) {
            monthlyStats = lastMonthStats;
            this.trendChartTitle = `${lastYear}年${lastMonthNum}月借阅量`;
          } else {
            // 如果上个月也没有数据，尝试获取最近有数据的月份
            console.log('上个月也无数据，使用预设的历史数据');
            const presetStats = await statisticsAPI.getMonthlyStats({ year: 2024, month: 3 });
            if (presetStats.code === 0 && presetStats.data) {
              monthlyStats = presetStats;
              this.trendChartTitle = '2024年3月借阅量';
            } else {
              // 使用默认空数据
              monthlyStats = { data: { dates: [], borrow_counts: [] } };
              this.trendChartTitle = `${currentYear}年${currentMonth}月借阅量`;
            }
          }
        } else {
          this.trendChartTitle = `${currentYear}年${currentMonth}月借阅量`;
        }
        
        // 处理借阅趋势数据
        this.processBorrowTrendData(monthlyStats);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        alert('获取数据失败，请稍后重试');
      } finally {
        this.isLoading = false;
        // 在数据加载完成后，初始化图表
        this.$nextTick(() => {
          this.initCharts();
          this.updateCharts();
        });
      }
    },
    
    /**
     * 处理图书分类数据
     */
    processBookCategoryData(books) {
      const categoryCount = {};
      
      // 统计各分类的图书数量
      const bookList = books.list || books || [];
      bookList.forEach(book => {
        const categoryName = book.category_name || book.category || '未分类';
        if (categoryCount[categoryName]) {
          categoryCount[categoryName]++;
        } else {
          categoryCount[categoryName] = 1;
        }
      });
      
      // 转换为图表数据格式
      const legend = [];
      const seriesData = [];
      
      Object.entries(categoryCount).forEach(([category, count]) => {
        legend.push(category);
        seriesData.push({ name: category, value: count });
      });
      
      this.bookCategoryData = {
        legend,
        series: [{
          name: '分类占比',
          type: 'pie',
          radius: '60%',
          data: seriesData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
    },
    
    /**
     * 处理借阅趋势数据
     * @param {Object} monthlyStats - 月度统计数据对象
     */
    processBorrowTrendData(monthlyStats) {
      // 根据后端API实际响应格式处理数据
      if (monthlyStats && monthlyStats.data && monthlyStats.data.dates && monthlyStats.data.borrow_counts) {
        // 提取日期标签（只显示日期部分，不显示年份和月份）
        const dateLabels = monthlyStats.data.dates.map(dateStr => {
          // 处理日期格式：从"2024-03-01"提取"1"
          const date = new Date(dateStr);
          return date.getDate().toString();
        });
        
        this.borrowTrendData = {
          xAxis: {
            type: 'category',
            data: dateLabels
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            data: monthlyStats.data.borrow_counts,
            type: 'line',
            smooth: true,
            name: '借阅量'
          }]
        };
      } else {
        // 如果没有实际数据，生成默认的趋势图
        const dateLabels = [];
        const borrowCounts = [];
        
        // 从当前日期往前推30天
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.getDate().toString();
          dateLabels.push(dateStr);
          
          // 默认借阅量为0
          borrowCounts.push(0);
        }
        
        this.borrowTrendData = {
          xAxis: {
            type: 'category',
            data: dateLabels
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            data: borrowCounts,
            type: 'line',
            smooth: true,
            name: '借阅量'
          }]
        };
      }
    },
    
    /**
     * 更新图表数据
     */
    updateCharts() {
      if (this.bookCategoryChart) {
        this.bookCategoryChart.setOption({
          legend: {
            data: this.bookCategoryData.legend
          },
          series: this.bookCategoryData.series
        });
      }
      
      if (this.borrowTrendChart) {
        this.borrowTrendChart.setOption({
          xAxis: this.borrowTrendData.xAxis,
          yAxis: this.borrowTrendData.yAxis,
          series: this.borrowTrendData.series
        });
      }
    },
    
    /**
     * 初始化ECharts图表
     */
    initCharts() {
      this.initBookCategoryChart();
      this.initBorrowTrendChart();
    },
    
    /**
     * 初始化图书分类占比饼图
     */
    initBookCategoryChart() {
      const chartDom = document.getElementById('bookCategoryChart');
      const myChart = echarts.init(chartDom);
      
      // 设置图表配置
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: this.bookCategoryData.legend
        },
        series: this.bookCategoryData.series
      };
      
      myChart.setOption(option);
      // 保存图表实例以便后续操作
      this.bookCategoryChart = myChart;
    },
    
    /**
     * 初始化借阅趋势折线图
     */
    initBorrowTrendChart() {
      const chartDom = document.getElementById('borrowTrendChart');
      const myChart = echarts.init(chartDom);
      
      // 设置图表配置
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: this.borrowTrendData.xAxis,
        yAxis: this.borrowTrendData.yAxis,
        series: this.borrowTrendData.series
      };
      
      myChart.setOption(option);
      // 保存图表实例以便后续操作
      this.borrowTrendChart = myChart;
    },
    
    /**
     * 处理窗口大小变化事件
     */
    handleResize() {
      if (this.bookCategoryChart) {
        this.bookCategoryChart.resize();
      }
      if (this.borrowTrendChart) {
        this.borrowTrendChart.resize();
      }
    }
  }
};
</script>

<style scoped>
/* 仪表盘容器样式 */
.dashboard-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 仪表盘头部样式 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.dashboard-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 统计卡片容器样式 */
.stats-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

/* 统计卡片样式 */
.stat-card {
  width: 250px;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 统计卡片图标样式 */
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

/* 图书图标样式 */
.book-icon {
  background-color: #409eff;
}

/* 借阅图标样式 */
.borrow-icon {
  background-color: #67c23a;
}

/* 统计内容样式 */
.stat-content {
  flex: 1;
}

/* 统计标题样式 */
.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

/* 统计数值样式 */
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

/* 图表容器样式 */
.charts-container {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

/* 单个图表区域样式 */
.chart-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 饼图区域样式 */
.chart-section:nth-child(1) {
  width: 400px;
}

/* 折线图区域样式 */
.chart-section:nth-child(2) {
  flex: 1;
  min-width: 600px;
}

/* 图表标题样式 */
.chart-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
}

/* 图表样式 */
.chart {
  width: 100%;
  height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-cards {
    flex-direction: column;
  }
  
  .charts-container {
    flex-direction: column;
  }
  
  .chart-section:nth-child(1),
  .chart-section:nth-child(2) {
    width: 100%;
    min-width: auto;
  }
  
  .chart {
    height: 300px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>