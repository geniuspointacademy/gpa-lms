import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Genius Point Academy"
                width={48}
                height={48}
                className="rounded"
              />
              <span className="font-bold text-lg hidden sm:inline">
                Genius Point Academy
              </span>
            </Link>
            <nav className="flex gap-6 text-sm items-center">
              <Link href="/courses">Courses</Link>
              <Link
                href="/login"
                className="bg-gpa-green px-4 py-2 rounded font-medium"
              >
                Sign In
              </Link>
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
