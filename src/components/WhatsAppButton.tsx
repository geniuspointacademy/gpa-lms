'use client'

type Props = {
  courseTitle: string
  studentName?: string | null
  level?: number | null
}

export default function WhatsAppButton({
  courseTitle,
  studentName,
  level,
}: Props) {
  const phone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || ''

  const lines = [`Hi GPA! I'd like access to "${courseTitle}".`]

  if (studentName || level) {
    const who = [studentName, level ? `Level ${level}` : null]
      .filter(Boolean)
      .join(', ')
    lines.push(`My name is ${who}.`)
  }

  const message = encodeURIComponent(lines.join('\n'))
  const href = `https://wa.me/${phone}?text=${message}`

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
