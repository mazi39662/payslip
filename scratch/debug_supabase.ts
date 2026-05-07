import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
  const { data: payslips, error: pError } = await supabase.from('payslips').select('*')
  console.log('All Payslips:', payslips)
  if (pError) console.error('Payslips Error:', pError)

  const { data: profiles, error: prError } = await supabase.from('profiles').select('*')
  console.log('All Profiles:', profiles)
  if (prError) console.error('Profiles Error:', prError)
}

debug()
