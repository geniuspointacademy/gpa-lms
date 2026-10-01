'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

type Profile = {
  email: string
  full_name: string | null
  level: number
  role: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('email, full_name, level, role')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-red-600">Could not load your profile.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gpa-navy mb-2">
        Welcome{profile.full_name ? `, ${profile.full_name}` : ''}!
      </h1>
      <p className="text-gray-600 mb-8">Your dashboard</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="font-bold mb-3">Your Account</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Email</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Level</dt>
              <dd className="font-medium">{profile.level} Level</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Role</dt>
              <dd className="font-medium capitalize">{profile.role}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="font-bold mb-3">Your Courses</h2>
          <p className="text-sm text-gray-600">
            You haven&apos;t enrolled in any courses yet. Browse the catalog to get started.
          </p>
        </div>
      </div>
    </div>
  )
}
