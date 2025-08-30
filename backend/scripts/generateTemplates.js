/**
 * Excel模板生成脚本
 * 用于创建标准的导入模板文件
 */

const path = require('path');
const { createExcelTemplate } = require('../src/utils/excelHelper');

// 创建模板文件保存目录
const templatesDir = path.join(__dirname, '../public/templates');

// 图书导入模板
const bookHeaders = ['书名', '作者', '分类', '出版社', 'ISBN', '出版日期', '库存数量', '描述'];
const bookSampleData = [
  ['JavaScript高级程序设计', 'Nicholas C. Zakas', '计算机', '人民邮电出版社', '978-7-115-27579-0', '2024-01-15', '10', '经典前端开发教材'],
  ['算法导论', 'Thomas H. Cormen', '计算机', 'MIT出版社', '978-0-262-03384-8', '2023-08-20', '8', '计算机算法经典教材'],
  ['红楼梦', '曹雪芹', '文学小说', '人民文学出版社', '978-7-02-008090-7', '2022-06-10', '15', '中国古典文学四大名著之一']
];

// 读者导入模板
const readerHeaders = ['姓名', '学号', '邮箱', '电话', '类型', '地址'];
const readerSampleData = [
  ['张三', '2023001', 'zhangsan@example.com', '13800138001', '学生', '北京市海淀区中关村大街1号'],
  ['李四', '2023002', 'lisi@example.com', '13800138002', '学生', '北京市朝阳区建国路88号'],
  ['王老师', 'T001', 'wangteacher@example.com', '13800138003', '教师', '北京市西城区西单北大街120号']
];

async function generateTemplates() {
  try {
    console.log('开始生成Excel模板文件...');
    
    // 创建图书导入模板
    const bookTemplatePath = path.join(templatesDir, '图书导入模板.xlsx');
    await createExcelTemplate(bookHeaders, bookSampleData, bookTemplatePath);
    console.log('✅ 图书导入模板创建成功');
    
    // 创建读者导入模板
    const readerTemplatePath = path.join(templatesDir, '读者导入模板.xlsx');
    await createExcelTemplate(readerHeaders, readerSampleData, readerTemplatePath);
    console.log('✅ 读者导入模板创建成功');
    
    console.log('\n📋 模板文件生成完成!');
    console.log(`📁 保存位置: ${templatesDir}`);
    console.log('📋 包含文件:');
    console.log('  - 图书导入模板.xlsx');
    console.log('  - 读者导入模板.xlsx');
    
    console.log('\n🔍 模板说明:');
    console.log('📚 图书导入模板字段:');
    bookHeaders.forEach((header, index) => {
      console.log(`  ${index + 1}. ${header}${index < 3 ? ' (必填)' : ''}`);
    });
    
    console.log('👥 读者导入模板字段:');
    readerHeaders.forEach((header, index) => {
      console.log(`  ${index + 1}. ${header}${index < 4 ? ' (必填)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ 模板生成失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateTemplates();
}

module.exports = { generateTemplates };