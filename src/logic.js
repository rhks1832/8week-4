import { TYPES, WEEKTYPE, CMP, DAYS, MAXSETS, ACC_REPS, exList, trackedDay } from './data.js'
const IDX = Array.from({ length: MAXSETS }, (_, i) => i)
const DIDX = DAYS.map((x) => x.no)
import { defaults } from './store.js'

const RANGE = { step: [0.25, 20], pf: [0.85, 1], thr: [0.5, 15], easy: [0.5, 30], minSleep: [0, 14], lowCond: [0, 5], upInc: [0, 20], lowInc: [0, 40] }
export function cfgOf(data) {
  const d = defaults().cfg
  const out = {}
  for (const k in d) {
    const v = parseFloat(data.cfg[k])
    const [lo, hi] = RANGE[k]
    out[k] = v >= lo && v <= hi ? v : d[k]
  }
  return out
}

export const num = (v) => {
  const x = parseFloat(v)
  return x > 0 ? x : 0
}
export const e1 = (w, r) => {
  const kg = parseFloat(w)
  const reps = parseInt(r, 10)
  if (!(kg > 0) || !(reps >= 1)) return 0
  return reps === 1 ? kg : kg * (1 + reps / 30)
}
export const fmt = (n) => (Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toFixed(1))
export const pct = (x) => (Math.round(x * 1000) / 10).toFixed(1)
const sgn = (x) => (x >= 0 ? '+' : '-') + Math.abs(Math.round(x * 1000) / 10).toFixed(1) + '%'

export const logKey = (w, d) => w + '-' + d
export const getLog = (data, w, d) => data.logs[logKey(w, d)] || {}
export const getSet = (log, ei, si) => ((log.ex && log.ex[ei] && log.ex[ei][si]) || {})

export function rmFor(data, lift, w) {
  const s = num(data.start[lift])
  if (w <= 4) return s
  const l = num(data.late[lift])
  return l > 0 ? l : s
}
export function targetWeight(data, lift, w, mult = 1) {
  const R = rmFor(data, lift, w)
  if (!(R > 0)) return null
  const T = TYPES[WEEKTYPE[w]]
  const { step, pf } = cfgOf(data)
  return Math.round((R * pf * T.pct * mult) / step) * step
}
export function warmups(data, lift, w, mult = 1) {
  const tw = targetWeight(data, lift, w, mult)
  if (tw === null) return null
  const { step } = cfgOf(data)
  const r = (p) => Math.round((tw * p) / step) * step
  return { tw, items: [[0.5, 8, r(0.5)], [0.65, 5, r(0.65)], [0.8, 3, r(0.8)]] }
}
export function mainE1(data, w, d) {
  if (!trackedDay(DAYS[d - 1])) return 0
  const log = getLog(data, w, d)
  return Math.max(0, ...IDX.map((si) => e1(getSet(log, 0, si).w, getSet(log, 0, si).r)))
}
export function exSets(w, ei) {
  return TYPES[WEEKTYPE[w]].sets
}
export function dayVolume(data, w, d) {
  const log = getLog(data, w, d)
  let t = 0
  const nEx = exList(DAYS[d - 1]).length
  for (let ei = 0; ei < nEx; ei++)
    for (let si = 0; si < MAXSETS; si++) {
      const s = getSet(log, ei, si)
      const a = parseFloat(s.w)
      const b = parseFloat(s.r)
      if (a > 0 && b > 0) t += a * b
    }
  return t
}
export const exVolume = (data, w, d, ei) => {
  const log = getLog(data, w, d)
  let t = 0
  for (let si = 0; si < MAXSETS; si++) {
    const s = getSet(log, ei, si)
    const a = parseFloat(s.w)
    const b = parseFloat(s.r)
    if (a > 0 && b > 0) t += a * b
  }
  return t
}
export const weekVolume = (data, w) => DIDX.reduce((a, d) => a + dayVolume(data, w, d), 0)
export const doneDays = (data) => {
  let n = 0
  for (let w = 1; w <= 8; w++) for (let d = 1; d <= DAYS.length; d++) if (dayVolume(data, w, d) > 0) n++
  return n
}

export function recovery(data, w, d) {
  const log = getLog(data, w, d)
  const S = parseFloat(log.sleep)
  const C = parseFloat(log.cond)
  const K = log.carb
  if (!(S > 0) && !(C > 0) && !K) return '수면 시간과 컨디션을 입력하면 자동으로 안내됩니다'
  const { minSleep, lowCond } = cfgOf(data)
  if ((S > 0 && S < minSleep) || (C > 0 && C <= lowCond) || K === '아니오')
    return '⚠ 회복 신호 낮음 → 중량을 5~10% 낮추거나 휴식을 우선하고, 수면·탄수화물·전해질부터 보충하세요'
  return '✔ 회복 상태 양호 → 계획대로 진행하세요'
}

