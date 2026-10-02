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

  return { ok: true, userId: user.id }
}

// Code charset: no I, L, O, 0, 1
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomSegment(length: number): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return out
}

export async function POST(req: Request) {
  const check = await verifyAdmin()
  if ('error' in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const body = await req.json()
  const { course_id, quantity } = body

  if (!course_id) {
    return NextResponse.json({ error: 'Missing course_id' }, { status: 400 })
  }

  const qty = Math.min(Math.max(Number(quantity) || 1, 1), 200)

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Generate unique codes
  const codes = new Set<string>()
  while (codes.size < qty) {
    codes.add(`GPA-${randomSegment(6)}`)
  }

  const rows = Array.from(codes).map((code_string) => ({
    code_string,
    course_id,
    created_by: check.userId,
    is_used: false,
  }))

  const { data, error } = await adminClient
    .from('invitation_codes')
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ codes: data })
}

export async function GET(req: Request) {
  const check = await verifyAdmin()
  if ('error' in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const url = new URL(req.url)
  const courseId = url.searchParams.get('course_id')

  if (!courseId) {
    return NextResponse.json({ error: 'Missing course_id' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await adminClient
    .from('invitation_codes')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ codes: data })
}
