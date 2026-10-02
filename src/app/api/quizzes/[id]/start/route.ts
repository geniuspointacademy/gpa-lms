import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // 1. Get quiz
  const { data: quiz } = await adminClient
    .from('quizzes')
    .select('*, courses ( id, title )')
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  }

  // 2. Verify user has access to the course
  const { data: access } = await adminClient
    .from('user_course_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', quiz.course_id)
    .maybeSingle()

  if (!access) {
    return NextResponse.json({ error: 'No access to this course' }, { status: 403 })
  }

  // 3. Check attempt count
  const { count: attemptCount } = await adminClient
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('quiz_id', params.id)

  const attemptsUsed = attemptCount ?? 0
  if (attemptsUsed >= quiz.max_attempts) {
    return NextResponse.json(
      { error: 'Maximum attempts reached' },
      { status: 403 }
    )
  }

  // 4. Fetch questions WITHOUT correct answers
  const { data: questions } = await adminClient
    .from('questions')
    .select('id, text, options, image_url, question_type, order_index, points, hint, topic_tag')
    .eq('quiz_id', params.id)
    .order('order_index', { ascending: true })

  if (!questions || questions.length === 0) {
    return NextResponse.json(
      { error: 'Quiz has no questions yet' },
      { status: 400 }
    )
  }

  // 5. Create the attempt
  const { data: attempt, error: attemptError } = await adminClient
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_id: params.id,
      attempt_number: attemptsUsed + 1,
      started_at: new Date().toISOString(),
      is_submitted: false,
    })
    .select()
    .single()

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 })
  }

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      started_at: attempt.started_at,
      attempt_number: attempt.attempt_number,
    },
    quiz: {
      id: quiz.id,
      title: quiz.title,
      topic_description: quiz.topic_description,
      time_limit_seconds: quiz.time_limit_seconds,
      max_attempts: quiz.max_attempts,
      course_title: (quiz.courses as any)?.title,
    },
    questions,
  })
}
