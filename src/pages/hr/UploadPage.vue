<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  Loader2,
  X,
  FileCheck,
  Info,
  History,
  Trash2
} from 'lucide-vue-next'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface ProcessedPayslip {
  employee_no: string
  month: number
  year: number
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  employee_id?: string
  employee_name?: string
  status: 'valid' | 'invalid'
  error?: string
}

interface UploadHistoryItem {
  id: string
  filename: string
  total_rows: number
  total_amount: number
  created_at: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isProcessing = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const rawData = ref<ProcessedPayslip[]>([])
const employeesMap = ref<Map<string, { id: string, name: string }>>(new Map())
const uploadSuccess = ref(false)
const uploadHistory = ref<UploadHistoryItem[]>([])
const currentFileName = ref('')

const isInitialLoading = ref(true)

async function fetchData() {
  isInitialLoading.value = true
  try {
    // Fetch employees for mapping
    const { data: empData } = await supabase
      .from('profiles')
      .select('id, employee_no, full_name')
    
    if (empData) {
      empData.forEach(emp => {
        if (emp.employee_no) {
          employeesMap.value.set(emp.employee_no.toString(), { 
            id: emp.id, 
            name: emp.full_name 
          })
        }
      })
    }

    // Fetch upload history
    const { data: historyData } = await supabase
      .from('upload_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyData) {
      uploadHistory.value = historyData
    }
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    isInitialLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const totalNetSalary = computed(() => {
  return rawData.value
    .filter(d => d.status === 'valid')
    .reduce((sum, d) => sum + d.net_salary, 0)
})

const processFile = async (file: File) => {
  if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
    alert('Please upload an Excel or CSV file.')
    return
  }

  currentFileName.value = file.name
  isProcessing.value = true
  rawData.value = []
  uploadSuccess.value = false
  uploadProgress.value = 0

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json(worksheet) as any[]

      rawData.value = json.map(row => {
        const empNo = (row.employee_no || row.EmployeeNo || row['Employee No'] || '').toString()
        const emp = employeesMap.value.get(empNo)
        
        return {
          employee_no: empNo,
          month: parseInt(row.month || row.Month || 0),
          year: parseInt(row.year || row.Year || 0),
          basic_salary: parseFloat(row.basic_salary || row.BasicSalary || 0),
          allowances: parseFloat(row.allowances || row.Allowances || 0),
          deductions: parseFloat(row.deductions || row.Deductions || 0),
          net_salary: parseFloat(row.net_salary || row.NetSalary || 0),
          employee_id: emp?.id,
          employee_name: emp?.name,
          status: emp ? 'valid' : 'invalid',
          error: emp ? undefined : 'Employee No not found'
        } as ProcessedPayslip
      })
    } catch (error) {
      console.error('Processing error:', error)
      alert('Error parsing file.')
    } finally {
      isProcessing.value = false
    }
  }
  reader.readAsArrayBuffer(file)
}

const handleUpload = async () => {
  const validData = rawData.value.filter(d => d.status === 'valid')
  if (validData.length === 0) return

  isUploading.value = true
  uploadProgress.value = 0
  
  try {
    // 1. Create a history record first
    const { data: historyRecord, error: historyError } = await supabase
      .from('upload_history')
      .insert({
        filename: currentFileName.value,
        total_rows: validData.length,
        total_amount: totalNetSalary.value,
      })
      .select()
      .single()

    if (historyError) throw historyError

    // 2. Upload in batches of 50
    const BATCH_SIZE = 50
    for (let i = 0; i < validData.length; i += BATCH_SIZE) {
      const chunk = validData.slice(i, i + BATCH_SIZE).map(d => ({
        employee_id: d.employee_id,
        month: d.month,
        year: d.year,
        basic_salary: d.basic_salary,
        allowances: d.allowances,
        deductions: d.deductions,
        net_salary: d.net_salary,
        upload_id: historyRecord.id // Link payslips to this upload session
      }))

      const { error } = await supabase.from('payslips').insert(chunk)
      if (error) throw error
      
      // Update progress
      uploadProgress.value = Math.round(((i + chunk.length) / validData.length) * 100)
    }

    uploadSuccess.value = true
    rawData.value = []
    fetchData() // Refresh history
  } catch (error: any) {
    console.error('Upload failed:', error)
    alert(`Upload failed: ${error.message || 'Check database permissions'}`)
  } finally {
    isUploading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const deleteUpload = async (id: string) => {
  const message = "⚠️ ATTENTION: Deleting this payroll history will also PERMANENTLY DELETE all payslips connected to this upload. This action cannot be undone.\n\nAre you sure you want to proceed?"
  if (!confirm(message)) return
  
  try {
    // 1. Delete linked payslips
    const { error: payslipsError } = await supabase
      .from('payslips')
      .delete()
      .eq('upload_id', id)
    
    if (payslipsError) throw payslipsError

    // 2. Delete history record
    const { error: historyError } = await supabase
      .from('upload_history')
      .delete()
      .eq('id', id)
    
    if (historyError) throw historyError

    // 3. Refresh list
    fetchData()
  } catch (error: any) {
    console.error('Delete failed:', error)
    alert('Failed to delete: ' + error.message)
  }
}

const triggerFileInput = () => fileInput.value?.click()
const handleFileDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files?.[0]) processFile(e.dataTransfer.files[0])
}
const handleFileChange = (e: Event) => {
  if ((e.target as HTMLInputElement).files?.[0]) processFile((e.target as HTMLInputElement).files![0])
}
</script>

