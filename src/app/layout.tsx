import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Genius Point Academy — Online Assessments',
  description:
    'Your academic breakthrough starts here. Structured courses, real assessments, and honest progress tracking.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  let fullName: string | null = null
  let role: string = 'student'

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    fullName = data?.full_name ?? null
    role = data?.role ?? 'student'
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-gpa-navy text-white">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo.png"
                alt="Genius Point Academy"
                width={40}
                height={40}
                priority
                className="rounded"
              />
              <span className="font-bold text-sm leading-tight">
                Genius Point
                <br />
                Academy
              </span>
            </Link>

            <nav className="flex gap-3 sm:gap-6 text-sm items-center shrink-0">
              <Link
                href="/courses"
                className="hover:text-gpa-gold transition-colors whitespace-nowrap"
              >
                Courses
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hover:text-gpa-gold transition-colors whitespace-nowrap"
                  >
                    Dashboard
                  </Link>
                  {role === 'admin' && (
                    <Link
                      href="/admin"
                      className="hover:text-gpa-gold transition-colors whitespace-nowrap"
                    >
                      Admin
                    </Link>
                  )}
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="bg-gpa-green hover:bg-gpa-green/90 px-3 sm:px-4 py-2 rounded font-medium transition-colors whitespace-nowrap"
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hover:text-gpa-gold transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gpa-green hover:bg-gpa-green/90 px-3 sm:px-4 py-2 rounded font-medium transition-colors whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-gray-100 border-t mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© 2026 Genius Point Academy</p>
            <p>A learning community built for academic excellence.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
