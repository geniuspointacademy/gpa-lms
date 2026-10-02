import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import WhatsAppButton from '@/components/WhatsAppButton'

export const revalidate = 60

export default async function CourseDetailPage({
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

  let studentName: string | null = null
  let studentLevel: number | null = null

  if (user) {
    const { data: profile } = await userClient
      .from('users')
      .select('full_name, level')
      .eq('id', user.id)
      .single()
    studentName = profile?.full_name ?? null
    studentLevel = profile?.level ?? null
  }

  const { data: course } = await userClient
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!course) {
    notFound()
  }

  // Get quiz count for this course
  const { count: quizCount } = await userClient
    .from('quizzes')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', params.id)
    .eq('is_published', true)

  // Get a sample question (server-side, includes no correct answer)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: firstQuiz } = await adminClient
    .from('quizzes')
    .select('id')
    .eq('course_id', params.id)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle()

  let sampleQuestion: {
    text: string
    options: string[]
    image_url: string | null
  } | null = null

  if (firstQuiz) {
    const { data: q } = await adminClient
      .from('questions')
      .select('text, options, image_url')
      .eq('quiz_id', firstQuiz.id)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle()
    sampleQuestion = q
  }

  // Check if current user already has access
  let hasAccess = false
  if (user) {
    const { data: access } = await userClient
      .from('user_course_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', params.id)
      .maybeSingle()
    hasAccess = !!access
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href="/courses"
        className="text-sm text-gray-600 hover:underline"
      >
        ← Back to Courses
      </Link>

      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm bg-gpa-navy text-white px-3 py-1 rounded">
            Level {course.level}
          </span>
          {hasAccess && (
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded">
              ✓ Enrolled
            </span>
          )}
        </div>
        <h1 className="text-4xl font-bold text-gpa-navy mb-4">
          {course.title}
        </h1>
        {course.description && (
          <p className="text-gray-700 text-lg">{course.description}</p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-5 rounded-lg border">
          <p className="text-xs text-gray-500 mb-1">Quizzes</p>
          <p className="text-2xl font-bold text-gpa-navy">
            {quizCount ?? 0}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg border">
          <p className="text-xs text-gray-500 mb-1">Level</p>
          <p className="text-2xl font-bold text-gpa-navy">{course.level}</p>
        </div>
        <div className="bg-white p-5 rounded-lg border">
          <p className="text-xs text-gray-500 mb-1">Access</p>
          <p className="text-2xl font-bold text-gpa-navy">Code</p>
        </div>
      </div>

      {hasAccess ? (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-8">
          <h2 className="font-bold text-lg text-green-900 mb-2">
            You have access to this course
          </h2>
          <p className="text-sm text-green-800 mb-4">
            Start learning with the quizzes below.
          </p>
          <Link
            href={`/courses/${course.id}/learn`}
            className="inline-block bg-gpa-green text-white px-6 py-3 rounded-lg font-medium hover:opacity-90"
          >
            Start Learning →
          </Link>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border mb-8 space-y-4">
          <h2 className="font-bold text-lg text-gpa-navy">
            How to get access
          </h2>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="font-medium text-sm mb-1">
              1. Have an access code?
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Enter it on the redeem page to unlock this course instantly.
            </p>
            <Link
              href="/redeem"
              className="inline-block bg-gpa-navy text-white px-4 py-2 rounded font-medium hover:opacity-90 text-sm"
            >
              Redeem Code
            </Link>
          </div>

          <div className="bg-green-50 p-4 rounded border border-green-200">
            <p className="font-medium text-sm mb-1 text-green-900">
              2. Don&apos;t have a code yet?
            </p>
            <p className="text-sm text-green-800 mb-3">
              Message the admin on WhatsApp to request access.
            </p>
            <WhatsAppButton
              courseTitle={course.title}
              studentName={studentName}
              level={studentLevel}
            />
          </div>
        </div>
      )}

      {sampleQuestion && (
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="font-bold text-lg text-gpa-navy mb-1">
            Sample Question
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Preview of what&apos;s inside this course
          </p>

          <div className="space-y-3">
            <p className="font-medium">{sampleQuestion.text}</p>

            {sampleQuestion.image_url && (
              <img
                src={sampleQuestion.image_url}
                alt="Sample question"
                className="max-h-64 rounded border"
              />
            )}

            <ul className="space-y-1 text-sm">
              {(sampleQuestion.options ?? []).map((opt, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 p-2 border rounded opacity-75"
                >
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-gray-500 italic">
              🔒 Sign in and enroll to see the answer and take the full quiz.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
