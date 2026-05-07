import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginPage from '@/pages/login/LoginPage.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/hr',
    component: DashboardLayout,
    meta: { role: 'hr' },
    children: [
      {
        path: 'dashboard',
        name: 'hr-dashboard',
        component: () => import('@/pages/hr/DashboardPage.vue')
      },
      {
        path: 'employees',
        name: 'hr-employees',
        component: () => import('@/pages/hr/EmployeesPage.vue')
      },
      {
        path: 'upload',
        name: 'hr-upload',
        component: () => import('@/pages/hr/UploadPage.vue')
      },
      {
        path: 'concerns',
        name: 'hr-concerns',
        component: () => import('@/pages/hr/ConcernsPage.vue')
      }
    ]
  },
  {
    path: '/employee',
    component: DashboardLayout,
    meta: { role: 'employee' },
    children: [
      {
        path: 'dashboard',
        name: 'employee-dashboard',
        component: () => import('@/pages/employee/DashboardPage.vue')
      },
      {
        path: 'payslips',
        name: 'employee-payslips',
        component: () => import('@/pages/employee/PayslipsPage.vue')
      },
      {
        path: 'concerns',
        name: 'employee-concerns',
        component: () => import('@/pages/employee/ConcernsPage.vue')
      },
      {
        path: 'settings',
        name: 'employee-settings',
        component: () => import('@/pages/employee/SettingsPage.vue')
      }
    ]
  },
  {
    path: '/',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  
  // Ensure auth is initialized
  if (authStore.loading) return // Let the current navigation finish if already loading
  
  // Basic login check
  const isLoginPage = to.path === '/login'
  const user = authStore.user

  if (isLoginPage) {
    if (user && authStore.profile) {
      return authStore.profile.role === 'hr' ? '/hr/dashboard' : '/employee/dashboard'
    }
    return true
  }

  // Auth required
  if (!user) {
    return '/login'
  }

  // If user is logged in but profile is not loaded yet (shouldn't happen with init in App.vue, but for safety)
  if (!authStore.profile && !authStore.loading) {
    await authStore.fetchProfile()
  }

  // Check role
  const requiredRole = to.matched.find(record => record.meta.role)?.meta.role as string
  if (requiredRole && authStore.profile?.role !== requiredRole) {
    // If they don't have the role, send them to their respective dashboard
    const target = authStore.profile?.role === 'hr' ? '/hr/dashboard' : '/employee/dashboard'
    if (to.path === target) return true // Prevent loop if already at target
    return target
  }

  return true
})

export default router
