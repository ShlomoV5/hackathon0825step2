export function parseRange(q = {}) {
  const { from, to } = q;
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 7 * 86400000);
  return { start, end };
}

export function filterByRange(rows, start, end, field = 'ts') {
  const s = start.getTime(), e = end.getTime();
  return rows.filter(r => {
    const t = new Date(r[field]).getTime();
    return t >= s && t <= e;
  });
}

export function groupByDay(rows, field = 'ts') {
  const map = {};
  rows.forEach(r => {
    const d = new Date(r[field]);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}
