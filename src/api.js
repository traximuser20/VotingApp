export async function apiFetch(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(path, { ...options, signal: controller.signal })
    const text = await res.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Invalid response (${res.status})`)
      }
    }
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
    return data
  } finally {
    clearTimeout(timeout)
  }
}
