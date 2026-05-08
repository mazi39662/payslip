<!-- Forced Update v2 -->
<script setup lang="ts">
import { MessageSquare, Rocket, Sparkles } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="h-[80vh] flex items-center justify-center p-6">
    <Card class="max-w-2xl w-full bg-slate-900/40 border-slate-800 shadow-[0_0_100px_rgba(59,130,246,0.1)] backdrop-blur-xl rounded-[3rem] overflow-hidden border-2 border-slate-800/50">
      <CardContent class="p-12 text-center space-y-8 relative">
        <!-- Abstract Background Elements -->
        <div class="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 blur-[80px] rounded-full"></div>
        <div class="absolute bottom-0 right-0 w-48 h-48 bg-purple-600/10 blur-[100px] rounded-full"></div>

        <div class="relative space-y-6">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-2xl shadow-blue-900/40 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <MessageSquare class="w-12 h-12 text-white" />
          </div>

          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 animate-pulse">
              <Rocket class="w-3 h-3" />
              Under Development
            </div>
            <h1 class="text-5xl font-black text-white tracking-tighter leading-none">
              Ticketing <br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Soon Available</span>
            </h1>
            <p class="text-slate-400 text-lg max-w-sm mx-auto leading-relaxed">
              We're building a seamless way for you to communicate with employees and resolve payroll concerns directly.
            </p>
          </div>

          <div class="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button @click="router.back()" variant="outline" class="h-14 px-8 rounded-2xl border-slate-800 text-slate-300 hover:bg-slate-800 transition-all font-bold">
              Return to Dashboard
            </Button>
            <div class="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <Sparkles class="w-4 h-4 text-amber-400" />
              Coming in v2.0
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
