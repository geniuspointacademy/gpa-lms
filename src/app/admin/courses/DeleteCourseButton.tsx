'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string
  courseTitle: string
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
        if (json.hasDependencies) {
          alert(
            `${json.error}\n\nClick OK, then Deactivate the course instead.`
          )
        } else {
          alert(`Delete failed: ${json.error}`)
        }
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      alert('Network error. Please try again.')
      setLoading(false)
    }
  }

  async function handleDeactivate() {
    const confirmed = window.confirm(
      `Deactivate "${courseTitle}"?\n\nStudents will no longer see it, but their access and codes stay intact.`
    )
    if (!confirmed) return

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      })

      if (!res.ok) {
        const json = await res.json()
        alert(`Deactivate failed: ${json.error}`)
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
        onClick={handleDeactivate}
        disabled={loading}
        className="text-xs border px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
      >
        Deactivate
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
