import { useEffect, useState } from 'react'
import { dailyQuote } from './data.js'

// 불씨(파티클): 값은 고정(렌더마다 바뀌지 않음)
const EMBERS = Array.from({ length: 18 }, (_, i) => ({
  l: (i * 53 + 11) % 100,
  s: 2 + ((i * 7) % 4),
  d: ((i * 37) % 28) / 10,
  t: 3.2 + ((i * 13) % 20) / 10,
}))
const NOTCH = [0, 45, 90, 135, 180, 225, 270, 315]

function Plate() {
  return (
    <svg className="sp-plate" viewBox="0 0 300 300" aria-hidden="true">
      <defs>
        <radialGradient id="pBody" cx="38%" cy="32%" r="85%">
          <stop offset="0" stopColor="#eaff8a" />
          <stop offset=".45" stopColor="#a9d11c" />
          <stop offset="1" stopColor="#3f5a00" />
        </radialGradient>
        <radialGradient id="pDisc" cx="40%" cy="34%" r="80%">
          <stop offset="0" stopColor="#d4f24a" />
          <stop offset=".6" stopColor="#86ad10" />
          <stop offset="1" stopColor="#2f4400" />
        </radialGradient>
        <linearGradient id="pSteel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f2f4" />
          <stop offset=".35" stopColor="#8e8e96" />
          <stop offset=".6" stopColor="#d8d8de" />
          <stop offset="1" stopColor="#5a5a62" />
        </linearGradient>
        <linearGradient id="pGloss" x1=".1" y1="0" x2=".7" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".42" />
          <stop offset=".38" stopColor="#fff" stopOpacity="0" />
          <stop offset=".78" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".12" />
        </linearGradient>
        <radialGradient id="pHole" cx="50%" cy="50%" r="50%">
          <stop offset=".6" stopColor="#000" />
          <stop offset="1" stopColor="#1b1b1f" />
        </radialGradient>
        <path id="pRing" d="M150,150 m-103,0 a103,103 0 1,1 206,0 a103,103 0 1,1 -206,0" />
      </defs>
      <circle cx="150" cy="150" r="146" fill="#1d2410" />
      <circle cx="150" cy="150" r="142" fill="url(#pBody)" />
      <circle cx="150" cy="150" r="142" fill="none" stroke="#2f4400" strokeWidth="3" />
      <circle cx="150" cy="150" r="134" fill="none" stroke="#2f4400" strokeOpacity=".35" strokeWidth="1.4" />
      <circle cx="150" cy="150" r="128" fill="none" stroke="#2f4400" strokeOpacity=".7" strokeWidth="2" />
      <g className="sp-ring">
        <text fontSize="14.5" fontWeight="900" letterSpacing="5.2" fill="#e9ffa0" fillOpacity=".95" fontFamily="system-ui,-apple-system,sans-serif">
          <textPath href="#pRing" startOffset="0">8-WEEK POWERBUILDING • LIFT SMART • </textPath>
        </text>
      </g>
      <circle cx="150" cy="150" r="88" fill="url(#pDisc)" />
      <circle cx="150" cy="150" r="88" fill="none" stroke="#2f4400" strokeOpacity=".4" strokeWidth="1.6" />
      <circle cx="150" cy="150" r="82" fill="none" stroke="#2f4400" strokeOpacity=".8" strokeWidth="2.5" />
      {NOTCH.map((a) => (
        <g key={a} transform={`rotate(${a} 150 150)`}>
          <rect x="143" y="76" width="14" height="22" rx="5" fill="#34490a" />
          <rect x="143" y="76" width="14" height="22" rx="5" fill="none" stroke="#2f4400" strokeOpacity=".35" strokeWidth="1" />
        </g>
      ))}
      <circle cx="150" cy="150" r="50" fill="#34490a" />
      <circle cx="150" cy="150" r="50" fill="none" stroke="#2f4400" strokeOpacity=".3" strokeWidth="1.2" />
      <circle cx="150" cy="150" r="33" fill="url(#pSteel)" />
      <circle cx="150" cy="150" r="33" fill="none" stroke="#2c2c31" strokeWidth="2" />
      <circle cx="150" cy="150" r="21" fill="url(#pHole)" />
      <circle cx="150" cy="150" r="21" fill="none" stroke="#7d7d85" strokeWidth="1.5" />
      <circle cx="150" cy="150" r="142" fill="url(#pGloss)" />
    </svg>
  )
}

export default function Splash() {
  const [phase, setPhase] = useState(0)
  // 하루 첫 실행에는 길게, 이후에는 짧게 보여줍니다
  const [quick] = useState(() => {
    try {
      const today = new Date().toLocaleDateString('sv')
      const seen = localStorage.getItem('power-splash-day') === today
      localStorage.setItem('power-splash-day', today)
      return seen
    } catch (e) {
      return false
    }
  })
  useEffect(() => {
    const a = setTimeout(() => setPhase(1), quick ? 1300 : 3000)
    const b = setTimeout(() => setPhase(2), quick ? 1900 : 3700)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])
  if (phase === 2) return null
  return (
    <div className={'splash' + (quick ? ' quick' : '') + (phase === 1 ? ' out' : '')} onClick={() => setPhase(1)} role="presentation">
      <div className="sp-glow" />
      <div className="sp-grid" />
      {EMBERS.map((e, i) => (
        <i key={i} className="sp-ember" style={{ left: e.l + '%', width: e.s, height: e.s, animationDelay: e.d + 's', animationDuration: e.t + 's' }} />
      ))}
      <div className="sp-stage">
        <div className="sp-halo" />
        <Plate />
        <div className="sp-sweep" />
      </div>
      <p className="sp-eye">8-WEEK POWERBUILDING</p>
      <h1 className="sp-t">
        <span>LIFT</span>
        <span>SMART.</span>
      </h1>
      <p className="sp-q">{dailyQuote()}</p>
      <p className="sp-tap">TAP TO ENTER</p>
    </div>
  )
}
