// Vue项目配置文件
module.exports = {
  // 开发服务器配置
  devServer: {
    port: 8080, // 设置前端服务端口为8080，避免与后端服务冲突
    open: true, // 自动打开浏览器
    proxy: {
      // 配置API代理，解决跨域问题
      '/api': {
        target: 'http://localhost:3000', // 后端API地址
        changeOrigin: true, // 改变请求源
        pathRewrite: {
          '^/api': '/api' // 路径重写规则
        }
      },
      '/docs': {
        target: 'http://localhost:3000', // API文档地址
        changeOrigin: true
      }
    }
  },
  // 其他配置
  lintOnSave: process.env.NODE_ENV !== 'production', // 开发环境下开启eslint检查
  productionSourceMap: false // 生产环境不生成sourcemap
};