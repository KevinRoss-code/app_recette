const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export const IconTirage = () => (
  <svg {...base}><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8" cy="8" r="1" /><circle cx="16" cy="8" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="8" cy="16" r="1" /><circle cx="16" cy="16" r="1" /></svg>
)
export const IconMenu = () => (
  <svg {...base}><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>
)
export const IconCourses = () => (
  <svg {...base}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 11.4a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21 7H6" /></svg>
)
export const IconRecettes = () => (
  <svg {...base}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 21.5V4.5M9 7h7" /></svg>
)
