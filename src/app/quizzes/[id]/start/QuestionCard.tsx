'use client'

import { useState } from 'react'

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
  question: Question
  index: number
  total: number
  selected: string | null
  onSelect: (option: string) => void
}

export default function QuestionCard({
  question,
  selected,
  onSelect,
}: Props) {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="bg-white rounded-lg border p-6">
      {question.topic_tag && (
        <div className="text-xs text-gray-500 mb-3">
          Topic: {question.topic_tag}
        </div>
      )}

      <p className="text-lg font-medium mb-5">{question.text}</p>

      {question.image_url && (
        <img
          src={question.image_url}
          alt="Question"
          className="max-h-80 rounded border mb-5"
        />
      )}

      <ul className="space-y-2">
        {question.options.map((opt, i) => {
          const isSelected = selected === opt
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelect(opt)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded border transition-colors ${
                  isSelected
                    ? 'border-gpa-green bg-green-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                    isSelected
                      ? 'bg-gpa-green text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {question.hint && (
        <div className="mt-5">
          {!showHint ? (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-sm text-gpa-navy underline hover:no-underline"
            >
              💡 Need a hint?
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
              <p className="font-medium text-yellow-900 mb-1">💡 Hint</p>
              <p className="text-yellow-800">{question.hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
