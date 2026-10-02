'use client'

import { useState, useEffect } from 'react'

type Course = {
  id: string
  title: string
  level: number
}

type InvitationCode = {
  id: string
  code_string: string
  course_id: string
  is_used: boolean
  used_by: string | null
  used_at: string | null
  created_at: string
}

export default function CodeGenerator({ courses }: { courses: Course[] }) {
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [quantity, setQuantity] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [loadingCodes, setLoadingCodes] = useState(false)

  useEffect(() => {
    if (!selectedCourse) {
      setCodes([])
      return
    }
    setLoadingCodes(true)
    fetch(`/api/admin/codes?course_id=${selectedCourse}`)
      .then((r) => r.json())
      .then((data) => {
        setCodes(data.codes ?? [])
        setLoadingCodes(false)
      })
      .catch(() => setLoadingCodes(false))
  }, [selectedCourse])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourse) {
      setError('Please select a course')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/admin/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: selectedCourse,
        quantity,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Failed to generate codes')
      setLoading(false)
      return
    }

    setSuccess(`Generated ${json.codes.length} codes`)
    setCodes((prev) => [...json.codes, ...prev])
    setLoading(false)
  }

  function downloadCSV() {
    if (codes.length === 0) return

    const headers = ['Code', 'Status', 'Used By', 'Used At', 'Created At']
    const rows = codes.map((c) => [
      c.code_string,
      c.is_used ? 'Used' : 'Unused',
      c.used_by ?? '',
      c.used_at ?? '',
      c.created_at,
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gpa-codes-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedCourseObj = courses.find((c) => c.id === selectedCourse)
  const unused = codes.filter((c) => !c.is_used).length
  const used = codes.length - unused

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleGenerate}
        className="bg-white p-6 rounded-lg border space-y-4"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
            >
              <option value="">— Select a course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.level}] {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              min={1}
              max={200}
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
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedCourse}
          className="bg-gpa-green text-white px-6 py-2 rounded font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Generating...' : `Generate ${quantity} Code${quantity > 1 ? 's' : ''}`}
        </button>
      </form>

      {selectedCourse && (
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-bold">
                Codes for {selectedCourseObj?.title}
              </h3>
              <p className="text-sm text-gray-600">
                {codes.length} total · {unused} unused · {used} used
              </p>
            </div>
            {codes.length > 0 && (
              <button
                onClick={downloadCSV}
                className="bg-gpa-navy text-white px-4 py-2 rounded font-medium hover:opacity-90 text-sm"
              >
                ⬇ Download CSV
              </button>
            )}
          </div>

          {loadingCodes ? (
            <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
              Loading codes...
            </div>
          ) : codes.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border text-center text-gray-600">
              No codes for this course yet. Generate some above.
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Code</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium hidden md:table-cell">
                      Used By
                    </th>
                    <th className="text-left px-4 py-2 font-medium hidden md:table-cell">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => (
                    <tr key={code.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono font-medium">
                        {code.code_string}
                      </td>
                      <td className="px-4 py-2">
                        {code.is_used ? (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            Used
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Unused
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-600 hidden md:table-cell">
                        {code.used_by ? code.used_by.slice(0, 8) + '...' : '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs hidden md:table-cell">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
