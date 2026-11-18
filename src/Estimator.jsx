import { LIFT, LIFT_ORDER } from './data.js'

const half = (x) => Math.round(x * 2) / 2
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const estimate = (w, r) => {
  const kg = parseFloat(w)
  const reps = parseInt(r, 10)
  if (!(kg > 0) || !(reps >= 1)) return null
  return half(reps === 1 ? kg : kg * (1 + reps / 30))
}
const repMax = (e, n) => half(n === 1 ? e : e / (1 + n / 30))
const note = (r) => {
  const x = parseInt(r, 10)
  if (!(x >= 1)) return null
  if (x > 10) return ['bad', '10회를 넘으면 오차가 큽니다. 3~5회 기록을 쓰세요']
  if (x > 5) return ['mid', '6~10회는 참고용입니다']
  return ['ok', '정확도 양호']
}

export default function Estimator({ data, update, go }) {
  const res = LIFT_ORDER.map((k) => estimate(data.est[k].w, data.est[k].r))
  const any = res.some((x) => x !== null)
  return (
    <div className="stack">
      <p className="lead">종목별로 <b>최근에 든 무게</b>와 <b>그 무게로 한 횟수</b>만 넣으세요. 3~5회 기록이 가장 정확합니다.</p>
      {LIFT_ORDER.map((k, i) => {
        const e = res[i]
        const n = note(data.est[k].r)
        return (
          <section className="card" key={k}>
            <h2>
              {LIFT[k].ko} <small className="en">{LIFT[k].en}</small>
            </h2>
            <div className="row2">
              <label className="fld">
                <span>든 무게 (kg)</span>
                <div className="inw"><input inputMode="decimal" placeholder="예: 100" value={data.est[k].w} onChange={(ev) => update((d) => (d.est[k].w = ev.target.value.replace(/[^0-9.]/g, '')))} /></div>
              </label>
              <label className="fld">
                <span>횟수</span>
                <div className="inw"><input inputMode="numeric" placeholder="예: 5" value={data.est[k].r} onChange={(ev) => update((d) => (d.est[k].r = ev.target.value.replace(/[^0-9]/g, '').slice(0, 2)))} /></div>
              </label>
            </div>
            <div className="result">
              <span>추정 1RM</span>
              <strong>{e === null ? '—' : fmt(e) + ' kg'}</strong>
            </div>
            {n && e !== null && <div className={'msg2 ' + n[0]}>{n[1]}</div>}
            {e !== null && (
              <button className="btn ghost" onClick={() => { update((d) => (d.start[k] = String(e))); go('home') }}>
                홈에 적용 (시작 1RM = {fmt(e)}kg)
              </button>
            )}
          </section>
        )
      })}
      {any && (
        <section className="card">
          <h2>반복 횟수별 추정 중량 (kg)</h2>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>횟수</th>
                  {LIFT_ORDER.map((k, i) => res[i] !== null && <th key={k}>{LIFT[k].ko}</th>)}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, j) => j + 1).map((n) => (
                  <tr key={n}>
                    <td>{n}회</td>
                    {LIFT_ORDER.map((k, i) => res[i] !== null && <td key={k}>{fmt(repMax(res[i], n))}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small">‘5회’ = 그 무게로 최대 5회까지 가능한 무게(5RM). 0.5kg 단위, 모든 값은 추정치입니다.</p>
        </section>
      )}
    </div>
  )
}
