import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ACTION_LABELS: Record<string, string> = {
  'course.create': 'Created course',
  'course.update': 'Updated course',
  'course.delete': 'Deleted course',
  'quiz.create': 'Created quiz',
  'quiz.update': 'Updated quiz',
  'quiz.publish': 'Published quiz',
  'quiz.unpublish': 'Unpublished quiz',
  'quiz.delete': 'Deleted quiz',
  'question.create': 'Added question',
  'question.update': 'Edited question',
  'question.delete': 'Deleted question',
  'codes.generate': 'Generated codes',
  'level.approve': 'Approved level access',
  'level.reject': 'Rejected level access',
  'level.grant': 'Granted level access',
  'admin.promote': 'Promoted to admin',
  'admin.demote': 'Demoted from admin',
}

const ACTION_COLORS: Record<string, string> = {
  'course.create': 'bg-green-100 text-green-700',
  'course.update': 'bg-blue-100 text-blue-700',
  'course.delete': 'bg-red-100 text-red-700',
  'quiz.create': 'bg-green-100 text-green-700',
  'quiz.update': 'bg-blue-100 text-blue-700',
  'quiz.publish': 'bg-green-100 text-green-700',
  'quiz.unpublish': 'bg-gray-100 text-gray-700',
  'quiz.delete': 'bg-red-100 text-red-700',
  'question.create': 'bg-green-100 text-green-700',
  'question.update': 'bg-blue-100 text-blue-700',
  'question.delete': 'bg-red-100 text-red-700',
  'codes.generate': 'bg-purple-100 text-purple-700',
  'level.approve': 'bg-green-100 text-green-700',
  'level.reject': 'bg-red-100 text-red-700',
  'level.grant': 'bg-blue-100 text-blue-700',
  'admin.promote': 'bg-yellow-100 text-yellow-800',
  'admin.demote': 'bg-yellow-100 text-yellow-800',
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { admin?: string; action?: string }
}) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Build query
  let query = adminClient
    .from('admin_audit_logs')
    .select(`
      id,
      action,
      target_type,
      target_id,
      target_label,
      details,
      created_at,
      admin_id,
      users!inner ( email, full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (searchParams.admin) {
    query = query.eq('admin_id', searchParams.admin)
  }
  if (searchParams.action) {
    query = query.eq('action', searchParams.action)
  }

  const { data: logs } = await query

  // Get list of admins for filter
  const { data: admins } = await adminClient
    .from('users')
    .select('id, email, full_name')
    .eq('role', 'admin')
    .order('email')

  function timeAgo(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime()
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Activity Log</h2>
        <p className="text-sm text-gray-600">
          Every admin action on the platform, newest first.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border flex gap-3 flex-wrap items-center">
        <span className="text-sm font-medium text-gray-700">Filter:</span>

        <form className="flex gap-3 flex-wrap items-center">
          <select
            name="admin"
            defaultValue={searchParams.admin ?? ''}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">All admins</option>
            {(admins ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name || a.email}
              </option>
            ))}
          </select>

          <select
            name="action"
            defaultValue={searchParams.action ?? ''}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-gpa-navy text-white px-4 py-1.5 rounded text-sm font-medium hover:opacity-90"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Logs */}
      {!logs || logs.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center text-gray-600">
          No activity logged yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <ul className="divide-y">
            {logs.map((log: any) => {
              const label = ACTION_LABELS[log.action] || log.action
              const colorClass =
                ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'

              return (
                <li key={log.id} className="px-4 py-3 flex items-start gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${colorClass}`}
                  >
                    {label}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">
                        {log.users?.full_name || log.users?.email}
                      </span>{' '}
                      <span className="text-gray-600">
                        {log.target_label ? (
                          <>
                            → <strong>{log.target_label}</strong>
                          </>
                        ) : null}
                      </span>
                    </div>
                    {log.details && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {Object.entries(log.details)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 shrink-0">
                    {timeAgo(log.created_at)}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {logs && logs.length >= 200 && (
        <p className="text-xs text-gray-500 text-center">
          Showing latest 200 entries.
        </p>
      )}
    </div>
  )
}
