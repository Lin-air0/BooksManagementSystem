@echo off
echo 正在清理Git历史中的问题...
echo.

REM 安装git-filter-repo（如果尚未安装）
python -m pip install git-filter-repo

REM 备份当前仓库
cd ..
robocopy "BooksManagementSystem" "BooksManagementSystem-backup" /E /XD .git
cd BooksManagementSystem

REM 使用git-filter-repo清理历史
echo 清理.git目录和特殊字符...
git filter-repo --force --path-rename .git:_git_backup --path-rename ..:_dot_backup --invert-paths --path .git --path "*/.git/*"

echo 清理完成！
echo 现在可以尝试推送: git push origin fix/filename-cleanup --force
pause