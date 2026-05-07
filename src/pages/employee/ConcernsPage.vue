<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4">
      <Button 
        variant="ghost" 
        class="w-fit text-slate-400 hover:text-white -ml-4"
        @click="router.push({ name: 'employee-dashboard' })"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Support & Concerns</h1>
          <p class="text-slate-400">Raise a ticket for payroll or HR related inquiries.</p>
        </div>
        <Button class="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6">
          <Plus class="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
      <div class="p-6 bg-slate-900 rounded-full">
        <MessageSquare class="w-10 h-10 text-slate-700" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-white">No active concerns</h3>
        <p class="text-slate-500 max-w-xs mx-auto">Everything looks good! If you have any questions, feel free to raise a new ticket.</p>
      </div>
    </div>
  </div>
</template>
