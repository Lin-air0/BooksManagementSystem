// 打印当前工作目录
console.log('当前工作目录:', process.cwd());

// 在加载dotenv之前先检查环境变量
console.log('加载dotenv前PORT环境变量值:', process.env.PORT);

// 尝试使用不同的dotenv配置
const dotenv = require('dotenv');
const result = dotenv.config();

console.log('dotenv加载结果:', result);
console.log('加载dotenv后PORT环境变量值:', process.env.PORT);

// 检查是否存在其他可能覆盖PORT的环境变量
console.log('是否存在NODE_PORT:', !!process.env.NODE_PORT);
console.log('是否存在SERVER_PORT:', !!process.env.SERVER_PORT);