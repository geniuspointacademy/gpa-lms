import Link from 'next/link'

type Course = {
  id: string
  title: string
  description: string | null
  level: number
  price: number
  currency: string
}

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="block bg-white p-5 rounded-lg border hover:border-gpa-green hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-lg text-gpa-navy leading-tight">
          {course.title}
        </h3>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded shrink-0">
          Level {course.level}
        </span>
      </div>

      {course.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {course.description}
        </p>
      )}

      <div className="text-sm text-gpa-green font-medium">
        View Course →
      </div>
    </Link>
  )
}
