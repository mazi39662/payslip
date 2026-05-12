<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, AlertCircle, TrendingUp } from 'lucide-vue-next'
import { supabase } from '@/utils/supabase'

const authStore = useAuthStore()
const totalEmployees = ref(0)
const pendingConcerns = ref(0)
const isLoading = ref(true)

const CACHE_KEY = 'hr_dashboard_stats_cache'

function loadCache() {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const data = JSON.parse(cached)
      totalEmployees.value = data.totalEmployees || 0
      pendingConcerns.value = data.pendingConcerns || 0
      isLoading.value = false
    } catch (e) {
      console.error('Error parsing dashboard cache:', e)
    }
  }
}

async function fetchStats() {
  if (totalEmployees.value === 0) {
    isLoading.value = true
  }
  
  try {
    // Fetch total active employees
    const { count: employeesCount, error: employeesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (!employeesError) {
      totalEmployees.value = employeesCount || 0
    }

    // Fetch total concerns
    const { count: concernsCount, error: concernsError } = await supabase
      .from('concerns')
      .select('*', { count: 'exact', head: true })

    if (!concernsError) {
      pendingConcerns.value = concernsCount || 0
    }

    // Save to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      totalEmployees: totalEmployees.value,
      pendingConcerns: pendingConcerns.value
    }))
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadCache()
  fetchStats()
})

const stats = [
  { name: 'Total Employees', value: totalEmployees, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Payslips Generated', value: 0, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Pending Concerns', value: pendingConcerns, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Net Payroll (MTD)', value: 0, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
]
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <h1 class="text-4xl font-extrabold text-white tracking-tight">HR Dashboard</h1>
        <span class="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-500/20 mt-1">
          ID: {{ authStore.profile?.employee_no }}
        </span>
      </div>
      <p class="text-slate-400 text-lg">Welcome back. Here's an overview of your organization's payroll health.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card v-for="stat in stats" :key="stat.name" class="bg-slate-900/40 border-slate-800 backdrop-blur-sm hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-300 group shadow-lg">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{{ stat.name }}</CardTitle>
          <div :class="[stat.bg, stat.color, 'p-2.5 rounded-xl transition-transform group-hover:scale-110 shadow-inner']">
            <component :is="stat.icon" class="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="isLoading" class="h-9 w-16 bg-slate-800 animate-pulse rounded-md"></div>
          <div v-else class="text-3xl font-bold text-white tracking-tight">{{ stat.value }}</div>
          <p class="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 uppercase tracking-wider font-bold">
            <span class="text-emerald-400">+0%</span> vs last period
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <!-- Payroll Trends Mockup -->
       <Card class="lg:col-span-2 bg-slate-900/40 border-slate-800 shadow-xl overflow-hidden group">
         <CardHeader class="border-b border-slate-800/50 bg-slate-900/20">
           <CardTitle class="text-xl font-bold text-white flex items-center gap-2">
             <TrendingUp class="w-5 h-5 text-blue-500" />
             Payroll Trends
           </CardTitle>
         </CardHeader>
         <CardContent class="h-[350px] flex items-center justify-center relative p-0">
            <div class="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-50"></div>
            <div class="text-center space-y-4 relative z-10 px-6">
              <div class="p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50 inline-block shadow-2xl group-hover:scale-105 transition-transform duration-500">
                <TrendingUp class="w-10 h-10 text-blue-400 opacity-20" />
              </div>
              <div class="space-y-1">
                <h3 class="text-lg font-semibold text-slate-200">Analytics Loading</h3>
                <p class="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">We're aggregating your payroll data for this month. Detailed charts will appear here shortly.</p>
              </div>
            </div>
         </CardContent>
       </Card>

       <!-- Recent Activity -->
       <Card class="bg-slate-900/40 border-slate-800 shadow-xl flex flex-col group">
         <CardHeader class="border-b border-slate-800/50 bg-slate-900/20">
           <CardTitle class="text-xl font-bold text-white flex items-center gap-2">
             <AlertCircle class="w-5 h-5 text-amber-500" />
             Recent Activity
           </CardTitle>
         </CardHeader>
         <CardContent class="flex-1 p-6">
            <div class="space-y-6">
              <div class="flex gap-4 items-start group/item">
                <div class="w-2 h-2 mt-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] group-hover/item:scale-125 transition-transform"></div>
                <div class="flex-1 space-y-1">
                  <p class="text-sm text-slate-300 font-medium">Dashboard connected to Supabase</p>
                  <p class="text-xs text-slate-500">Just now</p>
                </div>
              </div>
              <div class="pt-4 text-center">
                <button class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">View All Logs</button>
              </div>
            </div>
         </CardContent>
       </Card>
    </div>
  </div>
</template>

