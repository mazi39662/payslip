import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const profile = ref<any>(null)
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null
      if (user.value) {
        await fetchProfile()
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        user.value = session?.user ?? null
        if (user.value) {
          await fetchProfile()
        } else {
          profile.value = null
        }
      })
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!user.value) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching profile:', error.message)
        profile.value = null
      } else {
        profile.value = data
      }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    router.push('/login')
  }

  return { user, profile, loading, init, fetchProfile, signOut }
})
