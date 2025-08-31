<template>
  <div>
    <!-- 页面标题和筛选器 -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h1 class="text-xl font-semibold">统计分析</h1>
      <div class="flex items-center gap-3 self-end sm:self-auto">
        <div>
          <label class="block text-sm text-textSecondary mb-1">统计周期</label>
          <select 
            v-model="selectedPeriod"
            @change="updateStatistics"
            class="px-3 py-2 border border-borderMedium rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          >
            <option value="month">近一个月</option>
            <option value="quarter" selected>近三个月</option>
            <option value="halfyear">近半年</option>
            <option value="year">近一年</option>
          </select>
        </div>
        <button 
          @click="exportReport"
          class="bg-secondary text-textPrimary py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors mt-5"
          :disabled="isExporting"
        >
          <i class="fa fa-download mr-2"></i>
          {{ isExporting ? '导出中...' : '导出报表' }}
        </button>
      </div>
    </div>
    
    <!-- 核心统计指标 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <!-- 总借阅次数 -->
      <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-textSecondary text-sm">总借阅次数</p>
            <p class="text-2xl font-semibold mt-1">{{ summaryStats.totalBorrows || 0 }}</p>
            <p class="text-success text-xs mt-1">
              <i class="fa fa-arrow-up"></i> {{ summaryStats.borrowGrowth || '12.5' }}% 较上期
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <i class="fa fa-exchange"></i>
          </div>
        </div>
      </div>
      
      <!-- 活跃读者数 -->
      <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-textSecondary text-sm">活跃读者数</p>
            <p class="text-2xl font-semibold mt-1">{{ summaryStats.activeReaders || 0 }}</p>
            <p class="text-success text-xs mt-1">
              <i class="fa fa-arrow-up"></i> {{ summaryStats.readerGrowth || '8.3' }}% 较上期
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-primaryLight/10 flex items-center justify-center text-primaryLight">
            <i class="fa fa-users"></i>
          </div>
        </div>
      </div>
      
      <!-- 平均借阅时长 -->
      <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-textSecondary text-sm">平均借阅时长</p>
            <p class="text-2xl font-semibold mt-1">{{ summaryStats.avgDuration || 24 }}天</p>
            <p class="text-danger text-xs mt-1">
              <i class="fa fa-arrow-down"></i> {{ summaryStats.durationChange || '2.1' }}% 较上期
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
            <i class="fa fa-clock-o"></i>
          </div>
        </div>
      </div>
      
      <!-- 逾期率 -->
      <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-textSecondary text-sm">逾期率</p>
            <p class="text-2xl font-semibold mt-1">{{ summaryStats.overdueRate || '8.6' }}%</p>
            <p class="text-danger text-xs mt-1">
              <i class="fa fa-arrow-up"></i> {{ summaryStats.overdueChange || '1.2' }}% 较上期
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
            <i class="fa fa-exclamation-circle"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图表分析区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 分类借阅统计 -->
      <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow h-[400px]">
        <h2 class="text-lg font-semibold mb-4">分类借阅统计</h2>
        <div class="h-[calc(100%-30px)] relative">
          <div 
            id="categoryChart"
            ref="categoryChart" 
            class="w-full h-full"
            style="min-height: 320px;"
          ></div>
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <span class="text-primary">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 月度借阅趋势 -->
      <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow h-[400px]">
        <h2 class="text-lg font-semibold mb-4">月度借阅趋势</h2>
        <div class="h-[calc(100%-30px)] relative">
          <div 
            id="monthlyTrendChart"
            ref="monthlyTrendChart" 
            class="w-full h-full"
            style="min-height: 320px;"
          ></div>
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <span class="text-primary">加载中...</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 第二行图表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 读者类型分布 -->
      <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow h-[400px]">
        <h2 class="text-lg font-semibold mb-4">读者类型分布</h2>
        <div class="h-[calc(100%-30px)] relative">
          <div 
            id="readerTypeChart"
            ref="readerTypeChart" 
            class="w-full h-full"
            style="min-height: 320px;"
          ></div>
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <span class="text-primary">加载中...</span>
          </div>
        </div>
      </div>
      
      <!-- 热门图书TOP10 -->
      <div class="bg-white rounded-lg border border-borderLight p-5 card-shadow h-[400px]">
        <h2 class="text-lg font-semibold mb-4">热门图书TOP10</h2>
        <div class="h-[calc(100%-30px)] relative">
          <div 
            id="topBooksChart"
            ref="topBooksChart" 
            class="w-full h-full"
            style="min-height: 320px;"
          ></div>
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <span class="text-primary">加载中...</span>
          </div>
        </div>
      </div>
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
      // 统计周期
      selectedPeriod: 'quarter',
      
      // 核心统计指标数据
      summaryStats: {
        totalBorrows: 0,
        borrowGrowth: '12.5',
        activeReaders: 0,
        readerGrowth: '8.3',
        avgDuration: 24,
        durationChange: '2.1',
        overdueRate: '8.6',
        overdueChange: '1.2'
      },
      
      // 图表数据
      categoryData: [], // 分类图书数量数据
      categoryBorrowData: [], // 分类借阅统计数据
      monthlyTrendData: [], // 月度借阅趋势数据
      readerTypeData: [], // 读者类型分布数据
      popularBooksData: [], // 热门图书数据
      
      // 加载和导出状态
      isLoading: false,
      isExporting: false,
      
      // ECharts图表实例
      categoryChart: null,
      monthlyTrendChart: null,
      readerTypeChart: null,
      topBooksChart: null,
      
      // 图表重试计数
      categoryChartRetryCount: 0,
      monthlyTrendChartRetryCount: 0,
      readerTypeChartRetryCount: 0,
      topBooksChartRetryCount: 0
    };
  },
  
  mounted() {
    // 组件挂载后初始化统计数据
    this.updateStatistics();
    // 监听窗口大小变化，重新调整图表尺寸
    window.addEventListener('resize', this.resizeCharts);
  },
  
  beforeDestroy() {
    // 组件销毁前清理图表实例
    this.destroyCharts();
    // 移除事件监听器
    window.removeEventListener('resize', this.resizeCharts);
  },
  
  methods: {
    /**
     * 初始化统计数据
     */
    async updateStatistics() {
      this.isLoading = true;
      try {
        // 并行加载所有统计数据以提高性能
        const [
          categoryStats,
          categoryBorrowStats, // 新增：分类借阅统计
          monthlyStats,
          readerStats,
          popularBooksStats
        ] = await Promise.all([
          statisticsAPI.getCategoriesStats(),
          statisticsAPI.getCategoryBorrowStats(), // 新增：获取分类借阅统计
          statisticsAPI.getBorrowTrendAnalysis({ months: 6 }),
          statisticsAPI.getReaderBorrowAnalysis(),
          statisticsAPI.getPopularBooksRanking({ limit: 10 })
        ]);
        
        // 处理分类统计数据（图书数量）
        if ((categoryStats.code === 0 || categoryStats.code === 200) && categoryStats.data) {
          this.categoryData = Array.isArray(categoryStats.data) ? categoryStats.data : [];
        }
        
        // 处理分类借阅统计数据
        if ((categoryBorrowStats.code === 0 || categoryBorrowStats.code === 200) && categoryBorrowStats.data) {
          this.categoryBorrowData = Array.isArray(categoryBorrowStats.data) ? categoryBorrowStats.data : [];
        }
        
        // 处理月度趋势数据 - 修复数据格式问题
        if ((monthlyStats.code === 0 || monthlyStats.code === 200) && monthlyStats.data) {
          // 确保数据格式正确
          if (monthlyStats.data.labels && monthlyStats.data.borrow_counts) {
            this.monthlyTrendData = monthlyStats.data;
          } else if (Array.isArray(monthlyStats.data)) {
            // 如果是数组格式，转换为对象格式
            this.monthlyTrendData = {
              labels: monthlyStats.data.map(item => item.month || item.date),
              borrow_counts: monthlyStats.data.map(item => item.borrow_count || 0),
              return_counts: monthlyStats.data.map(item => item.return_count || 0)
            };
          } else {
            // 默认空数据
            this.monthlyTrendData = {
              labels: [],
              borrow_counts: [],
              return_counts: []
            };
          }
        }
        
        // 处理读者类型数据
        if ((readerStats.code === 0 || readerStats.code === 200) && readerStats.data) {
          this.readerTypeData = Array.isArray(readerStats.data) ? readerStats.data : [];
        }
        
        // 处理热门图书数据
        if ((popularBooksStats.code === 0 || popularBooksStats.code === 200) && popularBooksStats.data) {
          this.popularBooksData = Array.isArray(popularBooksStats.data) ? popularBooksStats.data : [];
        }
        
        // 在DOM更新后初始化所有图表
        this.$nextTick(() => {
          this.initAllCharts();
        });
        
        // 获取核心统计指标数据
        await this.fetchSummaryStats();
      } catch (error) {
        console.error('初始化统计数据失败:', error);
        alert('初始化统计数据失败: ' + error.message);
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 获取核心统计指标数据
     */
    async fetchSummaryStats() {
      try {
        // 获取总借阅次数
        const borrowStats = await statisticsAPI.getBorrowStats();
        if ((borrowStats.code === 0 || borrowStats.code === 200) && borrowStats.data) {
          // 修复：正确处理返回的数据结构
          if (borrowStats.data.total_borrows !== undefined) {
            this.summaryStats.totalBorrows = borrowStats.data.total_borrows;
          } else if (borrowStats.data.total !== undefined) {
            this.summaryStats.totalBorrows = borrowStats.data.total;
          } else if (borrowStats.data.borrow_counts) {
            // 修复：正确计算借阅总数
            this.summaryStats.totalBorrows = borrowStats.data.borrow_counts.reduce((sum, count) => sum + (count || 0), 0);
          } else if (borrowStats.data.dates && borrowStats.data.borrow_counts) {
            // 修复：处理月度统计数据格式
            this.summaryStats.totalBorrows = borrowStats.data.borrow_counts.reduce((sum, count) => sum + (count || 0), 0);
          }
        }
        
        // 获取活跃读者数 - 通过读者借阅分析API获取
        const readerStats = await statisticsAPI.getReaderBorrowAnalysis();
        if ((readerStats.code === 0 || readerStats.code === 200) && readerStats.data) {
          if (readerStats.data.active_readers !== undefined) {
            this.summaryStats.activeReaders = readerStats.data.active_readers;
          } else if (Array.isArray(readerStats.data)) {
            // 修复：正确计算活跃读者数
            const activeReaders = readerStats.data.reduce((sum, item) => sum + (item.reader_count || 0), 0);
            this.summaryStats.activeReaders = activeReaders;
          }
        }
      } catch (error) {
        console.error('获取核心统计指标失败:', error);
      }
    },
    
    /**
     * 导出报表
     */
    async exportReport() {
      this.isExporting = true;
      try {
        // 调用后端导出API
        const response = await statisticsAPI.exportStatistics({
          period: this.selectedPeriod,
          format: 'xlsx'
        });
        
        // 获取文件名 - 添加防御性编程处理headers可能为undefined的情况
        const contentDisposition = response.headers && response.headers['content-disposition'];
        let filename = '统计报表.xlsx';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }
        
        // 创建下载链接
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        window.URL.revokeObjectURL(url);
        
        // 使用alert显示成功消息，因为项目中没有引入$message组件
        alert('报表导出成功！');
      } catch (error) {
        console.error('导出报表失败:', error);
        // 使用alert显示错误消息
        alert('导出报表失败，请稍后重试');
      } finally {
        this.isExporting = false;
      }
    },
    
    /**
     * 新增统一的图表初始化方法
     */
    initAllCharts() {
      this.initCategoryChart();
      this.initMonthlyTrendChart();
      this.initReaderTypeChart();
      this.initTopBooksChart();
    },
    
    /**
     * 强制初始化图表（当重试次数用完时调用）
     */
    forceInitChart(container, chartType) {
      try {
        // 销毁现有实例
        switch (chartType) {
          case 'category':
            if (this.categoryChart) {
              this.categoryChart.dispose();
              this.categoryChart = null;
            }
            break;
          case 'monthly':
            if (this.monthlyTrendChart) {
              this.monthlyTrendChart.dispose();
              this.monthlyTrendChart = null;
            }
            break;
          case 'reader':
            if (this.readerTypeChart) {
              this.readerTypeChart.dispose();
              this.readerTypeChart = null;
            }
            break;
          case 'topBooks':
            if (this.topBooksChart) {
              this.topBooksChart.dispose();
              this.topBooksChart = null;
            }
            break;
        }
        
        // 重新初始化
        switch (chartType) {
          case 'category':
            this.initCategoryChart();
            break;
          case 'monthly':
            this.initMonthlyTrendChart();
            break;
          case 'reader':
            this.initReaderTypeChart();
            break;
          case 'topBooks':
            this.initTopBooksChart();
            break;
        }
      } catch (error) {
        console.error(`强制初始化${chartType}图表失败:`, error);
      }
    },
    
    /**
     * 初始化分类借阅统计图表
     */
    initCategoryChart() {
      try {
        // 确保DOM元素已经挂载并且有数据
        if (this.$refs.categoryChart && this.categoryBorrowData && this.categoryBorrowData.length > 0) {
          // 使用document.getElementById方式获取容器
          const container = document.getElementById('categoryChart');
          if (!container) {
            console.error('找不到分类图表容器: categoryChart');
            return;
          }
          
          // 检查容器尺寸
          const computedStyle = window.getComputedStyle(container);
          const width = parseFloat(computedStyle.width);
          const height = parseFloat(computedStyle.height);
          
          if (width === 0 || height === 0) {
            console.warn('分类图表容器尺寸为0，延迟初始化');
            // 延迟一段时间再尝试初始化，最多尝试10次
            if (this.categoryChartRetryCount < 10) {
              this.categoryChartRetryCount++;
              setTimeout(() => {
                this.initCategoryChart();
              }, 500); // 增加延迟时间到500ms
            } else {
              // 重试次数用完后强制初始化
              console.warn('分类图表重试次数用完，强制初始化');
              this.forceInitChart(container, 'category');
            }
            return;
          }
          
          // 重置重试计数
          this.categoryChartRetryCount = 0;
          
          // 如果已有实例，先销毁
          if (this.categoryChart) {
            this.categoryChart.dispose();
          }
          
          // 初始化图表
          this.categoryChart = echarts.init(container);
          
          // 准备数据 - 使用分类借阅统计数据
          const categories = this.categoryBorrowData.map(item => item.category_name || '未知分类');
          const borrowCounts = this.categoryBorrowData.map(item => item.borrow_count || 0);
          
          // 配置图表选项 - 优化版
          const option = {
            title: {
              text: '分类借阅统计',
              left: 'center',
              top: 10,
              textStyle: {
                color: '#333',
                fontSize: 16,
                fontWeight: 'normal'
              }
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              },
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#ccc',
              borderWidth: 1,
              padding: 10,
              textStyle: {
                color: '#333',
                fontSize: 12
              },
              extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);',
              formatter: function(params) {
                const param = params[0];
                return `${param.name}<br/>${param.seriesName}: ${param.value}次`;
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '20%', // 增加底部边距以容纳标签
              top: 60,
              containLabel: true
            },
            xAxis: [
              {
                type: 'category',
                data: categories,
                axisLine: {
                  lineStyle: {
                    color: '#ddd'
                  }
                },
                axisTick: {
                  alignWithLabel: true,
                  show: false
                },
                axisLabel: {
                  interval: 0, // 显示所有标签
                  rotate: 45, // 标签旋转45度防止重叠
                  margin: 20,
                  fontSize: 11,
                  color: '#666',
                  formatter: function(value) {
                    // 如果标签文字过长，进行截断处理
                    if (value && value.length > 8) {
                      return value.substring(0, 8) + '...';
                    }
                    return value;
                  }
                }
              }
            ],
            yAxis: [
              {
                type: 'value',
                name: '借阅次数',
                nameLocation: 'middle',
                nameGap: 40,
                nameTextStyle: {
                  fontSize: 12,
                  color: '#666'
                },
                axisLine: {
                  lineStyle: {
                    color: '#ddd'
                  }
                },
                axisTick: {
                  show: false
                },
                axisLabel: {
                  fontSize: 11,
                  color: '#666'
                },
                splitLine: {
                  lineStyle: {
                    type: 'dashed',
                    color: '#eee'
                  }
                }
              }
            ],
            // 添加数据缩放功能，当分类较多时可以缩放查看
            dataZoom: [
              {
                type: 'inside',
                start: 0,
                end: 100,
                zoomOnMouseWheel: 'ctrl'
              },
              {
                type: 'slider',
                start: 0,
                end: 100,
                bottom: 10,
                height: 15,
                borderColor: '#ddd',
                textStyle: {
                  fontSize: 10
                },
                handleStyle: {
                  color: '#409eff'
                },
                dataBackground: {
                  lineStyle: {
                    color: '#ddd'
                  },
                  areaStyle: {
                    color: '#f5f5f5'
                  }
                }
              }
            ],
            series: [
              {
                name: '借阅次数',
                type: 'bar',
                barWidth: '60%',
                data: borrowCounts,
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#83bff6' },
                    { offset: 0.5, color: '#188df0' },
                    { offset: 1, color: '#188df0' }
                  ]),
                  borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                  itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: '#2378f7' },
                      { offset: 0.7, color: '#2378f7' },
                      { offset: 1, color: '#83bff6' }
                    ])
                  }
                }
              }
            ]
          };
          
          this.categoryChart.setOption(option);
        } else if (this.$refs.categoryChart) {
          // 数据为空时显示提示信息
          this.$refs.categoryChart.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">暂无数据</div>';
        }
      } catch (error) {
        console.error('初始化分类图表失败:', error);
        // 显示错误提示
        if (this.$refs.categoryChart) {
          this.$refs.categoryChart.innerHTML = '<div class="chart-error flex items-center justify-center h-full text-red-500">图表初始化失败，请刷新页面重试</div>';
        }
      }
    },
    
    /**
     * 初始化月度借阅趋势图表
     */
    initMonthlyTrendChart() {
      try {
        // 确保DOM元素已经挂载并且有数据
        if (this.$refs.monthlyTrendChart && this.monthlyTrendData && 
            this.monthlyTrendData.labels && this.monthlyTrendData.labels.length > 0) {
          // 检查容器尺寸
          const container = this.$refs.monthlyTrendChart;
          const computedStyle = window.getComputedStyle(container);
          const width = parseFloat(computedStyle.width);
          const height = parseFloat(computedStyle.height);
          
          if (width === 0 || height === 0) {
            console.warn('月度趋势图表容器尺寸为0，延迟初始化');
            // 延迟一段时间再尝试初始化，最多尝试5次
            if (this.monthlyTrendChartRetryCount < 5) {
              this.monthlyTrendChartRetryCount++;
              setTimeout(() => {
                this.initMonthlyTrendChart();
              }, 300);
            }
            return;
          }
          
          // 重置重试计数
          this.monthlyTrendChartRetryCount = 0;
          
          // 如果已有实例，先销毁
          if (this.monthlyTrendChart) {
            this.monthlyTrendChart.dispose();
          }
          
          // 初始化图表
          this.monthlyTrendChart = echarts.init(container);
          
          // 准备数据 - 添加默认值处理
          const months = this.monthlyTrendData.labels || [];
          const borrowCounts = this.monthlyTrendData.borrow_counts || [];
          const returnCounts = this.monthlyTrendData.return_counts || [];
          
          // 配置图表选项 - 优化版
          const option = {
            title: {
              text: '月度借阅趋势',
              left: 'center',
              top: 10,
              textStyle: {
                color: '#333',
                fontSize: 16,
                fontWeight: 'normal'
              }
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'line',
                lineStyle: {
                  color: '#6a7985',
                  width: 1
                }
              },
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#ccc',
              borderWidth: 1,
              padding: 10,
              textStyle: {
                color: '#333',
                fontSize: 12
              },
              extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);'
            },
            legend: {
              data: ['借阅量', '归还量'],
              top: 40,
              itemWidth: 12,
              itemHeight: 12,
              itemGap: 20,
              textStyle: {
                fontSize: 12,
                color: '#666'
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '20%', // 增加底部边距以容纳标签
              top: 70,
              containLabel: true
            },
            xAxis: {
              type: 'category',
              boundaryGap: false,
              data: months,
              axisLine: {
                lineStyle: {
                  color: '#ddd'
                }
              },
              axisTick: {
                show: false
              },
              axisLabel: {
                interval: 0, // 显示所有标签
                rotate: 45, // 标签旋转45度防止重叠
                margin: 20,
                fontSize: 11,
                color: '#666',
                formatter: function(value) {
                  // 如果标签文字过长，进行截断处理
                  if (value && value.length > 10) {
                    return value.substring(0, 10) + '...';
                  }
                  return value;
                }
              }
            },
            yAxis: {
              type: 'value',
              name: '数量',
              nameLocation: 'middle',
              nameGap: 40,
              nameTextStyle: {
                fontSize: 12,
                color: '#666'
              },
              axisLine: {
                lineStyle: {
                  color: '#ddd'
                }
              },
              axisTick: {
                show: false
              },
              axisLabel: {
                fontSize: 11,
                color: '#666'
              },
              splitLine: {
                lineStyle: {
                  type: 'dashed',
                  color: '#eee'
                }
              }
            },
            // 添加数据缩放功能，当数据点较多时可以缩放查看
            dataZoom: [
              {
                type: 'inside',
                start: 0,
                end: 100,
                zoomOnMouseWheel: 'ctrl'
              },
              {
                type: 'slider',
                start: 0,
                end: 100,
                bottom: 10,
                height: 15,
                borderColor: '#ddd',
                textStyle: {
                  fontSize: 10
                },
                handleStyle: {
                  color: '#409eff'
                },
                dataBackground: {
                  lineStyle: {
                    color: '#ddd'
                  },
                  areaStyle: {
                    color: '#f5f5f5'
                  }
                }
              }
            ],
            series: [
              {
                name: '借阅量',
                type: 'line',
                data: borrowCounts,
                smooth: true, // 平滑曲线
                symbol: 'circle',
                symbolSize: 5,
                showSymbol: false, // 默认不显示符号，hover时显示
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
                      { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
                    ]
                  }
                },
                emphasis: {
                  focus: 'series',
                  lineStyle: {
                    width: 4
                  },
                  symbolSize: 6
                }
              },
              {
                name: '归还量',
                type: 'line',
                data: returnCounts,
                smooth: true, // 平滑曲线
                symbol: 'circle',
                symbolSize: 5,
                showSymbol: false, // 默认不显示符号，hover时显示
                lineStyle: {
                  color: '#67c23a',
                  width: 2
                },
                emphasis: {
                  focus: 'series',
                  lineStyle: {
                    width: 3
                  },
                  symbolSize: 6
                }
              }
            ]
          };
          
          this.monthlyTrendChart.setOption(option);
        } else if (this.$refs.monthlyTrendChart) {
          // 数据为空时显示提示信息
          this.$refs.monthlyTrendChart.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">暂无数据</div>';
        }
      } catch (error) {
        console.error('初始化月度趋势图表失败:', error);
        // 显示错误提示
        if (this.$refs.monthlyTrendChart) {
          this.$refs.monthlyTrendChart.innerHTML = '<div class="chart-error flex items-center justify-center h-full text-red-500">图表初始化失败，请刷新页面重试</div>';
        }
      }
    },
    
    /**
     * 初始化读者类型分布图表
     */
    initReaderTypeChart() {
      try {
        // 确保DOM元素已经挂载并且有数据
        if (this.$refs.readerTypeChart && this.readerTypeData && this.readerTypeData.length > 0) {
          // 检查容器尺寸
          const container = this.$refs.readerTypeChart;
          const computedStyle = window.getComputedStyle(container);
          const width = parseFloat(computedStyle.width);
          const height = parseFloat(computedStyle.height);
          
          if (width === 0 || height === 0) {
            console.warn('读者类型图表容器尺寸为0，延迟初始化');
            // 延迟一段时间再尝试初始化，最多尝试5次
            if (this.readerTypeChartRetryCount < 5) {
              this.readerTypeChartRetryCount++;
              setTimeout(() => {
                this.initReaderTypeChart();
              }, 300);
            }
            return;
          }
          
          // 重置重试计数
          this.readerTypeChartRetryCount = 0;
          
          // 如果已有实例，先销毁
          if (this.readerTypeChart) {
            this.readerTypeChart.dispose();
          }
          
          // 初始化图表
          this.readerTypeChart = echarts.init(container);
          
          // 准备数据 - 添加默认值处理
          const readerTypes = this.readerTypeData.map(item => {
            // 处理读者类型映射，将英文转换为中文
            switch(item.type_name || item.reader_type) {
              case 'student': return '学生';
              case 'teacher': return '教师';
              case 'admin': return '管理员';
              case 'staff': return '职工';
              default: return item.type_name || item.reader_type || '未知类型';
            }
          });
          const borrowCounts = this.readerTypeData.map(item => item.borrow_count || 0);
          
          // 配置图表选项 - 优化版
          const option = {
            title: {
              text: '读者类型分布',
              left: 'center',
              top: 10,
              textStyle: {
                color: '#333',
                fontSize: 16,
                fontWeight: 'normal'
              }
            },
            tooltip: {
              trigger: 'item',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#ccc',
              borderWidth: 1,
              padding: 10,
              textStyle: {
                color: '#333',
                fontSize: 12
              },
              extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);',
              formatter: function(params) {
                return `${params.seriesName}<br/>${params.name}: ${params.value}次 (${params.percent}%)`;
              }
            },
            legend: {
              top: '15%',
              left: 'left',
              orient: 'vertical',
              itemWidth: 12,
              itemHeight: 12,
              itemGap: 8,
              textStyle: {
                fontSize: 12,
                color: '#666'
              }
            },
            series: [
              {
                name: '借阅次数',
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
                      return `{name|${params.name}}\n{value|${params.value}次}`;
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
                  },
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                  }
                },
                labelLine: {
                  show: false
                },
                data: readerTypes.map((type, index) => ({
                  name: type,
                  value: borrowCounts[index]
                })),
                itemStyle: {
                  borderRadius: 6,
                  borderColor: '#fff',
                  borderWidth: 2
                }
              }
            ]
          };
          
          this.readerTypeChart.setOption(option);
        } else if (this.$refs.readerTypeChart) {
          // 数据为空时显示提示信息
          this.$refs.readerTypeChart.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">暂无数据</div>';
        }
      } catch (error) {
        console.error('初始化读者类型图表失败:', error);
        // 显示错误提示
        if (this.$refs.readerTypeChart) {
          this.$refs.readerTypeChart.innerHTML = '<div class="chart-error flex items-center justify-center h-full text-red-500">图表初始化失败，请刷新页面重试</div>';
        }
      }
    },
    
    /**
     * 初始化热门图书TOP10图表
     */
    initTopBooksChart() {
      try {
        // 确保DOM元素已经挂载并且有数据
        if (this.$refs.topBooksChart && this.popularBooksData && this.popularBooksData.length > 0) {
          // 检查容器尺寸
          const container = this.$refs.topBooksChart;
          const computedStyle = window.getComputedStyle(container);
          const width = parseFloat(computedStyle.width);
          const height = parseFloat(computedStyle.height);
          
          if (width === 0 || height === 0) {
            console.warn('热门图书图表容器尺寸为0，延迟初始化');
            // 延迟一段时间再尝试初始化，最多尝试5次
            if (this.topBooksChartRetryCount < 5) {
              this.topBooksChartRetryCount++;
              setTimeout(() => {
                this.initTopBooksChart();
              }, 300);
            }
            return;
          }
          
          // 重置重试计数
          this.topBooksChartRetryCount = 0;
          
          // 如果已有实例，先销毁
          if (this.topBooksChart) {
            this.topBooksChart.dispose();
          }
          
          // 初始化图表
          this.topBooksChart = echarts.init(container);
          
          // 准备数据 - 添加默认值处理
          const bookNames = this.popularBooksData.map(item => item.title || item.name || '未知图书');
          const borrowCounts = this.popularBooksData.map(item => item.borrow_count || 0);
          
          // 配置图表选项 - 优化版
          const option = {
            title: {
              text: '热门图书TOP10',
              left: 'center',
              top: 10,
              textStyle: {
                color: '#333',
                fontSize: 16,
                fontWeight: 'normal'
              }
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              },
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: '#ccc',
              borderWidth: 1,
              padding: 10,
              textStyle: {
                color: '#333',
                fontSize: 12
              },
              extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);',
              formatter: function(params) {
                const param = params[0];
                return `${param.name}<br/>${param.seriesName}: ${param.value}次`;
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '20%', // 增加底部边距以容纳标签
              top: 60,
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: bookNames,
              axisLine: {
                lineStyle: {
                  color: '#ddd'
                }
              },
              axisTick: {
                alignWithLabel: true,
                show: false
              },
              axisLabel: {
                interval: 0, // 显示所有标签
                rotate: 45, // 标签旋转45度防止重叠
                margin: 20,
                fontSize: 11,
                color: '#666',
                formatter: function(value) {
                  // 如果标签文字过长，进行截断处理
                  if (value && value.length > 8) {
                    return value.substring(0, 8) + '...';
                  }
                  return value;
                }
              }
            },
            yAxis: {
              type: 'value',
              name: '借阅次数',
              nameLocation: 'middle',
              nameGap: 40,
              nameTextStyle: {
                fontSize: 12,
                color: '#666'
              },
              axisLine: {
                lineStyle: {
                  color: '#ddd'
                }
              },
              axisTick: {
                show: false
              },
              axisLabel: {
                fontSize: 11,
                color: '#666'
              },
              splitLine: {
                lineStyle: {
                  type: 'dashed',
                  color: '#eee'
                }
              }
            },
            series: [
              {
                name: '借阅次数',
                type: 'bar',
                data: borrowCounts,
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#83bff6' },
                    { offset: 0.5, color: '#188df0' },
                    { offset: 1, color: '#188df0' }
                  ]),
                  borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                  itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: '#2378f7' },
                      { offset: 0.7, color: '#2378f7' },
                      { offset: 1, color: '#83bff6' }
                    ])
                  }
                },
                barWidth: '60%',
                barGap: '0%'
              }
            ]
          };
          
          this.topBooksChart.setOption(option);
        } else if (this.$refs.topBooksChart) {
          // 数据为空时显示提示信息
          this.$refs.topBooksChart.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">暂无数据</div>';
        }
      } catch (error) {
        console.error('初始化热门图书图表失败:', error);
        // 显示错误提示
        if (this.$refs.topBooksChart) {
          this.$refs.topBooksChart.innerHTML = '<div class="chart-error flex items-center justify-center h-full text-red-500">图表初始化失败，请刷新页面重试</div>';
        }
      }
    },
    
    /**
     * 销毁所有图表实例
     */
    destroyCharts() {
      if (this.categoryChart) {
        this.categoryChart.dispose();
        this.categoryChart = null;
      }
      if (this.monthlyTrendChart) {
        this.monthlyTrendChart.dispose();
        this.monthlyTrendChart = null;
      }
      if (this.readerTypeChart) {
        this.readerTypeChart.dispose();
        this.readerTypeChart = null;
      }
      if (this.topBooksChart) {
        this.topBooksChart.dispose();
        this.topBooksChart = null;
      }
    },
    
    /**
     * 重新调整图表尺寸
     */
    resizeCharts() {
      if (this.categoryChart) {
        this.categoryChart.resize();
      }
      if (this.monthlyTrendChart) {
        this.monthlyTrendChart.resize();
      }
      if (this.readerTypeChart) {
        this.readerTypeChart.resize();
      }
      if (this.topBooksChart) {
        this.topBooksChart.resize();
      }
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

/* 库存周转率相关样式 */
.turnover-rate {
  font-weight: 600;
  color: #059669;
}

.utilization-rate {
  font-weight: 600;
  color: #2563eb;
}

.efficiency-score {
  font-weight: 600;
  color: #7c3aed;
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
