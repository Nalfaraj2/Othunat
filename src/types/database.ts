export type PermissionType = 'morning' | 'end_of_day'
export type PermissionStatus = 'active' | 'cancelled'
export type UserRole = 'employee' | 'admin'

export interface Profile {
  id: string
  civil_id: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Permission {
  id: string
  user_id: string
  permission_type: PermissionType
  permission_date: string // YYYY-MM-DD
  permission_year: number
  permission_month: number
  entry_time: string // HH:MM:SS
  exit_time: string | null
  duration_minutes: number
  status: PermissionStatus
  fingerprint_record_id: string | null
  created_at: string
}

export interface MonthlyBalance {
  user_id: string
  balance_year: number
  balance_month: number
  total_minutes: number
  used_minutes: number
  permissions_count: number
  updated_at: string
}

export interface MedicalPermission {
  id: string
  user_id: string
  permission_date: string
  notes: string | null
  storage_path: string | null
  created_at: string
}

export interface FingerprintRecord {
  id: string
  user_id: string
  storage_path: string
  extracted_date: string | null
  extracted_entry_time: string | null
  extracted_exit_time: string | null
  confidence: number | null
  created_at: string
}
