export async function api(path, options = {}) {
  const config = { credentials: 'include', ...options };
  if (config.body && !(config.body instanceof FormData)) {
    config.headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
  }
  const response = await fetch(`/api${path}`, config);
  if (response.status === 204) return null;
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
