'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [level, setLevel] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          level,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Check your email to confirm your account.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gpa-navy mb-2">Create your account</h1>
      <p className="text-gray-600 mb-8">Join Genius Point Academy</p>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
          />
          <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gpa-green"
          >
            <option value={100}>100 Level</option>
            <option value={200}>200 Level</option>
            <option value={300}>300 Level</option>
            <option value={400}>400 Level</option>
            <option value={500}>500 Level</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gpa-green text-white py-2 rounded font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-gpa-green font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
