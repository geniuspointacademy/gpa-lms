import { createClient } from '@supabase/supabase-js'

type AuditAction =
  | 'course.create'
  | 'course.update'
  | 'course.delete'
  | 'quiz.create'
  | 'quiz.update'
  | 'quiz.publish'
  | 'quiz.unpublish'
  | 'quiz.delete'
  | 'question.create'
  | 'question.update'
  | 'question.delete'
  | 'codes.generate'
  | 'level.approve'
  | 'level.reject'
  | 'level.grant'
  | 'admin.promote'
  | 'admin.demote'

type LogOptions = {
  adminId: string
  action: AuditAction
  targetType?: string
  targetId?: string
  targetLabel?: string
  details?: Record<string, any>
}

/**
 * Log an admin action. Never throws — failures are silent so they don't
 * break the caller.
 */
export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  targetLabel,
  details,
}: LogOptions) {
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    await adminClient.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      target_label: targetLabel ?? null,
      details: details ?? null,
    })
  } catch (err) {
    // Silent fail — audit logging should never break the main action
    console.error('Audit log failed:', err)
  }
}
