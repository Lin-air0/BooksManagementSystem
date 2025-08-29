// Vue应用入口文件
// 版本：v1.0.1

import Vue from 'vue';
import App from './App.vue';
import router from './router';

Vue.config.productionTip = false;

const app = new Vue({
  router,
  render: h => h(App)
});

// 确保路由加载完成后再挂载
router.onReady(() => {
  app.$mount('#app');
});