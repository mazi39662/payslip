<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  // Initialize auth listener
  authStore.init()
})
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <router-view />
  </div>
</template>

<style>
@import './assets/index.css';
</style>
