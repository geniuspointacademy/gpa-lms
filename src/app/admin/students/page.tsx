import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage() {
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

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Get all students
  const { data: students } = await adminClient
    .from('users')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  // Get attempt stats per student
  const studentIds = (students ?? []).map((s) => s.id)
  const { data: attempts } = studentIds.length
    ? await adminClient
        .from('quiz_attempts')
        .select('user_id, score, max_score, is_submitted')
        .in('user_id', studentIds)
        .eq('is_submitted', true)
    : { data: [] }

  // Compute per-student stats
  const stats: Record<
    string,
    { attempts: number; avgPercent: number; courses: number }
  > = {}

  for (const s of students ?? []) {
    stats[s.id] = { attempts: 0, avgPercent: 0, courses: 0 }
  }

  for (const a of attempts ?? []) {
    if (!stats[a.user_id]) continue
    stats[a.user_id].attempts += 1
  }

  // Compute average percent per student
  const percentByStudent: Record<string, number[]> = {}
  for (const a of attempts ?? []) {
    if (!percentByStudent[a.user_id]) percentByStudent[a.user_id] = []
    if (a.max_score > 0) {
      percentByStudent[a.user_id].push((a.score / a.max_score) * 100)
    }
  }
  for (const [uid, percents] of Object.entries(percentByStudent)) {
    const avg = percents.reduce((x, y) => x + y, 0) / percents.length
    stats[uid].avgPercent = Math.round(avg)
  }

  // Count courses per student
  const { data: accessRows } = studentIds.length
    ? await adminClient
        .from('user_course_access')
        .select('user_id')
        .in('user_id', studentIds)
    : { data: [] }

  for (const a of accessRows ?? []) {
    if (stats[a.user_id]) stats[a.user_id].courses += 1
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold">All Students</h2>
          <p className="text-sm text-gray-600">
            {students?.length ?? 0} total
          </p>
        </div>
        <Link
          href="/admin/exports"
          className="bg-gpa-navy text-white px-4 py-2 rounded font-medium hover:opacity-90 text-sm"
        >
          Export Progress
        </Link>
      </div>

      {!students || students.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center text-gray-600">
          No students yet. They&apos;ll appear here once they sign up.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Level
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Courses
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Attempts
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Avg Score
                </th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const st = stats[s.id] || {
                  attempts: 0,
                  avgPercent: 0,
                  courses: 0,
                }
                return (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.full_name || '—'}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {s.level} Level
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {st.courses}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {st.attempts}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {st.attempts > 0 ? (
                        <span
                          className={
                            st.avgPercent >= 70
                              ? 'text-green-700 font-medium'
                              : st.avgPercent >= 50
                              ? 'text-yellow-700 font-medium'
                              : 'text-red-700 font-medium'
                          }
                        >
                          {st.avgPercent}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="text-xs bg-gpa-navy text-white px-3 py-1.5 rounded hover:opacity-90 inline-block"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
