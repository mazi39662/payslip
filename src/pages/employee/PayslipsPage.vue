<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Search, 
  Download, 
  FileText, 
  ChevronRight,
  ArrowLeft,
  X
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import { supabase } from '@/utils/supabase'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const searchQuery = ref('')
const selectedMonth = ref(0) // 0 means 'All Months'
const payslips = ref<any[]>([])
const isLoading = ref(false)
const companyInfo = ref({
  name: 'PayFlow Corp.',
  address: '123 Business Rd, Tech City'
})

const CACHE_KEY = computed(() => `payslips_list_cache_${authStore.user?.id}`)

function loadCache() {
  if (!authStore.user) return
  const cached = localStorage.getItem(CACHE_KEY.value)
  if (cached) {
    try {
      payslips.value = JSON.parse(cached)
      console.log('Payslips cache loaded')
    } catch (e) {
      console.error('Error parsing payslips cache:', e)
    }
  }
}

const months = [
  { label: 'All Months', value: 0 },
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 }
]

async function fetchPayslips() {
  if (!authStore.user) {
    isLoading.value = false
    return
  }
  
  if (payslips.value.length === 0) {
    isLoading.value = true
  }

  try {
    console.log('Fetching fresh payslips for user:', authStore.user.id)
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', authStore.user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) {
      console.error('Supabase Error:', error)
      throw error
    }

    console.log('Raw Payslips Data fetched:', data?.length || 0)

    // Map Supabase data to the UI structure
    const mappedData = (data || []).map(p => ({
      id: p.id.slice(0, 8).toUpperCase(), // Using short ID for display
      period: `${months.find(m => m.value === p.month)?.label || ''} ${p.year}`,
      date: new Date(p.created_at).toLocaleDateString(),
      netPay: Number(p.net_salary),
      status: 'Paid',
      pdf_url: p.pdf_url,
      month: p.month, // This is an integer now
      year: p.year,
      employee_id: p.employee_id,
      details: {
        earnings: [
          { label: 'Basic Salary', amount: Number(p.basic_salary) },
          { label: 'Allowances', amount: Number(p.allowances) },
        ],
        deductions: [
          { label: 'Deductions', amount: Number(p.deductions) },
        ]
      }
    }))

    payslips.value = mappedData
    localStorage.setItem(CACHE_KEY.value, JSON.stringify(mappedData))
  } catch (error: any) {
    console.error('Error fetching payslips:', error.message)
    } finally {
    isLoading.value = false
  }
}

async function fetchCompanySettings() {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .maybeSingle()

    if (data) {
      companyInfo.value = {
        name: data.company_name,
        address: data.address,
        logo_url: data.logo_url
      }
    }
  } catch (error) {
    console.error('Error fetching company settings:', error)
  }
}

// Fetch data on mount and whenever user changes
import { onMounted, watch } from 'vue'

onMounted(() => {
  fetchCompanySettings()
})

watch(() => authStore.user, (newUser) => {
  console.log('Auth user changed, fetching payslips:', newUser?.id)
  if (newUser) {
    loadCache()
    fetchPayslips()
  } else {
    payslips.value = []
    isLoading.value = false
  }
}, { immediate: true })

const filteredPayslips = computed(() => {
  return payslips.value.filter(p => {
    const matchesSearch = p.period.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesMonth = selectedMonth.value === 0 || p.month === selectedMonth.value
    return matchesSearch && matchesMonth
  })
})

const selectedPayslip = ref<any>(null)
const isDownloading = ref(false)

const openPayslip = (payslip: any) => {
  selectedPayslip.value = payslip
}

const formatCurrency = (amount: number) => {
  if (!settingsStore.isAmountVisible) return '••••••'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: settingsStore.currency,
  }).format(amount)
}

