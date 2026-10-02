import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import QuizList from './QuizList'
import CreateQuizForm from './CreateQuizForm'

export default async function CourseDetailAdminPage({
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

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!course) {
    notFound()
  }

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/courses"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Courses
        </Link>
        <h2 className="text-2xl font-bold text-gpa-navy mt-2">
          {course.title}
        </h2>
        <div className="flex gap-3 mt-2 text-sm text-gray-600">
          <span>Level {course.level}</span>
          <span>·</span>
          <span>₦{Number(course.price).toLocaleString()}</span>
          <span>·</span>
          <span>{quizzes?.length ?? 0} quizzes</span>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold mb-4">Add New Quiz</h3>
        <CreateQuizForm courseId={course.id} />
      </section>

      <section>
        <h3 className="text-lg font-bold mb-4">
          Quizzes ({quizzes?.length ?? 0})
        </h3>
        <QuizList quizzes={quizzes ?? []} courseId={course.id} />
      </section>
    </div>
  )
}
