'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Quiz = {
  id: string
  title: string
  topic_description: string | null
  time_limit_seconds: number | null
  max_attempts: number
  is_published: boolean
}

export default function QuizSettings({ quiz }: { quiz: Quiz }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function togglePublish() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !quiz.is_published }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error || 'Failed to update')
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg border space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            {quiz.is_published ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                Published
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                Draft
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Time limit: {quiz.time_limit_seconds
              ? `${Math.round(quiz.time_limit_seconds / 60)} minutes`
              : 'None'}
          </div>
          <div className="text-sm text-gray-600">
            Max attempts: {quiz.max_attempts}
          </div>
        </div>

        <button
          onClick={togglePublish}
          disabled={loading}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            quiz.is_published
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              : 'bg-gpa-green text-white hover:opacity-90'
          } disabled:opacity-50`}
        >
          {loading
            ? 'Updating...'
            : quiz.is_published
            ? 'Unpublish'
            : 'Publish Quiz'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
