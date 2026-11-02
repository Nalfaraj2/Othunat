import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Icon, type IconName } from '../brand/Icon'
import { getAppSettings } from '../services/adminService'
import { listMedicalPermissions, listMonthlyBalances, listPermissions } from '../services/permissionsService'
import type { MedicalPermission, MonthlyBalance, Permission } from '../types/database'

type Row =
  | { kind: 'permission'; data: Permission }
  | { kind: 'medical'; data: MedicalPermission }

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

interface MonthGroup {
  key: string // YYYY-MM
  year: number
  month: number
  rows: Row[]
}

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
  const [balances, setBalances] = useState<MonthlyBalance[]>([])
  const [maxPermissions, setMaxPermissions] = useState(4)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAppSettings()
      .then((settings) => setMaxPermissions(settings.max_permissions))
      .catch(() => {})
    listMonthlyBalances()
      .then(setBalances)
      .catch(() => {})
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

  const groups: MonthGroup[] = []
  for (const row of rows) {
    const key = row.data.permission_date.slice(0, 7)
    let group = groups[groups.length - 1]
    if (!group || group.key !== key) {
      const [year, month] = key.split('-').map(Number)
      group = { key, year, month, rows: [] }
      groups.push(group)
    }
    group.rows.push(row)
  }

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

        {groups.map((group) => {
          const balance = balances.find((b) => b.balance_year === group.year && b.balance_month === group.month)
          const total = balance?.total_minutes ?? 720
          const used = balance?.used_minutes ?? 0
          const count = balance?.permissions_count ?? 0
          return (
            <section key={group.key} className="space-y-3">
              <div className="space-y-2 pt-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
                    {MONTH_NAMES[group.month - 1]} {group.year}
                  </h2>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full bg-white"
                    style={{ color: 'var(--idh-ink-2)' }}
                  >
                    {count} من {maxPermissions} أذونات
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--idh-silver)' }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={Math.min(used, total)}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (used / total) * 100)}%`, background: 'var(--idh-navy-900)' }}
                  />
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--idh-ink-2)' }}>
                  <span>
                    مستخدم <b style={{ color: 'var(--idh-navy-900)' }}>{used}</b> د
                  </span>
                  <span>
                    متبقي <b style={{ color: 'var(--idh-navy-900)' }}>{Math.max(0, total - used)}</b> د
                  </span>
                </div>
              </div>

              <ul className="space-y-3">
                {group.rows.map((row) => (
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
            </section>
          )
        })}
      </div>
    </AppShell>
  )
}
