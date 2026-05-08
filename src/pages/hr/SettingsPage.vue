<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Save, MapPin, Phone, Mail, Loader2, CheckCircle2, Image } from 'lucide-vue-next'

const isLoading = ref(false)
const isSaving = ref(false)
const showSuccess = ref(false)

const company = ref({
  company_name: '',
  address: '',
  phone: '',
  email: '',
  logo_url: ''
})

async function fetchSettings() {
  isLoading.value = true
  try {
    const { data } = await supabase
      .from('company_settings')
      .select('*')
      .maybeSingle()
    
    if (data) {
      company.value = {
        company_name: data.company_name,
        address: data.address,
        phone: data.phone || '',
        email: data.email || '',
        logo_url: data.logo_url || ''
      }
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
  } finally {
    isLoading.value = false
  }
}

async function saveSettings() {
  isSaving.value = true
  try {
    const { data: existing } = await supabase.from('company_settings').select('id').maybeSingle()
    
    let error
    if (existing) {
      const { error: err } = await supabase
        .from('company_settings')
        .update(company.value)
        .eq('id', existing.id)
      error = err
    } else {
      const { error: err } = await supabase
        .from('company_settings')
        .insert(company.value)
      error = err
    }

    if (error) throw error
    
    showSuccess.value = true
    setTimeout(() => showSuccess.value = false, 3000)
  } catch (error) {
    console.error('Error saving settings:', error)
    alert('Failed to save settings.')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-4xl font-extrabold text-white tracking-tight">Company Settings</h1>
      <p class="text-slate-400 text-lg">Manage your organization's public profile and payslip branding.</p>
    </div>

    <Card class="bg-slate-900/40 border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden">
      <CardHeader class="border-b border-slate-800/50 bg-slate-900/20">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-600 rounded-lg">
            <Building2 class="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle class="text-xl font-bold text-white">General Information</CardTitle>
            <CardDescription class="text-slate-500">This information will appear on all system-generated payslips.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent class="p-8">
        <form @submit.prevent="saveSettings" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Logo URL & Preview -->
            <div class="md:col-span-2 flex flex-col md:flex-row items-start gap-6 p-6 bg-slate-950/50 rounded-2xl border border-slate-800 mb-2">
              <div class="w-32 h-32 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden shrink-0 group hover:border-blue-500/50 transition-all">
                <img v-if="company.logo_url" :src="company.logo_url" class="w-full h-full object-contain" alt="Logo Preview" />
                <div v-else class="text-center p-4">
                  <Image class="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p class="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No Logo</p>
                </div>
              </div>
              <div class="flex-1 space-y-2 w-full">
                <Label for="logo" class="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Company Logo URL</Label>
                <div class="relative group">
                  <Image class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input 
                    id="logo" 
                    v-model="company.logo_url" 
                    placeholder="https://example.com/logo.png" 
                    class="pl-10 h-12 bg-slate-950 border-slate-800 text-white focus:ring-blue-500 rounded-xl"
                  />
                </div>
                <p class="text-[10px] text-slate-500 italic">Provide a public image URL for your organization's logo.</p>
              </div>
            </div>

            <!-- Company Name -->
            <div class="space-y-2">
              <Label for="name" class="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Company Name</Label>
              <div class="relative group">
                <Building2 class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  id="name" 
                  v-model="company.company_name" 
                  placeholder="e.g. Antigravity Tech Corp." 
                  class="pl-10 h-12 bg-slate-950 border-slate-800 text-white focus:ring-blue-500 rounded-xl"
                  required
                />
              </div>
            </div>

            <!-- Email -->
            <div class="space-y-2">
              <Label for="email" class="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Business Email</Label>
              <div class="relative group">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  id="email" 
                  type="email"
                  v-model="company.email" 
                  placeholder="hr@company.com" 
                  class="pl-10 h-12 bg-slate-950 border-slate-800 text-white focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            <!-- Phone -->
            <div class="space-y-2">
              <Label for="phone" class="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Contact Number</Label>
              <div class="relative group">
                <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <Input 
                  id="phone" 
                  v-model="company.phone" 
                  placeholder="+1 (555) 000-0000" 
                  class="pl-10 h-12 bg-slate-950 border-slate-800 text-white focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            <!-- Address -->
            <div class="md:col-span-2 space-y-2">
              <Label for="address" class="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Headquarters Address</Label>
              <div class="relative group">
                <MapPin class="absolute left-3 top-4 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <textarea 
                  id="address" 
                  v-model="company.address" 
                  rows="3"
                  placeholder="Street, City, State, Zip Code" 
                  class="w-full pl-10 pt-3 bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-all"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-4 pt-6 border-t border-slate-800">
            <div v-if="showSuccess" class="flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 class="w-4 h-4" />
              Settings Saved!
            </div>
            <Button 
              type="submit" 
              :disabled="isSaving"
              class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
            >
              <Save v-if="!isSaving" class="w-4 h-4 mr-2" />
              <Loader2 v-else class="w-4 h-4 mr-2 animate-spin" />
              {{ isSaving ? 'Saving Changes...' : 'Save Settings' }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
