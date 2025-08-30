/**
 * Excel处理工具函数
 * 用于导入导出Excel文件的通用功能
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * 解析Excel文件内容
 * @param {string} filePath - Excel文件路径
 * @param {object} options - 解析选项
 * @returns {Array} 解析后的数据数组
 */
function parseExcelFile(filePath, options = {}) {
  try {
    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    
    // 获取第一个工作表名称
    const sheetName = workbook.SheetNames[0];
    
    // 获取工作表数据
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON格式
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // 使用第一行作为列标题
      defval: '', // 空单元格默认值
      ...options
    });
    
    // 移除空行
    const filteredData = jsonData.filter(row => 
      row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );
    
    console.log(`成功解析Excel文件：${path.basename(filePath)}，共${filteredData.length}行数据`);
    
    return filteredData;
  } catch (error) {
    console.error('解析Excel文件失败:', error);
    throw new Error(`Excel文件解析失败: ${error.message}`);
  }
}

/**
 * 将数据转换为Excel格式并保存
 * @param {Array} data - 要导出的数据数组
 * @param {string} filePath - 保存路径
 * @param {object} options - 导出选项
 * @returns {string} 生成的文件路径
 */
function exportToExcel(data, filePath, options = {}) {
  try {
    // 创建新的工作簿
    const workbook = XLSX.utils.book_new();
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(data, {
      header: options.headers || Object.keys(data[0] || {}),
      skipHeader: false
    });
    
    // 设置列宽（可选）
    if (options.columnWidths) {
      worksheet['!cols'] = options.columnWidths.map(width => ({ wch: width }));
    }
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 写入文件
    XLSX.writeFile(workbook, filePath);
    
    console.log(`成功导出Excel文件：${path.basename(filePath)}，共${data.length}行数据`);
    
    return filePath;
  } catch (error) {
    console.error('导出Excel文件失败:', error);
    throw new Error(`Excel文件导出失败: ${error.message}`);
  }
}

/**
 * 验证Excel文件格式和内容
 * @param {Array} data - Excel数据数组
 * @param {Array} requiredHeaders - 必需的列标题
 * @returns {object} 验证结果
 */
function validateExcelData(data, requiredHeaders = []) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  try {
    // 检查是否有数据
    if (!data || data.length === 0) {
      result.isValid = false;
      result.errors.push('Excel文件为空或无有效数据');
      return result;
    }
    
    // 获取表头（第一行）
    const headers = data[0] || [];
    
    // 检查必需的列
    for (const requiredHeader of requiredHeaders) {
      if (!headers.includes(requiredHeader)) {
        result.isValid = false;
        result.errors.push(`缺少必需的列: ${requiredHeader}`);
      }
    }
    
    // 检查数据行数
    if (data.length < 2) {
      result.isValid = false;
      result.errors.push('Excel文件必须包含至少一行数据（除标题行外）');
    }
    
    // 检查每行数据的完整性
    const dataRows = data.slice(1); // 跳过标题行
    let emptyRowCount = 0;
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // 检查空行
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        emptyRowCount++;
        continue;
      }
      
      // 检查行长度
      if (row.length !== headers.length) {
        result.warnings.push(`第${i + 2}行列数与标题行不匹配`);
      }
    }
    
    // 报告空行
    if (emptyRowCount > 0) {
      result.warnings.push(`发现${emptyRowCount}个空行，将被忽略`);
    }
    
    console.log(`Excel数据验证完成: ${result.isValid ? '通过' : '失败'}`);
    
    return result;
  } catch (error) {
    result.isValid = false;
    result.errors.push(`数据验证失败: ${error.message}`);
    return result;
  }
}

/**
 * 转换Excel数据为对象数组
 * @param {Array} excelData - 原始Excel数据数组
 * @param {object} fieldMapping - 字段映射配置
 * @returns {Array} 转换后的对象数组
 */
function convertExcelToObjects(excelData, fieldMapping = {}) {
  try {
    if (!excelData || excelData.length < 2) {
      return [];
    }
    
    const headers = excelData[0];
    const dataRows = excelData.slice(1);
    
    const result = dataRows.map((row, index) => {
      const obj = {};
      
      headers.forEach((header, colIndex) => {
        const fieldName = fieldMapping[header] || header;
        const cellValue = row[colIndex];
        
        // 处理空值
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          obj[fieldName] = null;
        } else {
          obj[fieldName] = cellValue.toString().trim();
        }
      });
      
      // 添加行号用于错误定位
      obj._rowIndex = index + 2; // +2 因为Excel从1开始，且跳过了标题行
      
      return obj;
    }).filter(obj => {
      // 过滤空对象（所有字段都为空的行）
      return Object.keys(obj).some(key => 
        key !== '_rowIndex' && obj[key] !== null && obj[key] !== ''
      );
    });
    
    console.log(`Excel数据转换完成：${dataRows.length}行 -> ${result.length}个有效对象`);
    
    return result;
  } catch (error) {
    console.error('Excel数据转换失败:', error);
    throw new Error(`数据转换失败: ${error.message}`);
  }
}

/**
 * 创建Excel模板文件
 * @param {Array} headers - 列标题数组
 * @param {Array} sampleData - 示例数据（可选）
 * @param {string} filePath - 保存路径
 * @returns {string} 生成的模板文件路径
 */
function createExcelTemplate(headers, sampleData = [], filePath) {
  try {
    // 创建包含标题和示例数据的数据
    const data = [headers];
    
    // 添加示例数据
    if (sampleData.length > 0) {
      data.push(...sampleData);
    }
    
    // 使用parseExcelFile函数的逻辑创建Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // 设置列宽
    const colWidths = headers.map(header => ({ wch: Math.max(header.length + 2, 15) }));
    worksheet['!cols'] = colWidths;
    
    // 添加工作表
    XLSX.utils.book_append_sheet(workbook, worksheet, '模板');
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 写入文件
    XLSX.writeFile(workbook, filePath);
    
    console.log(`成功创建Excel模板：${path.basename(filePath)}`);
    
    return filePath;
  } catch (error) {
    console.error('创建Excel模板失败:', error);
    throw new Error(`模板创建失败: ${error.message}`);
  }
}

module.exports = {
  parseExcelFile,
  exportToExcel,
  validateExcelData,
  convertExcelToObjects,
  createExcelTemplate
};