const paths={
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18M7 15h2M12 15h2M7 18h2"/>',
 timeline:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 3v18M8 8h9M8 12h6M8 16h10"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>',
 settings:'<path d="m9.5 3-.6 2.1-1.8 1-2.1-.5-2 3.4 1.5 1.6v2.1L3 14.3l2 3.4 2.1-.5 1.8 1 .6 2.1h4l.6-2.1 1.8-1 2.1.5 2-3.4-1.5-1.6v-2.1L20 9l-2-3.4-2.1.5-1.8-1L13.5 3z"/><circle cx="11.5" cy="11.7" r="3"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 video:'<rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 left:'<path d="m15 6-6 6 6 6"/>',right:'<path d="m9 6 6 6-6 6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',
 repeat:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',
 shield:'<path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6zM8.5 12l2.5 2.5 4.5-5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 moon:'<path d="M20.5 13a8.5 8.5 0 0 1-9.5-9.5A8.5 8.5 0 1 0 20.5 13Z"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 edit:'<path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15z"/>',
 save:'<path d="M5 3h12l4 4v14H3V3zM7 3v6h10V3M7 21v-8h10v8"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 'eye-off':'<path d="m3 3 18 18M10.5 5.1 12 5c6 0 10 7 10 7a18 18 0 0 1-3 3.7M6.3 6.3A18 18 0 0 0 2 12s4 7 10 7a12 12 0 0 0 5-1.2M10 10a3 3 0 0 0 4 4"/>',
 external:'<path d="M7 17 17 7M7 7h10v10"/>',
 logout:'<path d="M9 4H4v16h5M14 7l5 5-5 5M8 12h11"/>',
 check:'<path d="m5 12 4 4L19 6"/>'
};
export function icon(name){return `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||paths.calendar}</svg>`;}
export function mountIcons(root=document){for(const el of root.querySelectorAll('[data-icon]'))el.innerHTML=icon(el.dataset.icon);}
