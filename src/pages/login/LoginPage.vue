<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-vue-next'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const router = useRouter()

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  console.log('Attempting login for:', email.value)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (error) {
      console.error('Auth error:', error.message)
      throw error
    }
    
    console.log('Login successful, fetching profile for:', data.user.id)
    
    // Check role and redirect
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()
    
    if (profileError) throw profileError
    
    if (!profile) {
      throw new Error('Your profile has not been set up in the database. Please ask HR to add your employee record.')
    }
    
    console.log('User role found:', profile.role)
    
    if (profile?.role === 'hr') {
      console.log('Redirecting to HR Dashboard')
      await router.push('/hr/dashboard')
    } else {
      console.log('Redirecting to Employee Dashboard')
      await router.push('/employee/dashboard')
    }
  } catch (error: any) {
    errorMsg.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden font-sans">
    <!-- Animated Background Blobs -->
    <div class="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
    <div class="absolute top-0 -right-4 w-72 h-72 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

    <Card class="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl relative z-10">
      <CardHeader class="space-y-1">
        <div class="flex flex-col items-center justify-center mb-4">
          <div class="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 mb-3">
            <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span class="text-xs font-black uppercase tracking-[0.5em] text-blue-400">Pay Flow</span>
        </div>
        <CardTitle class="text-3xl font-bold tracking-tight text-white text-center">Welcome Back</CardTitle>
        <CardDescription class="text-slate-400 text-center">
          Enter your credentials to access your payslips
        </CardDescription>
      </CardHeader>
      <form @submit.prevent="handleLogin">
        <CardContent class="grid gap-4 mt-2">
          <div class="grid gap-2">
            <Label for="email" class="text-slate-300">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@company.com" 
              v-model="email" 
              required 
              class="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50 h-12"
            />
          </div>
          <div class="grid gap-2">
            <Label for="password" class="text-slate-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              v-model="password" 
              required 
              class="bg-slate-800/50 border-slate-700 text-white focus:ring-blue-500/50 h-12"
            />
          </div>
          <div v-if="errorMsg" class="text-sm text-red-400 bg-red-900/20 border border-red-900/50 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
            {{ errorMsg }}
          </div>
        </CardContent>
        <CardFooter class="pt-4">
          <Button 
            type="submit" 
            class="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-semibold h-12 transition-all duration-300 shadow-lg shadow-blue-900/40" 
            :disabled="loading"
          >
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? 'Authenticating...' : 'Sign In' }}
          </Button>
        </CardFooter>
      </form>
    </Card>
    
    <div class="absolute bottom-8 text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center z-10 flex flex-col gap-1">
      <p>&copy; {{ new Date().getFullYear() }} Pay Flow. All Rights Reserved.</p>
      <p class="text-blue-400/50">Developed by Franz Ocubillo</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
