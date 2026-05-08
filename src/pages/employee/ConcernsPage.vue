<script setup lang="ts">
import { MessageSquare, ShieldAlert, Sparkles } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="h-[80vh] flex items-center justify-center p-6">
    <Card class="max-w-2xl w-full bg-slate-900/40 border-slate-800 shadow-[0_0_100px_rgba(16,185,129,0.05)] backdrop-blur-xl rounded-[3rem] overflow-hidden border-2 border-slate-800/50">
      <CardContent class="p-12 text-center space-y-8 relative">
        <!-- Abstract Background Elements -->
        <div class="absolute top-0 left-0 w-32 h-32 bg-emerald-600/10 blur-[80px] rounded-full"></div>
        <div class="absolute bottom-0 right-0 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full"></div>

        <div class="relative space-y-6">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-2xl shadow-emerald-900/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <ShieldAlert class="w-12 h-12 text-white" />
          </div>

          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 animate-pulse">
              <Sparkles class="w-3 h-3" />
              In the Works
            </div>
            <h1 class="text-5xl font-black text-white tracking-tighter leading-none">
              Support Center <br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Soon Available</span>
            </h1>
            <p class="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
              Have a question about your payslip? Our direct support ticketing system is coming soon to help you resolve issues faster.
            </p>
          </div>

          <div class="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button @click="router.back()" variant="outline" class="h-14 px-8 rounded-2xl border-slate-800 text-slate-300 hover:bg-slate-800 transition-all font-bold">
              Go Back
            </Button>
            <div class="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <MessageSquare class="w-4 h-4 text-blue-400" />
              Direct HR Support
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
