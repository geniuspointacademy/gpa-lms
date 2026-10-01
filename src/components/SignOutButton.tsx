'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="bg-gpa-green hover:bg-gpa-green/90 px-3 sm:px-4 py-2 rounded font-medium transition-colors whitespace-nowrap"
    >
      Sign Out
    </button>
  )
}
