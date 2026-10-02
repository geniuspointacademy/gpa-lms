'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function RedeemPage() {
  const router = useRouter()
  const supabase = createClient()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Could not redeem code')
      setLoading(false)
      return
    }

    setSuccess('Unlocked! Redirecting to your course...')
    setTimeout(() => {
      router.push(`/courses/${json.course_id}`)
      router.refresh()
    }, 1200)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gpa-navy mb-2">
          Redeem Access Code
        </h1>
        <p className="text-gray-600">
          Enter the code you received to unlock your course
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg border space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Your Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            placeholder="GPA-XXXXXX"
            className="w-full border rounded px-3 py-3 text-center font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
          <p className="text-xs text-gray-500 mt-1 text-center">
            Codes are not case-sensitive
          </p>
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
          disabled={loading || !code}
          className="w-full bg-gpa-green text-white py-3 rounded font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Redeeming...' : 'Redeem Code'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have a code?{' '}
          <Link href="/courses" className="text-gpa-green font-medium">
            Browse courses
          </Link>{' '}
          or message the admin on WhatsApp.
        </p>
      </form>
    </div>
  )
}
