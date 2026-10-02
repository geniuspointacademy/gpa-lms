import { createClient } from '@supabase/supabase-js'
import CourseCard from '@/components/CourseCard'

type Course = {
  id: string
  title: string
  description: string | null
  level: number
  price: number
  currency: string
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function CoursesPage() {
  // Public client — uses anon key (RLS allows reading active courses)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, level, price, currency')
    .eq('is_active', true)
    .order('level', { ascending: true })
    .order('title', { ascending: true })

  const grouped = (courses ?? []).reduce<Record<number, Course[]>>(
    (acc, c) => {
      if (!acc[c.level]) acc[c.level] = []
      acc[c.level].push(c)
      return acc
    },
    {}
  )

  const levels = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gpa-navy mb-3">
          Course Catalog
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Structured courses built for exam preparation and academic mastery.
          Browse by level and explore what's available.
        </p>
      </div>

      {levels.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border text-center text-gray-600">
          <p className="text-lg mb-2">No courses available yet</p>
          <p className="text-sm">
            New courses are being added. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {levels.map((level) => (
            <section key={level}>
              <h2 className="text-2xl font-bold text-gpa-navy mb-4">
                {level} Level
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[level].map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