<template>
  <div class="relative min-h-[600px] space-y-8 pb-12">
    <!-- Success State Overlay -->
    <div v-if="uploadSuccess" class="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-3xl animate-in fade-in zoom-in duration-500 p-8">
      <Card class="bg-slate-900 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)] p-12 text-center max-w-md w-full">
        <div class="flex flex-col items-center gap-6">
          <div class="p-6 bg-emerald-500/20 rounded-full animate-bounce">
            <CheckCircle2 class="w-20 h-20 text-emerald-500" />
          </div>
          <div class="space-y-2">
            <h2 class="text-3xl font-black text-white">Upload Success!</h2>
            <p class="text-slate-400">Payroll has been processed and payslips are now available for employees.</p>
          </div>
          <Button class="w-full bg-emerald-600 hover:bg-emerald-500 h-12 rounded-xl font-bold" @click="uploadSuccess = false">
            Excellent
          </Button>
        </div>
      </Card>
    </div>
    <!-- Initial Loading Overlay -->
    <div v-if="isInitialLoading" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-3xl transition-all duration-500">
      <div class="relative">
        <div class="absolute inset-0 bg-blue-600/20 blur-3xl animate-pulse"></div>
        <Loader2 class="w-16 h-16 text-blue-500 animate-spin relative z-10" />
      </div>
      <p class="mt-6 text-slate-300 font-bold tracking-widest uppercase text-xs animate-pulse">Initializing System...</p>
      <p class="mt-2 text-slate-500 text-sm italic">Synchronizing employee directory and history</p>
    </div>

    <!-- Header -->
    <div class="flex flex-col gap-2" :class="{ 'opacity-20 pointer-events-none': isInitialLoading }">
      <h1 class="text-4xl font-extrabold text-white tracking-tight">Payroll Upload</h1>
      <p class="text-slate-400 text-lg">Convert your payroll Excel into digital payslips for employees.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Upload -->
      <div class="lg:col-span-1 space-y-6">
        <Card class="bg-slate-900/40 border-slate-800 shadow-xl group">
          <CardHeader class="border-b border-slate-800/50 bg-slate-900/20">
            <CardTitle class="text-xl font-bold text-white flex items-center gap-2">
              <Upload class="w-5 h-5 text-blue-500" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent class="p-6">
            <div 
              @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleFileDrop" @click="triggerFileInput"
              :class="[
                'relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer',
                isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40',
                rawData.length > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : ''
              ]"
            >
              <input type="file" ref="fileInput" class="hidden" accept=".xlsx,.xls,.csv" @change="handleFileChange" />
              
              <div v-if="!isProcessing && rawData.length === 0" class="text-center space-y-2">
                <div class="p-4 bg-slate-800/50 rounded-2xl inline-block mb-2 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet class="w-10 h-10 text-slate-400 group-hover:text-blue-400" />
                </div>
                <p class="text-sm font-bold text-slate-200">Click to upload or drag & drop</p>
                <p class="text-xs text-slate-500">Excel or CSV</p>
              </div>

              <div v-else-if="isProcessing" class="flex flex-col items-center gap-3">
                <Loader2 class="w-10 h-10 text-blue-500 animate-spin" />
                <p class="text-sm font-medium text-slate-300">Processing file...</p>
              </div>

              <div v-else class="flex flex-col items-center gap-3 text-center">
                <div class="p-4 bg-emerald-500/20 rounded-2xl">
                  <FileCheck class="w-10 h-10 text-emerald-400" />
                </div>
                <p class="text-sm font-bold text-emerald-400">{{ currentFileName }}</p>
                <p class="text-xs text-slate-400">{{ rawData.length }} rows found</p>
                <Button variant="ghost" size="sm" class="mt-2 text-slate-500 hover:text-white" @click.stop="rawData = []">
                  <X class="w-4 h-4 mr-1" /> Remove
                </Button>
              </div>
            </div>

            <!-- Uploading Progress Bar -->
            <div v-if="isUploading" class="mt-6 space-y-3">
              <div class="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                <span class="text-blue-400 animate-pulse">Uploading Payslips...</span>
                <span class="text-white">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  :style="{ width: `${uploadProgress}%` }"
                ></div>
              </div>
              <p class="text-[10px] text-center text-slate-500 italic">Please do not close this window</p>
            </div>
          </CardContent>
        </Card>

        <!-- Excel Guide -->
        <Card class="bg-slate-900/40 border-slate-800 border-l-4 border-l-blue-500">
          <CardContent class="p-6 space-y-4">
            <div class="flex items-center gap-2 text-blue-400">
              <Info class="w-5 h-5" />
              <h3 class="font-bold uppercase tracking-widest text-xs">Excel Format Guide</h3>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <code v-for="col in ['employee_no', 'month', 'year', 'basic_salary', 'allowances', 'deductions', 'net_salary']" :key="col" class="text-[10px] bg-slate-800 px-2 py-1 rounded text-blue-300 border border-blue-500/10">{{ col }}</code>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Column: Preview & History -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Preview -->
        <Card v-if="rawData.length > 0" class="bg-slate-900/40 border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col min-h-[400px]">
          <CardHeader class="border-b border-slate-800/50 bg-slate-900/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle class="text-xl font-bold text-white">Data Preview</CardTitle>
              <CardDescription class="text-slate-500">Review before generating payslips.</CardDescription>
            </div>
            <Button :disabled="isUploading || rawData.every(d => d.status === 'invalid')" class="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-8 h-12 rounded-2xl shadow-lg" @click="handleUpload">
              <CheckCircle2 v-if="!isUploading" class="w-5 h-5" />
              <Loader2 v-else class="w-5 h-5 animate-spin" />
              {{ isUploading ? 'Uploading...' : 'Generate Payslips' }}
            </Button>
          </CardHeader>
          <CardContent class="p-0 overflow-auto max-h-[400px]">
            <Table>
              <TableHeader class="bg-slate-900/40 sticky top-0 z-10 backdrop-blur-md">
                <TableRow class="border-slate-800">
                  <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Employee</TableHead>
                  <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Period</TableHead>
                  <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-right">Net Salary</TableHead>
                  <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(row, idx) in rawData" :key="idx" class="border-slate-800/50">
                  <TableCell>
                    <p class="text-sm font-bold" :class="row.status === 'valid' ? 'text-white' : 'text-slate-500'">{{ row.employee_name || 'Unknown' }}</p>
                    <p class="text-[10px] text-slate-500">ID: {{ row.employee_no }}</p>
                  </TableCell>
                  <TableCell class="text-sm text-slate-300">{{ row.month }}/{{ row.year }}</TableCell>
                  <TableCell class="text-right text-sm font-bold text-white">${{ row.net_salary.toLocaleString() }}</TableCell>
                  <TableCell class="text-center">
                    <Badge v-if="row.status === 'valid'" class="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[10px]">Valid</Badge>
                    <Badge v-else variant="destructive" class="text-[10px]">{{ row.error }}</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <div class="p-6 bg-slate-900/40 border-t border-slate-800 flex justify-between items-center">
            <span class="text-sm text-slate-400 font-bold uppercase tracking-widest">Total Disbursement</span>
            <span class="text-2xl font-black text-white">${{ totalNetSalary.toLocaleString() }}</span>
          </div>
        </Card>

        <!-- History Section -->
        <Card class="bg-slate-900/40 border-slate-800 shadow-xl overflow-hidden">
          <CardHeader class="border-b border-slate-800/50 bg-slate-900/20">
            <CardTitle class="text-xl font-bold text-white flex items-center gap-2">
              <History class="w-5 h-5 text-amber-500" />
              Upload History
            </CardTitle>
          </CardHeader>
          <CardContent class="p-0">
            <Table v-if="uploadHistory.length > 0">
              <TableHeader class="bg-slate-900/40">
                <TableRow class="border-slate-800">
                  <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">File Name</TableHead>
                  <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Date</TableHead>
                  <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-right">Total</TableHead>
                  <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in uploadHistory" :key="item.id" class="border-slate-800/50 hover:bg-slate-800/30 group/row">
                  <TableCell class="text-sm font-bold text-white">{{ item.filename }}</TableCell>
                  <TableCell class="text-xs text-slate-500">{{ formatDate(item.created_at) }}</TableCell>
                  <TableCell class="text-right text-sm font-bold text-emerald-400">${{ item.total_amount.toLocaleString() }}</TableCell>
                  <TableCell class="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      class="text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      @click="deleteUpload(item.id)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div v-else class="p-12 text-center text-slate-500 italic text-sm">No upload history found.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

