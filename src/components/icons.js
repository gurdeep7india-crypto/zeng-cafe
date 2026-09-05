/** Inline SVG. Small enough that a sprite sheet or icon font would cost more. */

const stroke = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}${extra}</svg>`;

export const icons = {
  bag: stroke('<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  menu: stroke('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  pin: stroke('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>'),
  phone: stroke('<path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>'),
  chat: stroke('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5.2A8 8 0 1 1 21 12z"/>'),
  clock: stroke('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  fork: stroke('<path d="M7 3v6a2 2 0 0 0 4 0V3M9 9v12"/><path d="M17 3c-1.6 1.2-2.4 3-2.4 5.2 0 1.7.8 2.6 2.4 2.8V21"/>'),
  bike: stroke('<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M9 17h5l-2-7 3-2M12 6h3"/>'),
  bagTake: stroke('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M9 12h6"/>'),
  chair: stroke('<path d="M6 4h12v8H6zM5 12h14M7 12v8M17 12v8M7 16h10"/>'),
  arrow: stroke('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  check: stroke('<path d="M5 13l4 4 10-11"/>'),
  close: stroke('<path d="M6 6l12 12M18 6L6 18"/>'),
  plus: stroke('<path d="M12 5v14M5 12h14"/>'),
  trash: stroke('<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>'),
  edit: stroke('<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/>'),
  qr: stroke('<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"/>'),
  chart: stroke('<path d="M4 20V6M9 20v-8M14 20V9M19 20v-5"/>'),
  gear: stroke('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>'),
  image: stroke('<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4 4 3 3-2 4 3"/>'),
  star: stroke('<path d="M12 4l2.3 5 5.7.6-4.3 3.8 1.3 5.6L12 16l-5 3 1.3-5.6L4 9.6 9.7 9z"/>'),
  tag: stroke('<path d="M4 11V4h7l9 9-7 7-9-9z"/><circle cx="8" cy="8" r="1.2"/>'),
  calendar: stroke('<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>'),
  grid: stroke('<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>'),
  list: stroke('<path d="M4 6h16M4 12h16M4 18h16"/>'),
  logout: stroke('<path d="M14 8V5H5v14h9v-3"/><path d="M10 12h10M17 9l3 3-3 3"/>'),
  download: stroke('<path d="M12 4v11M8 11l4 4 4-4M5 20h14"/>'),
  upload: stroke('<path d="M12 20V9M8 12l4-4 4 4M5 4h14"/>'),
  print: stroke('<path d="M7 9V4h10v5M7 19h10v-6H7z"/><rect x="4" y="9" width="16" height="7" rx="1.5"/>'),
  sparkle: stroke('<path d="M12 4l1.6 4.6L18 10l-4.4 1.4L12 16l-1.6-4.6L6 10l4.4-1.4z"/><path d="M18.5 16.5l.7 1.9 1.8.7-1.8.7-.7 1.9-.7-1.9-1.8-.7 1.8-.7z"/>')
};

/* Brand marks use their own paths — these are filled, not stroked. */
export const brandIcons = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.83-.4.4-.63.8-.83 1.3-.16.4-.35 1-.4 2.1C2.6 9.9 2.6 10.3 2.6 12s0 2.1.07 3.3c.05 1.1.24 1.7.4 2.1.2.5.44.9.83 1.3.4.4.8.63 1.3.83.4.16 1 .35 2.1.4 1.2.07 1.6.07 4.7.07s3.5 0 4.7-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.83.4-.4.63-.8.83-1.3.16-.4.35-1 .4-2.1.07-1.2.07-1.6.07-3.3s0-2.1-.07-3.3c-.05-1.1-.24-1.7-.4-2.1-.2-.5-.44-.9-.83-1.3-.4-.4-.8-.63-1.3-.83-.4-.16-1-.35-2.1-.4C15.5 4 15.1 4 12 4zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zm5.2-3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.7v8z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15.1V8.9l5.2 3.1z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a9.9 9.9 0 0 0-8.5 15l-1.3 4.8 4.9-1.3A9.9 9.9 0 1 0 12 2zm0 1.8a8.1 8.1 0 1 1-4.2 15l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 0 1 12 3.8zm-3.3 4c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.7 2.7 4.2 3.7 2 .8 2.4.7 2.9.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.15-1.2-.05-.1-.2-.2-.45-.3l-1.6-.8c-.2-.1-.4-.15-.6.1l-.8 1c-.15.2-.3.2-.55.07-.25-.13-1.1-.4-2.05-1.3-.75-.7-1.25-1.5-1.4-1.75-.15-.25 0-.4.1-.5l.4-.5c.15-.15.2-.25.3-.45.1-.2.05-.35 0-.5l-.75-1.8c-.2-.45-.4-.4-.55-.4z"/></svg>'
};
