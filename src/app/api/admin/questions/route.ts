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

export async function POST(req: Request) {
  const check = await verifyAdmin()
  if ('error' in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const body = await req.json()
  const {
    quiz_id,
    text,
    options,
    correct_answer,
    image_url,
    order_index,
    points,
  } = body

  if (!quiz_id || !text || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: 'Invalid question data' }, { status: 400 })
  }

  if (!Array.isArray(correct_answer) || correct_answer.length === 0) {
    return NextResponse.json({ error: 'Correct answer required' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Insert the question
  const { data: question, error: qError } = await adminClient
    .from('questions')
    .insert({
      quiz_id,
      text: text.trim(),
      options,
      image_url: image_url || null,
      question_type: 'single_choice',
      order_index: order_index ?? 0,
      points: points ?? 1,
    })
    .select()
    .single()

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 })
  }

  // Insert the answer
  const { error: aError } = await adminClient
    .from('question_answers')
    .insert({
      question_id: question.id,
      correct_answer,
    })

  if (aError) {
    // Rollback: delete the question
    await adminClient.from('questions').delete().eq('id', question.id)
    return NextResponse.json({ error: aError.message }, { status: 500 })
  }

  return NextResponse.json({
    question: {
      ...question,
      question_answers: { correct_answer },
    },
  })
}
