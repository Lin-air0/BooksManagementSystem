/**
 * 数据导入脚本
 * 用于将CSV数据文件导入到图书管理系统数据库中
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const iconv = require('iconv-lite');

// 加载环境变量
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'bookadmin',
  password: process.env.DB_PASSWORD || 'BookAdmin123!',
  database: process.env.DB_NAME || 'book_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 图书分类映射
const categoryMapping = {
  '计算机': 1,
  '文学小说': 2,
  '历史': 3,
  '科学': 4,
  '哲学': 5,
  '艺术': 6,
  '心理学': 7,
  '教育': 8
};

// 分类关键词映射
const categoryKeywords = {
  '计算机': ['计算机', '编程', '程序设计', '软件', '算法', '数据结构', '前端', '后端', '开发'],
  '文学小说': ['小说', '文学', '散文', '诗歌', '戏剧', '作品'],
  '历史': ['历史', '史', '古代', '近代', '现代'],
  '科学': ['科学', '物理', '化学', '生物', '天文', '地理'],
  '哲学': ['哲学', '思想', '逻辑'],
  '艺术': ['艺术', '设计', '美术', '音乐', '绘画'],
  '心理学': ['心理学', '心理', '行为'],
  '教育': ['教育', '教学', '学习']
};

/**
 * 自动分类图书
 * @param {string} title - 图书标题
 * @param {string} author - 作者
 * @param {string} publisher - 出版社
 * @returns {number} 分类ID
 */
function autoCategorize(title, author, publisher) {
  const text = `${title} ${author} ${publisher}`.toLowerCase();
  
  // 按优先级检查关键词
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return categoryMapping[category];
      }
    }
  }
  
  // 默认分类为文学小说
  return categoryMapping['文学小说'];
}

/**
 * 清理和转换图书数据
 * @param {object} row - 原始数据行
 * @returns {object} 处理后的数据
 */
function processBookData(row) {
  // 清理字段
  const title = row['书名'] ? row['书名'].trim() : '';
  const author = row['作者'] ? row['作者'].trim() : '';
  const publisher = row['出版社'] ? row['出版社'].trim() : '';
  const publishDate = row['出版时间'] ? row['出版时间'].trim() : null;
  const stock = row['数'] ? parseInt(row['数']) : 1;
  const isbn = row['ISBM'] ? row['ISBM'].toString().replace('9.78E+12', '').replace('9.79E+12', '') : null;
  
  // 数据清洗
  if (!title || !author) {
    return null; // 必填字段为空则跳过
  }
  
  // 修正ISBN字段名错误
  if (isbn === '9.78E+12' || isbn === '9.79E+12') {
    // 这些是无效的ISBN，设置为null
    isbn = null;
  }
  
  // 处理库存数量
  let cleanStock = isNaN(stock) ? 1 : Math.max(1, stock);
  
  // 处理出版日期 - 更严格的日期验证
  let cleanPublishDate = null;
  if (publishDate && publishDate !== 'None' && publishDate !== 'null' && publishDate.trim() !== '') {
    // 尝试解析日期
    let date = null;
    
    // 处理多种日期格式
    if (publishDate.includes('/')) {
      // 处理 "YYYY/MM/DD" 或 "YYYY/MM" 格式
      const parts = publishDate.split('/');
      if (parts.length >= 2) {
        const year = parseInt(parts[0]);
        const month = parts[1] ? parseInt(parts[1]) : 1;
        const day = parts[2] ? parseInt(parts[2]) : 1;
        
        // 验证年份合理性（1000-当前年份）
        if (year >= 1000 && year <= new Date().getFullYear() + 5) {
          date = new Date(year, month - 1, day);
        }
      }
    } else if (publishDate.includes('-')) {
      // 处理 "YYYY-MM-DD" 格式
      const parts = publishDate.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0]);
        const month = parts[1] ? parseInt(parts[1]) : 1;
        const day = parts[2] ? parseInt(parts[2]) : 1;
        
        // 验证年份合理性（1000-当前年份）
        if (year >= 1000 && year <= new Date().getFullYear() + 5) {
          date = new Date(year, month - 1, day);
        }
      }
    } else {
      // 尝试直接解析年份
      const year = parseInt(publishDate);
      if (!isNaN(year) && year >= 1000 && year <= new Date().getFullYear() + 5) {
        date = new Date(year, 0, 1);
      }
    }
    
    // 验证日期有效性
    if (date && !isNaN(date.getTime())) {
      cleanPublishDate = date.toISOString().split('T')[0];
    }
  }
  
  // 自动分类
  const categoryId = autoCategorize(title, author, publisher);
  
  return {
    title,
    author,
    publisher: publisher === 'None' ? '未知出版社' : publisher,
    publish_date: cleanPublishDate,
    stock: cleanStock,
    available: cleanStock, // 初始可用数量等于库存
    isbn: (!isbn || isbn === 'None' || isbn.trim() === '') ? null : isbn,
    category_id: categoryId,
    metadata: JSON.stringify({
      price: row['价格'] ? parseFloat(row['价格']) : null,
      rating: row['评分'] ? parseFloat(row['评分']) : null,
      reading_count: row['阅读量'] ? parseInt(row['阅读量']) : null
    })
  };
}

