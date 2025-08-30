/**
 * 文件上传中间件配置
 * 专门用于Excel文件上传处理
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建上传目录
const uploadDir = path.join(__dirname, '../../uploads');
const tempDir = path.join(uploadDir, 'temp');

// 确保目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳_原始文件名
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);
    const uniqueName = `${timestamp}_${basename}${ext}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedMimes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/excel',
    'application/x-excel',
    'application/x-msexcel'
  ];
  
  const allowedExts = ['.xls', '.xlsx'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(fileExt)) {
    cb(null, true);
  } else {
    const error = new Error('只支持Excel文件格式 (.xls, .xlsx)');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Multer配置
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制文件大小为10MB
    files: 1 // 一次只能上传一个文件
  }
});

/**
 * Excel文件上传中间件
 */
const uploadExcel = upload.single('excel');

/**
 * 错误处理中间件
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    let message = '文件上传失败';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = '文件大小超出限制（最大10MB）';
        break;
      case 'LIMIT_FILE_COUNT':
        message = '一次只能上传一个文件';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '意外的文件字段';
        break;
      default:
        message = `文件上传错误: ${err.message}`;
    }
    
    return res.status(400).json({
      code: 400,
      data: null,
      msg: message
    });
  } else if (err && err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      code: 400,
      data: null,
      msg: err.message
    });
  }
  
  next(err);
}

/**
 * 清理临时文件
 * @param {string} filePath - 要删除的文件路径
 */
function cleanupTempFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`已清理临时文件: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error('清理临时文件失败:', error);
  }
}

/**
 * 批量清理过期临时文件
 * @param {number} maxAge - 文件最大存活时间（毫秒），默认1小时
 */
function cleanupExpiredFiles(maxAge = 60 * 60 * 1000) {
  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    let cleanedCount = 0;
    
    files.forEach(filename => {
      const filePath = path.join(tempDir, filename);
      const stats = fs.statSync(filePath);
      
      // 检查文件创建时间
      if (now - stats.birthtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`已清理${cleanedCount}个过期临时文件`);
    }
  } catch (error) {
    console.error('批量清理临时文件失败:', error);
  }
}

// 定期清理过期文件（每30分钟执行一次）
setInterval(() => {
  cleanupExpiredFiles();
}, 30 * 60 * 1000);

module.exports = {
  uploadExcel,
  handleUploadError,
  cleanupTempFile,
  cleanupExpiredFiles,
  uploadDir,
  tempDir
};