const { exec } = require('child_process');
const os = require('os');

// 判断操作系统类型
const isWindows = os.platform() === 'win32';

// 释放指定端口的函数
function freePort(port) {
  return new Promise((resolve, reject) => {
    let command;
    
    if (isWindows) {
      // Windows系统命令
      command = `netstat -ano | findstr :${port} | findstr LISTENING`;
    } else {
      // macOS/Linux系统命令
      command = `lsof -i :${port} | grep LISTEN`;
    }

    exec(command, (error, stdout) => {
      if (error) {
        // 没有找到占用端口的进程，直接返回
        resolve();
        return;
      }

      // 提取进程ID
      let pid;
      if (isWindows) {
        // Windows输出格式处理
        const lines = stdout.trim().split('\n');
        if (lines.length > 0) {
          pid = lines[0].trim().split(/\s+/).pop();
        }
      } else {
        // macOS/Linux输出格式处理
        const lines = stdout.trim().split('\n');
        if (lines.length > 0) {
          pid = lines[0].trim().split(/\s+/)[1];
        }
      }

      if (pid) {
        console.log(`释放端口 ${port}，终止进程 ${pid}`);
        // 终止进程
        exec(isWindows ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
}

// 在新终端中执行命令
function executeInNewTerminal(command) {
  return new Promise((resolve, reject) => {
    let terminalCommand;
    
    if (isWindows) {
      // Windows系统：使用START命令在新窗口中运行，/B参数使其在后台运行
      terminalCommand = `start "App" /B cmd /c "${command}"`;
    } else if (os.platform() === 'darwin') {
      // macOS：打开新的终端窗口并执行命令
      terminalCommand = `osascript -e 'tell app "Terminal" to do script "${command}"'`;
    } else {
      // Linux：在后台运行命令
      terminalCommand = `${command} &`;
    }

    exec(terminalCommand, (error) => {
      if (error) {
        reject(error);
      } else {
        // 给一些时间让进程启动
        setTimeout(resolve, 2000);
      }
    });
  });
}

// 主函数
async function start() {
  try {
    console.log('正在释放端口 3000...');
    await freePort(3000);
    
    console.log('正在释放端口 8080...');
    await freePort(8080);

    console.log('正在启动后端服务...');
    // 启动后端服务，不等待完成
    executeInNewTerminal('cd d:\\BooksManagementSystem\\backend && npm start');

    // 等待一段时间让后端服务启动
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('正在启动前端服务...');
    // 启动前端服务，不等待完成
    executeInNewTerminal('cd d:\\BooksManagementSystem\\frontend && npm run serve');

    console.log('所有服务启动命令已执行，请稍候查看服务是否正常运行。');
    console.log('后端服务运行在 http://localhost:3000');
    console.log('前端服务运行在 http://localhost:8080');
  } catch (error) {
    console.error('启动过程中出现错误:', error);
  }
}

// 执行主函数
start();