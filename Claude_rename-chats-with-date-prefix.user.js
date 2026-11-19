// ==UserScript==
// @name        Claude - Rename chats with date prefix
// @version     1.1
// @description Every 12 hours, prefixes new claude.ai chat titles with their creation date ("MM/DD/YYYY: Original title")
// @author      MapleGingerOatmeal
// @namespace   https://github.com/maplegingeroatmeal
// @homepageURL https://github.com/maplegingeroatmeal/userscripts
// @supportURL  https://github.com/maplegingeroatmeal/userscripts/issues
// @match       https://claude.ai/*
// @run-at      document-start
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @icon        https://www.google.com/s2/favicons?domain=claude.ai
// ==/UserScript==

(async () => {
  const TZ = 'America/Los_Angeles';
  const now = Date.now();

  // Small message under the top bar
  const toast = msg => {
    const show = () => {
      const el = document.createElement('div');
      el.textContent = msg;
      const bar = document.querySelector('[aria-label="Page tools"]');
      const top = (bar ? Math.round(bar.getBoundingClientRect().bottom) : 45) + 16;
      Object.assign(el.style, {
        position: 'fixed', top: `${top}px`, right: '16px', zIndex: '9000',
        padding: '10px 16px',
        borderRadius: 'var(--cds-radius, 8px)',
        background: 'var(--cds-surface-popover, #303030)',
        color: 'hsl(var(--text-100, 0 0% 97.6%))',
        border: '1px solid var(--cds-fizzy-lake-color-menu-line, #ffffff1a)',
        boxShadow: 'var(--cds-shadow-popover, 0 8px 24px #00000052, 0 2px 6px #0003)',
        font: '16px/24px var(--cds-font-sans, system-ui, sans-serif)',
        pointerEvents: 'none', opacity: '0', transition: 'opacity 300ms'
      });
      document.body.appendChild(el);
      el.offsetHeight;
      el.style.opacity = '1';
      setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
    };
    const ready = () => document.querySelector('[contenteditable="true"]');
    if (ready()) return show();
    const obs = new MutationObserver(() => { if (ready()) { obs.disconnect(); clearTimeout(timer); show(); } });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    const timer = setTimeout(() => { obs.disconnect(); show(); }, 15000);
  };

  // Once per day
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(now));
  if (GM_getValue('lastRunDate') === today) return;

  const orgsRes = await fetch('/api/organizations', { credentials: 'include' });
  if (!orgsRes.ok) return;
  const orgs = await orgsRes.json();
  const org = orgs.find(o => (o.capabilities || []).includes('chat')) || orgs[0];
  if (!org) return;

  const base = `/api/organizations/${org.uuid}/chat_conversations`;
  const dated = /^\d{2}\/\d{2}\/\d{4}: /;

  // First run: start from the newest already-dated chat
  let since = GM_getValue('checkpoint', 0);
  if (!since) {
    const allRes = await fetch(base, { credentials: 'include' });
    if (!allRes.ok) return;
    const all = await allRes.json();
    const datedTimes = all.filter(c => dated.test(c.name || '')).map(c => new Date(c.created_at).getTime());
    if (!datedTimes.length) return;
    since = Math.max(...datedTimes);
  }

  // List is sorted by recent activity; stop at the first chat inactive since the checkpoint
  const candidates = [];
  for (let offset = 0; ; offset += 10) {
    const res = await fetch(`${base}?limit=10&offset=${offset}`, { credentials: 'include' });
    if (!res.ok) return;
    const page = await res.json();
    let stop = page.length < 10;
    for (const c of page) {
      if (new Date(c.updated_at).getTime() < since) { stop = true; break; }
      candidates.push(c);
    }
    if (stop) break;
  }

  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const newChats = candidates.filter(c => new Date(c.created_at).getTime() > since && !dated.test(c.name || ''));
  const untitled = newChats.filter(c => !(c.name || '').trim());
  const todo = newChats.filter(c => (c.name || '').trim());

  // Keep untitled chats inside the next run's range
  let nextCheckpoint = now;
  for (const c of untitled) nextCheckpoint = Math.min(nextCheckpoint, new Date(c.created_at).getTime() - 1);

  // Rename oldest-activity first, so the batch keeps its original order in the sidebar
  let failed = 0, renamed = 0;
  for (const c of todo.slice().reverse()) {
    const name = `${fmt.format(new Date(c.created_at))}: ${c.name.trim()}`;
    const res = await fetch(`${base}/${c.uuid}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) renamed++;
    else {
      const retryable = res.status >= 500 || [401, 403, 429].includes(res.status);
      console.warn(`[date-prefix] rename ${retryable ? 'failed, will retry' : 'skipped'} (${res.status}):`, c.uuid, name);
      if (retryable) failed++;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  if (!failed) {
    GM_setValue('checkpoint', nextCheckpoint);
		GM_setValue('checkpointReadable', new Date(nextCheckpoint).toLocaleString('en-US', { timeZone: TZ }));
    GM_setValue('lastRunDate', today);
  }

  const plural = n => `${n} chat${n === 1 ? '' : 's'}`;
  toast(failed
    ? `Renamed ${plural(renamed)}, ${failed} failed`
    : renamed ? `Renamed ${plural(renamed)}` : 'No chats to rename');
})();