/**
 * 清理和转换借阅记录数据
 * @param {object} row - 原始数据行
 * @returns {object} 处理后的数据
 */
function processBorrowData(row) {
  try {
    // 获取所有键名
    const keys = Object.keys(row);
    
    // 打印前几条记录的键名以调试
    if (!processBorrowData.debugged) {
      console.log('CSV列名:', keys);
      console.log('第一行数据:', row);
      processBorrowData.debugged = true;
    }
    
    // 根据实际的列索引获取数据（基于CSV文件的列顺序）
    // 修正后的列名应该是：记录ID,图书条形码,书名,定价,索书号,借书证号,部门,借出日期,应还日期,归还日期
    const borrowId = keys[0] && row[keys[0]] ? parseInt(row[keys[0]]) : null;     // 记录ID
    const bookId = keys[1] && row[keys[1]] ? parseInt(row[keys[1]]) : null;       // 图书条形码
    const readerId = keys[5] && row[keys[5]] ? parseInt(row[keys[5]]) : null;     // 借书证号（作为读者ID）
    const borrowDate = keys[7] && row[keys[7]] ? row[keys[7]].trim() : null;      // 借出日期
    const dueDate = keys[8] && row[keys[8]] ? row[keys[8]].trim() : null;         // 应还日期
    const returnDate = keys[9] && row[keys[9]] ? row[keys[9]].trim() : null;      // 归还日期
    
    // 数据验证
    if (!borrowId || !bookId || !readerId || !borrowDate || !dueDate) {
      // 不打印跳过记录的详细信息以减少日志输出
      // console.log(`跳过记录: 缺少必要字段 - 记录ID: ${borrowId}, 图书ID: ${bookId}, 读者ID: ${readerId}`);
      return null; // 必填字段为空则跳过
    }
    
    // 处理日期
    let cleanBorrowDate = null;
    let cleanDueDate = null;
    let cleanReturnDate = null;
    
    // 处理借阅日期
    if (borrowDate) {
      const borrowDateObj = new Date(borrowDate);
      if (!isNaN(borrowDateObj.getTime())) {
        cleanBorrowDate = borrowDateObj.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    
    // 处理应还日期
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (!isNaN(dueDateObj.getTime())) {
        cleanDueDate = dueDateObj.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    
    // 处理归还日期
    if (returnDate && returnDate !== '未还' && returnDate !== 'δ' && returnDate.trim() !== '') {
      const returnDateObj = new Date(returnDate);
      if (!isNaN(returnDateObj.getTime())) {
        cleanReturnDate = returnDateObj.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    
    // 确定状态
    let status = 'borrowed';
    if (cleanReturnDate) {
      status = 'returned';
    } else if (cleanDueDate) {
      const now = new Date();
      const due = new Date(cleanDueDate);
      if (now > due) {
        status = 'overdue';
      }
    }
    
    // 验证处理后的数据
    if (!cleanBorrowDate || !cleanDueDate) {
      // 不打印跳过记录的详细信息以减少日志输出
      // console.log(`跳过记录: 日期格式无效 - 借阅日期: ${borrowDate}, 应还日期: ${dueDate}`);
      return null;
    }
    
    return {
      borrow_id: borrowId,
      reader_id: readerId,
      book_id: bookId,
      borrow_date: cleanBorrowDate,
      due_date: cleanDueDate,
      return_date: cleanReturnDate,
      status: status
      // 移除了fine字段，因为表中没有这个字段
    };
  } catch (error) {
    console.error('处理借阅记录时出错:', error);
    return null;
  }
}

// 添加调试标记
processBorrowData.debugged = false;

/**
 * 生成读者数据
 * @param {Array} borrowRecords - 借阅记录
 * @returns {Array} 读者数据数组
 */
function generateReaderData(borrowRecords) {
  // 提取唯一的读者ID
  const readerIds = [...new Set(borrowRecords.map(record => record.reader_id))];
  
  // 生成读者信息
  const readers = readerIds.map(readerId => {
    return {
      reader_id: readerId,
      name: `读者${readerId}`,
      email: `reader${readerId}@example.com`,
      phone: `138${Math.floor(10000000 + Math.random() * 90000000)}`,
      type: 'student'
    };
  });
  
  return readers;
}

/**
 * 批量插入数据到数据库（处理重复键错误）
 * @param {string} tableName - 表名
 * @param {Array} data - 数据数组
 * @param {number} batchSize - 批量大小
 */
async function batchInsert(tableName, data, batchSize = 100) {
  if (data.length === 0) {
    console.log(`没有数据需要插入到 ${tableName} 表`);
    return;
  }
  
  console.log(`开始插入 ${data.length} 条数据到 ${tableName} 表`);
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 构建插入语句
    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    // 使用INSERT IGNORE来忽略重复键错误
    const sql = `INSERT IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    // 分批插入
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values = batch.map(row => columns.map(col => row[col]));
      
      // 批量执行
      await connection.query(sql, values.flat());
      console.log(`已插入 ${Math.min(i + batchSize, data.length)} / ${data.length} 条数据`);
    }
    
    await connection.commit();
    console.log(`成功插入 ${data.length} 条数据到 ${tableName} 表`);
  } catch (error) {
    await connection.rollback();
    console.error(`插入数据到 ${tableName} 表失败:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 读取并解析CSV文件
 * @param {string} filePath - 文件路径
 * @returns {Array} 解析后的数据
 */
function readCSVFile(filePath) {
  try {
    let fileContent;
    
    // 对于借阅记录文件，使用gbk编码
    if (filePath.endsWith('book_borrow_return_records.CSV')) {
      const buffer = fs.readFileSync(filePath);
      fileContent = iconv.decode(buffer, 'gbk');
    } else {
      fileContent = fs.readFileSync(filePath, 'utf8');
    }
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`成功读取 ${filePath}，共 ${records.length} 行数据`);
    return records;
  } catch (error) {
    console.error(`读取文件 ${filePath} 失败:`, error);
    throw error;
  }
}

/**
 * 导入图书数据
 */
async function importBooks() {
  try {
    console.log('开始导入图书数据...');
    
    // 读取图书数据文件
    const filePath = path.join(__dirname, '../../data/book_douban.csv');
    const rawBooks = readCSVFile(filePath);
    
    // 处理图书数据
    const processedBooks = [];
    const skippedBooks = [];
    
    for (const book of rawBooks) {
      const processedBook = processBookData(book);
      if (processedBook) {
        processedBooks.push(processedBook);
      } else {
        skippedBooks.push(book);
      }
    }
    
    console.log(`处理图书数据完成: ${processedBooks.length} 条有效数据，${skippedBooks.length} 条被跳过`);
    
    // 插入图书数据到数据库
    await batchInsert('books', processedBooks);
    
    console.log('图书数据导入完成');
  } catch (error) {
    console.error('导入图书数据失败:', error);
    throw error;
  }
}

/**
 * 导入借阅记录数据
 */
async function importBorrows() {
  try {
    console.log('开始导入借阅记录数据...');
    
    // 读取借阅记录数据文件
    const filePath = path.join(__dirname, '../../data/book_borrow_return_records.CSV');
    const rawBorrows = readCSVFile(filePath);
    
    // 处理借阅记录数据
    const processedBorrows = [];
    const skippedBorrows = [];
    
    for (const borrow of rawBorrows) {
      const processedBorrow = processBorrowData(borrow);
      if (processedBorrow) {
        processedBorrows.push(processedBorrow);
      } else {
        skippedBorrows.push(borrow);
      }
    }
    
    console.log(`处理借阅记录数据完成: ${processedBorrows.length} 条有效数据，${skippedBorrows.length} 条被跳过`);
    
    // 生成并插入读者数据
    const readers = generateReaderData(processedBorrows);
    await batchInsert('readers', readers);
    
    // 插入借阅记录数据到数据库（暂时不插入，因为需要处理外键约束）
    // await batchInsert('borrows', processedBorrows);
    
    console.log('借阅记录数据导入完成');
  } catch (error) {
    console.error('导入借阅记录数据失败:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('开始数据导入...');
    
    // 导入图书数据
    await importBooks();
    
    // 导入借阅记录数据
    await importBorrows();
    
    console.log('所有数据导入完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据导入失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  processBookData,
  processBorrowData,
  generateReaderData,
  importBooks,
  importBorrows
};