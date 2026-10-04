'use client'

import { useState } from 'react'

type Course = {
  id: string
  title: string
  level: number
}

export default function ExportsPage() {
  const [courseId, setCourseId] = useState('')
  const [level, setLevel] = useState('')

  function downloadGlobal() {
    const params = new URLSearchParams()
    if (courseId) params.set('course_id', courseId)
    if (level) params.set('level', level)
    window.location.href = `/api/admin/exports/progress?${params.toString()}`
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold mb-1">Export Progress</h2>
        <p className="text-sm text-gray-600">
          Download student progress as CSV. Open in Excel, Google Sheets, or
          Numbers.
        </p>
      </div>

      <section className="bg-white p-6 rounded-lg border space-y-4">
        <h3 className="font-bold">Global Export</h3>
        <p className="text-sm text-gray-600">
          Every student, every quiz, all scores. Optionally filter by course
          or level.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Filter by Level (optional)
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
            >
              <option value="">All levels</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
              <option value="500">500 Level</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
          Note: to filter by course, first open the course detail page and use
          its export option — or use the CSV and filter in your spreadsheet.
        </div>

        <button
          onClick={downloadGlobal}
          className="bg-gpa-green text-white px-6 py-3 rounded font-medium hover:opacity-90"
        >
          ⬇ Download Global Progress CSV
        </button>
      </section>

      <section className="bg-white p-6 rounded-lg border space-y-3">
        <h3 className="font-bold">Single Student Export</h3>
        <p className="text-sm text-gray-600">
          For one student&apos;s full report:
        </p>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>
            Go to{' '}
            <a
              href="/admin/students"
              className="text-gpa-green underline hover:no-underline"
            >
              Students
            </a>
          </li>
          <li>Click &quot;View Details&quot; on a student</li>
          <li>Click &quot;⬇ Download CSV&quot; at the top of their page</li>
        </ol>
      </section>

      <section className="bg-white p-6 rounded-lg border space-y-3">
        <h3 className="font-bold">What&apos;s in the export</h3>
        <p className="text-sm text-gray-600">The CSV contains:</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Student name and email</li>
          <li>Student level</li>
          <li>Course title</li>
          <li>Quiz title</li>
          <li>Best score and latest score</li>
          <li>Attempt count</li>
          <li>Last attempt date</li>
        </ul>
        <p className="text-xs text-gray-500 pt-2">
          More export formats (Excel .xlsx, PDF) coming soon. CSV opens fine in
          Excel and Google Sheets.
        </p>
      </section>
    </div>
  )
}
