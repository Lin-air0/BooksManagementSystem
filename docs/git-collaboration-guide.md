# Git 协作指南

## 版本信息
- 版本：v1.0.0
- 适配阶段：图书借阅系统 MVP 阶段
- 创建日期：2025年8月24日
- 作者：协同开发专员

## 一、分支策略

### 1. 分支类型与命名规范

本项目采用简洁的分支策略，仅包含以下两类分支：

#### 1.1 main 分支（生产分支）
- **用途**：存放可部署、稳定的代码
- **特点**：受保护，禁止直接提交，仅接受通过 PR 合并的代码
- **命名**：`main`

#### 1.2 feature 分支（功能开发分支）
- **用途**：开发新功能或修复 bug
- **命名规范**：`feature/{功能模块名称}`
- **创建来源**：从最新的 main 分支创建

### 2. 项目主要功能分支

根据图书借阅系统的 5 个核心页面功能，创建以下 feature 分支：

| 分支名称 | 对应功能 | 开发内容 |
|---------|---------|---------|
| `feature/book-list` | 图书列表页 | 图书查询、图书详情、图书分类等功能 |
| `feature/reader-manage` | 读者管理页 | 读者信息增删改查、读者类型管理等功能 |
| `feature/borrow-records` | 借阅记录页 | 借阅操作、还书操作、借阅记录查询等功能 |
| `feature/statistics` | 统计分析页 | 借阅数据统计、热门图书排行等数据可视化功能 |
| `feature/admin-dashboard` | 管理后台页 | 管理员操作、系统设置等功能 |

## 二、工作流程

### 1. 开始新功能开发

```bash
# 确保当前在 main 分支并获取最新代码
git checkout main
git pull origin main

# 创建并切换到新的 feature 分支
git checkout -b feature/{功能模块名称}
```

### 2. 日常开发与提交

```bash
# 添加修改的文件
git add .

# 提交更改，使用清晰的提交信息
git commit -m "feat: 实现图书列表分页功能"

# 推送到远程仓库
git push origin feature/{功能模块名称}
```

### 3. 创建 Pull Request

当功能开发完成并通过本地测试后：

1. 在 GitHub 上打开仓库页面
2. 点击 "Pull requests" → "New pull request"
3. 选择 base: `main` 和 compare: `feature/{功能模块名称}`
4. 填写 PR 描述，包括：
   - 实现的功能
   - 解决的问题
   - 相关测试
5. 点击 "Create pull request"

### 4. 代码审核与合并

1. 等待至少 1 位协作者进行代码审核
2. 根据审核意见修改代码并再次提交
3. 确保所有 CI/CD 检查通过
4. 审核通过后，点击 "Merge pull request"
5. 删除已合并的 feature 分支

## 三、冲突解决范例

### 1. 同步 main 分支到 feature 分支解决 package.json 依赖冲突

**场景**：当你的 feature 分支开发过程中，main 分支的 package.json 文件被其他开发者更新，导致依赖冲突。

**解决方案**：

```bash
# 切换到 main 分支并获取最新代码
git checkout main
git pull origin main

# 切换回你的 feature 分支
git checkout feature/your-feature-branch

# 将 main 分支的更改合并到你的 feature 分支
git merge main

# 此时若出现 package.json 冲突，手动编辑解决冲突
# 打开 package.json 文件，查找冲突标记 "<<<<<<< HEAD" 和 "======="，保留正确的依赖配置

# 解决冲突后，添加并提交更改
git add package.json
git commit -m "fix: 解决 package.json 依赖冲突"

# 继续推送到远程
git push origin feature/your-feature-branch
```

### 2. 合并冲突解决（Git UI 工具）

如果使用 Git GUI 工具（如 VS Code 内置 Git 工具），可以更直观地解决冲突：

1. 当合并时出现冲突，VS Code 会显示冲突文件
2. 点击文件中的 "Resolve in Merge Editor" 按钮
3. 在合并编辑器中，比较左侧（你的更改）和右侧（目标分支的更改）
4. 选择保留哪些更改，或手动编辑合并后的结果
5. 保存文件后，点击 "Complete Merge"
6. 添加并提交解决冲突的更改

## 四、代码提交规范

### 1. 提交信息格式

```
<type>: <subject>

[optional body]

[optional footer]
```

### 2. 类型（Type）

