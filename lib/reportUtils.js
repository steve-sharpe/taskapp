const CSV_COLUMNS = [
  ['Address', t => t.address],
  ['Name', t => t.name],
  ['Phone', t => t.phone],
  ['Email', t => t.email],
  ['Task', t => t.task],
  ['Notes', t => t.notes],
  ['Entered', t => formatDate(t.createdAt)],
  ['Completed', t => formatDate(t.completedAt)],
  ['IAN', t => (t.ian ? 'Yes' : 'No')],
  ['Vendor', t => (t.vendor ? 'Yes' : 'No')],
  ['Done', t => (t.done ? 'Yes' : 'No')],
  ['Attachments', t => (t.attachments || []).length],
];

export const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Prefix cells that spreadsheets would treat as formulas
const csvCell = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const tasksToCsv = (tasks) => {
  const header = CSV_COLUMNS.map(([label]) => csvCell(label)).join(',');
  const rows = tasks.map(t => CSV_COLUMNS.map(([, get]) => csvCell(get(t))).join(','));
  return [header, ...rows].join('\r\n');
};

export const downloadCsv = (filename, csv) => {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const startOfDay = (value) => new Date(`${value}T00:00:00`);
const endOfDay = (value) => new Date(`${value}T23:59:59.999`);

export const filterTasks = (tasks, { status, from, to }) => {
  return tasks.filter(t => {
    if (status === 'OPEN' && t.done) return false;
    if (status === 'DONE' && !t.done) return false;
    if (status === 'IAN' && !t.ian) return false;
    if (status === 'VENDOR' && !t.vendor) return false;
    const created = new Date(t.createdAt);
    if (from && created < startOfDay(from)) return false;
    if (to && created > endOfDay(to)) return false;
    return true;
  });
};

export const summarize = (tasks) => {
  const done = tasks.filter(t => t.done);
  const open = tasks.filter(t => !t.done);
  const completionDays = done
    .filter(t => t.completedAt && t.createdAt)
    .map(t => (new Date(t.completedAt) - new Date(t.createdAt)) / 86400000)
    .filter(d => d >= 0);
  const avgDaysToComplete = completionDays.length
    ? completionDays.reduce((sum, d) => sum + d, 0) / completionDays.length
    : null;
  const oldestOpen = open.reduce(
    (oldest, t) => (!oldest || new Date(t.createdAt) < new Date(oldest.createdAt) ? t : oldest),
    null
  );

  return {
    total: tasks.length,
    open: open.length,
    done: done.length,
    ian: tasks.filter(t => t.ian).length,
    vendor: tasks.filter(t => t.vendor).length,
    avgDaysToComplete,
    oldestOpenDays: oldestOpen ? Math.floor((Date.now() - new Date(oldestOpen.createdAt)) / 86400000) : null,
  };
};

export const groupByAddress = (tasks) => {
  const groups = new Map();
  tasks.forEach(t => {
    const label = (t.address || '').trim() || '(No address)';
    const key = label.replace(/\s+/g, ' ').toLowerCase();
    if (!groups.has(key)) groups.set(key, { address: label, total: 0, open: 0, done: 0, ian: 0, vendor: 0 });
    const g = groups.get(key);
    g.total += 1;
    if (t.done) g.done += 1; else g.open += 1;
    if (t.ian) g.ian += 1;
    if (t.vendor) g.vendor += 1;
  });
  return [...groups.values()].sort((a, b) => a.address.localeCompare(b.address));
};
