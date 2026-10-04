import Link from 'next/link'
import { requireAdmin } from '@/lib/auth-guard'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireAdmin()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gpa-navy">Admin Panel</h1>
          <p className="text-sm text-gray-600">
            Signed in as {profile.email}
          </p>
        </div>
      </div>

      <nav className="flex gap-2 mb-8 border-b overflow-x-auto">
        <Link
          href="/admin"
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-t whitespace-nowrap"
        >
          Overview
        </Link>
        <Link
          href="/admin/courses"
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-t whitespace-nowrap"
        >
          Courses
        </Link>
        <Link
          href="/admin/codes"
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-t whitespace-nowrap"
        >
          Codes
        </Link>
        <Link
          href="/admin/students"
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-t whitespace-nowrap"
        >
          Students
        </Link>
        <Link
          href="/admin/exports"
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-t whitespace-nowrap"
        >
          Exports
        </Link>
        <Link
          href="/admin/activity"
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-t whitespace-nowrap"
        >
          Activity
        </Link>
      </nav>

      {children}
    </div>
  )
}
