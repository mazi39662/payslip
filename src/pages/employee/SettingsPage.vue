<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  Globe, 
  ChevronRight,
  ArrowLeft
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
const settingsStore = useSettingsStore()
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col gap-4">
      <Button 
        variant="ghost" 
        class="w-fit text-slate-400 hover:text-white -ml-4"
        @click="router.push({ name: 'employee-dashboard' })"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      <div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
        <p class="text-slate-400">Manage your account preferences and display settings.</p>
      </div>
    </div>

    <div class="max-w-2xl space-y-6">
      <!-- Preferences Section -->
      <Card class="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md overflow-hidden">
        <CardHeader class="border-b border-slate-800/50 bg-slate-900/20">
          <div class="flex items-center gap-2">
            <Globe class="w-5 h-5 text-blue-400" />
            <div>
              <CardTitle class="text-white">Regional Preferences</CardTitle>
              <CardDescription class="text-slate-500">Choose how currency and units are displayed.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="p-6">
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-bold text-white">Display Currency</p>
                <p class="text-xs text-slate-500">All amounts will be shown in this currency.</p>
              </div>
              <div class="flex gap-2">
                <Button 
                  v-for="curr in settingsStore.currencies" 
                  :key="curr.code"
                  @click="settingsStore.setCurrency(curr.code)"
                  :variant="settingsStore.currency === curr.code ? 'default' : 'outline'"
                  class="rounded-xl px-4 py-2 transition-all"
                  :class="settingsStore.currency === curr.code ? 'bg-blue-600 text-white' : 'border-slate-800 text-slate-400 hover:text-white'"
                >
                  {{ curr.symbol }} {{ curr.code }}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
