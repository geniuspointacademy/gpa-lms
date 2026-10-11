'use client'

type Props = {
  courseTitle: string
  studentName?: string | null
  level?: number | null
  variant?: 'default' | 'compact'
}

export default function WhatsAppButton({
  courseTitle,
  studentName,
  level,
  variant = 'default',
}: Props) {
  const phone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || ''

  // Build the pre-filled message
  const lines: string[] = []

  if (courseTitle && courseTitle.trim().length > 0) {
    lines.push(`Hi GPA! I'd like access to "${courseTitle}".`)
  } else {
    lines.push(`Hi GPA! I'd like to get in touch.`)
  }

  const who = [
    studentName && studentName.trim().length > 0 ? studentName : null,
    level ? `Level ${level}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  if (who) {
    lines.push(`My name is ${who}.`)
  }

  const message = encodeURIComponent(lines.join('\n'))

  // api.whatsapp.com/send opens a DIRECT chat reliably on both mobile and desktop.
  // Format: https://api.whatsapp.com/send?phone=2347050376975&text=...
  const href = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`

  if (variant === 'compact') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
      >
        💬 Message Admin
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
    >
      💬 Message Admin on WhatsApp
    </a>
  )
}
