import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.https://lomgvdgcsqjqstrehtwy.supabase.co!,
    process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvbWd2ZGdjc3FqcXN0cmVodHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MjExMjUsImV4cCI6MjEwNjM5NzEyNX0.etYjFuMERs_JfcuYT6AC0lz0k8ISkSW3u_i5yONNkNc!
  )
}
