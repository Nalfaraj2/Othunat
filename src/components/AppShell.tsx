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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--idh-mist)' }} dir="rtl">
      <header className="bg-white border-b" style={{ borderColor: 'var(--idh-silver)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <img src={logoHorizontal} alt="إذونات" className="h-8" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 pb-24">{children}</main>

      <nav
        className="fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-2 max-w-2xl mx-auto"
        style={{ borderColor: 'var(--idh-silver)' }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-1 text-xs font-bold ${
                isActive ? '' : 'opacity-50'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--idh-navy-900)' : 'var(--idh-ink-2)' })}
          >
            <Icon name={item.icon} width={22} height={22} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
