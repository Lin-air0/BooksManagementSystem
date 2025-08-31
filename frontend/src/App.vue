<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 font-sans text-textPrimary">
    <!-- 左侧侧边栏 -->
    <aside class="w-64 bg-secondary border-r border-borderLight h-full flex-shrink-0">
      <div class="py-6 px-4">
        <!-- 系统名称在侧边栏顶部（小型设备显示） -->
        <div class="lg:hidden text-primary text-xl font-semibold mb-8">图书借阅管理系统</div>
        
        <!-- 导航菜单 -->
        <nav class="space-y-1">
          <router-link 
            to="/" 
            class="flex items-center px-4 py-3 rounded-md text-sm font-medium text-textPrimary hover:bg-gray-200 transition-colors" 
            active-class="nav-active"
            exact
          >
            <i class="fa fa-tachometer w-5 h-5 mr-3"></i>
            首页
          </router-link>
          <router-link 
            to="/book-list" 
            class="flex items-center px-4 py-3 rounded-md text-sm font-medium text-textPrimary hover:bg-gray-200 transition-colors"
            active-class="nav-active"
          >
            <i class="fa fa-book w-5 h-5 mr-3"></i>
            图书管理
          </router-link>
          <router-link 
            to="/reader-manage" 
            class="flex items-center px-4 py-3 rounded-md text-sm font-medium text-textPrimary hover:bg-gray-200 transition-colors"
            active-class="nav-active"
          >
            <i class="fa fa-users w-5 h-5 mr-3"></i>
            读者管理
          </router-link>
          <router-link 
            to="/borrow-record" 
            class="flex items-center px-4 py-3 rounded-md text-sm font-medium text-textPrimary hover:bg-gray-200 transition-colors"
            active-class="nav-active"
          >
            <i class="fa fa-exchange w-5 h-5 mr-3"></i>
            借阅记录
          </router-link>
          <router-link 
            to="/statistics" 
            class="flex items-center px-4 py-3 rounded-md text-sm font-medium text-textPrimary hover:bg-gray-200 transition-colors"
            active-class="nav-active"
          >
            <i class="fa fa-bar-chart w-5 h-5 mr-3"></i>
            统计分析
          </router-link>
        </nav>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部导航栏 -->
      <header class="h-15 bg-white border-b border-borderLight flex items-center justify-between px-6">
        <div class="text-primary text-xl font-semibold hidden lg:block">图书借阅管理系统</div>
        
        <!-- 用户信息 -->
        <div class="flex items-center space-x-3">
          <span class="text-sm">管理员</span>
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <i class="fa fa-user"></i>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div class="container mx-auto">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  watch: {
    $route: {
      immediate: true,
      handler(to) {
        if (!to.name) {
          this.$router.push('/');
        }
      }
    }
  }
};
</script>

<style>
/* 引入Tailwind CSS */
@import './assets/css/tailwind.css';

/* 引入Font Awesome图标 */
@import url('https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css');

/* 自定义样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'system-ui', 'sans-serif';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 导航活跃状态自定义样式 */
.nav-active {
  background-color: var(--primary);
  color: white;
}

/* 响应式布局调整 */
@media (max-width: 768px) {
  .w-64 {
    width: 16rem;
  }
}

/* 页面容器样式 */
.container {
  max-width: 100%;
  margin: 0 auto;
}

/* 页面过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>