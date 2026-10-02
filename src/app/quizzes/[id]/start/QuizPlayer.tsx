'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import QuestionCard from './QuestionCard'

type Question = {
  id: string
  text: string
  options: string[]
  image_url: string | null
  order_index: number
  points: number
  hint: string | null
  topic_tag: string | null
}

type Props = {
  attemptId: string
  startedAt: string
  quiz: {
    id: string
    title: string
    courseTitle: string
    courseId: string
    timeLimitSeconds: number | null
  }
  questions: Question[]
}

export default function QuizPlayer({
  attemptId,
  startedAt,
  quiz,
  questions,
}: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const submittedRef = useRef(false)

  const total = questions.length
  const current = questions[currentIndex]
  const progress = ((currentIndex + 1) / total) * 100

  useEffect(() => {
    if (!quiz.timeLimitSeconds) return

    const startMs = new Date(startedAt).getTime()
    const deadlineMs = startMs + quiz.timeLimitSeconds * 1000

    const tick = () => {
      const remaining = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000))
      setTimeLeft(remaining)

      if (remaining === 0 && !submittedRef.current) {
        submittedRef.current = true
        handleSubmit(true)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, quiz.timeLimitSeconds])

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function selectAnswer(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
  }

  function next() {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function prev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  async function handleSubmit(auto = false) {
    if (submittedRef.current && !auto) return
    submittedRef.current = true
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          answers,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to submit')
        setSubmitting(false)
        submittedRef.current = false
        return
      }

      router.push(`/quizzes/${quiz.id}/results`)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
      submittedRef.current = false
    }
  }

  const answered = Object.keys(answers).length
  const isTimeLow = timeLeft !== null && timeLeft <= 60

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">
                {quiz.courseTitle}
              </p>
              <h1 className="font-bold truncate">{quiz.title}</h1>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-sm text-gray-600 text-right">
                <p>
                  Question {currentIndex + 1} of {total}
                </p>
                <p className="text-xs">{answered} answered</p>
              </div>

              {timeLeft !== null && (
                <div
                  className={`px-3 py-1 rounded font-mono font-bold ${
                    isTimeLow
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gpa-navy text-white'
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>
          </div>

          <div className="h-1 bg-gray-200 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gpa-green transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <QuestionCard
          question={current}
          index={currentIndex}
          total={total}
          selected={answers[current.id] ?? null}
          onSelect={(opt) => selectAnswer(current.id, opt)}
        />

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            className="px-5 py-2 rounded font-medium border hover:bg-white disabled:opacity-40"
          >
            ← Previous
          </button>

          {currentIndex < total - 1 ? (
            <button
              onClick={next}
              className="px-6 py-2 rounded font-medium bg-gpa-navy text-white hover:opacity-90"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-6 py-2 rounded font-medium bg-gpa-green text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
