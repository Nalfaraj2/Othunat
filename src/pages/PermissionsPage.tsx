import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Icon, type IconName } from '../brand/Icon'
import { listMedicalPermissions, listPermissions } from '../services/permissionsService'
import type { MedicalPermission, Permission } from '../types/database'

type Row =
  | { kind: 'permission'; data: Permission }
  | { kind: 'medical'; data: MedicalPermission }

const TYPE_LABEL: Record<Permission['permission_type'], string> = {
  morning: 'إذن صباحي',
  end_of_day: 'إذن آخر الدوام',
}
const TYPE_ICON: Record<Permission['permission_type'], IconName> = {
  morning: 'calendar',
  end_of_day: 'duration',
}

const hhmm = (t: string) => t.slice(0, 5)

function timesLabel(p: Permission): string {
  if (p.permission_type === 'morning') {
    return p.work_start_time
      ? `بداية الدوام ${hhmm(p.work_start_time)} · التوقيع ${hhmm(p.entry_time)}`
      : `التوقيع ${hhmm(p.entry_time)}`
  }
  return `الدخول ${hhmm(p.entry_time)} · الخروج ${p.exit_time ? hhmm(p.exit_time) : '—'}`
}

export default function PermissionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listPermissions(), listMedicalPermissions()])
      .then(([permissions, medical]) => {
        const merged: Row[] = [
          ...permissions.map((data): Row => ({ kind: 'permission', data })),
          ...medical.map((data): Row => ({ kind: 'medical', data })),
        ].sort((a, b) => b.data.permission_date.localeCompare(a.data.permission_date))
        setRows(merged)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
          سجل الأذونات
        </h1>

        {loading && (
          <p className="text-sm" style={{ color: 'var(--idh-ink-2)' }}>
            ...جارٍ التحميل
          </p>
        )}

        {!loading && rows.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--idh-ink-2)' }}>
            ما فيه أذونات مسجّلة بعد
          </p>
        )}

        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.data.id}
              className="bg-white p-4"
              style={{ borderRadius: 'var(--idh-r-md)', boxShadow: 'var(--idh-shadow-1)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 flex items-center justify-center rounded-full"
                    style={{ background: 'var(--idh-mist)', color: 'var(--idh-navy-900)' }}
                  >
                    <Icon name={row.kind === 'medical' ? 'employee' : TYPE_ICON[row.data.permission_type]} width={18} height={18} />
                  </span>
                  <div>
                    <div className="text-sm font-bold">
                      {row.kind === 'medical' ? 'إذن طبي' : TYPE_LABEL[row.data.permission_type]}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--idh-ink-2)' }}>
                      {row.data.permission_date}
                    </div>
                  </div>
                </div>

                {row.kind === 'permission' ? (
                  <span className="text-sm font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
                    {row.data.duration_minutes} د
                  </span>
                ) : (
                  <span className="idh-chip idh-chip--approved">طبي</span>
                )}
              </div>

              {row.kind === 'permission' && (
                <div
                  className="mt-3 pt-3 flex items-center justify-between border-t"
                  style={{ borderColor: 'var(--idh-mist)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--idh-ink-2)' }}>
                    {timesLabel(row.data)}
                  </span>
                  {row.data.status === 'active' && (
                    <Link
                      to={`/permissions/${row.data.id}/edit`}
                      className="idh-btn idh-btn--secondary idh-btn--sm"
                      aria-label="تعديل الإذن"
                    >
                      <Icon name="edit" />
                      <span>تعديل</span>
                    </Link>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}
