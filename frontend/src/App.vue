<!-- Vue应用根组件 -->
<!-- 版本：v1.0.1 -->
<template>
  <div id="app">
    <header class="app-header">
      <h1>图书借阅信息管理系统</h1>
    </header>
    
    <!-- 统一导航栏 -->
    <nav class="main-nav">
      <ul class="nav-list">
        <li class="nav-item">
          <router-link to="/" class="nav-link" active-class="nav-link-active" exact>首页</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/book-list" class="nav-link" active-class="nav-link-active">图书管理</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/reader-manage" class="nav-link" active-class="nav-link-active">读者管理</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/borrow-record" class="nav-link" active-class="nav-link-active">借阅记录</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/statistics" class="nav-link" active-class="nav-link-active">统计分析</router-link>
        </li>
      </ul>
    </nav>
    
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8fafc;
  color: #333;
}

.app-header {
  background-color: #2563eb;
  color: white;
  padding: 20px;
  text-align: center;
}

/* 导航栏样式 */
.main-nav {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-list {
  display: flex;
  list-style: none;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-item {
  margin-right: 2px;
}

.nav-link {
  display: block;
  padding: 16px 20px;
  color: #4b5563;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background-color: #f3f4f6;
  color: #1e40af;
}

.nav-link-active {
  background-color: #dbeafe;
  color: #1e40af;
  font-weight: 500;
  border-bottom: 3px solid #2563eb;
}

.app-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 240px);
}
</style>