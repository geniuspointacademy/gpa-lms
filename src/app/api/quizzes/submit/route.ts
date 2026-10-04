import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // 1. Verify user
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  const body = await req.json()
  const { attempt_id, answers } = body as {
    attempt_id: string
    answers: Record<string, string>
  }

  if (!attempt_id || !answers) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // 3. Load the attempt + quiz
  const { data: attempt } = await adminClient
    .from('quiz_attempts')
    .select('*, quizzes ( id, title, time_limit_seconds, course_id )')
    .eq('id', attempt_id)
    .eq('user_id', user.id)
    .single()

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  if (attempt.is_submitted) {
    return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
  }

  const quiz = attempt.quizzes as any

  // 4. Server-side time enforcement
  if (quiz.time_limit_seconds) {
    const elapsed =
      (Date.now() - new Date(attempt.started_at).getTime()) / 1000
    const grace = 30 // 30 second grace
    if (elapsed > quiz.time_limit_seconds + grace) {
      await adminClient
        .from('quiz_attempts')
        .update({
          is_submitted: true,
          submitted_at: new Date().toISOString(),
          score: 0,
          max_score: 0,
        })
        .eq('id', attempt_id)

      return NextResponse.json(
        { error: 'Time expired' },
        { status: 410 }
      )
    }
  }

  // 5. Fetch questions + correct answers
  const { data: questions } = await adminClient
    .from('questions')
    .select('id, points, question_answers ( correct_answer )')
    .eq('quiz_id', quiz.id)

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions' }, { status: 400 })
  }

  // 6. Grade
  let score = 0
  let maxScore = 0

  for (const q of questions) {
    maxScore += q.points
    const correct = (q.question_answers as any)?.correct_answer as
      | string[]
      | undefined
    const given = answers[q.id]

    if (correct && given) {
      // Simple single-choice comparison
      if (correct.length === 1 && correct[0] === given) {
        score += q.points
      }
    }
  }

  // 7. Update attempt
  const { error: updateError } = await adminClient
    .from('quiz_attempts')
    .update({
      is_submitted: true,
      submitted_at: new Date().toISOString(),
      score,
      max_score: maxScore,
    })
    .eq('id', attempt_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 8. Upsert student_progress
  const { data: existing } = await adminClient
    .from('student_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('quiz_id', quiz.id)
    .maybeSingle()

  if (existing) {
    await adminClient
      .from('student_progress')
      .update({
        best_score: Math.max(existing.best_score, score),
        latest_score: score,
        attempt_count: existing.attempt_count + 1,
        last_completed_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await adminClient.from('student_progress').insert({
      user_id: user.id,
      quiz_id: quiz.id,
      best_score: score,
      latest_score: score,
      attempt_count: 1,
      last_completed_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({
    score,
    max_score: maxScore,
    attempt_id,
  })
}
