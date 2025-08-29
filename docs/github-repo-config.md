# GitHub 仓库配置说明

## 版本信息
- 版本：v1.0.0
- 适配阶段：图书借阅系统 MVP 阶段
- 创建日期：2025年8月24日
- 作者：协同开发专员

## 一、远程仓库创建与配置

### 1. 仓库创建
1. 访问 GitHub 官网 (https://github.com/)，登录账户
2. 点击右上角 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - Repository name: BooksManagementSystem
   - Description: 图书借阅信息管理系统
   - Visibility: 根据项目需求选择 Public 或 Private
   - 勾选 "Add a README file"
   - 点击 "Create repository"

### 2. 关键配置设置

#### 2.1 分支保护规则
为确保代码质量和安全，需对 main 分支设置严格的保护规则：

1. 进入仓库 Settings → Branches → Branch protection rules → Add rule
2. Branch name pattern: main
3. 勾选以下保护选项：
   - Require a pull request before merging: 强制通过 PR 进行代码合并
   - Require approvals: 至少需要 1 个审核通过
   - Dismiss stale pull request approvals when new commits are pushed: 当有新提交时，取消之前的审核
   - Require status checks to pass before merging: 要求状态检查通过才能合并
   - Require branches to be up to date before merging: 要求分支必须与目标分支保持同步
   - Include administrators: 规则同样适用于管理员
4. 点击 "Create"

#### 2.2 GitHub Actions 配置

1. 在仓库根目录创建 `.github/workflows/` 文件夹
2. 创建测试工作流文件 `.github/workflows/test.yml`
3. 配置内容见本文件 "三、GitHub Actions 工作流配置" 章节

#### 2.3 协作成员管理

1. 进入仓库 Settings → Manage access → Invite a collaborator
2. 输入协作者 GitHub 用户名或邮箱地址
3. 分配合适的权限角色（默认选择 "Write" 权限）
4. 点击 "Add {username} to this repository"

## 二、本地仓库与远程仓库连接

### 1. 首次连接远程仓库

在本地已初始化的 Git 仓库中执行以下命令：

```bash
# 添加远程仓库地址
git remote add origin https://github.com/{your_username}/BooksManagementSystem.git

# 推送本地 main 分支到远程
git push -u origin main
```

### 2. 克隆远程仓库

对于新加入的开发人员，可直接克隆远程仓库：

```bash
git clone https://github.com/{your_username}/BooksManagementSystem.git
cd BooksManagementSystem
```

## 三、GitHub Actions 工作流配置

### 工作流文件名：`.github/workflows/test.yml`

```yaml
name: Run Tests

on:
  push:
    branches: [ "feature/**" ]
  pull_request:
    branches: [ "main" ]

jobs:
  test:
    runs-on: windows-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'
      
      - name: Install dependencies
        run: |
          npm install
        
      - name: Run tests
        run: |
          npm test
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
```

## 四、Webhook 与通知配置

### 1. 启用邮件通知

1. 进入 Settings → Notifications
2. 勾选 "Email me about all of my notifications"
3. 调整其他通知偏好设置

### 2. Slack 集成（可选）

若团队使用 Slack 进行沟通，可集成 GitHub 与 Slack：

1. 在 Slack 中安装 GitHub 应用
2. 在 GitHub 仓库的 Settings → Webhooks → Add webhook 中配置 Slack 通知

## 五、验收检查清单

- [ ] 远程仓库已成功创建
- [ ] main 分支保护规则已设置
- [ ] GitHub Actions 工作流已配置
- [ ] 协作成员已添加并分配适当权限
- [ ] 本地仓库已成功连接到远程仓库
- [ ] 首次代码推送已完成

## 六、常见问题与解决方案

1. **无法推送代码到远程仓库**
   - 问题：`fatal: Authentication failed for 'https://github.com/...'`
   - 解决方案：使用 GitHub Token 或 SSH Key 进行认证
   - 步骤：前往 GitHub 设置 → Developer settings → Personal access tokens → Generate new token

2. **PR 无法合并**
   - 问题："Required status check "tests" is failing"
   - 解决方案：修复代码并确保测试通过后再次提交

3. **GitHub Actions 构建失败**
   - 问题：依赖安装失败或测试执行失败
   - 解决方案：查看 Actions 日志，根据错误信息修复问题
   - 常见原因：Node.js 版本不匹配、依赖缺失、测试用例错误