function easyCheck(data, lift, w, cur) {
  const R = rmFor(data, lift, w)
  return R > 0 && Math.round((cur / R - 1) * 1000) / 1000 >= cfgOf(data).easy / 100
}

export function perf(data, w, d) {
  const t = WEEKTYPE[w]
  const T = TYPES[t]
  const lift = DAYS[d - 1].lift
  if (!trackedDay(DAYS[d - 1])) return '이 일차는 메인 리프트가 없어 수행능력을 판정하지 않습니다 — 볼륨을 쌓는 날입니다.'
  if (t === 'R') return '회복 주입니다. 이번 주에는 수행능력을 판정하지 않습니다 — 여유 있게(RIR 3 이상) 마치고 충분히 쉬세요.'
  const cur = mainE1(data, w, d)
  if (cur === 0) return '메인 리프트의 실제 중량·렙을 입력하면 자동으로 판정됩니다'
  const first = getSet(getLog(data, w, d), 0, 0)
  const fr = parseInt(first.r, 10)
  if (Number.isFinite(fr) && fr < T.floor)
    return '⚠ 첫 본세트가 목표 하한(' + T.floor + '회)에 못 미쳤습니다 → 수행능력 저하 신호: 추가 세트를 중단하고 1~2일 완전 휴식 후 같은 일차를 다시 진행하세요'
  const R = rmFor(data, lift, w)
  const tail = CMP[w] ? '이번 사이클은 계획대로 마치고(증량·추가 세트 금지), 다음 사이클 시작 1RM에 반영하세요' : '오늘은 계획대로 마치고(증량·추가 세트 금지), 같은 신호가 이어지면 홈 화면 ③ 1RM에 반영하세요'
  const EW = (x) => (easyCheck(data, lift, w, cur) ? 'ℹ 강도 부족 신호: e1RM ' + fmt(cur) + 'kg (기준 1RM보다 ' + sgn(cur / R - 1) + ') → ' + tail : x)
  if (!CMP[w]) return EW('✔ 기준 기록이 저장되었습니다 (5주차부터 같은 유형 주와 비교됩니다)')
  const pw = CMP[w]
  const ref = mainE1(data, pw, d)
  if (ref === 0) return EW('✔ 기록 저장됨 (비교할 ' + pw + '주차 기록이 없습니다)')
  const dd = Math.round((cur / ref - 1) * 10000) / 10000
  const thr = cfgOf(data).thr / 100
  const a = Math.abs(Math.round((cur / ref - 1) * 1000) / 10).toFixed(1) + '%'
  if (dd <= -thr) return '⚠ ' + pw + '주차(같은 유형) 대비 e1RM이 ' + a + ' 감소 → 휴식 권고: 추가 세트를 중단하고 1~2일 완전 휴식 후 재개하세요 (수면·탄수화물·전해질 점검)'
  if (dd <= -thr / 2) return '△ ' + pw + '주차(같은 유형) 대비 e1RM이 ' + a + ' 소폭 감소 → 오늘은 계획대로 마치고, 다음 운동에서도 줄면 휴식하세요 (수면·탄수화물·전해질 점검)'
  return EW('✔ ' + pw + '주차(같은 유형) 대비 ' + sgn(cur / ref - 1) + ' → 정상 (계획대로 진행)')
}

// 요약 화면용 한 칸 판정
export function judgeCell(data, w, lift) {
  const t = WEEKTYPE[w]
  if (t === 'R') return { txt: '회복', cls: 'mute' }
  const d = DAYS.findIndex((x) => x.lift === lift) + 1
  const cur = mainE1(data, w, d)
  if (cur === 0) return { txt: '', cls: '' }
  const E = (x, c) => (easyCheck(data, lift, w, cur) ? { txt: 'ℹ 강도↑', cls: 'info' } : { txt: x, cls: c })
  if (!CMP[w]) return E('기준', 'mute')
  const prev = mainE1(data, CMP[w], d)
  if (prev === 0) return E('기준', 'mute')
  const dd = Math.round((cur / prev - 1) * 10000) / 10000
  const thr = cfgOf(data).thr / 100
  if (dd <= -thr) return { txt: '⚠ 휴식', cls: 'bad' }
  if (dd <= -thr / 2) return { txt: '△ 주의', cls: 'mid' }
  return E('✔ 정상', 'ok')
}
export const sev = (m) => ({ '⚠': 'bad', '✔': 'ok', '△': 'mid', 'ℹ': 'info' }[m ? m[0] : ''] || 'plain')

