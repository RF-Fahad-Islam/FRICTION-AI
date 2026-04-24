import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { supabase } from './lib/supabaseClient'
import App from './App.vue'
import './style.css'

// Router
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('./views/LandingView.vue') },
    { path: '/login', name: 'login', component: () => import('./views/LoginView.vue') },
    { path: '/dashboard', name: 'dashboard', component: () => import('./views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/analytics', name: 'analytics', component: () => import('./views/AnalyticsView.vue'), meta: { requiresAuth: true } },
    { path: '/insights', name: 'insights', component: () => import('./views/InsightsView.vue'), meta: { requiresAuth: true } },
    { path: '/chat', name: 'chat', component: () => import('./views/ChatView.vue'), meta: { requiresAuth: true } },
  ],
})

// Auth Guard
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if ((to.name === 'login' || to.name === 'landing') && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

// Update on Auth change
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (router.currentRoute.value.name === 'login' || router.currentRoute.value.name === 'landing') {
      router.push('/dashboard')
    }
  } else if (event === 'SIGNED_OUT') {
    router.push('/login')
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
