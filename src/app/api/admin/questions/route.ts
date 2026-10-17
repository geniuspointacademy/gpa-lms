import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function verifyAdmin() {
  const cookieStore = cookies()
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await userClient.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 }

  return { ok: true }
}

export async function POST(req: Request) {
  try {
    const check = await verifyAdmin()
    if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status })

    const body = await req.json()
    
    // Safety check: make sure required fields exist
    if (!body.quiz_id || !body.text) {
      return NextResponse.json({ error: 'Missing quiz_id or question text' }, { status: 400 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // 1. Insert the question safely
    const { data: question, error: qError } = await adminClient
      .from('questions')
      .insert({
        quiz_id: body.quiz_id,
        text: body.text.trim(),
        question_type: body.question_type || 'multiple_choice',
        options: body.options && body.options.length > 0 ? body.options : null,
        correct_text: body.correct_text || null,
        image_url: body.image_url || null,
        order_index: body.order_index ?? 0,
        points: body.points ?? 1,
        hint: body.hint || null,
        topic_tag: body.topic_tag || null,
      })
      .select()
      .single()

    if (qError) {
      console.error('Question insert error:', qError)
      return NextResponse.json({ error: qError.message }, { status: 500 })
    }

    // 2. Insert the answer safely
    const { error: aError } = await adminClient
      .from('question_answers')
      .insert({
        question_id: question.id,
        correct_answer: body.correct_answer || [],
        explanation: body.explanation || null,
      })

    if (aError) {
      console.error('Answer insert error:', aError)
      // Rollback if answer fails
      await adminClient.from('questions').delete().eq('id', question.id)
      return NextResponse.json({ error: aError.message }, { status: 500 })
    }

    return NextResponse.json({
      question: { 
        ...question, 
        question_answers: { 
          correct_answer: body.correct_answer || [], 
          explanation: body.explanation || null 
        } 
      },
    })

  } catch (err: any) {
    console.error('Unhandled API Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
