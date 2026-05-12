<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Calendar, 
  Bell
} from 'lucide-vue-next'
import { supabase } from '@/utils/supabase'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const router = useRouter()

const isLoading = ref(false) // Start false to show cache if it exists
const rawPayslips = ref<any[]>([])
const CACHE_KEY = computed(() => `payslips_cache_${authStore.user?.id}`)

const formatAmount = (amount: number) => {
  if (!settingsStore.isAmountVisible) return '••••••'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: settingsStore.currency,
  }).format(amount)
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Load cache immediately
function loadCache() {
  if (!authStore.user) return
  const cached = localStorage.getItem(CACHE_KEY.value)
  if (cached) {
    try {
      rawPayslips.value = JSON.parse(cached)
      console.log('Cache loaded for user:', authStore.user.id)
    } catch (e) {
      console.error('Error parsing cache:', e)
    }
  }
}

async function fetchAnalyticsData() {
  console.log('fetchAnalyticsData called, user:', authStore.user?.id)
  if (!authStore.user) {
    isLoading.value = false
    return
  }
  
  isLoading.value = true

  try {
    console.log('Fetching fresh analytics from Supabase...')
    const { data, error } = await supabase
      .from('payslips')
      .select('payroll_date, net_pay')
      .eq('employee_id', authStore.user.id)
      .order('payroll_date', { ascending: true })

    if (error) {
      console.error('Supabase Query Error:', error)
      throw error
    }
    
    console.log('Fresh analytics data received, count:', data?.length || 0)
    rawPayslips.value = data || []
    
    // Update cache
    localStorage.setItem(CACHE_KEY.value, JSON.stringify(rawPayslips.value))
  } catch (error) {
    console.error('Error fetching analytics:', error)
  } finally {
    isLoading.value = false
    console.log('Analytics background fetch completed')
  }
}

watch(() => authStore.user?.id, (newUserId, oldUserId) => {
  console.log('Dashboard Auth Watch:', { old: oldUserId, new: newUserId })
  if (newUserId) {
    if (newUserId !== oldUserId) {
      rawPayslips.value = []
    }
    loadCache()
    fetchAnalyticsData()
  } else {
    rawPayslips.value = []
    isLoading.value = false
  }
}, { immediate: true })

const selectedYear = computed(() => {
  if (rawPayslips.value.length === 0) return new Date().getFullYear()
  // Find the latest year in the data
  const years = rawPayslips.value.map(p => new Date(p.payroll_date).getFullYear())
  return Math.max(...years)
})

const salaryData = computed(() => {
  const data = months.map((month, index) => {
    const monthNum = index + 1
    // Filter and sum all payslips for this month and year
    const monthlyPayslips = rawPayslips.value.filter(p => {
      const date = new Date(p.payroll_date)
      return (date.getMonth() + 1) === monthNum && date.getFullYear() === selectedYear.value
    })
    
    const totalAmount = monthlyPayslips.reduce((sum, p) => sum + Number(p.net_pay), 0)
    
    return {
      month,
      amount: totalAmount
    }
  })
  return data
})

const maxAmount = computed(() => {
  const max = Math.max(...salaryData.value.map(d => d.amount))
  return max > 0 ? max : 1000 // Fallback to avoid division by zero
})

const averageMonthly = computed(() => {
  const paidMonths = salaryData.value.filter(d => d.amount > 0)
  if (paidMonths.length === 0) return 0
  const total = paidMonths.reduce((sum, d) => sum + d.amount, 0)
  return total / paidMonths.length
})

const yearToDate = computed(() => {
  return salaryData.value.reduce((sum, d) => sum + d.amount, 0)
})

const projection = computed(() => {
  const paidMonths = salaryData.value.filter(d => d.amount > 0).length
  if (paidMonths === 0) return 0
  return (yearToDate.value / paidMonths) * 12
})

