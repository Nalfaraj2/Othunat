// Inlined from Idhonat-Brand-Kit v1.0 (03_UI/icons/*.svg) — 24px, stroke="currentColor",
// so each icon inherits the button/text color it sits in.
import type { SVGProps } from 'react'

const PATHS = {
  home: <path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5" />,
  history: <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4M12 8v4l2.5 2.5" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  duration: <path d="M12 13V8.5A4.5 4.5 0 0 1 16.5 13z M12 5V3M10 3h4" />,
  add: <path d="M12 5v14M5 12h14" />,
  'request-leave': <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4M12 8v4l3 2" />,
  approve: <path d="M8 12.5l2.7 2.7L16.2 9.6" />,
  reject: <path d="M9 9l6 6M15 9l-6 6" />,
  pending: (
    <path d="M7 3h10M7 21h10M8 3v2.5a4 4 0 0 0 1.7 3.3L12 10.5l2.3-1.7A4 4 0 0 0 16 5.5V3M8 21v-2.5a4 4 0 0 1 1.7-3.3l2.3-1.7 2.3 1.7a4 4 0 0 1 1.7 3.3V21" />
  ),
  employee: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
    </>
  ),
  notifications: <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 21h4" />,
  filter: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
} as const

// duration/approve/employee also need a base circle — kept separate per icon below where relevant.
const EXTRA = {
  duration: <circle cx="12" cy="13" r="8" />,
  approve: <circle cx="12" cy="12" r="9" />,
  reject: <circle cx="12" cy="12" r="9" />,
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {name in EXTRA && EXTRA[name as keyof typeof EXTRA]}
      {PATHS[name]}
    </svg>
  )
}
