<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <h1 class="text-xl font-semibold mb-6">仪表盘</h1>
    
    <!-- 统计卡片区域 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
    <!-- 总图书数 -->
    <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-textSecondary text-sm">总图书数</p>
          <p class="text-2xl font-semibold mt-1">{{ totalBooks }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <i class="fa fa-book"></i>
        </div>
      </div>
    </div>
    
    <!-- 在借数 -->
    <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-textSecondary text-sm">在借数</p>
          <p class="text-2xl font-semibold mt-1">{{ borrowedBooks }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-primaryLight/10 flex items-center justify-center text-primaryLight">
          <i class="fa fa-arrow-circle-right"></i>
        </div>
      </div>
    </div>
    
    <!-- 逾期数 -->
    <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-textSecondary text-sm">逾期数</p>
          <p class="text-2xl font-semibold mt-1 text-danger">{{ overdueBooks }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
          <i class="fa fa-exclamation-triangle"></i>
        </div>
      </div>
    </div>
    
    <!-- 可借数 -->
    <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-textSecondary text-sm">可借数</p>
          <p class="text-2xl font-semibold mt-1 text-success">{{ availableBooks }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
          <i class="fa fa-check-circle"></i>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 图表预览区域 -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- 借阅趋势图 -->
    <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow h-[400px]">
      <h2 class="text-lg font-semibold mb-4">借阅趋势图</h2>
      <div class="h-[calc(100%-2rem)] relative">
        <div
          id="borrowTrendChart"
          ref="borrowTrendChart"
          class="w-full h-full"
          style="min-height: 320px;"
        ></div>
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <span class="text-primary">加载中...</span>
        </div>
      </div>
    </div>
    
    <!-- 图书分类分布 -->
    <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow h-[400px]">
      <h2 class="text-lg font-semibold mb-4">图书分类分布</h2>
      <div class="h-[calc(100%-2rem)] relative">
        <div
          id="bookCategoryChart"
          ref="bookCategoryChart"
          class="w-full h-full"
          style="min-height: 320px;"
        ></div>
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <span class="text-primary">加载中...</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 快速操作区域 -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <button class="btn-primary" @click="goToAddBook">
      <i class="fa fa-plus mr-2"></i>添加图书
    </button>
    <button class="btn-secondary" @click="goToReaderRegister">
      <i class="fa fa-user-plus mr-2"></i>读者注册
    </button>
    <button class="btn-secondary" @click="goToBorrowRecord">
      <i class="fa fa-search mr-2"></i>借阅记录查询
    </button>
  </div>
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
      overdueBooks: 0,
      availableBooks: 0,
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
    // 从后端获取数据并初始化图表
    this.$nextTick(() => {
      this.fetchDashboardData().then(() => {
        // 确保DOM已完全渲染后再初始化图表
        this.$nextTick(() => {
          this.initCharts();
        });
      });
    });
    
    // 监听窗口大小变化，重新调整图表尺寸
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    // 移除窗口大小变化监听器
    window.removeEventListener('resize', this.handleResize);
    
    // 销毁图表实例
    if (this.bookCategoryChart) {
      this.bookCategoryChart.dispose();
      this.bookCategoryChart = null;
    }
    if (this.borrowTrendChart) {
      this.borrowTrendChart.dispose();
      this.borrowTrendChart = null;
    }
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
        // 计算在借图书数量和逾期数量
        const borrowedRecords = borrowsResponse.data.list || borrowsResponse.data || [];
        this.borrowedBooks = borrowedRecords.filter(record => record.status === 'borrowed').length;
        this.overdueBooks = borrowedRecords.filter(record => record.status === 'overdue').length;
        
        // 修复可借数计算：从图书数据中累加每本书的available字段
        const bookList = booksResponse.data.list || [];
        this.availableBooks = bookList.reduce((sum, book) => sum + (book.available || 0), 0);
        
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
     * 跳转到添加图书页面
     */
    goToAddBook() {
      this.$router.push('/book-list');
    },
    
    /**
     * 跳转到读者注册页面
     */
    goToReaderRegister() {
      this.$router.push('/reader-manage');
    },
    
    /**
     * 跳转到借阅记录查询页面
     */
    goToBorrowRecord() {
      this.$router.push('/borrow-record');
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
          radius: ['40%', '70%'],
          center: ['65%', '55%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold',
              formatter: function(params) {
                return `{name|${params.name}}\n{value|${params.value}本}`;
              },
              rich: {
                name: {
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20
                },
                value: {
                  fontSize: 16,
                  color: '#333',
                  fontWeight: 'bold',
                  lineHeight: 24
                }
              }
            }
          },
          labelLine: {
            show: false
          },
          data: seriesData,
          itemStyle: {
            borderRadius: 6,
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
        this.overdueBooks = borrowedRecords.filter(record => record.status === 'overdue').length;
        // 修复可借数计算：从图书数据中累加每本书的available字段
        const bookList = booksResponse.data.list || [];
        this.availableBooks = bookList.reduce((sum, book) => sum + (book.available || 0), 0);
        
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
      this.overdueBooks = 3; // 模拟数据
      this.availableBooks = 19; // 模拟数据，修复为直接设置正确的可借数
      
      // 默认分类数据 - 更新为新的配置格式
      this.bookCategoryData = {
        legend: ['计算机', '文学小说', '科学', '哲学'],
        series: [{
          name: '分类占比',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['65%', '55%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold',
              formatter: function(params) {
                return `{name|${params.name}}\n{value|${params.value}本}`;
              },
              rich: {
                name: {
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20
                },
                value: {
                  fontSize: 16,
                  color: '#333',
                  fontWeight: 'bold',
                  lineHeight: 24
                }
              }
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { name: '计算机', value: 8 },
            { name: '文学小说', value: 6 },
            { name: '科学', value: 7 },
            { name: '哲学', value: 6 }
          ],
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          }
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
          radius: ['40%', '70%'],
          center: ['65%', '55%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold',
              formatter: function(params) {
                return `{name|${params.name}}\n{value|${params.value}本}`;
              },
              rich: {
                name: {
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 20
                },
                value: {
                  fontSize: 16,
                  color: '#333',
                  fontWeight: 'bold',
                  lineHeight: 24
                }
              }
            }
          },
          labelLine: {
            show: false
          },
          data: seriesData,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
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
      
      // 设置图表配置 - 优化版
      const option = {
        title: {
          text: '图书分类分布',
          left: 'center',
          top: 10,
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
          left: 'left',
          top: 'middle',
          left: 10,
          textStyle: {
            fontSize: 12
          },
          // 优化图例显示，避免重叠
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 6
        },
        series: [
          {
            name: '分类占比',
            type: 'pie',
            radius: ['40%', '70%'], // 环形饼图
            center: ['65%', '55%'], // 调整中心位置
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '14',
                fontWeight: 'bold',
                formatter: function(params) {
                  return `{name|${params.name}}\n{value|${params.value}本}`;
                },
                rich: {
                  name: {
                    fontSize: 14,
                    color: '#666',
                    lineHeight: 20
                  },
                  value: {
                    fontSize: 16,
                    color: '#333',
                    fontWeight: 'bold',
                    lineHeight: 24
                  }
                }
              }
            },
            labelLine: {
              show: false
            },
            data: this.bookCategoryData.series[0].data,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ]
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
    },
    
    /**
     * 更新图表数据
     */
    updateCharts() {
      // 更新分类饼图
      if (this.bookCategoryChart && this.bookCategoryData.series) {
        this.bookCategoryChart.setOption({
          legend: {
            data: this.bookCategoryData.legend
          },
          series: [
            {
              name: '分类占比',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['65%', '55%'],
              avoidLabelOverlap: false,
              label: {
                show: false,
                position: 'center'
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '14',
                  fontWeight: 'bold',
                  formatter: function(params) {
                    return `{name|${params.name}}\n{value|${params.value}本}`;
                  },
                  rich: {
                    name: {
                      fontSize: 14,
                      color: '#666',
                      lineHeight: 20
                    },
                    value: {
                      fontSize: 16,
                      color: '#333',
                      fontWeight: 'bold',
                      lineHeight: 24
                    }
                  }
                }
              },
              labelLine: {
                show: false
              },
              data: this.bookCategoryData.series[0].data,
              itemStyle: {
                borderRadius: 6,
                borderColor: '#fff',
                borderWidth: 2
              }
            }
          ]
        });
      }
      
      // 更新趋势折线图
      if (this.borrowTrendChart && this.borrowTrendData.series) {
        this.borrowTrendChart.setOption({
          title: {
            text: this.trendChartTitle
          },
          xAxis: this.borrowTrendData.xAxis,
          series: this.borrowTrendData.series
        });
      }
    }
  }
};
</script>

<style scoped>
/* 修复 ECharts 图表在 Tailwind CSS 环境下的显示问题 */
.dashboard-container {
  padding: 1rem;
  min-height: 100vh;
  background-color: #f9fafb;
}

#borrowTrendChart,
#bookCategoryChart {
  width: 100% !important;
  height: 100% !important;
  min-height: 300px;
  display: block;
}
</style>