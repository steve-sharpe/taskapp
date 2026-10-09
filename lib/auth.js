export const AUTH_COOKIE = 'nvh_auth';

// Vercel runs in UTC, so "the day" is computed in a configurable timezone.
const TZ = process.env.APP_TIMEZONE || 'America/St_Johns';

function parts(date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const o = {};
  for (const p of fmt.formatToParts(date)) o[p.type] = p.value;
  return o;
}

export function todayKey(date = new Date()) {
  const o = parts(date);
  return `${o.year}-${o.month}-${o.day}`;
}

// Milliseconds remaining until local midnight in the configured timezone.
export function msUntilMidnight(date = new Date()) {
  const o = parts(date);
  const elapsed = (Number(o.hour) * 3600 + Number(o.minute) * 60 + Number(o.second)) * 1000;
  return 24 * 3600 * 1000 - elapsed;
}

export function endOfToday() {
  return new Date(Date.now() + msUntilMidnight());
}

// The token only validates for the current day, so it lapses at midnight.
export async function makeToken(pin, day = todayKey()) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(`nvh-secret:${pin}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(day));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}
