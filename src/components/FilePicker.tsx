import { useRef } from 'react'

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
)

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </svg>
)

interface FilePickerProps {
  file: File | null
  onChange: (file: File | null) => void
  accept?: string
  label?: string
}

export function FilePicker({ file, onChange, accept = 'image/*,application/pdf', label = 'ارفق ملف أو صورة' }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function clear() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label
        className="flex flex-col items-center justify-center gap-2 p-5 text-center cursor-pointer border-2 border-dashed focus-within:outline-2"
        style={{
          borderRadius: 'var(--idh-r-md)',
          borderColor: file ? 'var(--idh-navy-500)' : 'var(--idh-silver)',
          background: file ? 'var(--idh-mist)' : '#fff',
          color: 'var(--idh-navy-900)',
          outlineColor: 'var(--idh-navy-500)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <FileIcon />
            <span className="text-sm font-bold break-all" dir="auto">{file.name}</span>
            <span className="text-xs" style={{ color: 'var(--idh-ink-2)' }}>اضغطي لتغيير الملف</span>
          </>
        ) : (
          <>
            <UploadIcon />
            <span className="text-sm font-bold">{label}</span>
            <span className="text-xs" style={{ color: 'var(--idh-ink-2)' }}>صورة أو ملف PDF</span>
          </>
        )}
      </label>

      {file && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 text-xs font-bold"
          style={{ color: 'var(--idh-rejected)' }}
        >
          إزالة الملف
        </button>
      )}
    </div>
  )
}
