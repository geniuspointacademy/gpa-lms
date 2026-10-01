1  import { createClient } from '@supabase/supabase-js'
2
3  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
4  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
5
6  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
