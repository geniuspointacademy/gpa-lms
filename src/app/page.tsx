import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <section className="text-center mb-20">
        <h1 className="text-4xl md:text-6xl font-bold text-gpa-navy mb-6">
          Your academic breakthrough
          <br />
          starts here.
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
          A learning community built for academic excellence — structured
          courses, timed assessments, and honest progress tracking.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/courses"
            className="bg-gpa-green text-white px-6 py-3 rounded-lg font-medium hover:opacity-90"
          >
            Browse Courses
          </Link>
          <Link
            href="/signup"
            className="bg-white border-2 border-gpa-navy text-gpa-navy px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
          >
            Sign Up Free
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 mb-20">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-bold text-lg mb-2">📚 Structured Courses</h3>
          <p className="text-gray-600 text-sm">
            Level-based content that meets you where you are.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-bold text-lg mb-2">⏱️ Timed Assessments</h3>
          <p className="text-gray-600 text-sm">
            Exam-style quizzes that build real confidence.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-bold text-lg mb-2">📊 Honest Progress</h3>
          <p className="text-gray-600 text-sm">
            Scores and history you can actually trust.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-lg border p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to begin?</h2>
        <p className="text-gray-600 mb-6">
          Have an access code, or need one? We're one message away.
        </p>
        <Link
          href="/signup"
          className="bg-gpa-green text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 inline-block"
        >
          Create Your Account
        </Link>
      </section>
    </div>
  )
}
