import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Router
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', redirect: '/dashboard' },
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue') },
    { path: '/dashboard', name: 'dashboard', component: () => import('./views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/insights', name: 'insights', component: () => import('./views/InsightsView.vue'), meta: { requiresAuth: true } },
    { path: '/chat', name: 'chat', component: () => import('./views/ChatView.vue'), meta: { requiresAuth: true } },
  ],
})

// Local Auth Guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('sf_is_authenticated') === 'true'

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if ((to.name === 'login' || to.name === 'home') && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

import { syncFromChrome } from '../storage/storageAdapter.js'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Initialize storage before mounting
syncFromChrome().then(() => {
  app.mount('#app')
})
