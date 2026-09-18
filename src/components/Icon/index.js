import React, {useId} from 'react';
import styles from './styles.module.css';

// UI symbols only. Product and architecture logos retain their own artwork.
const paths = {
  link: <><path d="m10 13 4-4" /><path d="M8 16H6a4 4 0 0 1-2.8-6.8l3-3A4 4 0 0 1 13 8M11 16a4 4 0 0 0 6.8 1.8l3-3A4 4 0 0 0 18 8h-2" /></>,
  'file-text': <><path d="M14 3H5v18h14V8Zm0 0v5h5M8 12h8M8 16h6" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
  'book-open': <><path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7 14h2M13 14h2M7 17h2" /></>,
  refresh: <><path d="M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  layers: <><path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5" /></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3" /></>,
  activity: <path d="M2 12h5l3-8 4 16 3-8h5" />,
  terminal: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m6 9 3 3-3 3m7 0h5" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0" /></>,
  shield: <path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  'alert-triangle': <><path d="M12 3 2 21h20ZM12 9v5m0 3v.1" /></>,
  'x-circle': <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
  'external-link': <><path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7" /></>,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  x: <path d="m6 6 12 12m0-12L6 18" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  'arrow-up': <path d="M12 20V4m-6 6 6-6 6 6" />,
  'arrow-down': <path d="M12 4v16m-6-6 6 6 6-6" />,
  'arrow-left': <path d="M20 12H4m6-6-6 6 6 6" />,
  'arrow-right': <path d="M4 12h16m-6-6 6 6-6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  search: <><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></>,
  settings: <><path d="M4 4v16M12 4v16M20 4v16" /><path d="M1 8h6M9 16h6M17 10h6" /></>,
  network: <><rect x="9" y="2" width="6" height="5" rx="1" /><rect x="2" y="17" width="6" height="5" rx="1" /><rect x="16" y="17" width="6" height="5" rx="1" /><path d="M12 7v5M5 17v-5h14v5" /></>,
  cloud: <path d="M6 19h12a4 4 0 0 0 0-8 6 6 0 0 0-11.8-2A5 5 0 0 0 6 19Z" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6Z" /></>,
  server: <><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.1M7 17.5h.1M12 6.5h5M12 17.5h5" /></>,
  chart: <path d="M3 3v18h18M7 16v-5m5 5V6m5 10V9" />,
};

export const ICON_NAMES = Object.freeze(Object.keys(paths));
export const ICON_SIZES = Object.freeze([16, 18, 20, 24]);

/**
 * Adjacent visible text supplies meaning by default. Use title only for an
 * informational image without that text; useId keeps its name unique in SSR.
 */
export default function Icon({name, size = 18, className, title}) {
  const titleId = useId();
  const dimension = ICON_SIZES.includes(size) ? size : 18;
  return (
    <svg
      className={[styles.icon, className].filter(Boolean).join(' ')}
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-labelledby={title ? titleId : undefined}>
      {title && <title id={titleId}>{title}</title>}
      {Object.hasOwn(paths, name) ? paths[name] : paths['file-text']}
    </svg>
  );
}
