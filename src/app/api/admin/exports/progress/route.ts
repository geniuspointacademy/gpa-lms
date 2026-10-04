import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function verifyAdmin() {
  const cookieStore = cookies()
  const userClient = createServerClient(
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

  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await userClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 }

  return { ok: true }
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: Request) {
  const check = await verifyAdmin()
  if ('error' in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const url = new URL(req.url)
  const courseFilter = url.searchParams.get('course_id')
  const levelFilter = url.searchParams.get('level')
  const format = url.searchParams.get('format') || 'csv'

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Build query
  let query = adminClient
    .from('student_progress')
    .select(`
      best_score,
      latest_score,
      attempt_count,
      last_completed_at,
      users!inner ( id, email, full_name, level ),
      quizzes!inner (
        id, title, course_id,
        courses ( id, title, level )
      )
    `)
    .order('last_completed_at', { ascending: false })

  if (courseFilter) {
    query = query.eq('quizzes.courses.id', courseFilter)
  }
  if (levelFilter) {
    query = query.eq('users.level', Number(levelFilter))
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Build CSV
  const headers = [
    'Student Name',
    'Student Email',
    'Level',
    'Course',
    'Quiz',
    'Best Score',
    'Latest Score',
    'Attempts',
    'Last Attempt',
  ]

  const rows = (data ?? []).map((r: any) => [
    r.users?.full_name || '',
    r.users?.email || '',
    r.users?.level || '',
    r.quizzes?.courses?.title || '',
    r.quizzes?.title || '',
    r.best_score ?? '',
    r.latest_score ?? '',
    r.attempt_count ?? '',
    r.last_completed_at
      ? new Date(r.last_completed_at).toISOString().slice(0, 19).replace('T', ' ')
      : '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(','))
    .join('\n')

  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `gpa-progress-export-${timestamp}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
