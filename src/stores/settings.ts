import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // Load initial values from localStorage or use defaults
  const currency = ref(localStorage.getItem('payflow_currency') || 'PHP')
  const isAmountVisible = ref(localStorage.getItem('payflow_amount_visible') !== 'false') // Default to true

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' }
  ]

  function setCurrency(code: string) {
    currency.value = code
  }

  function toggleAmountVisibility() {
    isAmountVisible.value = !isAmountVisible.value
  }

  // Persist changes to localStorage
  watch(currency, (newVal) => {
    localStorage.setItem('payflow_currency', newVal)
  })

  watch(isAmountVisible, (newVal) => {
    localStorage.setItem('payflow_amount_visible', String(newVal))
  })

  return { 
    currency, 
    currencies, 
    isAmountVisible, 
    setCurrency, 
    toggleAmountVisibility 
  }
})
