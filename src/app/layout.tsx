import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import SignOutButton from '@/components/SignOutButton'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import './globals.css'

export const metadata: Metadata = {
  title: 'Genius Point Academy — Your Academic Breakthrough Starts Here',
  description:
    'Structured courses, timed assessments, and honest progress tracking.',
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

  let role = 'student'
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    role = data?.role ?? 'student'
  }

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-gpa-navy text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Image
                src="/logo.png"
                alt="Genius Point Academy"
                width={44}
                height={44}
                priority
                className="rounded"
              />
              <span className="font-bold text-base leading-tight hidden sm:block">
                Genius Point
                <br />
                <span className="text-gpa-gold">Academy</span>
              </span>
            </Link>

            <nav className="flex gap-1 sm:gap-3 text-sm items-center">
              <Link
                href="/courses"
                className="px-3 py-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors whitespace-nowrap"
              >
                Courses
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors whitespace-nowrap"
                  >
                    Dashboard
                  </Link>
                  {role === 'admin' && (
                    <Link
                      href="/admin"
                      className="px-3 py-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors whitespace-nowrap"
                    >
                      Admin
                    </Link>
                  )}
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-2 rounded hover:bg-white hover:bg-opacity-10 transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gpa-gold text-gpa-navy px-4 py-2 rounded font-semibold whitespace-nowrap text-sm hover:opacity-90"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-gpa-navy text-white mt-16">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Image
                    src="/logo.png"
                    alt="GPA"
                    width={36}
                    height={36}
                    className="rounded"
                  />
                  <span className="font-bold text-lg">
                    Genius Point{' '}
                    <span className="text-gpa-gold">Academy</span>
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  A learning community built for academic excellence.
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-3 text-gpa-gold text-sm uppercase tracking-wide">
                  Quick Links
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>
                    <Link
                      href="/courses"
                      className="hover:text-gpa-gold transition-colors"
                    >
                      Courses
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="hover:text-gpa-gold transition-colors"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/redeem"
                      className="hover:text-gpa-gold transition-colors"
                    >
                      Redeem Code
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-3 text-gpa-gold text-sm uppercase tracking-wide">
                  Get in Touch
                </h4>
                <p className="text-sm text-gray-300">
                  Have a question or need an access code? Tap the green button
                  at the bottom-right of any page.
                </p>
              </div>
            </div>

            <div className="border-t border-white border-opacity-10 mt-8 pt-6 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} Genius Point Academy
            </div>
          </div>
        </footer>

        {/* Floating WhatsApp button — appears on every page */}
        <FloatingWhatsApp />
      </body>
    </html>
  )
}
