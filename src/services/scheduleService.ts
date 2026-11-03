import { supabase } from '../lib/supabaseClient'
import { currentUserId, PermissionsServiceError } from './permissionsService'

/** Local calendar date as YYYY-MM-DD (not UTC, so it flips at local midnight). */
export function localDateKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** The entry time (HH:MM) the employee picked for that day, or null. */
export async function getDailyEntry(workDate: string): Promise<string | null> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('daily_schedules')
    .select('entry_time')
    .eq('user_id', userId)
    .eq('work_date', workDate)
    .maybeSingle()
  if (error) throw new PermissionsServiceError(error.message)
  return data ? data.entry_time.slice(0, 5) : null
}

/** Saves (or changes) the entry time for a day. The server clamps it to the flexible window. */
export async function setDailyEntry(workDate: string, entryTime: string): Promise<string> {
  const userId = await currentUserId()
  const { data, error } = await supabase
    .from('daily_schedules')
    .upsert({ user_id: userId, work_date: workDate, entry_time: entryTime }, { onConflict: 'user_id,work_date' })
    .select('entry_time')
    .single()
  if (error) throw new PermissionsServiceError(error.message)
  return data.entry_time.slice(0, 5)
}

export async function clearDailyEntry(workDate: string): Promise<void> {
  const userId = await currentUserId()
  const { error } = await supabase.from('daily_schedules').delete().eq('user_id', userId).eq('work_date', workDate)
  if (error) throw new PermissionsServiceError(error.message)
}
