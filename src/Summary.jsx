import { DAYS, LIFT, LIFT_ORDER, TRACKED, TYPES, WEEKTYPE } from './data.js'
import { useState } from 'react'
import { Num } from './fx.jsx'
import { dayVolume, weekVolume, mainE1, liftE1, judgeCell, getLog, num } from './logic.js'

const WK = [1, 2, 3, 4, 5, 6, 7, 8]
const Head = ({ first }) => (
  <tr>
    <th>{first}</th>
    {WK.map((w) => (
      <th key={w} style={{ color: TYPES[WEEKTYPE[w]].color }}>
        {w}주
      </th>
    ))}
  </tr>
)

export default function Summary({ data }) {
  const cells = []
  TRACKED.forEach((k) => WK.forEach((w) => cells.push(judgeCell(data, w, k))))
  const cnt = (c) => cells.filter((x) => x.cls === c).length
  const avg = (w, key) => {
    const v = DAYS.map((x) => x.no).map((d) => parseFloat(getLog(data, w, d)[key])).filter((x) => x > 0)
    return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : ''
  }
  const noCount = (w) => DAYS.map((x) => x.no).filter((d) => getLog(data, w, d).carb === '아니오').length

  return (
    <div className="stack">
      <section className="card">
        <h2>기록 추이</h2>
        <Trend data={data} />
      </section>

      <section className="card">
        <h2>주차별 총 볼륨</h2>
        <VolChart data={data} />
      </section>

      <section className="card">
        <h2>① 일차별 총 볼륨 (kg × 렙)</h2>
        <div className="tablewrap">
          <table className="sm">
            <thead><Head first="일차" /></thead>
            <tbody>
              {DAYS.map((x) => (
                <tr key={x.no}>
                  <td>{x.no}일차 {x.name}</td>
                  {WK.map((w) => {
                    const v = dayVolume(data, w, x.no)
                    return <td key={w}>{v ? Math.round(v).toLocaleString() : ''}</td>
                  })}
                </tr>
              ))}
              <tr className="tot">
                <td>주 합계</td>
                {WK.map((w) => {
                  const v = weekVolume(data, w)
                  return <td key={w}>{v ? Math.round(v).toLocaleString() : ''}</td>
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>② 메인 리프트 e1RM (kg)</h2>
        <div className="tablewrap">
          <table className="sm">
            <thead><Head first="종목" /></thead>
            <tbody>
              {LIFT_ORDER.map((k) => {
                return (
                  <tr key={k}>
                    <td>{LIFT[k].ko}</td>
                    {WK.map((w) => {
                      const v = liftE1(data, w, k)
                      return <td key={w}>{v ? (Math.round(v * 10) / 10).toFixed(1) : ''}</td>
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="small">e1RM = 무게 × (1 + 렙 ÷ 30), 1렙이면 무게 그대로. 가장 좋은 세트가 기준입니다. 렙이 10회를 넘으면 오차가 커집니다.</p>
      </section>

      <section className="card">
        <h2>③ 주차별 판정 (같은 유형 주끼리 비교)</h2>
        <div className="tablewrap">
          <table className="sm">
            <thead><Head first="종목" /></thead>
            <tbody>
              {TRACKED.map((k) => (
                <tr key={k}>
                  <td>{LIFT[k].ko}</td>
                  {WK.map((w) => {
                    const j = judgeCell(data, w, k)
                    return <td key={w} className={'j ' + j.cls}>{j.txt}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={'msg2 ' + (cnt('bad') ? 'bad' : 'ok')}>{cnt('bad') ? `⚠ 휴식 권고 ${cnt('bad')}회 → 해당 일차 전후의 수면·탄수화물·전해질을 점검하세요` : '✔ 기록상 휴식 권고 없음'}</div>
        <div className={'msg2 ' + (cnt('mid') ? 'mid' : 'ok')}>{cnt('mid') ? `△ 소폭 감소 ${cnt('mid')}회 → 연속으로 나타나면 휴식을 고려하세요` : '✔ 소폭 감소 없음'}</div>
        <div className={'msg2 ' + (cnt('info') ? 'info' : 'ok')}>{cnt('info') ? `ℹ 강도 부족 신호 ${cnt('info')}회 → 사용 설명 6번 순서대로 다음 처방(③ 1RM)을 조정하세요` : '✔ 강도 부족 신호 없음'}</div>
        <p className="small">첫 본세트가 목표 하한에 못 미친 경우의 ⚠는 운동 화면에서만 표시됩니다.</p>
      </section>

      <section className="card">
        <h2>④ 회복 기록 (주별 평균)</h2>
        <div className="tablewrap">
          <table className="sm">
            <thead><Head first="항목" /></thead>
            <tbody>
              <tr><td>평균 수면(시간)</td>{WK.map((w) => <td key={w}>{avg(w, 'sleep')}</td>)}</tr>
              <tr><td>평균 컨디션(1~5)</td>{WK.map((w) => <td key={w}>{avg(w, 'cond')}</td>)}</tr>
              <tr><td>탄수·전해질 ‘아니오’</td>{WK.map((w) => <td key={w}>{noCount(w) || ''}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function VolChart({ data }) {
  const vals = WK.map((w) => weekVolume(data, w))
  const max = Math.max(1, ...vals)
  const W = 320
  const H = 150
  const bw = 26
  const gap = (W - bw * 8) / 9
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="주차별 총 볼륨 막대그래프">
      {[0.5, 1].map((k) => (
        <line key={k} x1="0" x2={W} y1={H - 24 - (H - 54) * k} y2={H - 24 - (H - 54) * k} stroke="#e6e0cb" strokeWidth="1" />
      ))}
      {WK.map((w, i) => {
        const h = vals[i] ? Math.max(3, (vals[i] / max) * (H - 54)) : 3
        const x = gap + i * (bw + gap)
        const c = TYPES[WEEKTYPE[w]].color
        return (
          <g key={w}>
            <rect className="bar2" style={{ animationDelay: i * 60 + 'ms' }} x={x} y={H - 24 - h} width={bw} height={h} rx="4" fill={vals[i] ? c : '#e6e0cb'} />
            {vals[i] > 0 && (
              <text x={x + bw / 2} y={H - 30 - h} textAnchor="middle" fontSize="9.5" fill="#1d2410">
                {vals[i] >= 1000 ? Math.round(vals[i] / 100) / 10 + 'k' : Math.round(vals[i])}
              </text>
            )}
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill={c}>
              {w}주
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ───── 기록 추이 (e1RM · 체중) ─────
const wkAvgBw = (data, w) => {
  const v = DAYS.map((x) => x.no).map((d) => parseFloat(getLog(data, w, d).bw)).filter((x) => x > 0)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
}
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1)

function Trend({ data }) {
  const [sel, setSel] = useState(() => {
    const has = LIFT_ORDER.find((k) => WK.some((w) => liftE1(data, w, k) > 0))
    return has || (WK.some((w) => wkAvgBw(data, w) > 0) ? 'BW' : 'BP')
  })
  const isBw = sel === 'BW'
  const vals = WK.map((w) => (isBw ? wkAvgBw(data, w) : liftE1(data, w, sel)))
  const pts = vals.map((v, i) => (v > 0 ? { w: WK[i], v } : null)).filter(Boolean)
  const W = 320
  const H = 190
  const L = 14
  const R = 14
  const top = 26
  const bot = 30
  const lo0 = pts.length ? Math.min(...pts.map((p) => p.v)) : 0
  const hi0 = pts.length ? Math.max(...pts.map((p) => p.v)) : 1
  const padv = Math.max((hi0 - lo0) * 0.25, hi0 * 0.03, 1)
  const lo = lo0 - padv
  const hi = hi0 + padv
  const x = (w) => L + ((w - 1) / 7) * (W - L - R)
  const y = (v) => top + (1 - (v - lo) / (hi - lo)) * (H - top - bot)
  const path = pts.map((p, i) => (i ? 'L' : 'M') + x(p.w).toFixed(1) + ',' + y(p.v).toFixed(1)).join(' ')
  const first = pts[0]
  const last = pts[pts.length - 1]
  const best = pts.reduce((a, p) => (p.v > a.v ? p : a), { v: 0, w: 0 })
  const diff = first && last ? last.v - first.v : 0
  const pc = first && last && first.v ? (diff / first.v) * 100 : 0
  const unit = 'kg'
  const sgn = (n) => (n > 0 ? '+' : n < 0 ? '-' : '') + f1(Math.abs(n))
  const tabs = [...LIFT_ORDER.map((k) => [k, LIFT[k].ko]), ['BW', '체중']]
  return (
    <div className="trend">
      <div className="tpills" role="tablist">
        {tabs.map(([k, l]) => (
          <button key={k} className={sel === k ? 'on' : ''} onClick={() => setSel(k)} role="tab" aria-selected={sel === k}>
            {l}
          </button>
        ))}
      </div>
      {pts.length === 0 ? (
        <p className="small tempty">
          {isBw ? '운동 기록 화면의 체중 칸에 입력하면 주차별 평균 체중이 그려집니다.' : `${LIFT[sel].ko} 기록을 입력하면 주차별 e1RM이 그려집니다.`}
        </p>
      ) : (
        <>
          <svg key={sel} viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={(isBw ? '체중' : LIFT[sel].ko + ' e1RM') + ' 추이 그래프'}>
            <defs>
              <linearGradient id="tfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#9bc21a" stopOpacity=".35" />
                <stop offset="1" stopColor="#9bc21a" stopOpacity="0" />
              </linearGradient>
            </defs>
            {WK.map((w) => (
              <rect key={w} x={x(w) - 14} y={top - 8} width="28" height={H - top - bot + 16} rx="6" fill={TYPES[WEEKTYPE[w]].color} fillOpacity=".06" />
            ))}
            {[0, 0.5, 1].map((k) => (
              <line key={k} x1={L} x2={W - R} y1={top + (H - top - bot) * k} y2={top + (H - top - bot) * k} stroke="#e6e0cb" strokeWidth="1" strokeDasharray={k === 1 ? '' : '3 4'} />
            ))}
            {pts.length > 1 && <path d={`${path} L${x(last.w).toFixed(1)},${H - bot} L${x(first.w).toFixed(1)},${H - bot} Z`} fill="url(#tfill)" className="tarea" />}
            {pts.length > 1 && <path d={path} fill="none" stroke="#4c6a00" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="tline" />}
            {pts.map((p, i) => (
              <g key={p.w} className="tdot" style={{ animationDelay: 300 + i * 90 + 'ms' }}>
                <circle cx={x(p.w)} cy={y(p.v)} r="5.5" fill="#ffffff" stroke={TYPES[WEEKTYPE[p.w]].color} strokeWidth="2.6" />
                {p.v === best.v && <circle cx={x(p.w)} cy={y(p.v)} r="9" fill="none" stroke="#4c6a00" strokeOpacity=".5" />}
                <text x={Math.min(W - 16, Math.max(16, x(p.w)))} y={y(p.v) - 11} textAnchor="middle" fontSize="10" fontWeight="800" fill="#1d2410">
                  {f1(p.v)}
                </text>
              </g>
            ))}
            {WK.map((w) => (
              <text key={w} x={x(w)} y={H - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill={TYPES[WEEKTYPE[w]].color}>
                {w}주
              </text>
            ))}
          </svg>
          <div className="tstats">
            <div>
              <small>{isBw ? '처음' : '처음 기록'}</small>
              <b>{f1(first.v)}<i>{unit}</i></b>
            </div>
            <div>
              <small>{isBw ? '최근' : '최고'}</small>
              <b>{f1(isBw ? last.v : best.v)}<i>{unit}</i></b>
            </div>
            <div>
              <small>변화</small>
              <b className={diff > 0 && !isBw ? 'up' : ''}>{pts.length > 1 ? sgn(diff) : '—'}<i>{pts.length > 1 ? unit : ''}</i></b>
              {pts.length > 1 && <em>{sgn(pc)}%</em>}
            </div>
          </div>
          <p className="small">
            {isBw
              ? '그 주에 입력한 체중의 평균입니다. 기록이 있는 주만 이어서 그립니다.'
              : 'e1RM은 무게 × (1 + 렙 ÷ 30)로 추정한 값이며 그 주의 가장 좋은 세트 기준입니다. 점 색은 주차 유형(헤비·중간·볼륨·회복)이고, 렙이 10회를 넘으면 오차가 커집니다.'}
          </p>
        </>
      )}
    </div>
  )
}
