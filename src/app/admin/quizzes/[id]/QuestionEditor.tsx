'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from './ImageUploader'

type Question = {
  id: string
  text: string
  options: string[]
  image_url: string | null
  order_index: number
  points: number
  hint: string | null
  topic_tag: string | null
  question_answers: {
    correct_answer: string[]
    explanation: string | null
  } | null
}

export default function QuestionEditor({
  quizId,
  initialQuestions,
}: {
  quizId: string
  initialQuestions: Question[]
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return
    const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {questions.length === 0 && !showForm && (
        <div className="bg-white p-6 rounded-lg border text-center text-gray-600">
          No questions yet. Click below to add the first one.
        </div>
      )}

      {questions.map((q, i) =>
        editingId === q.id ? (
          <QuestionForm
            key={q.id}
            quizId={quizId}
            existing={q}
            nextOrderIndex={q.order_index}
            onSuccess={(updated) => {
              setQuestions((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item))
              )
              setEditingId(null)
              router.refresh()
            }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <QuestionItem
            key={q.id}
            question={q}
            index={i + 1}
            onEdit={() => setEditingId(q.id)}
            onDelete={() => deleteQuestion(q.id)}
          />
        )
      )}

      {showForm ? (
        <QuestionForm
          quizId={quizId}
          nextOrderIndex={questions.length}
          onSuccess={(newQuestion) => {
            setQuestions((prev) => [...prev, newQuestion])
            setShowForm(false)
            router.refresh()
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gpa-green text-white py-3 rounded-lg font-medium hover:opacity-90"
          >
            + Add New Question
          </button>
        )
      )}
    </div>
  )
}

function QuestionItem({
  question,
  index,
  onEdit,
  onDelete,
}: {
  question: Question
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const correct = question.question_answers?.correct_answer || []
  const explanation = question.question_answers?.explanation || null
  const options = question.options || []

  return (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500">Q{index}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
              {question.points} pt{question.points !== 1 ? 's' : ''}
            </span>
            {question.topic_tag && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {question.topic_tag}
              </span>
            )}
          </div>

          <p className="font-medium mb-3">{question.text}</p>

          {question.image_url && (
            <img
              src={question.image_url}
              alt=""
              className="max-h-48 rounded border mb-3"
            />
          )}

          <ul className="space-y-1 text-sm">
            {options.map((opt, i) => {
              const isCorrect = correct.includes(opt)
              return (
                <li
                  key={i}
                  className={`flex items-center gap-2 ${
                    isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span className="w-5 h-5 flex items-center justify-center border rounded-full text-xs">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                  {isCorrect && (
                    <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                      Correct
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          {question.hint && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
              <span className="font-medium text-yellow-900">💡 Hint:</span>{' '}
              <span className="text-yellow-800">{question.hint}</span>
            </div>
          )}

          {explanation && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2 text-xs">
              <span className="font-medium text-blue-900">Explanation:</span>{' '}
              <span className="text-blue-800">{explanation}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0 flex-col">
          <button
            onClick={onEdit}
            className="text-sm bg-gpa-navy text-white px-3 py-1 rounded hover:opacity-90"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionForm({
  quizId,
  existing,
  nextOrderIndex,
  onSuccess,
  onCancel,
}: {
  quizId: string
  existing?: Question
  nextOrderIndex: number
  onSuccess: (q: Question) => void
  onCancel: () => void
}) {
  const isEdit = !!existing

  const [text, setText] = useState(existing?.text ?? '')
  const [options, setOptions] = useState(
    existing?.options?.length
      ? [...existing.options, '', '', '', ''].slice(0, Math.max(4, existing.options.length))
      : ['', '', '', '']
  )
  const [correctIndex, setCorrectIndex] = useState(() => {
    if (!existing) return 0
    const correct = existing.question_answers?.correct_answer?.[0]
    const idx = existing.options?.findIndex((o) => o === correct) ?? 0
    return idx >= 0 ? idx : 0
  })
  const [imageUrl, setImageUrl] = useState<string | null>(
    existing?.image_url ?? null
  )
  const [hint, setHint] = useState(existing?.hint ?? '')
  const [topicTag, setTopicTag] = useState(existing?.topic_tag ?? '')
  const [explanation, setExplanation] = useState(
    existing?.question_answers?.explanation ?? ''
  )
  const [points, setPoints] = useState(existing?.points ?? 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateOption(i: number, value: string) {
    const next = [...options]
    next[i] = value
    setOptions(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const filledOptions = options.filter((o) => o.trim().length > 0)
    if (filledOptions.length < 2) {
      setError('At least 2 options are required')
      setLoading(false)
      return
    }

    const correctAnswer = [options[correctIndex].trim()]

    const payload = {
      quiz_id: quizId,
      text,
      options: filledOptions,
      correct_answer: correctAnswer,
      image_url: imageUrl,
      order_index: nextOrderIndex,
      points,
      hint: hint.trim() || null,
      topic_tag: topicTag.trim() || null,
      explanation: explanation.trim() || null,
    }

    const url = isEdit
      ? `/api/admin/questions/${existing!.id}`
      : '/api/admin/questions'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Failed to save')
      setLoading(false)
      return
    }

    onSuccess(json.question)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg border space-y-4 border-gpa-green"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold">{isEdit ? 'Edit Question' : 'New Question'}</h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:underline"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Question</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={2}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Options (select the correct one)
        </label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                className="w-4 h-4"
              />
              <span className="w-5 text-sm font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image (optional)</label>
        <ImageUploader value={imageUrl} onChange={setImageUrl} />
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-medium text-gpa-navy">Optional learning aids</p>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600">
            💡 Hint
          </label>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600">
            📖 Explanation
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600">
            🏷️ Topic Tag
          </label>
          <input
            type="text"
            value={topicTag}
            onChange={(e) => setTopicTag(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
        </div>
      </div>

      <div className="w-32">
        <label className="block text-sm font-medium mb-1">Points</label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value) || 1)}
          min={1}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-gpa-green text-white px-6 py-2 rounded font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Saving...' : isEdit ? 'Update Question' : 'Save Question'}
      </button>
    </form>
  )
}
