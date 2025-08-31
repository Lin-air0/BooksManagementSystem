// 前后端连接测试脚本
const http = require('http');
const https = require('https');
const { URL } = require('url');

// 简单的HTTP请求函数（替代axios）
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      timeout: options.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    req.end();
  });
}

// 测试配置
const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:8080';

console.log('=== 图书借阅管理系统连接测试 ===\n');

// 测试后端健康检查
async function testBackendHealth() {
  console.log('1. 测试后端服务器连接...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    console.log('✅ 后端服务器连接成功');
    console.log('   响应数据:', response.data);
    return true;
  } catch (error) {
    console.log('❌ 后端服务器连接失败');
    if (error.code === 'ECONNREFUSED') {
      console.log('   错误: 连接被拒绝，后端服务器可能未启动');
      console.log('   请在 backend 目录下运行: node server.js');
    } else {
      console.log('   错误:', error.message);
    }
    return false;
  }
}

// 测试数据库连接（通过后端API）
async function testDatabaseConnection() {
  console.log('\n2. 测试数据库连接...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/books/search?page=1&pageSize=1`, {
      timeout: 5000
    });
    console.log('✅ 数据库连接成功');
    console.log('   测试查询成功，返回数据结构正常');
    return true;
  } catch (error) {
    console.log('❌ 数据库连接失败');
    console.log('   错误:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.log('   可能原因: 数据库配置错误或数据库服务未启动');
      console.log('   请检查数据库配置: 用户名=bookadmin, 密码=BookAdmin123!, 数据库=book_management');
    }
    return false;
  }
}

// 测试前端服务器
async function testFrontendServer() {
  console.log('\n3. 测试前端服务器连接...');
  try {
    const response = await axios.get(FRONTEND_URL, {
      timeout: 5000
    });
    console.log('✅ 前端服务器连接成功');
    return true;
  } catch (error) {
    console.log('❌ 前端服务器连接失败');
    if (error.code === 'ECONNREFUSED') {
      console.log('   错误: 连接被拒绝，前端服务器可能未启动');
      console.log('   请在 frontend 目录下运行: npm run serve');
    } else {
      console.log('   错误:', error.message);
    }
    return false;
  }
}

// 测试前后端API通信
async function testAPIIntegration() {
  console.log('\n4. 测试前后端API集成...');
  try {
    // 模拟前端调用后端API的方式
    const response = await axios.get(`${BACKEND_URL}/api/books/search`, {
      params: { page: 1, pageSize: 5 },
      timeout: 5000
    });
    console.log('✅ API集成测试成功');
    console.log('   图书数据获取正常，数据条数:', response.data.data?.list?.length || response.data.length || 0);
    return true;
  } catch (error) {
    console.log('❌ API集成测试失败');
    console.log('   错误:', error.response?.data || error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  const results = {
    backend: false,
    database: false,
    frontend: false,
    integration: false
  };

  // 依次执行测试
  results.backend = await testBackendHealth();
  
  if (results.backend) {
    results.database = await testDatabaseConnection();
    results.integration = await testAPIIntegration();
  }
  
  results.frontend = await testFrontendServer();

  // 输出测试总结
  console.log('\n=== 测试结果总结 ===');
  console.log(`后端服务器: ${results.backend ? '✅' : '❌'}`);
  console.log(`数据库连接: ${results.database ? '✅' : '❌'}`);
  console.log(`前端服务器: ${results.frontend ? '✅' : '❌'}`);
  console.log(`API集成: ${results.integration ? '✅' : '❌'}`);

  // 给出建议
  console.log('\n=== 启动建议 ===');
  if (!results.backend) {
    console.log('1. 启动后端服务器:');
    console.log('   cd backend');
    console.log('   node server.js');
  }
  if (!results.frontend) {
    console.log('2. 启动前端服务器:');
    console.log('   cd frontend');
    console.log('   npm run serve');
  }
  if (!results.database) {
    console.log('3. 检查数据库配置:');
    console.log('   - 确保MySQL服务正在运行');
    console.log('   - 检查用户名: bookadmin');
    console.log('   - 检查密码: BookAdmin123!');
    console.log('   - 检查数据库: book_management');
  }

  const allSuccess = Object.values(results).every(result => result);
  console.log(`\n系统状态: ${allSuccess ? '🟢 全部正常' : '🔴 存在问题'}`);
}

// 运行测试
runTests().catch(console.error);