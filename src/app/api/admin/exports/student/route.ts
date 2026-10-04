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
  const userId = url.searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Get the student
  const { data: student } = await adminClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Get their progress
  const { data: progress } = await adminClient
    .from('student_progress')
    .select(`
      best_score,
      latest_score,
      attempt_count,
      last_completed_at,
      quizzes (
        id, title,
        courses ( id, title )
      )
    `)
    .eq('user_id', userId)
    .order('last_completed_at', { ascending: false })

  // Build CSV with student info as a header block
  const lines: string[] = []

  lines.push('Genius Point Academy — Student Progress Report')
  lines.push('')
  lines.push(`Student Name,${escapeCSV(student.full_name || '')}`)
  lines.push(`Student Email,${escapeCSV(student.email)}`)
  lines.push(`Level,${student.level}`)
  lines.push(
    `Joined,${new Date(student.created_at).toISOString().slice(0, 10)}`
  )
  lines.push(
    `Report Generated,${new Date().toISOString().slice(0, 19).replace('T', ' ')}`
  )
  lines.push('')
  lines.push('')

  // Table headers
  lines.push(
    ['Course', 'Quiz', 'Best Score', 'Latest Score', 'Attempts', 'Last Attempt']
      .map(escapeCSV)
      .join(',')
  )

  for (const p of progress ?? []) {
    const quiz: any = (p as any).quizzes
    lines.push(
      [
        quiz?.courses?.title || '',
        quiz?.title || '',
        p.best_score,
        p.latest_score,
        p.attempt_count,
        p.last_completed_at
          ? new Date(p.last_completed_at)
              .toISOString()
              .slice(0, 19)
              .replace('T', ' ')
          : '',
      ]
        .map(escapeCSV)
        .join(',')
    )
  }

  const csv = lines.join('\n')

  const safeName = (student.full_name || student.email)
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
  const filename = `gpa-progress-${safeName}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
