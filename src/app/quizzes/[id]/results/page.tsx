import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function ResultsPage({
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
    .single()

  if (!quiz) notFound()

  // Get the latest submitted attempt
  const { data: attempt } = await adminClient
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('quiz_id', params.id)
    .eq('is_submitted', true)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!attempt) {
    // No submitted attempt yet — send back to start
    redirect(`/quizzes/${params.id}/start`)
  }

  // Get progress
  const { data: progress } = await adminClient
    .from('student_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('quiz_id', params.id)
    .maybeSingle()

  // Get questions + answers for review
  const { data: questions } = await adminClient
    .from('questions')
    .select('*, question_answers ( correct_answer, explanation )')
    .eq('quiz_id', params.id)
    .order('order_index', { ascending: true })

  const score = attempt.score ?? 0
  const maxScore = attempt.max_score ?? 0
  const percentage =
    maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  const attemptsUsed = progress?.attempt_count ?? 1
  const canRetake = attemptsUsed < quiz.max_attempts

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href={`/courses/${quiz.course_id}/learn`}
        className="text-sm text-gray-600 hover:underline"
      >
        ← Back to Course
      </Link>

      <div className="bg-white p-8 rounded-lg border text-center mt-6 mb-8">
        <h1 className="text-2xl font-bold text-gpa-navy mb-1">
          {quiz.title}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {(quiz.courses as any)?.title}
        </p>

        <div className="mb-4">
          <div
            className={`text-6xl font-bold ${
              percentage >= 70
                ? 'text-green-600'
                : percentage >= 50
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {percentage}%
          </div>
        </div>

        <p className="text-gray-600 mb-2">
          You scored {score} out of {maxScore}
        </p>
        <p className="text-sm text-gray-500">
          Attempt {attemptsUsed} of {quiz.max_attempts}
          {progress && progress.best_score > score && (
            <> · Best: {progress.best_score}/{maxScore}</>
          )}
        </p>

        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          <Link
            href={`/courses/${quiz.course_id}/learn`}
            className="px-5 py-2 rounded font-medium border hover:bg-gray-50"
          >
            Back to Course
          </Link>
          {canRetake && (
            <Link
              href={`/quizzes/${quiz.id}/start`}
              className="px-5 py-2 rounded font-medium bg-gpa-green text-white hover:opacity-90"
            >
              Retake Quiz
            </Link>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-4">Question Review</h2>

        <div className="space-y-4">
          {(questions ?? []).map((q, i) => {
            const correctAnswer =
              (q.question_answers as any)?.correct_answer?.[0] ?? null
            const explanation = (q.question_answers as any)?.explanation ?? null
            const userAnswer = (attempt as any).answers?.[q.id] ?? null
            const isCorrect = userAnswer === correctAnswer

            return (
              <div key={q.id} className="bg-white p-5 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-gray-500">
                    Q{i + 1}
                  </span>
                  {isCorrect ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      ✓ Correct
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      ✗ Wrong
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {q.points} pt{q.points !== 1 ? 's' : ''}
                  </span>
                </div>

                <p className="font-medium mb-3">{q.text}</p>

                {q.image_url && (
                  <img
                    src={q.image_url}
                    alt=""
                    className="max-h-48 rounded border mb-3"
                  />
                )}

                <ul className="space-y-1 text-sm">
                  {(q.options ?? []).map((opt: string, j: number) => {
                    const isCorrectOpt = opt === correctAnswer
                    const isUserChoice = opt === userAnswer
                    return (
                      <li
                        key={j}
                        className={`flex items-center gap-2 p-2 rounded ${
                          isCorrectOpt
                            ? 'bg-green-50 text-green-800'
                            : isUserChoice
                            ? 'bg-red-50 text-red-800'
                            : ''
                        }`}
                      >
                        <span className="w-5 h-5 flex items-center justify-center border rounded-full text-xs shrink-0">
                          {String.fromCharCode(65 + j)}
                        </span>
                        <span>{opt}</span>
                        {isCorrectOpt && (
                          <span className="text-xs font-medium ml-auto">
                            ✓ Correct answer
                          </span>
                        )}
                        {isUserChoice && !isCorrectOpt && (
                          <span className="text-xs font-medium ml-auto">
                            Your answer
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>

                {explanation && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                    <p className="font-medium text-blue-900 mb-1">
                      💡 Explanation
                    </p>
                    <p className="text-blue-800">{explanation}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
