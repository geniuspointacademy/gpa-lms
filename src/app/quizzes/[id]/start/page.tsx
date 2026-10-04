import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import QuizPlayer from './QuizPlayer'
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
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gpa-navy mb-2">
            Quiz Not Found
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            This quiz doesn&apos;t exist or hasn&apos;t been published yet.
          </p>
          <Link
            href="/courses"
            className="inline-block px-5 py-2 rounded font-medium bg-gpa-navy text-white hover:opacity-90"
          >
            Browse Courses
          </Link>
        </div>
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

  // Check max attempts — show message instead of redirect
  if (attemptsUsed >= quiz.max_attempts) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gpa-navy mb-2">
            Attempts Exhausted
          </h1>
          <p className="text-gray-600 mb-4">
            You have used all{' '}
            <strong>
              {quiz.max_attempts}{' '}
              {quiz.max_attempts === 1 ? 'attempt' : 'attempts'}
            </strong>{' '}
            for this quiz.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Quiz: <strong>{quiz.title}</strong>
          </p>

          <div className="flex gap-3 justify-center flex-wrap mb-6">
            <Link
              href={`/quizzes/${params.id}/results`}
              className="px-5 py-2 rounded font-medium bg-gpa-navy text-white hover:opacity-90"
            >
              View Your Results
            </Link>
            <Link
              href={`/courses/${quiz.course_id}/learn`}
              className="px-5 py-2 rounded font-medium border hover:bg-gray-50"
            >
              Back to Course
            </Link>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Need another attempt? Contact the admin.
            </p>
            <WhatsAppButton
              courseTitle={quiz.title}
              studentName={null}
              level={null}
            />
          </div>
        </div>
      </div>
    )
  }

  // Get questions
  const { data: questions } = await adminClient
    .from('questions')
    .select(
      'id, text, options, image_url, question_type, order_index, points, hint, topic_tag'
    )
    .eq('quiz_id', params.id)
    .order('order_index', { ascending: true })

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-xl font-bold text-gpa-navy mb-2">
            No Questions Yet
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            This quiz doesn&apos;t have any questions yet. Check back soon.
          </p>
          <Link
            href={`/courses/${quiz.course_id}/learn`}
            className="inline-block px-5 py-2 rounded font-medium bg-gpa-navy text-white hover:opacity-90"
          >
            Back to Course
          </Link>
        </div>
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
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Could Not Start Quiz
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            {attemptError?.message || 'Unknown error'}
          </p>
          <Link
            href={`/courses/${quiz.course_id}/learn`}
            className="inline-block px-5 py-2 rounded font-medium bg-gpa-navy text-white hover:opacity-90"
          >
            Back to Course
          </Link>
        </div>
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
