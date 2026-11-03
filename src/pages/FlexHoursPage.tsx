import { useEffect, useState } from 'react'
import { AppShell } from '../components/AppShell'
import { getAppSettings } from '../services/adminService'
import { clearDailyEntry, getDailyEntry, localDateKey, setDailyEntry } from '../services/scheduleService'

// Official flexible-hours table: sign-out time = sign-in time + shift length. The window and the
// shift length come from app_settings (06:55–07:40 and 370 min by default), so the table always
// follows what the admin configured.
const DEFAULTS = { from: '06:55', to: '07:40', shiftMinutes: 370 }

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// 12-hour clock without AM/PM, like the official sheet (13:05 -> 1:05)
function fmt(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h}:${String(totalMinutes % 60).padStart(2, '0')}`
}

export default function FlexHoursPage() {
  const [win, setWin] = useState(DEFAULTS)
  const [chosen, setChosen] = useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const dateKey = localDateKey()

  useEffect(() => {
    getDailyEntry(dateKey)
      .then((t) => setChosen(t ? toMinutes(t) : null))
      .catch(() => {})
  }, [dateKey])

  async function choose(m: number | null) {
    const previous = chosen
    setChosen(m)
    setError(null)
    try {
      if (m === null) await clearDailyEntry(dateKey)
      else await setDailyEntry(dateKey, `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
    } catch {
      setChosen(previous)
      setError('تعذّر حفظ وقت الدخول، حاول مرة ثانية')
    }
  }

  useEffect(() => {
    getAppSettings()
      .then((s) =>
        setWin({ from: s.flex_floor.slice(0, 5), to: s.flex_ceiling.slice(0, 5), shiftMinutes: s.shift_length_minutes }),
      )
      .catch(() => {})
  }, [])

  const start = toMinutes(win.from)
  const end = toMinutes(win.to)
  const rows: { entry: string; exit: string }[] = []
  const mins: number[] = []
  for (let m = start; m <= end; m++) {
    rows.push({ entry: fmt(m), exit: fmt(m + win.shiftMinutes) })
    mins.push(m)
  }
  const todayLabel = new Date().toLocaleDateString('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' })

  const shiftH = Math.floor(win.shiftMinutes / 60)
  const shiftM = win.shiftMinutes % 60

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--idh-navy-900)' }}>
            توقيت الدوام المرن
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--idh-ink-2)' }}>
            الدخول من {win.from} إلى {win.to}، والخروج بعد {shiftH} ساعات و{shiftM} دقائق من وقت دخولك.
          </p>
        </div>

        <div
          className="p-5 text-white space-y-3"
          style={{ background: 'var(--idh-approved)', borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-2)' }}
        >
          <div className="flex items-center justify-between text-sm opacity-80">
            <span>دوامي اليوم</span>
            <span>{todayLabel}</span>
          </div>
          {chosen === null ? (
            <p className="text-base font-bold">حدّد وقت دخولك اليوم من الجدول، وبيطلع لك وقت الخروج.</p>
          ) : (
            <>
              <div className="flex items-center justify-around text-center">
                <div>
                  <div className="text-xs opacity-90">الدخول</div>
                  <div className="text-3xl font-extrabold">{fmt(chosen)}</div>
                </div>
                <span className="text-2xl opacity-60">←</span>
                <div>
                  <div className="text-xs opacity-90">الخروج</div>
                  <div className="text-3xl font-extrabold">{fmt(chosen + win.shiftMinutes)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs opacity-90">
                <span>اضغط على وقت ثاني في الجدول لتغييره</span>
                <button type="button" className="underline font-bold" onClick={() => choose(null)}>
                  مسح
                </button>
              </div>
            </>
          )}
        </div>

        {error && (
          <p className="text-sm font-bold" style={{ color: 'var(--idh-rejected)' }}>
            {error}
          </p>
        )}

        <div
          className="overflow-hidden bg-white"
          style={{ borderRadius: 'var(--idh-r-lg)', boxShadow: 'var(--idh-shadow-1)' }}
        >
          <table className="w-full text-center">
            <thead>
              <tr style={{ background: 'var(--idh-navy-900)', color: '#fff' }}>
                <th className="py-3 text-sm font-bold">ساعة الدخول</th>
                <th className="py-3 text-sm font-bold">ساعة الخروج</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.entry}
                  role="button"
                  tabIndex={0}
                  aria-pressed={chosen === mins[i]}
                  onClick={() => choose(mins[i])}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && choose(mins[i])}
                  className="cursor-pointer"
                  style={
                    chosen === mins[i]
                      ? { background: 'var(--idh-navy-900)', color: '#fff' }
                      : { background: i % 2 === 0 ? '#fff' : 'var(--idh-mist)' }
                  }
                >
                  <td
                    className="py-2.5 text-base font-extrabold"
                    style={{ color: chosen === mins[i] ? '#fff' : 'var(--idh-navy-900)' }}
                  >
                    {r.entry}
                  </td>
                  <td
                    className="py-2.5 text-base font-bold"
                    style={{ color: chosen === mins[i] ? '#fff' : 'var(--idh-ink-2)' }}
                  >
                    {r.exit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
