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
      `Delete "${courseTitle}"?\n\nThis cannot be undone.`
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

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Delete'}
    </button>
  )
}
