import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CodeGenerator from './CodeGenerator'

export default async function AdminCodesPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {}
        },
      },
    }
  )

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, level')
    .eq('is_active', true)
    .order('title', { ascending: true })

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold mb-4">Generate Invitation Codes</h2>
        <CodeGenerator courses={courses ?? []} />
      </section>
    </div>
  )
}