</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Welcome back, <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">{{ authStore.profile?.full_name?.split(' ')[0] || 'User' }}</span> 👋
        </h1>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-slate-400">Here's what's happening with your payroll and workplace.</p>
          <span class="text-slate-600">•</span>
          <span class="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-500/20">
            ID: {{ authStore.profile?.employee_no }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" size="icon" class="rounded-full border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800">
          <Bell class="h-5 w-5" />
        </Button>
        <div 
          @click="router.push({ name: 'employee-settings' })"
          class="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-slate-900 shadow-xl cursor-pointer hover:scale-110 transition-transform"
        >
          {{ authStore.profile?.full_name?.charAt(0) || 'U' }}
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Card 1: Salary Analytics -->
      <Card class="lg:col-span-2 bg-slate-900/40 border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
        <CardHeader class="flex flex-row items-center justify-between pb-2 border-b border-slate-800/50 bg-slate-900/20">
          <div>
            <CardTitle class="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp class="w-5 h-5 text-blue-400" />
              Salary Analytics
              <div v-if="isLoading && rawPayslips.length > 0" class="flex items-center gap-2 ml-2">
                <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span class="text-[10px] text-slate-500 font-medium uppercase tracking-widest animate-pulse">Updating...</span>
              </div>
            </CardTitle>
            <CardDescription class="text-slate-500">Earnings performance throughout the year</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            @click="settingsStore.toggleAmountVisibility"
            class="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <component :is="settingsStore.isAmountVisible ? Eye : EyeOff" class="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent class="pt-8 flex-1 flex flex-col min-h-[350px]">
          <!-- Full card loading only if no data at all -->
          <div v-if="isLoading && rawPayslips.length === 0" class="flex-1 flex flex-col items-center justify-center space-y-4">
            <div class="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p class="text-slate-500 font-medium">Analyzing your salary data...</p>
          </div>

          <template v-else>
            <!-- Salary Summary -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-8">
              <div class="space-y-1">
                <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Average Monthly</p>
                <p class="text-2xl font-black text-white">{{ formatAmount(averageMonthly) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Year to Date</p>
                <p class="text-2xl font-black text-blue-400">{{ formatAmount(yearToDate) }}</p>
              </div>
              <div class="hidden sm:block space-y-1">
                <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Projection</p>
                <p class="text-2xl font-black text-indigo-400">{{ formatAmount(projection) }}</p>
              </div>
            </div>

            <!-- Simple SVG Chart -->
            <div class="h-64 w-full mt-auto relative group">
              <div v-if="yearToDate === 0" class="absolute inset-0 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <p class="text-slate-600 text-sm italic">No salary data available for {{ selectedYear }}</p>
              </div>
              <template v-else>
                <div class="absolute inset-0 flex items-end justify-between px-2 gap-1 sm:gap-2">
                  <div 
                    v-for="(item, index) in salaryData" 
                    :key="index"
                    class="relative flex-1 group/bar"
                    :style="{ height: `${(item.amount / maxAmount) * 100}%` }"
                  >
                    <div 
                      class="w-full h-full bg-gradient-to-t from-blue-600/20 to-blue-500/60 rounded-t-sm sm:rounded-t-md transition-all duration-500 group-hover/bar:to-blue-400 group-hover/bar:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    ></div>
                    <!-- Tooltip -->
                    <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none border border-slate-700 shadow-xl">
                      {{ item.month }}: {{ formatAmount(item.amount) }}
                    </div>
                  </div>
                </div>
                
                <!-- X-Axis Labels -->
                <div class="absolute -bottom-6 inset-x-0 flex justify-between px-2 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                  <span v-for="item in salaryData" :key="item.month" class="flex-1 text-center">{{ item.month }}</span>
                </div>

                <!-- Grid Lines (Horizontal) -->
                <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                  <div v-for="i in 4" :key="i" class="w-full h-px bg-slate-400"></div>
                </div>
              </template>
            </div>
          </template>
        </CardContent>
      </Card>

      <div class="space-y-8">
        <!-- Card 2: Quick Actions -->
        <Card class="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md">
          <CardHeader>
            <CardTitle class="text-xl font-bold text-white">Quick Actions</CardTitle>
            <CardDescription class="text-slate-500">Frequently used shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              @click="router.push({ name: 'employee-payslips' })"
              class="flex flex-col w-full h-32 gap-3 bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div class="p-3 bg-white/20 rounded-2xl">
                <FileText class="w-8 h-8" />
              </div>
              <span class="text-lg font-bold">View My Payslips</span>
            </Button>
          </CardContent>
        </Card>

        <!-- Card 3: News & Updates -->
        <Card class="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md flex flex-col relative overflow-hidden group">
          <!-- Subtle background decorative element -->
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
          
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-xl font-bold text-white">News & Updates</CardTitle>
              <div class="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-slate-700">
                0 New
              </div>
            </div>
          </CardHeader>
          <CardContent class="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div class="p-4 bg-slate-800/50 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-500">
              <Bell class="w-8 h-8 text-slate-500" />
            </div>
            <h3 class="text-lg font-bold text-slate-300">Coming Soon</h3>
            <p class="text-xs text-slate-500 max-w-[180px] mt-2">
              We're building a space for your company announcements and payroll updates.
            </p>
            
            <!-- Hidden button for layout consistency but disabled/ghosted -->
            <Button disabled variant="ghost" class="w-full mt-6 text-slate-600 cursor-not-allowed text-xs font-bold uppercase tracking-widest">
              No active updates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Professional Bottom Banner -->
    <div class="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10 shadow-2xl group">
      <div class="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="flex items-center gap-6">
          <div class="p-5 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
            <Calendar class="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <p class="text-slate-500 text-sm font-bold uppercase tracking-[0.2em]">Upcoming Payroll</p>
            <h2 class="text-white text-3xl md:text-4xl font-black tracking-tight mt-1">May 31, 2024</h2>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs bg-blue-500/10 px-3 py-1 rounded-full text-blue-400 font-bold uppercase tracking-widest border border-blue-500/20">24 Days Remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
