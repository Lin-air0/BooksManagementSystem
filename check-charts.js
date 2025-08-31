const { chromium } = require('playwright');

async function checkCharts() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 导航到统计分析页面
    await page.goto('http://localhost:8080/#/statistics');
    
    // 等待页面加载完成
    await page.waitForTimeout(5000);
    
    // 检查分类借阅统计图表
    const categoryChart = await page.$('#categoryChart');
    if (categoryChart) {
      const categoryChartContent = await categoryChart.innerHTML();
      console.log('分类借阅统计图表内容:', categoryChartContent);
      
      // 检查是否有图表元素（canvas或svg）
      const hasCanvas = categoryChartContent.includes('<canvas') || categoryChartContent.includes('canvas');
      const hasSVG = categoryChartContent.includes('<svg') || categoryChartContent.includes('svg');
      
      console.log('分类图表是否有Canvas:', hasCanvas);
      console.log('分类图表是否有SVG:', hasSVG);
    } else {
      console.log('未找到分类借阅统计图表容器');
    }
    
    // 检查月度借阅趋势图表
    const monthlyTrendChart = await page.$('#monthlyTrendChart');
    if (monthlyTrendChart) {
      const monthlyTrendChartContent = await monthlyTrendChart.innerHTML();
      console.log('月度借阅趋势图表内容:', monthlyTrendChartContent);
      
      // 检查是否有图表元素（canvas或svg）
      const hasCanvas = monthlyTrendChartContent.includes('<canvas') || monthlyTrendChartContent.includes('canvas');
      const hasSVG = monthlyTrendChartContent.includes('<svg') || monthlyTrendChartContent.includes('svg');
      
      console.log('月度趋势图表是否有Canvas:', hasCanvas);
      console.log('月度趋势图表是否有SVG:', hasSVG);
    } else {
      console.log('未找到月度借阅趋势图表容器');
    }
    
    // 检查读者类型分布图表
    const readerTypeChart = await page.$('#readerTypeChart');
    if (readerTypeChart) {
      const readerTypeChartContent = await readerTypeChart.innerHTML();
      console.log('读者类型分布图表内容:', readerTypeChartContent);
      
      // 检查是否有图表元素（canvas或svg）
      const hasCanvas = readerTypeChartContent.includes('<canvas') || readerTypeChartContent.includes('canvas');
      const hasSVG = readerTypeChartContent.includes('<svg') || readerTypeChartContent.includes('svg');
      
      console.log('读者类型图表是否有Canvas:', hasCanvas);
      console.log('读者类型图表是否有SVG:', hasSVG);
    } else {
      console.log('未找到读者类型分布图表容器');
    }
    
    // 检查热门图书TOP10图表
    const topBooksChart = await page.$('#topBooksChart');
    if (topBooksChart) {
      const topBooksChartContent = await topBooksChart.innerHTML();
      console.log('热门图书TOP10图表内容:', topBooksChartContent);
      
      // 检查是否有图表元素（canvas或svg）
      const hasCanvas = topBooksChartContent.includes('<canvas') || topBooksChartContent.includes('canvas');
      const hasSVG = topBooksChartContent.includes('<svg') || topBooksChartContent.includes('svg');
      
      console.log('热门图书图表是否有Canvas:', hasCanvas);
      console.log('热门图书图表是否有SVG:', hasSVG);
    } else {
      console.log('未找到热门图书TOP10图表容器');
    }
    
    // 等待一段时间以便观察
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error('检查图表时出错:', error);
  } finally {
    await browser.close();
  }
}

checkCharts();