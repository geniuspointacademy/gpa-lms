import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Genius Point Academy — Online Assessments',
  description:
    'Your academic breakthrough starts here. Structured courses, real assessments, and honest progress tracking.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-gpa-navy text-white">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-bold text-xl">
              Genius Point Academy
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/courses">Courses</Link>
              <Link href="/home">Dashboard</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-gray-100 border-t mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex items-center justify-between">
            <p>© 2026 Genius Point Academy</p>
            <p>A learning community built for academic excellence.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
