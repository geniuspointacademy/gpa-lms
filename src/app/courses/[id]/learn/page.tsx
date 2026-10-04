import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const revalidate = 0

export default async function LearnPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!course) {
    notFound()
  }

  // Check access
  const { data: access } = await supabase
    .from('user_course_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', params.id)
    .maybeSingle()

  if (!access) {
    redirect(`/courses/${params.id}`)
  }

  // Get quizzes
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', params.id)
    .eq('is_published', true)
    .order('created_at', { ascending: true })

  // Get progress for all these quizzes
  const quizIds = (quizzes ?? []).map((q) => q.id)
  const { data: progress } = quizIds.length
    ? await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('quiz_id', quizIds)
    : { data: [] }

  const progressMap = new Map(
    (progress ?? []).map((p) => [p.quiz_id, p])
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href={`/courses/${params.id}`}
        className="text-sm text-gray-600 hover:underline"
      >
        ← Back to Course
      </Link>

      <div className="mt-6 mb-8">
        <span className="text-sm bg-gpa-navy text-white px-3 py-1 rounded">
          Level {course.level}
        </span>
        <h1 className="text-3xl font-bold text-gpa-navy mt-3 mb-2">
          {course.title}
        </h1>
        {course.description && (
          <p className="text-gray-600">{course.description}</p>
        )}
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4">
          Quizzes ({quizzes?.length ?? 0})
        </h2>

        {!quizzes || quizzes.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border text-center text-gray-600">
            No quizzes published yet. Check back soon.
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz, i) => {
              const p = progressMap.get(quiz.id)
              const attemptsUsed = p?.attempt_count ?? 0
              const attemptsLeft = quiz.max_attempts - attemptsUsed
              const canAttempt = attemptsLeft > 0
              const exhausted = attemptsLeft <= 0

              return (
                <div
                  key={quiz.id}
                  className={`bg-white p-5 rounded-lg border ${
                    exhausted ? 'opacity-90' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-gray-500">
                          QUIZ {i + 1}
                        </span>
                        {p && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Best: {p.best_score}
                          </span>
                        )}
                        {exhausted && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg">{quiz.title}</h3>
                      {quiz.topic_description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {quiz.topic_description}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mt-2 flex gap-3 flex-wrap">
                        {quiz.time_limit_seconds && (
                          <span>
                            ⏱ {Math.round(quiz.time_limit_seconds / 60)} min
                          </span>
                        )}
                        <span
                          className={
                            exhausted ? 'text-red-600 font-medium' : ''
                          }
                        >
                          {exhausted
                            ? 'Attempts used up'
                            : `Attempts: ${attemptsUsed}/${quiz.max_attempts}`}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={
                        canAttempt
                          ? `/quizzes/${quiz.id}/start`
                          : `/quizzes/${quiz.id}/results`
                      }
                      className={`px-5 py-2 rounded font-medium whitespace-nowrap ${
                        canAttempt
                          ? 'bg-gpa-green text-white hover:opacity-90'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {canAttempt
                        ? attemptsUsed > 0
                          ? 'Retake'
                          : 'Start Quiz'
                        : 'View Results'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
