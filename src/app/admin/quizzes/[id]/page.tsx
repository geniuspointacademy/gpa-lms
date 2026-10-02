import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import QuizSettings from './QuizSettings'
import QuestionEditor from './QuestionEditor'

export default async function QuizEditPage({
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

  // Fetch quiz
  const { data: quiz } = await userClient
    .from('quizzes')
    .select('*, courses ( id, title )')
    .eq('id', params.id)
    .single()

  if (!quiz) {
    notFound()
  }

  // Fetch questions with their answers (service role to bypass RLS on question_answers)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: questions } = await adminClient
    .from('questions')
    .select('*, question_answers ( correct_answer )')
    .eq('quiz_id', params.id)
    .order('order_index', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/courses/${quiz.courses?.id}`}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to {(quiz.courses as any)?.title || 'Course'}
        </Link>
        <h2 className="text-2xl font-bold text-gpa-navy mt-2">{quiz.title}</h2>
        {quiz.topic_description && (
          <p className="text-sm text-gray-600 mt-1">{quiz.topic_description}</p>
        )}
      </div>

      <QuizSettings quiz={quiz} />

      <section>
        <h3 className="text-lg font-bold mb-4">
          Questions ({questions?.length ?? 0})
        </h3>
        <QuestionEditor
          quizId={quiz.id}
          initialQuestions={questions ?? []}
        />
      </section>
    </div>
  )
}
