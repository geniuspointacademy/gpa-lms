import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Get student
  const { data: student } = await adminClient
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!student) notFound()

  // Get their enrolled courses
  const { data: accessRows } = await adminClient
    .from('user_course_access')
    .select('*, courses ( id, title, level )')
    .eq('user_id', params.id)
    .order('granted_at', { ascending: false })

  // Get all their attempts
  const { data: attempts } = await adminClient
    .from('quiz_attempts')
    .select(
      '*, quizzes ( id, title, course_id, max_attempts, courses ( id, title ) )'
    )
    .eq('user_id', params.id)
    .order('started_at', { ascending: false })

  // Get progress
  const { data: progress } = await adminClient
    .from('student_progress')
    .select('*, quizzes ( title, course_id, courses ( title ) )')
    .eq('user_id', params.id)
    .order('last_completed_at', { ascending: false })

  const submitted = (attempts ?? []).filter((a) => a.is_submitted)
  const avgPercent =
    submitted.length > 0
      ? Math.round(
          submitted.reduce(
            (sum, a) =>
              sum + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0),
            0
          ) / submitted.length
        )
      : 0

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/students"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Students
        </Link>
      </div>

      {/* Student header */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gpa-navy">
              {student.full_name || 'Unnamed Student'}
            </h2>
            <p className="text-gray-600">{student.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {student.level} Level
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {student.role}
              </span>
              <span className="text-xs text-gray-500">
                Joined {new Date(student.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <a
            href={`/api/admin/exports/student?user_id=${student.id}`}
            className="bg-gpa-navy text-white px-4 py-2 rounded font-medium hover:opacity-90 text-sm"
          >
            ⬇ Download CSV
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border">
          <p className="text-xs text-gray-500 mb-1">Courses</p>
          <p className="text-2xl font-bold text-gpa-navy">
            {accessRows?.length ?? 0}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg border">
          <p className="text-xs text-gray-500 mb-1">Total Attempts</p>
          <p className="text-2xl font-bold text-gpa-navy">
            {submitted.length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg border">
          <p className="text-xs text-gray-500 mb-1">Quizzes Taken</p>
          <p className="text-2xl font-bold text-gpa-navy">
            {progress?.length ?? 0}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg border">
          <p className="text-xs text-gray-500 mb-1">Avg Score</p>
          <p
            className={`text-2xl font-bold ${
              avgPercent >= 70
                ? 'text-green-600'
                : avgPercent >= 50
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {submitted.length > 0 ? `${avgPercent}%` : '—'}
          </p>
        </div>
      </div>

      {/* Enrolled courses */}
      <section className="bg-white p-6 rounded-lg border">
        <h3 className="font-bold mb-4">
          Enrolled Courses ({accessRows?.length ?? 0})
        </h3>
        {!accessRows || accessRows.length === 0 ? (
          <p className="text-sm text-gray-500">
            Not enrolled in any courses yet.
          </p>
        ) : (
          <div className="space-y-2">
            {accessRows.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <div className="font-medium">{a.courses?.title}</div>
                  <div className="text-xs text-gray-500">
                    Level {a.courses?.level} · via {a.access_method}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(a.granted_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Progress summary */}
      <section className="bg-white p-6 rounded-lg border">
        <h3 className="font-bold mb-4">
          Quiz Progress ({progress?.length ?? 0})
        </h3>
        {!progress || progress.length === 0 ? (
          <p className="text-sm text-gray-500">
            No quiz attempts yet.
          </p>
        ) : (
          <div className="bg-gray-50 rounded border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Quiz</th>
                  <th className="text-left px-4 py-2 font-medium">Course</th>
                  <th className="text-right px-4 py-2 font-medium">Best</th>
                  <th className="text-right px-4 py-2 font-medium">Latest</th>
                  <th className="text-right px-4 py-2 font-medium">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">
                      {p.quizzes?.title ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {p.quizzes?.courses?.title ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-green-700">
                      {p.best_score}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {p.latest_score}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-500">
                      {p.attempt_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detailed attempt history */}
      <section className="bg-white p-6 rounded-lg border">
        <h3 className="font-bold mb-4">
          Attempt History ({attempts?.length ?? 0})
        </h3>
        {!attempts || attempts.length === 0 ? (
          <p className="text-sm text-gray-500">
            No attempts recorded.
          </p>
        ) : (
          <div className="bg-gray-50 rounded border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Quiz</th>
                  <th className="text-right px-4 py-2 font-medium">Attempt</th>
                  <th className="text-right px-4 py-2 font-medium">Score</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-right px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a: any) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {a.quizzes?.title ?? '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {a.quizzes?.courses?.title ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      #{a.attempt_number}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {a.is_submitted ? (
                        <>
                          {a.score}/{a.max_score}
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {a.is_submitted ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Submitted
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-gray-500">
                      {new Date(a.started_at).toLocaleDateString()}{' '}
                      {new Date(a.started_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
