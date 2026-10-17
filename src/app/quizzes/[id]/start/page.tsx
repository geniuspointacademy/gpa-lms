import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import QuizPlayer from './QuizPlayer'
import Link from 'next/link'
import WhatsAppButton from '@/components/WhatsAppButton'

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
        getAll() { return cookieStore.getAll() },
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
  if (!user) redirect('/login')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Fetch quiz and course details
  const { data: quiz } = await adminClient
    .from('quizzes')
    .select('*, courses ( id, title, is_free )')
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg border text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Quiz Not Found</h1>
          <p className="text-gray-600 text-sm mb-4">This quiz doesn't exist or isn't published.</p>
        </div>
      </div>
    )
  }

  const course = quiz.courses as any
  const isFree = course?.is_free === true

  // Check access (skip if the course is free)
  if (!isFree) {
    const { data: access } = await adminClient
      .from('user_course_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', quiz.course_id)
      .maybeSingle()

    if (!access) {
      redirect(`/courses/${quiz.course_id}`)
    }
  }

  // Check attempts
  const { count: attemptCount } = await adminClient
    .from('quiz_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('quiz_id', params.id)

  const attemptsUsed = attemptCount ?? 0

  if (attemptsUsed >= quiz.max_attempts) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gpa-navy mb-2">Attempts Exhausted</h1>
          <p className="text-gray-600 mb-6">
            You have used all <strong>{quiz.max_attempts}</strong> attempts for this quiz.
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/quizzes/${params.id}/results`} className="bg-gpa-navy text-white px-5 py-2 rounded font-medium hover:opacity-90">
              View Your Results
            </Link>
            <Link href={`/courses/${quiz.course_id}/learn`} className="border px-5 py-2 rounded font-medium hover:bg-gray-50">
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch questions
  let { data: questions } = await adminClient
    .from('questions')
    .select('id, text, options, image_url, question_type, correct_text, order_index, points, hint, topic_tag')
    .eq('quiz_id', params.id)
    .order('order_index', { ascending: true })
    .limit(500)

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-bold mb-2">No questions in this quiz</p>
      </div>
    )
  }

  // 🔀 SHUFFLE LOGIC
  if (quiz.shuffle_questions) {
    questions = [...questions].sort(() => Math.random() - 0.5)
  }

  // Create attempt
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
      <div className="max-w-md mx-auto px-4 py-16 text-center text-red-600">
        Could not start quiz attempt. Please try again.
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
        courseTitle: course?.title ?? '',
        courseId: quiz.course_id,
        timeLimitSeconds: quiz.time_limit_seconds,
      }}
      questions={questions}
    />
  )
}
