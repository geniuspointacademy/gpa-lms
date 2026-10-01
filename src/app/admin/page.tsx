import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function AdminOverviewPage() {
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

  const { count: courseCount } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })

  const { count: studentCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  const { count: codeCount } = await supabase
    .from('invitation_codes')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-600 mb-1">Courses</p>
          <p className="text-3xl font-bold text-gpa-navy">{courseCount ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-600 mb-1">Students</p>
          <p className="text-3xl font-bold text-gpa-navy">{studentCount ?? 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm text-gray-600 mb-1">Invitation Codes</p>
          <p className="text-3xl font-bold text-gpa-navy">{codeCount ?? 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="font-bold mb-3">Get Started</h2>
        <p className="text-sm text-gray-600 mb-4">
          Create your first course to begin building the catalog.
        </p>
        <Link
          href="/admin/courses"
          className="inline-block bg-gpa-green text-white px-4 py-2 rounded font-medium hover:opacity-90"
        >
          Go to Courses
        </Link>
      </div>
    </div>
  )
}
