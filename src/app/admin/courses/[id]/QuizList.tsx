'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Quiz = {
  id: string
  title: string
  topic_description: string | null
  time_limit_seconds: number | null
  max_attempts: number
  is_published: boolean
  created_at: string
}

export default function QuizList({
  quizzes,
  courseId,
}: {
  quizzes: Quiz[]
  courseId: string
}) {
  const router = useRouter()

  async function togglePublish(quizId: string, current: boolean) {
    await fetch(`/api/admin/quizzes/${quizId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !current }),
    })
    router.refresh()
  }

  if (quizzes.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border text-center text-gray-600">
        No quizzes yet. Create the first one above.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="bg-white p-4 rounded-lg border flex items-center justify-between gap-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold">{quiz.title}</h4>
              {quiz.is_published ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Published
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Draft
                </span>
              )}
            </div>
            {quiz.topic_description && (
              <p className="text-sm text-gray-600 truncate mt-1">
                {quiz.topic_description}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {quiz.time_limit_seconds
                ? `${Math.round(quiz.time_limit_seconds / 60)} min`
                : 'No time limit'}{' '}
              · {quiz.max_attempts} attempt
              {quiz.max_attempts > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/admin/quizzes/${quiz.id}`}
              className="text-sm bg-gpa-navy text-white px-3 py-1.5 rounded hover:opacity-90"
            >
              Edit
            </Link>
            <button
              onClick={() => togglePublish(quiz.id, quiz.is_published)}
              className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50"
            >
              {quiz.is_published ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
