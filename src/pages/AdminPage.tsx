import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { IdhButton } from '../brand/Button'
import {
  AdminServiceError,
  getAppSettings,
  isCurrentUserAdmin,
  listAllReviews,
  listAllSubscriptions,
  updateAppSettings,
  type AdminReviewRow,
  type AdminSubscriptionRow,
  type AppSettings,
} from '../services/adminService'

type Tab = 'settings' | 'subscriptions' | 'reviews' | 'errors'
const TABS: { key: Tab; label: string }[] = [
  { key: 'settings', label: 'الإعدادات' },
  { key: 'subscriptions', label: 'الاشتراكات' },
  { key: 'reviews', label: 'التقييمات' },
  { key: 'errors', label: 'الأخطاء' },
]

const inputStyle = { borderRadius: 'var(--idh-r-md)', borderColor: 'var(--idh-silver)' }
const labelStyle = { color: 'var(--idh-ink-2)' }

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('settings')

  useEffect(() => {
    isCurrentUserAdmin().then(setAllowed)
  }, [])

  if (allowed === false) return <Navigate to="/" replace />
  if (allowed === null) return null

  return (
    <AppShell>
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
          لوحة الأدمن
        </h1>

        <div className="idh-seg w-full">
          {TABS.map((t) => (
            <button key={t.key} type="button" className="flex-1" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'settings' && <SettingsTab />}
        {tab === 'subscriptions' && <SubscriptionsTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'errors' && <ErrorsTab />}
      </div>
    </AppShell>
  )
}

function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAppSettings().then(setSettings).catch(() => {})
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setMessage(null)
    try {
      await updateAppSettings(settings)
      setMessage({ type: 'success', text: 'تم حفظ الإعدادات' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof AdminServiceError ? err.message : 'حدث خطأ غير متوقع' })
    } finally {
      setSaving(false)
    }
  }

  if (!settings) return <p className="text-sm" style={labelStyle}>...جارٍ التحميل</p>

  const field = (key: keyof AppSettings, label: string, type: 'time' | 'number') => (
    <label className="block">
      <span className="text-sm font-bold" style={labelStyle}>{label}</span>
      <input
        type={type}
        className="mt-1 w-full p-3 border outline-none"
        style={inputStyle}
        value={settings[key] as string | number}
        onChange={(e) => setSettings({ ...settings, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
      />
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 space-y-4" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}>
      {field('standard_start', 'بداية الدوام الرسمي', 'time')}
      {field('shift_length_minutes', 'طول الدوام (بالدقائق)', 'number')}
      {field('flex_floor', 'أقل وقت دخول لحساب الدوام المرن', 'time')}
      {field('flex_ceiling', 'أعلى وقت دخول لحساب الدوام المرن', 'time')}
      {field('total_monthly_minutes', 'إجمالي دقائق الإذن الشهري', 'number')}
      {field('max_permissions', 'الحد الأقصى لعدد الأذونات شهريًا', 'number')}

      {message && (
        <p className="text-sm font-bold" style={{ color: message.type === 'error' ? 'var(--idh-rejected)' : 'var(--idh-approved)' }}>
          {message.text}
        </p>
      )}

      <IdhButton type="submit" variant="primary" block loading={saving}>
        حفظ
      </IdhButton>
    </form>
  )
}

function SubscriptionsTab() {
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllSubscriptions().then(setRows).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm" style={labelStyle}>...جارٍ التحميل</p>
  if (rows.length === 0) return <p className="text-sm" style={labelStyle}>ما فيه اشتراكات بعد</p>

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.user_id} className="bg-white p-4" style={{ borderRadius: 'var(--idh-r-md)', boxShadow: 'var(--idh-shadow-1)' }}>
          <div className="flex justify-between text-sm">
            <span className="font-bold">{r.full_name}</span>
            <span className={`idh-chip idh-chip--${r.status === 'active' ? 'approved' : r.status === 'expired' ? 'rejected' : 'pending'}`}>
              {r.status}
            </span>
          </div>
          <div className="text-xs mt-1" style={labelStyle}>
            {r.civil_id} · {r.product_id ?? '—'} · ينتهي {r.expires_at ? new Date(r.expires_at).toLocaleDateString('ar') : '—'}
          </div>
        </li>
      ))}
    </ul>
  )
}

function ReviewsTab() {
  const [rows, setRows] = useState<AdminReviewRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllReviews().then(setRows).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm" style={labelStyle}>...جارٍ التحميل</p>
  if (rows.length === 0) return <p className="text-sm" style={labelStyle}>ما فيه تقييمات بعد</p>

  const average = (rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(1)

  return (
    <div className="space-y-3">
      <div className="bg-white p-4 text-center" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}>
        <div className="text-3xl font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>{average} ★</div>
        <div className="text-xs" style={labelStyle}>من {rows.length} تقييم</div>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="bg-white p-4" style={{ borderRadius: 'var(--idh-r-md)', boxShadow: 'var(--idh-shadow-1)' }}>
            <div className="flex justify-between text-sm">
              <span className="font-bold">{r.full_name}</span>
              <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            {r.comment && <div className="text-sm mt-1" style={labelStyle}>{r.comment}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ErrorsTab() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  return (
    <div className="bg-white p-4 space-y-2 text-sm" style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)', ...labelStyle }}>
      {dsn ? (
        <p>مراقبة الأخطاء مفعّلة عبر Sentry. راجعي لوحة تحكم Sentry مباشرة لتفاصيل الأعطال الأخيرة.</p>
      ) : (
        <p>مراقبة الأخطاء غير مفعّلة بعد — أضيفي VITE_SENTRY_DSN في متغيرات البيئة لتفعيلها (راجعي README).</p>
      )}
      <a href="https://sentry.io" target="_blank" rel="noreferrer" className="font-bold block" style={{ color: 'var(--idh-navy-500)' }}>
        فتح لوحة Sentry ↗
      </a>
    </div>
  )
}
