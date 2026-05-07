import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/index.css'

const app = createApp(App)

// Global error handler for catching runtime errors
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Global Error:', err)
  console.error('Info:', info)
}

// Log environment status (don't log values for security)
console.log('App initialization started...')
console.log('Supabase URL present:', !!import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key present:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

app.use(createPinia())
app.use(router)

app.mount('#app')
