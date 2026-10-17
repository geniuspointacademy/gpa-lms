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
  shuffle_questions: boolean
}

export default function QuizSettings({ quiz }: { quiz: Quiz }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateQuiz(data: Partial<Quiz>) {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
      <div className="flex items-start justify-between gap-4 flex-wrap border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {quiz.is_published ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Published</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">Draft</span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Time limit: {quiz.time_limit_seconds ? `${Math.round(quiz.time_limit_seconds / 60)} minutes` : 'None'}
          </div>
          <div className="text-sm text-gray-600">
            Max attempts: {quiz.max_attempts}
          </div>
        </div>

        <button
          onClick={() => updateQuiz({ is_published: !quiz.is_published })}
          disabled={loading}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            quiz.is_published
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              : 'bg-gpa-green text-white hover:opacity-90'
          } disabled:opacity-50`}
        >
          {loading ? 'Updating...' : quiz.is_published ? 'Unpublish' : 'Publish Quiz'}
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-sm text-gray-800">Shuffle Questions</p>
          <p className="text-xs text-gray-500">Randomize question order for each student attempt.</p>
        </div>
        <button
          onClick={() => updateQuiz({ shuffle_questions: !quiz.shuffle_questions })}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            quiz.shuffle_questions ? 'bg-gpa-green' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              quiz.shuffle_questions ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">{error}</div>}
    </div>
  )
}
