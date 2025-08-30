/**
 * 第4阶段统计分析API测试脚本
 * 测试热门图书排行和读者借阅分析功能
 */

const axios = require('axios');

// 后端服务器基础URL
const BASE_URL = 'http://localhost:3000/api';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 测试结果存储
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 记录测试结果
function recordTest(testName, success, message = '') {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${testName}: 通过`);
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, message });
    console.log(`❌ ${testName}: 失败 - ${message}`);
  }
}

// 延时函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 测试热门图书排行API
 */
async function testPopularBooksAPI() {
  console.log('\n🔍 测试热门图书排行API...');
  
  try {
    // 测试1: 默认参数查询
    console.log('\n📋 测试1: 默认参数查询');
    const response1 = await api.get('/statistics/books/popular');
    
    if (response1.status === 200 && response1.data.success) {
      recordTest('热门图书默认查询', true);
      console.log(`   📊 返回${response1.data.data.length}本热门图书`);
      console.log(`   📖 示例图书: ${response1.data.data[0]?.title || '无数据'}`);
      console.log(`   📈 借阅次数: ${response1.data.data[0]?.borrow_count || 0}`);
    } else {
      recordTest('热门图书默认查询', false, '响应格式错误');
    }
    
    await sleep(500);
    
    // 测试2: 限制数量查询
    console.log('\n📋 测试2: 限制数量查询(limit=5)');
    const response2 = await api.get('/statistics/books/popular?limit=5');
    
    if (response2.status === 200 && response2.data.data.length <= 5) {
      recordTest('热门图书限制数量查询', true);
      console.log(`   📊 返回${response2.data.data.length}本图书（符合limit=5限制）`);
    } else {
      recordTest('热门图书限制数量查询', false, '数量限制未生效');
    }
    
    await sleep(500);
    
    // 测试3: 时间周期查询
    console.log('\n📋 测试3: 近1个月热门图书查询');
    const response3 = await api.get('/statistics/books/popular?period=month&limit=3');
    
    if (response3.status === 200 && response3.data.success) {
      recordTest('热门图书时间周期查询', true);
      console.log(`   📊 近1个月热门图书: ${response3.data.data.length}本`);
      console.log(`   🏆 Top 1: ${response3.data.data[0]?.title || '无数据'}`);
    } else {
      recordTest('热门图书时间周期查询', false, '时间周期查询失败');
    }
    
    await sleep(500);
    
    // 测试4: 参数校验测试
    console.log('\n📋 测试4: 无效参数校验');
    try {
      const response4 = await api.get('/statistics/books/popular?period=invalid');
      recordTest('热门图书参数校验', response4.status === 400, '应该返回400错误');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        recordTest('热门图书参数校验', true);
        console.log('   ✅ 参数校验正常工作');
      } else {
        recordTest('热门图书参数校验', false, '参数校验异常');
      }
    }
    
  } catch (error) {
    recordTest('热门图书API总体测试', false, `请求失败: ${error.message}`);
  }
}

/**
 * 测试读者借阅分析API
 */
async function testReaderBorrowsAPI() {
  console.log('\n🔍 测试读者借阅分析API...');
  
  try {
    // 测试1: 默认查询
    console.log('\n📋 测试1: 默认读者借阅分析');
    const response1 = await api.get('/statistics/readers/borrows');
    
    if (response1.status === 200 && response1.data.success) {
      recordTest('读者借阅分析默认查询', true);
      console.log(`   📊 读者类型数量: ${response1.data.data.length}`);
      
      response1.data.data.forEach(item => {
        console.log(`   👥 ${item.type_name}: ${item.borrow_count}次借阅 (${item.percentage}%)`);
      });
      
      if (response1.data.summary) {
        console.log(`   📈 总借阅量: ${response1.data.summary.total_borrows}`);
        console.log(`   👤 活跃读者: ${response1.data.summary.total_active_readers}人`);
      }
    } else {
      recordTest('读者借阅分析默认查询', false, '响应格式错误');
    }
    
    await sleep(500);
    
    // 测试2: 时间周期查询
    console.log('\n📋 测试2: 近1年读者借阅分析');
    const response2 = await api.get('/statistics/readers/borrows?period=year');
    
    if (response2.status === 200 && response2.data.success) {
      recordTest('读者借阅分析时间周期查询', true);
      console.log(`   📊 近1年数据: ${response2.data.data.length}种读者类型`);
      console.log(`   📅 周期: ${response2.data.summary?.period || 'year'}`);
    } else {
      recordTest('读者借阅分析时间周期查询', false, '时间周期查询失败');
    }
    
    await sleep(500);
    
    // 测试3: 数据完整性验证
    console.log('\n📋 测试3: 数据完整性验证');
    const response3 = await api.get('/statistics/readers/borrows');
    
    if (response3.status === 200 && response3.data.data) {
      let totalPercentage = 0;
      let validData = true;
      
      response3.data.data.forEach(item => {
        totalPercentage += item.percentage;
        if (!item.reader_type || typeof item.borrow_count !== 'number') {
          validData = false;
        }
      });
      
      // 百分比总和应该接近100%（允许四舍五入误差）
      const percentageValid = Math.abs(totalPercentage - 100) <= 0.5 || totalPercentage === 0;
      
      recordTest('读者借阅数据完整性', validData && percentageValid);
      console.log(`   📊 百分比总和: ${totalPercentage.toFixed(1)}%`);
      console.log(`   ✅ 数据格式: ${validData ? '正确' : '错误'}`);
    } else {
      recordTest('读者借阅数据完整性', false, '无法获取数据');
    }
    
  } catch (error) {
    recordTest('读者借阅分析API总体测试', false, `请求失败: ${error.message}`);
  }
}

/**
 * 测试API性能
 */
async function testAPIPerformance() {
  console.log('\n🔍 测试API性能...');
  
  const performanceTests = [
    { name: '热门图书查询', url: '/statistics/books/popular?limit=20' },
    { name: '读者借阅分析', url: '/statistics/readers/borrows' }
  ];
  
  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      const response = await api.get(test.url);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.status === 200 && duration < 3000) {
        recordTest(`${test.name}性能`, true);
        console.log(`   ⏱️  响应时间: ${duration}ms`);
      } else {
        recordTest(`${test.name}性能`, false, `响应时间过长: ${duration}ms`);
      }
    } catch (error) {
      recordTest(`${test.name}性能`, false, `性能测试失败: ${error.message}`);
    }
    
    await sleep(300);
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始第4阶段统计分析API测试...');
  console.log('=' .repeat(60));
  
  // 检查服务器连接
  try {
    await api.get('/health');
    console.log('✅ 后端服务器连接正常');
  } catch (error) {
    console.log('❌ 无法连接到后端服务器，请确保服务器运行在端口3000');
    return;
  }
  
  // 执行测试
  await testPopularBooksAPI();
  await testReaderBorrowsAPI();
  await testAPIPerformance();
  
  // 输出测试总结
  console.log('\n' + '=' .repeat(60));
  console.log('📊 测试总结:');
  console.log(`   总测试数: ${testResults.total}`);
  console.log(`   通过数: ${testResults.passed}`);
  console.log(`   失败数: ${testResults.failed}`);
  console.log(`   通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach(error => {
      console.log(`   - ${error.test}: ${error.message}`);
    });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 所有测试通过！第4阶段统计API开发成功！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查后端实现。');
  }
}

// 执行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试执行出错:', error);
  });
}

module.exports = {
  runTests,
  testPopularBooksAPI,
  testReaderBorrowsAPI,
  testAPIPerformance
};