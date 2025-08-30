/**
 * 前端Excel处理工具函数
 * 用于Excel文件的读取、解析和导出
 */

import * as XLSX from 'xlsx';

/**
 * 读取并解析Excel文件
 * @param {File} file - Excel文件对象
 * @returns {Promise<Array>} 解析后的数据数组
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('请选择Excel文件'));
      return;
    }
    
    // 检查文件类型
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const isValidType = validTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.xls') || 
                       file.name.toLowerCase().endsWith('.xlsx');
    
    if (!isValidType) {
      reject(new Error('请选择有效的Excel文件 (.xls 或 .xlsx)'));
      return;
    }
    
    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('文件大小不能超过10MB'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 转换为JSON数组
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false // 将所有值转换为字符串
        });
        
        // 过滤空行
        const filteredData = jsonData.filter(row => 
          row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        console.log(`成功解析Excel文件：${file.name}，共${filteredData.length}行数据`);
        resolve(filteredData);
      } catch (error) {
        console.error('Excel文件解析失败:', error);
        reject(new Error(`文件解析失败: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 验证Excel数据格式
 * @param {Array} data - Excel数据数组
 * @param {Array} requiredColumns - 必需的列名数组
 * @returns {Object} 验证结果
 */
export function validateExcelData(data, requiredColumns = []) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    preview: null
  };
  
  try {
    // 检查是否有数据
    if (!data || data.length === 0) {
      result.isValid = false;
      result.errors.push('Excel文件为空');
      return result;
    }
    
    // 获取标题行
    const headers = data[0] || [];
    
    // 检查必需的列
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      result.isValid = false;
      result.errors.push(`缺少必需的列: ${missingColumns.join(', ')}`);
    }
    
    // 检查数据行数
    if (data.length < 2) {
      result.isValid = false;
      result.errors.push('Excel文件必须包含至少一行数据（除标题行外）');
    }
    
    // 生成预览数据（前5行）
    if (data.length > 0) {
      result.preview = {
        headers: headers,
        rows: data.slice(1, 6) // 最多预览5行数据
      };
    }
    
    // 统计信息
    const totalRows = data.length - 1; // 除去标题行
    if (totalRows > 0) {
      result.warnings.push(`共发现 ${totalRows} 行数据`);
    }
    
    return result;
  } catch (error) {
    result.isValid = false;
    result.errors.push(`数据验证失败: ${error.message}`);
    return result;
  }
}

/**
 * 将数据导出为Excel文件
 * @param {Array} data - 要导出的数据数组
 * @param {String} filename - 文件名
 * @param {Object} options - 导出选项
 */
export function exportToExcel(data, filename = 'export.xlsx', options = {}) {
  try {
    if (!data || data.length === 0) {
      throw new Error('没有数据可导出');
    }
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 创建工作表
    let worksheet;
    if (Array.isArray(data[0])) {
      // 如果是二维数组
      worksheet = XLSX.utils.aoa_to_sheet(data);
    } else {
      // 如果是对象数组
      worksheet = XLSX.utils.json_to_sheet(data);
    }
    
    // 设置列宽
    if (options.columnWidths) {
      worksheet['!cols'] = options.columnWidths.map(width => ({ wch: width }));
    } else {
      // 自动调整列宽
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const cols = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10; // 最小宽度
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            const cellWidth = cell.v.toString().length;
            maxWidth = Math.max(maxWidth, Math.min(cellWidth + 2, 50)); // 最大宽度50
          }
        }
        cols.push({ wch: maxWidth });
      }
      worksheet['!cols'] = cols;
    }
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
    
    // 生成Excel文件并下载
    XLSX.writeFile(workbook, filename);
    
    console.log(`成功导出Excel文件：${filename}`);
  } catch (error) {
    console.error('导出Excel文件失败:', error);
    throw new Error(`导出失败: ${error.message}`);
  }
}

/**
 * 将Excel数据转换为对象数组
 * @param {Array} excelData - 原始Excel数据数组
 * @param {Object} fieldMapping - 字段映射 { Excel列名: 对象属性名 }
 * @returns {Array} 对象数组
 */
export function convertExcelToObjects(excelData, fieldMapping = {}) {
  try {
    if (!excelData || excelData.length < 2) {
      return [];
    }
    
    const headers = excelData[0];
    const dataRows = excelData.slice(1);
    
    return dataRows.map((row, rowIndex) => {
      const obj = {};
      
      headers.forEach((header, colIndex) => {
        const fieldName = fieldMapping[header] || header;
        const cellValue = row[colIndex];
        
        // 处理空值和格式化
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          obj[fieldName] = null;
        } else {
          obj[fieldName] = cellValue.toString().trim();
        }
      });
      
      // 添加行号用于错误定位
      obj._rowIndex = rowIndex + 2; // Excel行号从1开始，加上标题行
      
      return obj;
    }).filter(obj => {
      // 过滤完全空白的行
      return Object.keys(obj).some(key => 
        key !== '_rowIndex' && obj[key] !== null && obj[key] !== ''
      );
    });
  } catch (error) {
    console.error('Excel数据转换失败:', error);
    throw new Error(`数据转换失败: ${error.message}`);
  }
}

/**
 * 创建Excel文件的Blob对象
 * @param {Array} data - 数据数组
 * @param {Object} options - 选项
 * @returns {Blob} Excel文件的Blob对象
 */
export function createExcelBlob(data, options = {}) {
  try {
    const workbook = XLSX.utils.book_new();
    
    let worksheet;
    if (Array.isArray(data[0])) {
      worksheet = XLSX.utils.aoa_to_sheet(data);
    } else {
      worksheet = XLSX.utils.json_to_sheet(data);
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
    
    // 生成二进制数据
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // 创建Blob对象
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  } catch (error) {
    console.error('创建Excel Blob失败:', error);
    throw new Error(`创建Excel文件失败: ${error.message}`);
  }
}

/**
 * 下载Blob为文件
 * @param {Blob} blob - 文件Blob对象
 * @param {String} filename - 文件名
 */
export function downloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL
    URL.revokeObjectURL(url);
    
    console.log(`开始下载文件：${filename}`);
  } catch (error) {
    console.error('文件下载失败:', error);
    throw new Error(`下载失败: ${error.message}`);
  }
}

/**
 * 格式化文件大小显示
 * @param {Number} bytes - 字节数
 * @returns {String} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 预定义的Excel模板配置
export const ExcelTemplates = {
  // 图书导入模板
  books: {
    requiredColumns: ['书名', '作者', '分类', '出版社', 'ISBN', '库存数量'],
    fieldMapping: {
      '书名': 'title',
      '作者': 'author',
      '分类': 'category_name',
      '出版社': 'publisher',
      'ISBN': 'isbn',
      '出版日期': 'publish_date',
      '库存数量': 'stock',
      '描述': 'description'
    },
    columnWidths: [20, 15, 12, 15, 15, 12, 10, 30]
  },
  
  // 读者导入模板
  readers: {
    requiredColumns: ['姓名', '学号', '邮箱', '电话', '类型'],
    fieldMapping: {
      '姓名': 'name',
      '学号': 'student_id',
      '邮箱': 'email',
      '电话': 'phone',
      '类型': 'type',
      '地址': 'address'
    },
    columnWidths: [15, 15, 20, 15, 10, 30]
  }
};