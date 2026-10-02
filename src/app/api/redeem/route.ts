import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // 1. Verify user is logged in
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
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // 2. Parse code
  const body = await req.json()
  const { code } = body

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return NextResponse.json({ error: 'Please enter a code' }, { status: 400 })
  }

  // 3. Call the SQL function via service role (it's restricted)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await adminClient.rpc('redeem_invitation_code', {
    p_code: code.trim().toUpperCase(),
    p_user_id: user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = Array.isArray(data) ? data[0] : data

  if (!result || !result.success) {
    return NextResponse.json(
      { error: result?.message || 'Invalid or already-used code' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    course_id: result.course_id,
    message: result.message,
  })
}
