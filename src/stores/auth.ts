import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'

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
        console.log('Auth state changed:', _event, session?.user?.id)
        user.value = session?.user ?? null
        if (user.value) {
          await fetchProfile()
        } else {
          profile.value = null
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
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
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    console.log('Starting signOut...')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      user.value = null
      profile.value = null
      console.log('SignOut successful')
    } catch (error) {
      console.error('Error during signOut:', error)
      // Even if there's an error, we should probably clear local state
      user.value = null
      profile.value = null
    }
  }

  return { user, profile, loading, init, fetchProfile, signOut }
})
