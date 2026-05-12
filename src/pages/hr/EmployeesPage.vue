<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  UserPlus, 
  Mail, 
  Shield, 
  Filter,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Save,
  Briefcase,
  Fingerprint,
  Calendar,
  Plus,
  Download,
  Upload as UploadIcon,
  Table as TableIcon,
  EyeOff
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'

const employees = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

const CACHE_KEY = 'hr_employees_cache'

// Dialog States
const isEditDialogOpen = ref(false)
const isViewDialogOpen = ref(false)
const isBulkAddDialogOpen = ref(false)
const isExcelUploadDialogOpen = ref(false)
const isSaving = ref(false)
const selectedEmployee = ref<any>(null)
const newPassword = ref('')
const showNewPassword = ref(true)
const excelInput = ref<HTMLInputElement | null>(null)

const bulkEmployees = ref<any[]>([
  { full_name: '', email: '', employee_no: '', job_position: '', role: 'employee', password: '', show_password: true }
])

const excelEmployeeColumns = [
  { name: 'Full Name', type: 'Text' },
  { name: 'Email', type: 'Email' },
  { name: 'Employee No', type: 'Text/ID' },
  { name: 'Job Position', type: 'Text' },
  { name: 'Role', type: 'hr/employee' },
  { name: 'Password', type: 'Text' }
]

function loadCache() {
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      employees.value = JSON.parse(cached)
      isLoading.value = false
    } catch (e) {
      console.error('Error parsing employees cache:', e)
    }
  }
}

async function fetchEmployees() {
  if (employees.value.length === 0) {
    isLoading.value = true
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })

    if (error) throw error
    employees.value = data || []
    localStorage.setItem(CACHE_KEY, JSON.stringify(employees.value))
  } catch (error) {
    console.error('Error fetching employees:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredEmployees = computed(() => {
  if (!searchQuery.value) return employees.value
  const q = searchQuery.value.toLowerCase()
  return employees.value.filter(emp => 
    emp.full_name?.toLowerCase().includes(q) || 
    emp.email?.toLowerCase().includes(q) || 
    emp.employee_no?.toLowerCase().includes(q) ||
    emp.role?.toLowerCase().includes(q) ||
    emp.job_position?.toLowerCase().includes(q)
  )
})

const openEditDialog = (employee: any) => {
  selectedEmployee.value = { ...employee }
  newPassword.value = ''
  showNewPassword.value = true
  isEditDialogOpen.value = true
}

function addBulkRow() {
  bulkEmployees.value.push({ full_name: '', email: '', employee_no: '', job_position: '', role: 'employee', password: '', show_password: true })
}

function removeBulkRow(index: number) {
  bulkEmployees.value.splice(index, 1)
  if (bulkEmployees.value.length === 0) addBulkRow()
}

async function saveBulkEmployees() {
  const validEmployees = bulkEmployees.value.filter(e => e.full_name && e.email)
  if (validEmployees.length === 0) {
    alert('Please fill in at least one employee with name and email.')
    return
  }
  
  isSaving.value = true
  try {
    const { error } = await supabase
      .from('profiles')
      .insert(validEmployees)

    if (error) throw error
    
    await fetchEmployees()
    isBulkAddDialogOpen.value = false
    bulkEmployees.value = [{ full_name: '', email: '', employee_no: '', job_position: '', role: 'employee' }]
  } catch (error: any) {
    console.error('Error saving bulk employees:', error)
    alert(`Failed to save: ${error.message}`)
  } finally {
    isSaving.value = false
  }
}