| 类型 | 说明 |
|------|------|
| feat | 新功能（feature） |
| fix | 修复 bug |
| docs | 文档（documentation） |
| style | 格式（不影响代码运行的变动） |
| refactor | 重构（既不增加功能，也不修复 bug） |
| test | 增加测试 |
| chore | 构建过程或辅助工具的变动 |

### 3. 示例

```
feat: 添加图书按分类查询功能

实现了图书列表页的分类筛选功能，用户可以根据图书分类进行查询。

相关需求：#123
```

## 五、团队协作规范

### 1. 每日同步

- 每天开始工作前，先从 main 分支拉取最新代码
- 开发过程中，定期将 feature 分支推送到远程仓库
- 每周至少将 main 分支的最新代码合并到你的 feature 分支一次

### 2. 代码评审要点

- 核心功能是否实现完整
- API 是否符合《API 设计文档》
- 是否存在明显 bug
- 代码是否遵循项目规范
- 单元测试是否覆盖主要场景

### 3. 沟通与反馈

- 大型功能开发前进行简短的方案讨论
- 遇到问题及时在团队群中沟通
- PR 审核意见应具体、建设性
- 对审核意见的回复应及时、清晰

## 六、文件命名规范

### 1. 统一英文命名

为确保项目文件命名的一致性，所有文档、资源文件、原型图等均采用英文命名规范：

#### 1.1 文档文件命名
- 使用小写字母和连字符（-）分隔单词
- 避免使用中文、空格或特殊字符
- 示例：`api-design-document.md`、`reader-management-test-report.md`

#### 1.2 资源文件命名
- 图片文件：使用描述性名称，如 `current-homepage.png`
- Excel文件：使用业务描述，如 `book-borrow-return-records.xlsx`
- 文件夹：使用简洁英文，如 `library-management-system-prototypes`

#### 1.3 原型文件命名
- 采用 `{功能模块}-prototype.{扩展名}` 格式
- 示例：`book-management-prototype.html`、`statistics-prototype.html`

### 2. 命名检查清单

在提交代码前，请确认：
- [ ] 所有文件名均为英文
- [ ] 使用连字符（-）而非下划线（_）或空格
- [ ] 文件名具有描述性，能清晰表达内容
- [ ] 无重复或冲突的文件名

## 七、附录：常用 Git 命令速查

### 1. 基本操作

```bash
git init              # 初始化 Git 仓库
git clone <url>       # 克隆远程仓库
git status            # 查看工作区状态
git add <file>        # 添加文件到暂存区
git commit -m "message" # 提交更改
git push origin <branch> # 推送到远程分支
git pull origin <branch> # 从远程分支拉取
```

### 2. 分支操作

```bash
git branch            # 查看所有分支
git branch <name>     # 创建新分支
git checkout <branch> # 切换分支
git merge <branch>    # 合并分支
git branch -d <branch> # 删除本地分支
```

### 3. 文件重命名操作

```bash
git mv <old-name> <new-name>  # Git方式重命名文件
git add -A                    # 添加所有更改（包括重命名）
```

### 4. 历史查看

```bash
git log               # 查看提交历史
git diff              # 查看工作区与暂存区的差异
git diff --cached     # 查看暂存区与版本库的差异
git diff <branch1> <branch2> # 查看两个分支的差异
```

## 七、验收检查清单

- [ ] 分支策略已在团队中明确传达
- [ ] 所有开发者已了解 PR 流程
- [ ] 团队成员已掌握基本的冲突解决方法
- [ ] Git 提交信息规范已被遵循
- [ ] 团队协作规范已达成共识

## 八、常见问题与解决方案

1. **忘记创建 feature 分支直接在 main 分支开发**
   - 解决方案：在 main 分支创建新分支，然后回滚 main 分支
   - 步骤：`git checkout -b feature/new-feature`，`git checkout main`，`git reset --hard HEAD~{commit-count}`

2. **提交了错误的文件到暂存区**
   - 解决方案：从暂存区移除文件
   - 步骤：`git reset HEAD <file>`

3. **需要撤销已提交的更改**
   - 解决方案：使用 git revert 创建新的提交来撤销之前的提交
   - 步骤：`git revert <commit-hash>`

4. **本地分支与远程分支不同步**
   - 解决方案：先拉取远程分支，再推送本地更改
   - 步骤：`git pull --rebase origin <branch>`，然后 `git push origin <branch>`