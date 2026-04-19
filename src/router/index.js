import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'

const routes = [
  //默认路由重定向到首页
  { path: '/', redirect: '/home' },
  {
    path: '/home',
    name: 'Home',
    component: Home,
  },
  // 404 重定向到首页
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