async function handleExcelUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(firstSheet) as any[]

      const mappedEmployees = json.map(row => ({
        full_name: row['Full Name'] || row.full_name || '',
        email: row['Email'] || row.email || '',
        employee_no: (row['Employee No'] || row.employee_no || '').toString(),
        job_position: row['Job Position'] || row.job_position || '',
        role: (row['Role'] || row.role || 'employee').toLowerCase(),
        password: row['Password'] || row.password || '',
        status: 'active'
      })).filter(e => e.full_name && e.email)

      if (mappedEmployees.length === 0) {
        alert('No valid employees found in the Excel file.')
        return
      }

      if (confirm(`Found ${mappedEmployees.length} employees. Proceed with upload?`)) {
        isSaving.value = true
        const { error } = await supabase.from('profiles').insert(mappedEmployees)
        if (error) throw error
        await fetchEmployees()
        isExcelUploadDialogOpen.value = false
        alert('Employees uploaded successfully!')
      }
    } catch (error: any) {
      console.error('Excel upload error:', error)
      alert(`Error processing file: ${error.message}`)
    } finally {
      isSaving.value = false
      // Reset input
      ;(event.target as HTMLInputElement).value = ''
    }
  }
  reader.readAsArrayBuffer(file)
}

const openViewDialog = (employee: any) => {
  selectedEmployee.value = { ...employee }
  isViewDialogOpen.value = true
}

async function saveEmployee() {
  if (!selectedEmployee.value) return
  isSaving.value = true
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: selectedEmployee.value.full_name,
        email: selectedEmployee.value.email,
        role: selectedEmployee.value.role,
        job_position: selectedEmployee.value.job_position,
        status: selectedEmployee.value.status,
        // In a real app, you'd handle password change via Supabase Auth Admin
        // For now, we'll just mock the update or update a password field if it exists
        ...(newPassword.value ? { password: newPassword.value } : {})
      })
      .eq('id', selectedEmployee.value.id)

    if (error) throw error
    
    await fetchEmployees()
    isEditDialogOpen.value = false
  } catch (error) {
    console.error('Error saving employee:', error)
    alert('Failed to save changes.')
  } finally {
    isSaving.value = false
  }
}

async function deleteEmployee(id: string) {
  if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return
  
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
    await fetchEmployees()
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    alert(`Could not delete employee. They may have existing payslips or records.`)
  }
}

const getInitials = (name: string) => {
  return (name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'default'
    case 'inactive': return 'destructive'
    case 'pending': return 'outline'
    default: return 'secondary'
  }
}

