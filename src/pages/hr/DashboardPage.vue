<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, AlertCircle, TrendingUp } from 'lucide-vue-next'

const stats = [
  { name: 'Total Employees', value: '124', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Payslips Generated', value: '1,024', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Pending Concerns', value: '12', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Net Payroll (MTD)', value: '$452,000', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
]
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-2">
      <h1 class="text-4xl font-extrabold text-white tracking-tight">HR Dashboard</h1>
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
          <div class="text-3xl font-bold text-white tracking-tight">{{ stat.value }}</div>
          <p class="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 uppercase tracking-wider font-bold">
            <span class="text-emerald-400">+12%</span> vs last period
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

       <!-- Quick Actions / Notifications -->
       <Card class="bg-slate-900/40 border-slate-800 shadow-xl flex flex-col group">
         <CardHeader class="border-b border-slate-800/50 bg-slate-900/20">
           <CardTitle class="text-xl font-bold text-white flex items-center gap-2">
             <AlertCircle class="w-5 h-5 text-amber-500" />
             Recent Activity
           </CardTitle>
         </CardHeader>
         <CardContent class="flex-1 p-6">
            <div class="space-y-6">
              <div v-for="i in 3" :key="i" class="flex gap-4 items-start group/item">
                <div class="w-2 h-2 mt-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] group-hover/item:scale-125 transition-transform"></div>
                <div class="flex-1 space-y-1">
                  <p class="text-sm text-slate-300 font-medium">New employee added</p>
                  <p class="text-xs text-slate-500">2 hours ago</p>
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
