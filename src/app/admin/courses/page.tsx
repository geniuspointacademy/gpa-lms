import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CourseForm from './CourseForm'

export default async function AdminCoursesPage() {
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

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold mb-4">Create New Course</h2>
        <CourseForm />
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">
          All Courses ({courses?.length ?? 0})
        </h2>

        {!courses || courses.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border text-center text-gray-600">
            No courses yet. Create your first one above.
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white p-4 rounded-lg border flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{course.title}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      Level {course.level}
                    </span>
                    {!course.is_active && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {course.description}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-600 shrink-0">
                  ₦{Number(course.price).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