onMounted(() => {
  loadCache()
  fetchEmployees()
})
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-extrabold text-white tracking-tight">Employee Directory</h1>
        <p class="text-slate-400 text-lg">Manage your organization's workforce and their profiles.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <Button 
          @click="isExcelUploadDialogOpen = true"
          variant="outline"
          class="border-slate-800 bg-slate-900/40 text-slate-300 gap-2 h-12 px-6 rounded-2xl hover:bg-slate-800 transition-all"
        >
          <UploadIcon class="w-5 h-5 text-blue-400" />
          Upload Excel
        </Button>
        <Button 
          @click="isBulkAddDialogOpen = true"
          variant="outline"
          class="border-slate-800 bg-slate-900/40 text-slate-300 gap-2 h-12 px-6 rounded-2xl hover:bg-slate-800 transition-all"
        >
          <TableIcon class="w-5 h-5 text-emerald-400" />
          Bulk Add
        </Button>
        <Button 
          @click="isBulkAddDialogOpen = true"
          class="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-12 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
        >
          <UserPlus class="w-5 h-5" />
          Add Employee
        </Button>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-1 group">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
        <Input 
          v-model="searchQuery"
          placeholder="Search by name, ID, position, or role..." 
          class="pl-12 h-14 bg-slate-900/40 border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>
      <Button variant="outline" class="h-14 px-6 border-slate-800 bg-slate-900/40 text-slate-300 rounded-2xl hover:bg-slate-800 gap-2">
        <Filter class="w-5 h-5" />
        Filters
      </Button>
    </div>

    <!-- Employee Table -->
    <Card class="bg-slate-900/40 border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden">
      <Table>
        <TableHeader class="bg-slate-900/40">
          <TableRow class="border-slate-800 hover:bg-transparent">
            <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] py-6">Employee</TableHead>
            <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] py-6">Employee No</TableHead>
            <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] py-6">Account</TableHead>
            <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] py-6">Role & Status</TableHead>
            <TableHead class="text-slate-400 font-bold uppercase tracking-widest text-[10px] py-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="isLoading">
            <TableRow v-for="i in 5" :key="i" class="border-slate-800/50">
              <TableCell v-for="j in 5" :key="j" class="py-6">
                <div class="h-8 bg-slate-800/50 animate-pulse rounded-lg w-full"></div>
              </TableCell>
            </TableRow>
          </template>
          <template v-else-if="filteredEmployees.length > 0">
            <TableRow 
              v-for="employee in filteredEmployees" 
              :key="employee.id"
              class="border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
            >
              <TableCell class="py-6">
                <div class="flex items-center gap-4">
                  <Avatar class="h-12 w-12 border-2 border-slate-800 group-hover:border-blue-500/50 transition-colors">
                    <AvatarImage :src="employee.avatar_url || ''" />
                    <AvatarFallback class="bg-slate-800 text-slate-300 font-bold">
                      {{ getInitials(employee.full_name) }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="space-y-0.5 text-left">
                    <p class="text-sm font-bold text-white">{{ employee.full_name }}</p>
                    <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{{ employee.job_position || '' }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell class="py-6 text-sm text-slate-400 font-mono tracking-wider">
                #{{ employee.employee_no || '---' }}
              </TableCell>
              <TableCell class="py-6">
                <div class="flex items-center gap-2 text-slate-300">
                  <Mail class="w-3.5 h-3.5 text-slate-500" />
                  <span class="text-sm">{{ employee.email || 'No email' }}</span>
                </div>
              </TableCell>
              <TableCell class="py-6">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <Shield class="w-3.5 h-3.5 text-blue-400" />
                    <span class="text-xs font-bold text-slate-300 uppercase tracking-widest">{{ employee.role || 'Employee' }}</span>
                  </div>
                  <Badge 
                    :variant="getStatusVariant(employee.status)"
                    class="w-fit text-[10px] font-black uppercase tracking-tighter"
                  >
                    {{ employee.status || 'Active' }}
                  </Badge>
                </div>
              </TableCell>
              <TableCell class="py-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button 
                    @click="openViewDialog(employee)"
                    variant="ghost" 
                    size="icon" 
                    title="View Details" 
                    class="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <Eye class="w-4 h-4" />
                  </Button>
                  <Button 
                    @click="openEditDialog(employee)"
                    variant="ghost" 
                    size="icon" 
                    title="Edit Profile" 
                    class="text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                  >
                    <Pencil class="w-4 h-4" />
                  </Button>
                  <Button 
                    @click="deleteEmployee(employee.id)"
                    variant="ghost" 
                    size="icon" 
                    title="Remove Employee" 
                    class="text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell colspan="5" class="h-64 text-center">
              <div class="flex flex-col items-center justify-center space-y-4">
                <div class="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <Search class="w-8 h-8 text-slate-600" />
                </div>
                <div class="space-y-1">
                  <p class="text-slate-300 font-bold">No employees found</p>
                  <p class="text-slate-500 text-sm">Try adjusting your search or filters</p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- View Employee Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="bg-slate-950 border-slate-800 text-white sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden">
        <div class="p-8 pb-0">
          <DialogHeader class="flex flex-row items-center gap-6">
            <Avatar class="h-20 w-20 border-4 border-slate-800 shadow-2xl">
              <AvatarImage :src="selectedEmployee?.avatar_url || ''" />
              <AvatarFallback class="bg-blue-600 text-white text-2xl font-black">
                {{ getInitials(selectedEmployee?.full_name) }}
              </AvatarFallback>
            </Avatar>
            <div class="space-y-1">
              <DialogTitle class="text-3xl font-black tracking-tighter">{{ selectedEmployee?.full_name }}</DialogTitle>
              <Badge :variant="getStatusVariant(selectedEmployee?.status)" class="uppercase text-[10px] font-black tracking-widest">
                {{ selectedEmployee?.status || 'Active' }}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div class="p-8 space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Fingerprint class="w-3 h-3" /> Employee ID
              </Label>
              <p class="text-sm font-mono text-slate-300">#{{ selectedEmployee?.employee_no || '---' }}</p>
            </div>
            <div class="space-y-1.5">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Shield class="w-3 h-3" /> System Role
              </Label>
              <p class="text-sm font-bold text-white uppercase tracking-widest">{{ selectedEmployee?.role }}</p>
            </div>
            <div class="space-y-1.5">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Briefcase class="w-3 h-3" /> Job Position
              </Label>
              <p class="text-sm font-bold text-blue-400">{{ selectedEmployee?.job_position || '' }}</p>
            </div>
            <div class="space-y-1.5">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Mail class="w-3 h-3" /> Email Address
              </Label>
              <p class="text-sm text-slate-300 truncate">{{ selectedEmployee?.email }}</p>
            </div>
          </div>

          <div class="pt-6 border-t border-slate-800 flex justify-between items-center">
            <div class="flex items-center gap-2 text-slate-500">
              <Calendar class="w-4 h-4" />
              <span class="text-[10px] font-bold uppercase tracking-widest">Member Since {{ new Date(selectedEmployee?.created_at).getFullYear() }}</span>
            </div>
            <Button variant="outline" @click="isViewDialogOpen = false" class="rounded-xl border-slate-800 text-slate-400 hover:text-white">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Edit Employee Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="bg-slate-950 border-slate-800 text-white sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle class="text-2xl font-black tracking-tight">Edit Employee</DialogTitle>
          <DialogDescription class="text-slate-500">
            Make changes to the employee profile here.
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedEmployee" class="space-y-6 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Name</Label>
              <Input v-model="selectedEmployee.full_name" class="bg-slate-900 border-slate-800 rounded-xl h-12" />
            </div>
            <div class="space-y-2">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email Address</Label>
              <Input v-model="selectedEmployee.email" type="email" class="bg-slate-900 border-slate-800 rounded-xl h-12" />
            </div>
          </div>

          <div class="space-y-2">
            <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Job Position</Label>
            <Input v-model="selectedEmployee.job_position" placeholder="e.g. Senior Developer" class="bg-slate-900 border-slate-800 rounded-xl h-12" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</Label>
              <Select v-model="selectedEmployee.role">
                <SelectTrigger class="bg-slate-900 border-slate-800 rounded-xl h-12">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent class="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="hr">HR Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</Label>
              <Select v-model="selectedEmployee.status">
                <SelectTrigger class="bg-slate-900 border-slate-800 rounded-xl h-12">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent class="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800/50">
            <div class="space-y-2">
              <Label class="text-[10px] font-bold uppercase tracking-widest text-orange-500">Reset Password</Label>
              <div class="relative group">
                <Input 
                  v-model="newPassword" 
                  :type="showNewPassword ? 'text' : 'password'" 
                  placeholder="Enter new password" 
                  class="bg-slate-900 border-slate-800 rounded-xl h-12 pr-12" 
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon" 
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  @click="showNewPassword = !showNewPassword"
                >
                  <Eye v-if="!showNewPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </Button>
              </div>
              <p class="text-[9px] text-slate-500 italic">Leave blank to keep current password.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" @click="isEditDialogOpen = false" class="text-slate-400 hover:text-white rounded-xl h-12 px-6">
            Cancel
          </Button>
          <Button @click="saveEmployee" :disabled="isSaving" class="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl h-12 px-8 shadow-lg shadow-blue-900/20">
            <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
            <Save v-else class="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Bulk Add Employees Dialog -->
    <Dialog v-model:open="isBulkAddDialogOpen">
      <DialogContent class="bg-slate-950 border-slate-800 text-white max-w-5xl rounded-[2rem] overflow-hidden p-0">
        <DialogHeader class="p-8 pb-4">
          <DialogTitle class="text-3xl font-black tracking-tight">Bulk Add Employees</DialogTitle>
          <DialogDescription class="text-slate-500">
            Enter multiple employees at once using the table below.
          </DialogDescription>
        </DialogHeader>

        <div class="p-8 pt-0 space-y-6">
          <div class="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/20">
            <Table>
              <TableHeader class="bg-slate-900/40">
                <TableRow class="border-slate-800">
                  <TableHead class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</TableHead>
                  <TableHead class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</TableHead>
                  <TableHead class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Employee No</TableHead>
                  <TableHead class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Job Position</TableHead>
                  <TableHead class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</TableHead>
                  <TableHead class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</TableHead>
                  <TableHead class="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(emp, index) in bulkEmployees" :key="index" class="border-slate-800/50">
                  <TableCell class="p-2">
                    <Input v-model="emp.full_name" placeholder="John Doe" class="bg-slate-900/50 border-slate-800 h-10 text-xs rounded-lg" />
                  </TableCell>
                  <TableCell class="p-2">
                    <Input v-model="emp.email" type="email" placeholder="john@example.com" class="bg-slate-900/50 border-slate-800 h-10 text-xs rounded-lg" />
                  </TableCell>
                  <TableCell class="p-2">
                    <Input v-model="emp.employee_no" placeholder="EMP001" class="bg-slate-900/50 border-slate-800 h-10 text-xs rounded-lg" />
                  </TableCell>
                  <TableCell class="p-2">
                    <Input v-model="emp.job_position" placeholder="Developer" class="bg-slate-900/50 border-slate-800 h-10 text-xs rounded-lg" />
                  </TableCell>
                  <TableCell class="p-2">
                    <Select v-model="emp.role">
                      <SelectTrigger class="bg-slate-900/50 border-slate-800 h-10 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent class="bg-slate-900 border-slate-800 text-white">
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="hr">HR Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell class="p-2">
                    <div class="relative group">
                      <Input 
                        v-model="emp.password" 
                        :type="emp.show_password ? 'text' : 'password'" 
                        placeholder="••••••••" 
                        class="bg-slate-900/50 border-slate-800 h-10 text-xs rounded-lg pr-10" 
                      />
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-500 hover:text-white"
                        @click="emp.show_password = !emp.show_password"
                      >
                        <Eye v-if="!emp.show_password" class="w-3.5 h-3.5" />
                        <EyeOff v-else class="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell class="p-2 text-center">
                    <Button @click="removeBulkRow(index)" variant="ghost" size="icon" class="text-slate-500 hover:text-red-400 h-8 w-8">
                      <Trash2 class="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div class="p-4 border-t border-slate-800 flex justify-center">
              <Button @click="addBulkRow" variant="ghost" class="text-blue-400 hover:text-blue-300 gap-2 font-bold text-xs">
                <Plus class="w-4 h-4" />
                Add Row
              </Button>
            </div>
          </div>

          <DialogFooter class="pb-8">
            <Button variant="ghost" @click="isBulkAddDialogOpen = false" class="text-slate-400 hover:text-white rounded-xl">
              Cancel
            </Button>
            <Button @click="saveBulkEmployees" :disabled="isSaving" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-12 px-8 shadow-lg shadow-emerald-900/20">
              <Loader2 v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
              <Save v-else class="w-4 h-4 mr-2" />
              Save All Employees
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Excel Upload Employees Dialog -->
    <Dialog v-model:open="isExcelUploadDialogOpen">
      <DialogContent class="bg-slate-950 border-slate-800 text-white sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle class="text-2xl font-black tracking-tight text-blue-400">Upload Excel</DialogTitle>
          <DialogDescription class="text-slate-500">
            Upload an Excel file to bulk add employees.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-6 py-4">
          <!-- Guide -->
          <div class="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 space-y-3">
            <div class="flex items-center gap-2 text-blue-400">
              <Info class="w-4 h-4" />
              <span class="text-[10px] font-black uppercase tracking-widest">Required Columns</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="col in excelEmployeeColumns" :key="col.name" class="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
                <span class="text-[9px] font-bold text-slate-300">{{ col.name }}</span>
                <span class="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black">{{ col.type }}</span>
              </div>
            </div>
          </div>

          <div 
            class="relative border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
            @click="excelInput?.click()"
          >
            <input type="file" ref="excelInput" class="hidden" accept=".xlsx,.xls,.csv" @change="handleExcelUpload" />
            <div class="p-4 bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform">
              <Download class="w-8 h-8 text-slate-400 group-hover:text-blue-400" />
            </div>
            <div class="text-center">
              <p class="text-sm font-bold text-white">Choose Excel File</p>
              <p class="text-[10px] text-slate-500 mt-1">.xlsx, .xls, or .csv</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" @click="isExcelUploadDialogOpen = false" class="text-slate-400 hover:text-white rounded-xl">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
