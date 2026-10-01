export default function CoursesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gpa-navy mb-6">Courses</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-bold mb-2">Sample Course</h3>
          <p className="text-gray-600 text-sm">
            Courses from the database will appear here once we connect Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}
