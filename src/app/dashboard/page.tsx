'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

type Profile = {
  email: string
  full_name: string | null
  level: number
  role: string
}

type EnrolledCourse = {
  id: string
  title: string
  description: string | null
  level: number
  access_method: string
  granted_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: prof } = await supabase
        .from('users')
        .select('email, full_name, level, role')
        .eq('id', user.id)
        .single()

      if (prof) setProfile(prof)

      // Fetch enrolled courses
      const { data: access } = await supabase
        .from('user_course_access')
        .select(`
          access_method,
          granted_at,
          courses (
            id,
            title,
            description,
            level
          )
        `)
        .eq('user_id', user.id)

      if (access) {
        const mapped: EnrolledCourse[] = access
          .map((a: any) => {
            const c = a.courses
            if (!c) return null
            return {
              id: c.id,
              title: c.title,
              description: c.description,
              level: c.level,
              access_method: a.access_method,
              granted_at: a.granted_at,
            }
          })
          .filter(Boolean) as EnrolledCourse[]

        setCourses(mapped)
      }

      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <p className="text-red-600">Could not load your account.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gpa-navy mb-2">
          Welcome{profile.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="text-gray-600">
          {profile.email} · Level {profile.level} · {profile.role}
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">
          My Courses ({courses.length})
        </h2>

        {courses.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border text-center">
            <p className="text-gray-600 mb-4">
              You haven&apos;t enrolled in any courses yet.
            </p>
            <Link
              href="/courses"
              className="inline-block bg-gpa-green text-white px-5 py-2 rounded font-medium hover:opacity-90"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}/learn`}
                className="block bg-white p-5 rounded-lg border hover:border-gpa-green hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gpa-navy text-white px-2 py-0.5 rounded">
                    Level {course.level}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    {course.access_method === 'code' ? '🎟️ Code' : '✓ Enrolled'}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                )}
                <p className="text-sm text-gpa-green font-medium mt-3">
                  Continue →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
