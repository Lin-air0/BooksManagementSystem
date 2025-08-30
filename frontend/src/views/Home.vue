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
        // 并发请求所有需要的数据 - 使用第2阶段新的统计API
        const [booksResponse, borrowsResponse, categoriesResponse, trendsResponse] = await Promise.all([
          bookAPI.getBooks({ page: 1, pageSize: 100 }), // 获取图书数据
          borrowAPI.getBorrowRecords({ page: 1, pageSize: 100 }), // 获取借阅记录
          statisticsAPI.getCategoriesStats(), // 【第2阶段新增】获取分类分布统计
          statisticsAPI.getBorrowTrends({ months: 6 }) // 【第2阶段新增】获取借阅趋势统计
        ]);
        
        // 更新统计数据 - 使用后端标准响应格式
        this.totalBooks = booksResponse.data.total || booksResponse.data.list?.length || 0;
        // 计算在借图书数量（状态为borrowed的记录）
        const borrowedRecords = borrowsResponse.data.list || borrowsResponse.data || [];
        this.borrowedBooks = borrowedRecords.filter(record => record.status === 'borrowed').length;
        
        // 【第2阶段更新】使用新的分类统计API数据
        if (categoriesResponse.success && categoriesResponse.data) {
          this.processNewCategoryData(categoriesResponse.data);
        } else {
          // 降级处理：使用原有方法处理图书分类数据
          this.processBookCategoryData(booksResponse.data.list);
        }
        
        // 【第2阶段更新】使用新的趋势统计API数据
        if (trendsResponse.success && trendsResponse.data) {
          this.processNewTrendData(trendsResponse.data);
          this.trendChartTitle = '近6个月借阅趋势';
        } else {
          // 降级处理：使用原有方法获取月度数据
          await this.fetchLegacyTrendData();
        }
        
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
        // 降级处理：使用原有方法获取数据
        await this.fetchLegacyData();
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
     * 【第2阶段新增】处理新的分类统计API数据
     * @param {Array} categoriesData - 分类统计数据数组
     */
    processNewCategoryData(categoriesData) {
      const legend = [];
      const seriesData = [];
      
      // 处理新API返回的数据格式
      categoriesData.forEach(category => {
        const categoryName = category.category_name || '未分类';
        const bookCount = category.book_count || 0;
        
        if (bookCount > 0) { // 只显示有图书的分类
          legend.push(categoryName);
          seriesData.push({ 
            name: categoryName, 
            value: bookCount,
            percentage: category.percentage || '0.0'
          });
        }
      });
      
      this.bookCategoryData = {
        legend,
        series: [{
          name: '分类占比',
          type: 'pie',
          radius: ['40%', '70%'], // 使用环形饶图样式
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: seriesData,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          }
        }]
      };
    },
    
    /**
     * 【第2阶段新增】处理新的月度趋势统计API数据
     * @param {Object} trendsData - 趋势统计数据对象
     */
    processNewTrendData(trendsData) {
      // 处理新API返回的数据格式
      const labels = trendsData.labels || [];
      const borrowCounts = trendsData.borrow_counts || [];
      const returnCounts = trendsData.return_counts || [];
      const overdueCounts = trendsData.overdue_counts || [];
      
      // 转换时间标签显示格式（只显示月份）
      const monthLabels = labels.map(label => {
        // 从 "2024-08" 转为 "8月"
        const parts = label.split('-');
        return parts.length > 1 ? `${parseInt(parts[1])}月` : label;
      });
      
      this.borrowTrendData = {
        xAxis: {
          type: 'category',
          data: monthLabels,
          axisLabel: {
            interval: 0,
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '数量'
        },
        series: [
          {
            name: '借阅量',
            data: borrowCounts,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              color: '#409eff',
              width: 3
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
                ]
              }
            }
          },
          {
            name: '归还量',
            data: returnCounts,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              color: '#67c23a',
              width: 2
            }
          },
          {
            name: '逾期量',
            data: overdueCounts,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              color: '#f56c6c',
              width: 2
            }
          }
        ]
      };
    },
    
    /**
     * 降级处理：使用原有方法获取数据（当新API失败时）
     */
    async fetchLegacyData() {
      try {
        const [booksResponse, borrowsResponse] = await Promise.all([
          bookAPI.getBooks({ page: 1, pageSize: 100 }),
          borrowAPI.getBorrowRecords({ page: 1, pageSize: 100 })
        ]);
        
        this.totalBooks = booksResponse.data.total || booksResponse.data.length || 0;
        const borrowedRecords = borrowsResponse.data.list || borrowsResponse.data || [];
        this.borrowedBooks = borrowedRecords.filter(record => record.status === 'borrowed').length;
        
        this.processBookCategoryData(booksResponse.data.list);
        await this.fetchLegacyTrendData();
      } catch (error) {
        console.error('降级数据获取也失败:', error);
        this.useDefaultData();
      }
    },
    
    /**
     * 降级处理：使用原有方法获取趋势数据
     */
    async fetchLegacyTrendData() {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      try {
        let monthlyStats = await statisticsAPI.getMonthlyStats({ year: currentYear, month: currentMonth });
        
        if (!monthlyStats.data || !monthlyStats.data.dates || monthlyStats.data.dates.length === 0) {
          // 尝试上个月
          const lastMonth = new Date(currentDate);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          const lastYear = lastMonth.getFullYear();
          const lastMonthNum = lastMonth.getMonth() + 1;
          
          const lastMonthStats = await statisticsAPI.getMonthlyStats({ year: lastYear, month: lastMonthNum });
          if (lastMonthStats.code === 0 && lastMonthStats.data) {
            monthlyStats = lastMonthStats;
            this.trendChartTitle = `${lastYear}年${lastMonthNum}月借阅量`;
          } else {
            monthlyStats = { data: { dates: [], borrow_counts: [] } };
            this.trendChartTitle = `${currentYear}年${currentMonth}月借阅量`;
          }
        } else {
          this.trendChartTitle = `${currentYear}年${currentMonth}月借阅量`;
        }
        
        this.processBorrowTrendData(monthlyStats);
      } catch (error) {
        console.error('获取传统趋势数据失败:', error);
        this.useDefaultTrendData();
      }
    },
    
    /**
     * 使用默认数据（当所有API都失败时）
     */
    useDefaultData() {
      this.totalBooks = 27; // 模拟数据
      this.borrowedBooks = 8; // 模拟数据
      
      // 默认分类数据
      this.bookCategoryData = {
        legend: ['计算机', '文学小说', '科学', '哲学'],
        series: [{
          name: '分类占比',
          type: 'pie',
          radius: '60%',
          data: [
            { name: '计算机', value: 8 },
            { name: '文学小说', value: 6 },
            { name: '科学', value: 7 },
            { name: '哲学', value: 6 }
          ]
        }]
      };
      
      this.useDefaultTrendData();
    },
    
    /**
     * 使用默认趋势数据
     */
    useDefaultTrendData() {
      const dateLabels = [];
      const borrowCounts = [];
      
      // 生成最近30天的模拟数据
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dateLabels.push(date.getDate().toString());
        borrowCounts.push(Math.floor(Math.random() * 10)); // 随机模拟数据
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
      
      this.trendChartTitle = '近30天借阅趋势（模拟数据）';
    },
    
    /**
     * 处理图书分类数据（原有方法，保持向后兼容）
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
     * 初始化图书分类占比饼图（第2阶段增强版）
     */
    initBookCategoryChart() {
      const chartDom = document.getElementById('bookCategoryChart');
      if (!chartDom) {
        console.error('找不到图表容器: bookCategoryChart');
        return;
      }
      
      const myChart = echarts.init(chartDom);
      
      // 设置图表配置 - 第2阶段增强版
      const option = {
        title: {
          text: '图书分类分布',
          left: 'center',
          top: 20,
          textStyle: {
            color: '#333',
            fontSize: 16
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const percentage = params.data.percentage || ((params.value / params.data.total) * 100).toFixed(1);
            return `${params.seriesName}<br/>${params.name}: ${params.value}本 (${percentage}%)`;
          }
        },
        legend: {
          orient: 'vertical',
          left: 10,
          top: 60,
          data: this.bookCategoryData.legend,
          textStyle: {
            fontSize: 12
          }
        },
        series: this.bookCategoryData.series
      };
      
      myChart.setOption(option);
      // 保存图表实例以便后续操作
      this.bookCategoryChart = myChart;
    },
    
    /**
     * 初始化借阅趋势折线图（第2阶段增强版）
     */
    initBorrowTrendChart() {
      const chartDom = document.getElementById('borrowTrendChart');
      if (!chartDom) {
        console.error('找不到图表容器: borrowTrendChart');
        return;
      }
      
      const myChart = echarts.init(chartDom);
      
      // 设置图表配置 - 第2阶段增强版
      const option = {
        title: {
          text: this.trendChartTitle,
          left: 'center',
          top: 20,
          textStyle: {
            color: '#333',
            fontSize: 16
          }
        },
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
          data: ['借阅量', '归还量', '逾期量'],
          top: 50
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: 80,
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