const downloadPDF = async () => {
  if (!selectedPayslip.value) return
  
  isDownloading.value = true
  const element = document.getElementById('payslip-modal-content')
  if (!element) {
    isDownloading.value = false
    return
  }

  try {
    // Create a temporary clone for PDF generation to avoid theme issues
    const clone = element.cloneNode(true) as HTMLElement
    clone.style.width = '800px'
    clone.style.padding = '40px'
    clone.style.background = '#ffffff'
    clone.style.color = '#000000'
    // Ensure text colors are black for the clone
    const allText = clone.querySelectorAll('*')
    allText.forEach((el: any) => {
        if (el.classList.contains('text-white')) el.classList.remove('text-white')
        if (el.classList.contains('text-slate-400')) el.classList.remove('text-slate-400')
        if (el.classList.contains('text-slate-500')) el.classList.remove('text-slate-500')
        el.style.color = '#000000'
    })
    
    document.body.appendChild(clone)
    clone.style.position = 'absolute'
    clone.style.left = '-9999px'
    clone.style.top = '-9999px'

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    })
    
    document.body.removeChild(clone)

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`Payslip-${selectedPayslip.value.id}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
  } finally {
    isDownloading.value = false
  }
}

const getTotalEarnings = (payslip: any) => {
  return payslip.details.earnings.reduce((sum: number, e: any) => sum + e.amount, 0)
}

const getTotalDeductions = (payslip: any) => {
  return payslip.details.deductions.reduce((sum: number, d: any) => sum + d.amount, 0)
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header with Back Button -->
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
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-extrabold text-white tracking-tight">Your Payslips</h1>
            <div v-if="isLoading && payslips.length > 0" class="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span class="text-[10px] text-blue-400 font-bold uppercase tracking-widest animate-pulse">Updating...</span>
            </div>
          </div>
          <p class="text-slate-400">View and download your salary history.</p>
        </div>
      </div>
    </div>


    <!-- Search and Filters -->
    <div class="flex flex-col md:flex-row gap-4 items-center">
      <div class="relative w-full md:max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          v-model="searchQuery"
          placeholder="Search by month or ID..." 
          class="pl-10 bg-slate-900/50 border-slate-800 text-white focus:ring-blue-500 rounded-xl"
        />
      </div>
      <div class="flex items-center gap-2 w-full overflow-x-auto pb-2 scrollbar-hide">
        <Badge 
          v-for="month in months" 
          :key="month.value"
          @click="selectedMonth = month.value"
          class="cursor-pointer px-4 py-1.5 rounded-full transition-all whitespace-nowrap"
          :variant="selectedMonth === month.value ? 'default' : 'outline'"
          :class="selectedMonth === month.value ? 'bg-blue-600 text-white' : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'"
        >
          {{ month.label }}
        </Badge>
      </div>
    </div>

    <!-- Payslip Grid -->
    <div v-if="isLoading && payslips.length === 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="h-48 bg-slate-900/40 border border-slate-800 animate-pulse rounded-3xl"></div>
    </div>
    <div v-else-if="filteredPayslips.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <Dialog v-for="payslip in filteredPayslips" :key="payslip.id" @update:open="(val) => val && openPayslip(payslip)">
        <DialogTrigger asChild>
          <Card 
            class="group bg-slate-900/40 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/60 transition-all cursor-pointer shadow-xl overflow-hidden relative"
          >
            <!-- Highlight element -->
            <div class="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <CardHeader class="pb-2">
              <div class="flex justify-between items-start">
                <Badge variant="outline" class="border-slate-700 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                  {{ payslip.id }}
                </Badge>
              </div>
              <CardTitle class="text-xl font-bold text-white mt-2 group-hover:text-blue-400 transition-colors">
                {{ payslip.period.split(',')[0] }}
              </CardTitle>
              <CardDescription class="text-slate-500">{{ payslip.date }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex items-end justify-between mt-4">
                <div>
                  <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Net Salary</p>
                  <p class="text-2xl font-black text-white tracking-tight">{{ formatCurrency(payslip.netPay) }}</p>
                </div>
                <div class="p-2 bg-slate-800/50 rounded-lg group-hover:bg-blue-600 group-hover:text-white text-slate-500 transition-all">
                  <ChevronRight class="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>

        <DialogContent class="sm:max-w-[700px] bg-slate-950 border-slate-800 p-0 overflow-hidden rounded-[2rem]">
          <div class="flex flex-col h-full">
            <div class="p-8 pb-4">
              <DialogHeader>
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20 shrink-0">
                      <FileText class="w-7 h-7 text-white" />
                    </div>
                    <div class="min-w-0">
                      <DialogTitle class="text-3xl font-black text-white tracking-tighter truncate">Payslip Detail</DialogTitle>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-widest">ID: {{ payslip.id }}</span>
                        <span class="text-slate-600 text-xs">•</span>
                        <span class="text-xs text-slate-500 font-medium">{{ payslip.date }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 self-end sm:self-auto">
                    <Button 
                      @click="downloadPDF" 
                      :disabled="isDownloading"
                      class="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6 h-11 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                    >
                      <Download v-if="!isDownloading" class="w-4 h-4 mr-2" />
                      <span v-else class="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      {{ isDownloading ? 'Generating...' : 'Download PDF' }}
                    </Button>
                    <DialogClose asChild>
                      <Button variant="ghost" size="icon" class="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full h-11 w-11 transition-colors">
                        <X class="w-5 h-5" />
                      </Button>
                    </DialogClose>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <Separator class="bg-slate-800" />

            <!-- Payslip Content (This is what will be captured) -->
            <div id="payslip-modal-content" class="p-8 space-y-8 bg-slate-950">
              <!-- Company & Employee Info -->
              <div class="flex justify-between items-start">
                <div class="space-y-4 text-left">
                  <div class="flex items-center gap-4">
                    <img v-if="companyInfo.logo_url" :src="companyInfo.logo_url" class="h-12 w-auto object-contain" alt="Logo" />
                    <div>
                      <h3 class="text-lg font-black text-white uppercase tracking-tighter">{{ companyInfo.name }}</h3>
                      <p class="text-xs text-slate-500">{{ companyInfo.address }}</p>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Employee Name</p>
                    <p class="text-base font-bold text-white">{{ authStore.profile?.full_name }}</p>
                    <p class="text-xs text-slate-400">
                      {{ authStore.profile?.job_position || 'Staff' }} 
                      {{ authStore.profile?.department_name ? `• ${authStore.profile?.department_name}` : '' }}
                    </p>
                  </div>
                </div>
                <div class="text-right space-y-4">
                  <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl inline-block text-left">
                    <p class="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Pay Period</p>
                    <p class="text-sm font-bold text-white">{{ payslip.period }}</p>
                  </div>
                </div>
              </div>

              <!-- Pay Breakdown Table -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Earnings -->
                <div class="space-y-4">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <h4 class="text-sm font-black text-white uppercase tracking-widest">Earnings</h4>
                  </div>
                  <div class="space-y-3 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50">
                    <div v-for="item in payslip.details.earnings" :key="item.label" class="flex justify-between text-sm">
                      <span class="text-slate-400">{{ item.label }}</span>
                      <span class="font-bold text-slate-200">{{ formatCurrency(item.amount) }}</span>
                    </div>
                    <Separator class="bg-slate-800 my-2" />
                    <div class="flex justify-between text-sm font-black">
                      <span class="text-white uppercase tracking-widest">Total Earnings</span>
                      <span class="text-emerald-400">{{ formatCurrency(getTotalEarnings(payslip)) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Deductions -->
                <div class="space-y-4">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <h4 class="text-sm font-black text-white uppercase tracking-widest">Deductions</h4>
                  </div>
                  <div class="space-y-3 bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50">
                    <div v-for="item in payslip.details.deductions" :key="item.label" class="flex justify-between text-sm">
                      <span class="text-slate-400">{{ item.label }}</span>
                      <span class="font-bold text-slate-200">{{ formatCurrency(item.amount) }}</span>
                    </div>
                    <Separator class="bg-slate-800 my-2" />
                    <div class="flex justify-between text-sm font-black">
                      <span class="text-white uppercase tracking-widest">Total Deductions</span>
                      <span class="text-red-400">{{ formatCurrency(getTotalDeductions(payslip)) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Net Pay Footer -->
              <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl flex justify-between items-center shadow-xl">
                <div>
                  <h4 class="text-sm font-bold text-blue-100 uppercase tracking-widest mb-1">Net Take Home Pay</h4>
                  <p class="text-[10px] text-blue-200 italic opacity-80">Final amount credited to your bank account</p>
                </div>
                <div class="text-right">
                  <p class="text-4xl font-black text-white tracking-tighter">{{ formatCurrency(payslip.netPay) }}</p>
                </div>
              </div>
              
              <div class="text-center">
                <p class="text-[10px] text-slate-600 uppercase tracking-widest font-bold">This is a system-generated document. No signature required.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
      <div class="p-6 bg-slate-900 rounded-full">
        <Search class="w-10 h-10 text-slate-700" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-white">No payslips found</h3>
        <p class="text-slate-500 max-w-xs mx-auto">We couldn't find any payslips matching your current search or filter criteria.</p>
      </div>
      <Button variant="outline" @click="searchQuery = ''; selectedMonth = 0" class="border-slate-700 text-slate-400 hover:text-white">
        Clear all filters
      </Button>
    </div>
  </div>
</template>

<style scoped>
/* Optional: Add smooth transition for the dialog */
.dialog-content-enter-active,
.dialog-content-leave-active {
  transition: all 0.3s ease-out;
}

.dialog-content-enter-from,
.dialog-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
