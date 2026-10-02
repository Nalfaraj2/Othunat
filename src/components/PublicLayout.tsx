import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logoHorizontal from '../assets/logo/idhonat-horizontal-navy.svg'

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-safe" style={{ background: 'var(--idh-mist)' }} dir="rtl">
      <header className="bg-white border-b pt-safe px-safe" style={{ borderColor: 'var(--idh-silver)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/">
            <img src={logoHorizontal} alt="إذونات" className="h-8" />
          </Link>
        </div>
      </header>
      <main className="max-w-2xl w-full mx-auto px-page py-6 space-y-4 leading-relaxed">{children}</main>
    </div>
  )
}
