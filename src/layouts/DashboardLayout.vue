<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LayoutDashboard, Users, Upload, LogOut, FileText, ChevronRight, Settings } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const hrNavigation = [
  { name: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
  { name: 'Employees', href: '/hr/employees', icon: Users },
  { name: 'Upload Payroll', href: '/hr/upload', icon: Upload },
  { name: 'Company Settings', href: '/hr/settings', icon: Settings },
]

const employeeNavigation = [
  { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { name: 'My Payslips', href: '/employee/payslips', icon: FileText },
  { name: 'Settings', href: '/employee/settings', icon: Settings },
]

const navigation = computed(() => authStore.profile?.role === 'hr' ? hrNavigation : employeeNavigation)

async function handleLogout() {
  console.log('Instant logout initiated...')
  
  // 1. Clear local caches to keep HR/Employee data secure
  localStorage.removeItem('hr_employees_cache')
  localStorage.removeItem('hr_dashboard_stats_cache')
  localStorage.removeItem('employee_payslips_cache')
  
  // 2. Trigger the actual signOut (background)
  authStore.signOut()
  
  // 3. Immediate redirect
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col">
      <div class="p-6">
        <div class="flex items-center gap-3 px-2">
          <div class="p-2 bg-slate-800 rounded-lg border border-slate-700">
            <FileText class="w-6 h-6 text-blue-400" />
          </div>
          <span class="text-xl font-bold text-white tracking-tight italic">PayFlow</span>
        </div>
      </div>

      <nav class="flex-1 px-4 space-y-1">
        <router-link 
          v-for="item in navigation" 
          :key="item.name" 
          :to="item.href"
          class="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group"
          :class="[
            route.path === item.href 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 transition-transform group-hover:scale-110" />
          <span class="font-medium">{{ item.name }}</span>
          <ChevronRight v-if="route.path === item.href" class="ml-auto w-4 h-4" />
        </router-link>
      </nav>

      <div class="p-4 mt-auto border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="w-full flex items-center justify-start gap-3 px-3 py-8 hover:bg-slate-800 rounded-xl transition-all duration-200">
              <Avatar class="w-10 h-10 border-2 border-slate-700 shadow-lg">
                <AvatarImage src="" />
                <AvatarFallback class="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold">
                  {{ authStore.profile?.full_name?.charAt(0) || 'U' }}
                </AvatarFallback>
              </Avatar>
              <div class="flex flex-col items-start overflow-hidden">
                <span class="text-sm font-semibold text-white truncate w-full text-left">{{ authStore.profile?.full_name || 'Loading...' }}</span>
                <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{{ authStore.profile?.role }}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-56 bg-slate-900 border-slate-800 text-slate-200 shadow-2xl" align="end" :side-offset="10">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator class="bg-slate-800" />
            <DropdownMenuItem @select="router.push({ name: 'employee-settings' })" class="text-slate-300 focus:text-white focus:bg-slate-800 cursor-pointer">
              <Settings class="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator class="bg-slate-800" />
            <DropdownMenuItem @select="handleLogout" class="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer">
              <LogOut class="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- Topbar (Mobile) -->
      <header class="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md md:hidden flex items-center justify-between px-6">
        <div class="flex items-center gap-2">
           <FileText class="w-6 h-6 text-blue-500" />
           <span class="font-bold text-white">PayFlow</span>
        </div>
        <Button variant="ghost" size="icon" @click="handleLogout" class="text-slate-400 hover:text-red-400">
          <LogOut class="w-5 h-5" />
        </Button>
      </header>

      <!-- Page Wrapper -->
      <div class="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <!-- Background decorative element -->
        <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <router-view v-slot="{ Component }">
          <transition 
            name="page-fade" 
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>
