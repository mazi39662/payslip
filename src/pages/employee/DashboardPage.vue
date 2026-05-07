<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  Calendar, 
  Bell, 
  ChevronRight,
  ArrowUpRight
} from 'lucide-vue-next'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const router = useRouter()


const formatAmount = (amount: number) => {
  if (!settingsStore.isAmountVisible) return '••••••'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: settingsStore.currency,
  }).format(amount)
}

// Mock data for the chart
const salaryData = [
  { month: 'Jan', amount: 3800 },
  { month: 'Feb', amount: 4100 },
  { month: 'Mar', amount: 3950 },
  { month: 'Apr', amount: 4250 },
  { month: 'May', amount: 4250 },
  { month: 'Jun', amount: 4400 },
  { month: 'Jul', amount: 4400 },
  { month: 'Aug', amount: 4600 },
  { month: 'Sep', amount: 4600 },
  { month: 'Oct', amount: 4800 },
  { month: 'Nov', amount: 4800 },
  { month: 'Dec', amount: 5000 },
]

const maxAmount = Math.max(...salaryData.map(d => d.amount))

const newsItems = [
  {
    id: 1,
    title: 'New Health Insurance Provider',
    description: 'We are switching to a new provider starting next month with better coverage.',
    date: '2 hours ago',
    type: 'announcement'
  },
  {
    id: 2,
    title: 'Quarterly Bonus Update',
    description: 'Performance bonuses for Q1 have been processed and will be reflected in your next payslip.',
    date: 'Yesterday',
    type: 'finance'
  },
  {
    id: 3,
    title: 'Upcoming Office Maintenance',
    description: 'The office will be closed this Friday for scheduled maintenance.',
    date: '3 days ago',
    type: 'maintenance'
  }
]
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Welcome back, <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">{{ authStore.profile?.full_name?.split(' ')[0] || 'User' }}</span> 👋
        </h1>
        <p class="text-slate-400">Here's what's happening with your payroll and workplace.</p>
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
        
        <CardContent class="pt-8 flex-1 flex flex-col">
          <!-- Salary Summary -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-8">
            <div class="space-y-1">
              <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Average Monthly</p>
              <p class="text-2xl font-black text-white">{{ formatAmount(4350) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Year to Date</p>
              <p class="text-2xl font-black text-blue-400">{{ formatAmount(53100) }}</p>
            </div>
            <div class="hidden sm:block space-y-1">
              <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Projection</p>
              <p class="text-2xl font-black text-indigo-400">{{ formatAmount(65000) }}</p>
            </div>
          </div>

          <!-- Simple SVG Chart -->
          <div class="h-64 w-full mt-auto relative group">
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
          </div>
        </CardContent>
      </Card>

      <div class="space-y-8">
        <!-- Card 2: Quick Actions -->
        <Card class="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md">
          <CardHeader>
            <CardTitle class="text-xl font-bold text-white">Quick Actions</CardTitle>
            <CardDescription class="text-slate-500">Frequently used shortcuts</CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-2 gap-4">
            <Button 
              @click="router.push({ name: 'employee-payslips' })"
              class="flex flex-col h-28 gap-3 bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div class="p-2 bg-white/20 rounded-xl">
                <FileText class="w-6 h-6" />
              </div>
              <span class="font-bold">Payslips</span>
            </Button>
            
            <Button 
              variant="outline"
              @click="router.push({ name: 'employee-concerns' })"
              class="flex flex-col h-28 gap-3 border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div class="p-2 bg-slate-700/50 rounded-xl text-blue-400">
                <MessageSquare class="w-6 h-6" />
              </div>
              <span class="font-bold">Concern</span>
            </Button>
          </CardContent>
        </Card>

        <!-- Card 3: News & Updates -->
        <Card class="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md flex flex-col">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-xl font-bold text-white">News & Updates</CardTitle>
              <div class="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-blue-500/20">
                3 New
              </div>
            </div>
          </CardHeader>
          <CardContent class="flex-1">
            <div class="space-y-4">
              <div 
                v-for="news in newsItems" 
                :key="news.id"
                class="group cursor-pointer p-3 rounded-2xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700/50"
              >
                <div class="flex gap-3">
                  <div class="mt-1">
                    <div v-if="news.type === 'finance'" class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div v-else-if="news.type === 'announcement'" class="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div v-else class="w-2 h-2 rounded-full bg-amber-500"></div>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <h4 class="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{{ news.title }}</h4>
                      <span class="text-[10px] text-slate-500 whitespace-nowrap">{{ news.date }}</span>
                    </div>
                    <p class="text-xs text-slate-400 line-clamp-1 group-hover:text-slate-300">{{ news.description }}</p>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" class="w-full mt-4 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-xl group text-xs font-bold uppercase tracking-widest">
              View All Updates
              <ChevronRight class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Bottom Banner (Retained but refreshed) -->
    <div class="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-8 md:p-10 shadow-2xl group">
      <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="flex items-center gap-6">
          <div class="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
            <Calendar class="w-10 h-10 text-white" />
          </div>
          <div>
            <p class="text-blue-100 text-sm font-bold uppercase tracking-[0.2em]">Upcoming Payroll</p>
            <h2 class="text-white text-3xl md:text-4xl font-black tracking-tight mt-1">May 31, 2024</h2>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs bg-white/20 px-3 py-1 rounded-full text-white font-bold uppercase tracking-widest backdrop-blur-md">24 Days Remaining</span>
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
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
