export async function apiGet(path) {
  const res = await fetch(path, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}