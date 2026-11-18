import { useEffect, useRef, useState } from 'react'

export const reduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch (e) {
    return false
  }
}
export const haptic = (p = 12) => {
  try {
    navigator.vibrate && navigator.vibrate(p)
  } catch (e) {}
}

// 가벼운 캔버스 컨페티 (라이브러리 없음)
export function confetti(x, y) {
  if (reduced()) return
  const c = document.createElement('canvas')
  c.className = 'confetti'
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const W = window.innerWidth
  const H = window.innerHeight
  c.width = W * dpr
  c.height = H * dpr
  document.body.appendChild(c)
  const g = c.getContext('2d')
  g.scale(dpr, dpr)
  const cols = ['#c6f432', '#e4572e', '#e0a100', '#3f8fb0', '#6f9a1a']
  const ox = x == null ? W / 2 : x
  const oy = y == null ? H * 0.35 : y
  const ps = Array.from({ length: 90 }, () => {
    const a = Math.random() * Math.PI * 2
    const v = 4 + Math.random() * 8
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, s: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[(Math.random() * cols.length) | 0] }
  })
  const t0 = performance.now()
  const step = (t) => {
    const k = (t - t0) / 1600
    g.clearRect(0, 0, W, H)
    ps.forEach((p) => {
      p.vy += 0.28
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      g.save()
      g.globalAlpha = Math.max(0, 1 - k)
      g.translate(p.x, p.y)
      g.rotate(p.r)
      g.fillStyle = p.c
      g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2)
      g.restore()
    })
    if (k < 1) requestAnimationFrame(step)
    else c.remove()
  }
  requestAnimationFrame(step)
}

// 숫자 카운트업
export function Num({ v, dec = 0, suffix = '', dur = 750 }) {
  const [x, setX] = useState(v)
  const cur = useRef(v)
  useEffect(() => {
    if (reduced()) {
      cur.current = v
      setX(v)
      return
    }
    const from = cur.current
    const t0 = performance.now()
    let id
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur)
      const val = from + (v - from) * (1 - Math.pow(1 - k, 3))
      cur.current = val
      setX(val)
      if (k < 1) id = requestAnimationFrame(step)
    }
    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [v])
  return <>{x.toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix}</>
}

// 눌렀을 때 퍼지는 물결 효과
export function useRipple() {
  useEffect(() => {
    const on = (e) => {
      const el = e.target.closest && e.target.closest('.btn,.wk,.days button,.tabs button,.seg2 button,.chip')
      if (!el || reduced()) return
      const r = el.getBoundingClientRect()
      const s = document.createElement('span')
      const size = Math.max(r.width, r.height) * 1.6
      s.className = 'ripple'
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`
      el.appendChild(s)
      setTimeout(() => s.remove(), 650)
    }
    document.addEventListener('pointerdown', on)
    return () => document.removeEventListener('pointerdown', on)
  }, [])
}

// ───── 소리 알림 (WebAudio, 외부 파일 없음) ─────
let actx = null
export function primeAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    if (!actx) actx = new AC()
    if (actx.state === 'suspended') actx.resume()
  } catch (e) {}
}
export function beep(times = 3) {
  try {
    primeAudio()
    if (!actx) return
    const t0 = actx.currentTime + 0.02
    for (let i = 0; i < times; i++) {
      const o = actx.createOscillator()
      const g = actx.createGain()
      o.type = 'square'
      o.frequency.value = i === times - 1 ? 1320 : 990
      const t = t0 + i * 0.28
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.28, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
      o.connect(g)
      g.connect(actx.destination)
      o.start(t)
      o.stop(t + 0.22)
    }
  } catch (e) {}
}

// ───── 화면 꺼짐 방지 ─────
export function useWakeLock(on) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock = null
    let dead = false
    const get = async () => {
      try {
        if (document.visibilityState !== 'visible') return
        lock = await navigator.wakeLock.request('screen')
        if (dead && lock) lock.release().catch(() => {})
      } catch (e) {}
    }
    get()
    const vis = () => {
      if (document.visibilityState === 'visible') get()
    }
    document.addEventListener('visibilitychange', vis)
    return () => {
      dead = true
      document.removeEventListener('visibilitychange', vis)
      if (lock) lock.release().catch(() => {})
    }
  }, [on])
}
