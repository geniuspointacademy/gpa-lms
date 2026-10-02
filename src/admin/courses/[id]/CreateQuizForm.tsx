'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateQuizForm({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [maxAttempts, setMaxAttempts] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await fetch('/api/admin/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        title,
        topic_description: description,
        time_limit_seconds: timeLimit ? Number(timeLimit) * 60 : null,
        max_attempts: Number(maxAttempts) || 1,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Failed to create quiz')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTitle('')
    setDescription('')
    setTimeLimit('')
    setMaxAttempts('1')
    setLoading(false)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg border space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Quiz Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Quiz 1 — Newton's Laws"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Topic Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What does this quiz cover?"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Time Limit (minutes, optional)
          </label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            min={1}
            placeholder="Leave empty for no limit"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Max Attempts
          </label>
          <input
            type="number"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            min={1}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded">
          Quiz created! Add questions to it below.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-gpa-green text-white px-6 py-2 rounded font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Quiz'}
      </button>
    </form>
  )
}
