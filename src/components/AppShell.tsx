import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import logoHorizontal from '../assets/logo/idhonat-horizontal-navy.svg'
import { Icon, type IconName } from '../brand/Icon'

const NAV_ITEMS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'الرئيسية', icon: 'home', end: true },
  { to: '/permissions', label: 'السجل', icon: 'history' },
  { to: '/profile', label: 'حسابي', icon: 'employee' },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--idh-mist)' }} dir="rtl">
      {/* Header extends under the status bar / notch; its content sits below it. */}
      <header className="sticky top-0 z-20 bg-white border-b pt-safe px-safe" style={{ borderColor: 'var(--idh-silver)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <img src={logoHorizontal} alt="إذونات" className="h-8" />
        </div>
      </header>

      <main
        className="flex-1 max-w-2xl w-full mx-auto px-page py-5"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>

      {/* Tab bar background reaches the very bottom edge; icons stay above the home indicator. */}
      <nav
        className="fixed bottom-0 inset-x-0 z-20 bg-white border-t pb-safe px-safe"
        style={{ borderColor: 'var(--idh-silver)' }}
      >
        <div className="max-w-2xl mx-auto flex justify-around py-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 min-w-20 min-h-12 px-3 py-1 text-xs font-bold ${
                  isActive ? '' : 'opacity-50'
                }`
              }
              style={({ isActive }) => ({ color: isActive ? 'var(--idh-navy-900)' : 'var(--idh-ink-2)' })}
            >
              <Icon name={item.icon} width={22} height={22} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
