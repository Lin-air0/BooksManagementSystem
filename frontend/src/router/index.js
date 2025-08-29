// 图书借阅系统前端路由配置
// 导入页面组件
import Vue from 'vue';
import VueRouter from 'vue-router';

// 导入页面组件
import BookList from '../views/BookList.vue';
import ReaderManage from '../views/ReaderManage.vue';
import Home from '../views/Home.vue';
import BorrowRecord from '../views/BorrowRecord.vue';
import Statistics from '../views/Statistics.vue';

// 使用路由插件
Vue.use(VueRouter);

// 定义路由规则
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/book-list',
    name: 'BookList',
    component: BookList
  },
  {
    path: '/reader-manage',
    name: 'ReaderManage',
    component: ReaderManage
  },
  {
    path: '/borrow-record',
    name: 'BorrowRecord',
    component: BorrowRecord
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics
  },

];

// 创建路由实例
const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
});

export default router;