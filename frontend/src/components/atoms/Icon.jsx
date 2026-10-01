// Iconografía genérica propia (SVG de trazo). No usa recursos de terceros.
const ICONS = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  home: <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" />,
  homeFilled: <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" fill="currentColor" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  logout: <path d="M9 4H5v16h4M16 16l4-4-4-4M20 12H9" />,
  play: <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="13" height="14" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  library: (
    <>
      <rect x="3" y="7" width="14" height="13" rx="2" />
      <path d="M7 4h12a2 2 0 0 1 2 2v10M9 11v5l4-2.5z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  share: <path d="M14 5l7 7-7 7M21 12H11a7 7 0 0 0-7 7" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  comment: <path d="M4 5h16v11H9l-5 4z" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
  check: <path d="m5 12 5 5L20 7" />,
  trending: <path d="m3 17 6-6 4 4 7-7M14 8h6v6" />,
  sort: <path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3" />,
  alert: <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
}

export default function Icon({ name, size = 24, className = '', strokeWidth = 1.8 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
