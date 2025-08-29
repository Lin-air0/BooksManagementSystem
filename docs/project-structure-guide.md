# 项目目录结构说明

## 一、项目根目录结构

```
BooksManagementSystem/
├── .github/              # GitHub相关配置文件
├── .trae/                # TraeAI相关配置
├── backend/              # 后端代码目录
├── data/                 # 测试数据和初始化脚本
├── docs/                 # 项目文档目录
├── frontend/             # 前端代码目录
├── logs/                 # 日志文件目录
├── playwright-report/    # Playwright测试报告
├── resources/            # 资源文件（原型图、图片等）
├── tests/                # 测试代码目录
├── .gitignore            # Git忽略文件配置
├── gitignore_backup.txt  # Git忽略配置备份
├── package-lock.json     # 依赖锁定文件
└── package.json          # 项目配置和依赖声明
```

## 二、前端目录结构 (frontend/)

```
frontend/
├── .gitignore            # 前端Git忽略文件配置
├── babel.config.js       # Babel配置
├── package-lock.json     # 前端依赖锁定文件
├── package.json          # 前端项目配置和依赖声明
├── public/               # 静态资源目录（不参与打包）
│   └── index.html        # 入口HTML文件
├── src/                  # 源代码目录
│   ├── App.vue           # 根组件
│   ├── main.js           # 入口文件
│   ├── router/           # 路由配置
│   ├── utils/            # 工具函数
│   └── views/            # 页面组件
└── vue.config.js         # Vue配置文件
```

### 前端目录功能说明
- **public/**: 存放不参与打包的静态资源，如index.html等
- **src/**: 存放前端源代码
  - **App.vue**: 应用根组件
  - **main.js**: 应用入口文件，初始化Vue实例
  - **router/**: 存放路由配置文件，定义页面跳转规则
  - **utils/**: 存放工具函数，如API请求封装、日期处理等
  - **views/**: 存放页面级组件
- **vue.config.js**: Vue项目配置文件

## 三、后端目录结构 (backend/)

```
backend/
├── docs/                 # 后端API文档
├── package-lock.json     # 后端依赖锁定文件
├── package.json          # 后端项目配置和依赖声明
├── scripts/              # 后端脚本
│   └── test_data_init.js # 测试数据初始化脚本
├── server.js             # 后端服务器入口文件
├── src/                  # 源代码目录
│   └── routes/           # 路由配置
└── test-results/         # 后端测试结果
```

### 后端目录功能说明
- **docs/**: 存放后端API文档
- **scripts/**: 存放后端脚本，如数据初始化脚本
- **server.js**: 后端服务器入口文件，启动Express服务
- **src/**: 存放后端源代码
  - **routes/**: 存放路由配置文件，定义API接口路径和处理函数

## 四、数据目录结构 (data/)

```
data/
├── book_douban.csv       # 图书数据CSV文件
└── test_data_init.js     # 测试数据初始化脚本
```

### 数据目录功能说明
- **book_douban.csv**: 包含图书信息的CSV数据文件
- **test_data_init.js**: 用于初始化测试数据的脚本

## 五、文档目录结构 (docs/)

```
docs/
├── API设计文档.md                 # API设计文档
├── Figma低保真交互原型配置.md      # Figma原型配置文档
├── Figma高保真视觉原型.md          # Figma视觉原型文档
├── GitHub仓库配置说明.md           # GitHub配置说明
├── Git协作指南.md                 # Git协作指南
├── IMPLEMENTATION_PLAN.md         # 实施计划
├── P0需求清单（含数据表设计）.md    # 核心需求清单和数据表设计
├── README.md                      # 项目说明文档
├── 交互验证报告.md                 # 交互验证报告
├── 修复报告.md                     # 问题修复报告
├── 关于Figma原型的说明.md          # Figma原型说明
├── 图书借阅系统视觉规范.md          # 视觉规范文档
├── 技术栈选型说明.md               # 技术栈选型说明
├── 数据库表结构设计（含初始化脚本）.md # 数据库表结构设计
├── 数据库配置调整指南.md           # 数据库配置指南
├── 核心流程交互草图.md             # 核心流程交互图
├── 核心流程测试报告.md             # 核心流程测试报告
├── 竞品功能对比表.md               # 竞品功能对比
├── 自动化测试用例文档.md           # 自动化测试用例
├── 视觉验证报告.md                 # 视觉验证报告
├── 需求调研纪要.md                 # 需求调研记录
└── 项目目录结构说明.md             # 项目目录结构说明
```

### 文档目录功能说明
- 存放项目的所有文档，包括需求、设计、实现、测试等各个阶段的文档
- 按文档类型进行分类，便于查找和管理

## 六、日志目录结构 (logs/)

```
logs/
├── backend.log                    # 后端日志
├── frontend.log                   # 前端日志
├── init_data.log                  # 数据初始化日志
├── minimal-test-failure.png       # 测试失败截图
├── navigation-failure.png         # 导航失败截图
├── test-failure-screenshot.png    # 测试失败截图
├── test-screenshot.png            # 测试截图
└── test-results.json              # 测试结果JSON文件
```

### 日志目录功能说明
- 存放项目运行过程中产生的日志文件
- 包括前后端日志、测试相关日志和截图

## 七、资源目录结构 (resources/)

```
resources/
├── 图书借还记录.xlsx            # 图书借还记录数据
├── 图书馆管理系统原型图/         # 图书馆管理系统原型图
│   ├── 借阅记录页面原型图.html    # 借阅记录页面原型
│   ├── 图书管理页面原型图.html    # 图书管理页面原型
│   ├── 统计分析页面原型图.html    # 统计分析页面原型
│   ├── 读者管理页面原型图.html    # 读者管理页面原型
│   └── 首页原型图.html            # 首页原型
└── 当前页面图/                  # 当前页面截图
    ├── 当前借阅记录页面.png       # 当前借阅记录页面截图
    ├── 当前图书管理页面.png       # 当前图书管理页面截图
    ├── 当前统计分析页面.png       # 当前统计分析页面截图
    ├── 当前读者管理页面.png       # 当前读者管理页面截图
    └── 当前首页.png               # 当前首页截图
```

### 资源目录功能说明
- 存放项目相关的资源文件，如原型图、页面截图等
- 便于查看项目的视觉效果和设计参考

## 八、测试目录结构 (tests/)

```
tests/
├── config/                       # 测试配置
│   └── playwright.config.js      # Playwright配置文件
└── playwright/                   # Playwright测试
    ├── README.md                 # 测试说明
    ├── playwright-report/        # Playwright生成的报告
    ├── book-system-test.spec.js  # 图书系统测试用例
    └── test-results.json         # 测试结果JSON文件
```

### 测试目录功能说明
- **config/**: 存放测试配置文件
- **playwright/**: 存放Playwright测试代码和相关文件
  - **book-system-test.spec.js**: 图书管理系统的核心测试用例

## 九、重要文件说明

1. **.gitignore**
   - 定义Git版本控制中需要忽略的文件和目录
   - 通常包括node_modules、日志文件、构建产物等

2. **package.json**
   - 项目的核心配置文件，定义项目信息、依赖和脚本命令
   - 位于根目录和前后端子目录中

3. **playwright.config.js**
   - Playwright测试框架的配置文件
   - 定义测试环境、浏览器设置等

4. **server.js**
   - 后端服务器的入口文件
   - 启动Express服务器并配置路由

5. **main.js**
   - 前端应用的入口文件
   - 创建Vue实例并挂载到DOM

## 十、版本说明

本目录结构说明文档版本：v1.5.0
适配图书借阅系统版本：v1.4.0

更新日期：2025年8月