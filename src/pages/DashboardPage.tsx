import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { IdhFab } from '../brand/Button'
import { Icon } from '../brand/Icon'
import { getMyFullName } from '../services/authService'
import { getMonthlyBalance, listPermissions } from '../services/permissionsService'
import type { MonthlyBalance, Permission } from '../types/database'

const today = new Date()

// "نورا صلاح العبدالله" -> "نورا العبدالله" (first + last word); a single word stays as is.
function shortName(fullName: string | null): string | null {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1]}`
}
const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState<MonthlyBalance | null>(null)
  const [recent, setRecent] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    getMyFullName().then((n) => setName(shortName(n))).catch(() => {})
    Promise.all([getMonthlyBalance(today.getFullYear(), today.getMonth() + 1), listPermissions()])
      .then(([b, list]) => {
        setBalance(b)
        setRecent(list.slice(0, 3))
      })
      .finally(() => setLoading(false))
  }, [])

  const usedMinutes = balance?.used_minutes ?? 0
  const totalMinutes = balance?.total_minutes ?? 720
  const remaining = totalMinutes - usedMinutes
  const permissionsCount = balance?.permissions_count ?? 0
  const overBudget = usedMinutes > totalMinutes
  const pct = Math.min(100, (usedMinutes / totalMinutes) * 100)

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
            {name ? `أهلاً ${name}` : 'أهلاً بك'} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--idh-ink-2)' }}>
            {MONTH_NAMES[today.getMonth()]} {today.getFullYear()}
          </p>
        </div>

        <div
          className="p-5 text-white space-y-3"
          style={{ background: 'var(--idh-navy-900)', borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-2)' }}
        >
          <div className="flex justify-between items-center text-sm opacity-80">
            <span>الرصيد المتبقي هذا الشهر</span>
            <span className="flex items-center gap-1">
              <Icon name="request-leave" width={16} height={16} />
              {permissionsCount} / 4 أذونات
            </span>
          </div>

          <div className="text-3xl font-extrabold" style={{ color: overBudget ? '#FF8A8A' : '#fff' }}>
            {loading ? '...' : `${remaining} دقيقة`}
            {overBudget && ' (عجز)'}
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.18)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: overBudget ? '#FF8A8A' : '#fff' }}
            />
          </div>
          <div className="text-xs opacity-70">
            مستخدم {usedMinutes} من {totalMinutes} دقيقة (12 ساعة)
          </div>
        </div>

        <div
          className="bg-white p-4"
          style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">آخر الأذونات</h2>
            <Link to="/permissions" className="text-sm font-bold" style={{ color: 'var(--idh-navy-500)' }}>
              عرض الكل
            </Link>
          </div>

          <ul className="space-y-3">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Icon name={p.permission_type === 'morning' ? 'calendar' : 'duration'} width={18} height={18} style={{ color: 'var(--idh-navy-500)' }} />
                  {p.permission_type === 'morning' ? 'إذن صباحي' : 'إذن آخر الدوام'} — {p.permission_date}
                </span>
                <span className="font-bold">{p.duration_minutes} د</span>
              </li>
            ))}
            {!loading && recent.length === 0 && (
              <li className="text-sm" style={{ color: 'var(--idh-ink-2)' }}>
                ما فيه أذونات هالشهر بعد
              </li>
            )}
          </ul>
        </div>
      </div>

      <IdhFab
        aria-label="إضافة إذن"
        icon={<Icon name="add" />}
        onClick={() => navigate('/permissions/new')}
        className="fixed left-5 bottom-24"
      />
    </AppShell>
  )
}