export const isSkipped = (data, w, d) => !!(data.skips && data.skips[logKey(w, d)])
export function nextWorkout(data) {
  for (let w = 1; w <= 8; w++) for (let d = 1; d <= DAYS.length; d++) if (dayVolume(data, w, d) === 0 && !isSkipped(data, w, d)) return { w, d }
  return null
}
export const weekDone = (data, w) => DIDX.filter((d) => dayVolume(data, w, d) > 0).length
// 해당 일차 메인 리프트 최고 e1RM과 그 세트의 렙
export function mainBest(data, w, d) {
  const log = getLog(data, w, d)
  let best = { e: 0, reps: 0 }
  if (!trackedDay(DAYS[d - 1])) return best
  for (let si = 0; si < MAXSETS; si++) {
    const s = getSet(log, 0, si)
    const e = e1(s.w, s.r)
    if (e > best.e) best = { e, reps: parseInt(s.r, 10) }
  }
  return best
}
// 다른 주차 기록 중 최고 e1RM (10렙 이하 세트만 인정)
export function prevBest(data, w, d) {
  let m = 0
  for (let x = 1; x <= 8; x++) {
    if (x === w) continue
    const b = mainBest(data, x, d)
    if (b.reps <= 10 && b.e > m) m = b.e
  }
  return m
}
export const SAME = { 5: 1, 6: 2, 7: 3 }

// ───── 종목별 기록 도우미 ─────
export function exBest(data, w, d, ei) {
  const log = getLog(data, w, d)
  let best = { e: 0, reps: 0, kg: 0 }
  for (let si = 0; si < MAXSETS; si++) {
    const s = getSet(log, ei, si)
    const e = e1(s.w, s.r)
    if (e > best.e) best = { e, reps: parseInt(s.r, 10), kg: parseFloat(s.w) }
  }
  return best
}
export function exPrevBest(data, w, d, ei) {
  let m = 0
  for (let x = 1; x <= 8; x++) {
    if (x === w) continue
    const b = exBest(data, x, d, ei)
    if (b.reps <= 10 && b.e > m) m = b.e
  }
  return m
}
const maxKg = (data, w, d, ei) => {
  const log = getLog(data, w, d)
  let m = 0
  for (let si = 0; si < MAXSETS; si++) {
    const s = getSet(log, ei, si)
    if (parseFloat(s.w) > 0 && parseFloat(s.r) > 0) m = Math.max(m, parseFloat(s.w))
  }
  return m
}
// 이번 주 목표 렙 구간의 중간값
export const midReps = (str) => {
  const m = String(str).match(/(\d+)\s*~\s*(\d+)/)
  return m ? Math.round((+m[1] + +m[2]) / 2) : parseInt(str, 10) || 10
}
// 보조운동 제안 중량: 가장 최근 기록의 e1RM을 이번 주 목표 렙에 맞춰 환산 (±10% 안으로 제한)
export function suggestWeight(data, w, d, ei, kind) {
  const t = WEEKTYPE[w]
  for (let x = w - 1; x >= 1; x--) {
    const b = exBest(data, x, d, ei)
    if (b.e > 0) {
      const last = maxKg(data, x, d, ei)
      const reps = midReps(ACC_REPS[t][kind === 'c' ? 0 : 1])
      let kg = b.e / (1 + reps / 30)
      if (t === 'R') kg *= 0.9
      kg = Math.min(last * 1.1, Math.max(last * 0.9, kg))
      const { step } = cfgOf(data)
      const out = Math.round(kg / step) * step
      return out > 0 ? { kg: out, from: x, last } : null
    }
  }
  return null
}
// 4대 운동 e1RM이 기록되는 위치 (메인 리프트 또는 보조 일차의 해당 종목)
export function liftSource(k) {
  for (const day of DAYS) {
    const list = exList(day)
    const i = list.findIndex((x) => (x.main ? day.lift === k && day.track !== false : x.lift === k))
    if (i >= 0) return { d: day.no, ei: i }
  }
  return null
}
export function liftE1(data, w, k) {
  const src = liftSource(k)
  return src ? exBest(data, w, src.d, src.ei).e : 0
}
