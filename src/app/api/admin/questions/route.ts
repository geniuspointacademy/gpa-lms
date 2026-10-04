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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const check = await verifyAdmin()
  if ('error' in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const body = await req.json()
  const {
    text,
    options,
    correct_answer,
    image_url,
    order_index,
    points,
    hint,
    topic_tag,
    explanation,
  } = body

  if (!text || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: 'Invalid question data' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Update question
  const { data: question, error: qError } = await adminClient
    .from('questions')
    .update({
      text: text.trim(),
      options,
      image_url: image_url || null,
      order_index: order_index ?? 0,
      points: points ?? 1,
      hint: hint || null,
      topic_tag: topic_tag || null,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 })
  }

  // Upsert the answer
  const { error: aError } = await adminClient
    .from('question_answers')
    .upsert({
      question_id: params.id,
      correct_answer,
      explanation: explanation || null,
    })

  if (aError) {
    return NextResponse.json({ error: aError.message }, { status: 500 })
  }

  return NextResponse.json({
    question: {
      ...question,
      question_answers: {
        correct_answer,
        explanation: explanation || null,
      },
    },
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const check = await verifyAdmin()
  if ('error' in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error } = await adminClient
    .from('questions')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
