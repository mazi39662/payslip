import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

console.log('Supabase config check:', {
  urlLength: supabaseUrl.length,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  urlStart: supabaseUrl.substring(0, 10) + '...'
});

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error("FATAL: VITE_SUPABASE_URL is invalid or empty. Value received:", `"${supabaseUrl}"`);
}

export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseKey || 'missing-key'
);
