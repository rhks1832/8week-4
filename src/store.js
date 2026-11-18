const KEY = 'workout-program-v1'
export const defaults = () => ({
  v: 1,
  buyer: '',
  start: { SQ: '', BP: '', DL: '', OHP: '' },
  late: { SQ: '', BP: '', DL: '', OHP: '' },
  cfg: { step: 2.5, pf: 0.95, thr: 3.5, easy: 5, minSleep: 6, lowCond: 2, upInc: 2.5, lowInc: 5 },
  est: { SQ: { w: '', r: '' }, BP: { w: '', r: '' }, DL: { w: '', r: '' }, OHP: { w: '', r: '' } },
  logs: {},
  skips: {},
  swaps: {},
  ui: { w: 1, d: 1, onboarded: false, sound: true, vib: true, wake: true },
})
export function merge(base, d) {
  const out = defaults()
  if (!d || typeof d !== 'object') return out
  out.buyer = typeof d.buyer === 'string' ? d.buyer : ''
  for (const k of ['start', 'late', 'cfg', 'est', 'ui']) if (d[k] && typeof d[k] === 'object') out[k] = { ...out[k], ...d[k] }
  if (d.logs && typeof d.logs === 'object') out.logs = d.logs
  for (const k of ['skips', 'swaps']) if (d[k] && typeof d[k] === 'object') out[k] = d[k]
  return out
}
export function load() {
  try {
    return merge(null, JSON.parse(localStorage.getItem(KEY) || 'null'))
  } catch (e) {
    return defaults()
  }
}
export function save(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch (e) {}
}
