'use client

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteCourseButton({
  courseId,
  courseTitle,
  isActive,
}: {
  courseId: string
  courseTitle: string
  isActive: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${courseTitle}"?\n\nThis cannot be undone. If the course has students or codes, you'll be asked to deactivate it instead.`
    )
    if (!confirmed) return

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json.error || 'Delete failed')
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      alert('Network error. Please try again.')
      setLoading(false)
    }
  }

  async function handleToggleActive() {
    const action = isActive ? 'Deactivate' : 'Reactivate'
    const detail = isActive
      ? 'Students will no longer see it in the catalog, but their access stays intact.'
      : 'The course will appear again in the public catalog.'

    const confirmed = window.confirm(
      `${action} "${courseTitle}"?\n\n${detail}`
    )
    if (!confirmed) return

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json.error || `${action} failed`)
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      alert('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleToggleActive}
        disabled={loading}
        className={`text-xs px-3 py-1.5 rounded disabled:opacity-50 ${
          isActive
            ? 'border border-gray-300 hover:bg-gray-50'
            : 'bg-gpa-green text-white hover:opacity-90'
        }`}
      >
        {loading ? '...' : isActive ? 'Deactivate' : 'Reactivate'}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? '...' : 'Delete'}
      </button>
    </div>
  )
}
