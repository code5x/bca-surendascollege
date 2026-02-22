// functions/_utils.js
// small helpers used by multiple endpoints

export function pad(n){ return n < 10 ? '0'+n : String(n) }

export function timestampFolder() {
  const d = new Date()
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/**
 * Validate filename characters (very basic)
 */
export function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, '_')
}
