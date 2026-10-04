import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import QuizPlayer from './QuizPlayer'

export const dynamic = 'force-dynamic'

export default async function StartQuizPage({
  params,
}: {
  params: { id: string }
}) {
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
    redirect('/login')
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Get the quiz
  const { data: quiz } = await adminClient
    .from('quizzes')
    .select('*, courses ( id, title )')
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-bold mb-2">Quiz not found or not published</p>
        <p className="text-sm text-gray-600">Quiz ID: {params.id}</p>
      </div>
    )
  }

  // Check access
  const { data: access } = await adminClient
    .from('user_course_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', quiz.course_id)
    .maybeSingle()

  if (!access) {
    redirect(`/courses/${quiz.course_id}`)
  }

  // Count existing attempts
  const { count: attemptCount } = await adminClient
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('quiz_id', params.id)

  const attemptsUsed = attemptCount ?? 0

  // Check max attempts
  if (attemptsUsed >= quiz.max_attempts) {
    redirect(`/quizzes/${params.id}/results`)
  }

  // Get questions
  const { data: questions } = await adminClient
    .from('questions')
    .select('id, text, options, image_url, question_type, order_index, points, hint, topic_tag')
    .eq('quiz_id', params.id)
    .order('order_index', { ascending: true })

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-bold mb-2">No questions in this quiz</p>
        <p className="text-sm text-gray-600">Quiz: {quiz.title}</p>
      </div>
    )
  }

  // Create a NEW attempt with the correct number
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

  if (attemptError || !attempt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-bold mb-2">
          Could not start quiz attempt
        </p>
        <p className="text-sm text-gray-600 mt-2">
          {attemptError?.message || 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <QuizPlayer
      attemptId={attempt.id}
      startedAt={attempt.started_at}
      quiz={{
        id: quiz.id,
        title: quiz.title,
        courseTitle: (quiz.courses as any)?.title ?? '',
        courseId: quiz.course_id,
        timeLimitSeconds: quiz.time_limit_seconds,
      }}
      questions={questions}
    />
  )
}
