// 版本：v1.0.0，适配图书借阅系统 MVP 阶段
// API测试工具 - 用于验证前后端联调

import { bookAPI, readerAPI, borrowAPI, statisticsAPI } from './api';

/**
 * 测试所有API接口
 * 按顺序测试各个模块的API调用
 */
export async function testAllAPIs() {
  const results = [];
  
  // 1. 测试图书搜索API
  try {
    const bookResult = await bookAPI.getBooks({
      page: 1,
      limit: 10,
      keyword: '三体'
    });
    results.push({
      api: '图书搜索',
      success: bookResult.success,
      data: bookResult.data
    });
  } catch (error) {
    results.push({
      api: '图书搜索',
      success: false,
      error: error.message
    });
  }
  
  // 2. 测试借阅记录API
  try {
    const borrowResult = await borrowAPI.getBorrowRecords({
      page: 1,
      limit: 10
    });
    results.push({
      api: '借阅记录',
      success: borrowResult.success,
      data: borrowResult.data
    });
  } catch (error) {
    results.push({
      api: '借阅记录',
      success: false,
      error: error.message
    });
  }
  
  // 3. 测试读者信息API
  try {
    const readerResult = await readerAPI.getReaderInfo(1);
    results.push({
      api: '读者信息',
      success: readerResult.success,
      data: readerResult.data
    });
  } catch (error) {
    results.push({
      api: '读者信息',
      success: false,
      error: error.message
    });
  }
  
  return results;
}

/**
 * 测试单个API并返回格式化结果
 * @param {string} apiName - API名称
 * @param {Function} apiCall - API调用函数
 * @returns {Object} 测试结果
 */
export async function testSingleAPI(apiName, apiCall) {
  try {
    console.log(`测试 ${apiName}...`);
    const response = await apiCall();
    console.log(`${apiName} 成功:`, response);
    return { success: true, data: response };
  } catch (error) {
    console.error(`${apiName} 失败:`, error);
    return { success: false, error: error.message };
  }
}