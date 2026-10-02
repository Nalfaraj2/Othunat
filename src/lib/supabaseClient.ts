import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.',
  )
}

// "Remember me": when on (default) the session lives in localStorage and survives closing the
// browser/app; when off it lives in sessionStorage and is gone once the tab/app is closed.
const REMEMBER_KEY = 'idh_remember_me'
const LAST_CIVIL_ID_KEY = 'idh_last_civil_id'

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const getRememberMe = () => safe(() => localStorage.getItem(REMEMBER_KEY) !== 'false', true)

export function setRememberMe(remember: boolean) {
  safe(() => localStorage.setItem(REMEMBER_KEY, String(remember)), undefined)
}

export const getRememberedCivilId = () => safe(() => localStorage.getItem(LAST_CIVIL_ID_KEY) ?? '', '')

export function setRememberedCivilId(civilId: string | null) {
  safe(() => (civilId ? localStorage.setItem(LAST_CIVIL_ID_KEY, civilId) : localStorage.removeItem(LAST_CIVIL_ID_KEY)), undefined)
}

const authStorage = {
  getItem: (key: string) => safe(() => sessionStorage.getItem(key) ?? localStorage.getItem(key), null),
  setItem: (key: string, value: string) =>
    safe(() => {
      const [keep, drop] = getRememberMe() ? [localStorage, sessionStorage] : [sessionStorage, localStorage]
      keep.setItem(key, value)
      drop.removeItem(key)
    }, undefined),
  removeItem: (key: string) =>
    safe(() => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }, undefined),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: authStorage },
})
