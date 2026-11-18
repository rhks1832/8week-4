import { useState, useEffect } from 'react'
import { LIFT, LIFT_ORDER, TYPES, WEEKTYPE } from './data.js'
import { num, fmt, targetWeight, cfgOf } from './logic.js'
import { Num, confetti, haptic } from './fx.jsx'

const half = (x) => Math.round(x * 2) / 2
const est = (w, r) => {
  const kg = parseFloat(w)
  const reps = parseInt(r, 10)
  if (!(kg > 0) || !(reps >= 1)) return 0
  return half(reps === 1 ? kg : kg * (1 + reps / 30))
}

export default function Onboarding({ data, update, go }) {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState('know')
  const valid = LIFT_ORDER.filter((k) => (mode === 'know' ? num(data.start[k]) > 0 : est(data.est[k].w, data.est[k].r) > 0))

  const toResult = () => {
    haptic(15)
    if (mode === 'est')
      update((n) =>
        LIFT_ORDER.forEach((k) => {
          const e = est(n.est[k].w, n.est[k].r)
          if (e > 0) n.start[k] = String(e)
        })
      )
    setStep(2)
  }
  useEffect(() => {
    if (step === 2) setTimeout(() => confetti(), 350)
  }, [step])
  const finish = () => {
    haptic(20)
    update((n) => {
      n.ui.onboarded = true
      n.ui.w = 1
      n.ui.d = 1
    })
    go('work')
  }
  const pf = cfgOf(data).pf

  return (
    <div className="app onb">
      <div className="dots">
        {[0, 1, 2].map((i) => (
          <i key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>

      {step === 0 && (
        <div className="step" key="s0">
          <p className="eyebrow">8-WEEK POWERBUILDING</p>
          <h1 className="hero">
            8주 4분할
            <br />
            <em>파워빌딩</em>
          </h1>
          <p className="sub">정체기를 깨는 90 · 80 · 70% 주기 프로그램.<br />웨이트만 60분 이내, 회복이 먼저입니다.</p>
          <div className="cyc" aria-label="8주 구성">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((w, i) => (
              <div key={w} className="cb" style={{ '--c': TYPES[WEEKTYPE[w]].color, '--d': i * 70 + 'ms', '--h': ({ C: 54, B: 74, A: 100, R: 34 })[WEEKTYPE[w]] + '%' }}>
                <i />
                <small>{w}</small>
              </div>
            ))}
          </div>
          <ul className="feat">
            <li>
              <b>자동 목표 중량</b> 1RM만 넣으면 8주 중량이 계산됩니다
            </li>
            <li>
              <b>수행능력 판정</b> 떨어지면 쉬라고 알려 줍니다
            </li>
            <li>
              <b>휴식 타이머 · 볼륨 기록</b> 세트마다 바로 입력
            </li>
          </ul>
          <button className="btn solid big" onClick={() => setStep(1)}>
            내 프로그램 만들기
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="step" key="s1">
          <button className="back" onClick={() => setStep(0)}>
            ← 이전
          </button>
          <h2 className="h2">내 1RM을 알려 주세요</h2>
          <div className="seg2 modes">
            <button className={mode === 'know' ? 'on' : ''} onClick={() => setMode('know')}>
              1RM을 알아요
            </button>
            <button className={mode === 'est' ? 'on' : ''} onClick={() => setMode('est')}>
              기록으로 추정할게요
            </button>
          </div>
          <p className="small">{mode === 'know' ? '종목별 1RM(kg)을 입력하세요. 모르는 종목은 비워 두고 나중에 입력해도 됩니다.' : '최근에 든 무게와 그 횟수를 넣으세요. 3~5회 기록이 가장 정확합니다.'}</p>
          <div className="lifts">
            {LIFT_ORDER.map((k) => (
              <div className="card lc" key={k}>
                <div className="lname">
                  {LIFT[k].ko}
                  <small>{LIFT[k].en}</small>
                </div>
                {mode === 'know' ? (
                  <div className="inw">
                    <input inputMode="decimal" placeholder="1RM (kg)" value={data.start[k]} onChange={(e) => update((n) => (n.start[k] = e.target.value.replace(/[^0-9.]/g, '')))} />
                  </div>
                ) : (
                  <>
                    <div className="row2">
                      <div className="inw">
                        <input inputMode="decimal" placeholder="무게 (kg)" value={data.est[k].w} onChange={(e) => update((n) => (n.est[k].w = e.target.value.replace(/[^0-9.]/g, '')))} />
                      </div>
                      <div className="inw">
                        <input inputMode="numeric" placeholder="횟수" value={data.est[k].r} onChange={(e) => update((n) => (n.est[k].r = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)))} />
                      </div>
                    </div>
                    <p className="estline">추정 1RM <b>{est(data.est[k].w, data.est[k].r) > 0 ? fmt(est(data.est[k].w, data.est[k].r)) + ' kg' : '—'}</b></p>
                  </>
                )}
              </div>
            ))}
          </div>
          <button className="btn solid big" disabled={valid.length === 0} onClick={toResult}>
            {valid.length === 0 ? '1개 이상 입력해 주세요' : `내 프로그램 확인하기 (${valid.length}/4)`}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="step" key="s2">
          <p className="eyebrow">READY</p>
          <h2 className="h2">내 프로그램이 준비됐어요</h2>
          <p className="small">수행 1RM(1RM × {pf})의 비율로 계산한 목표 중량입니다.</p>
          <div className="lifts">
            {LIFT_ORDER.filter((k) => num(data.start[k]) > 0).map((k, i) => (
              <div className="card rc" key={k} style={{ '--i': i }}>
                <div className="rt">
                  <b>{LIFT[k].ko}</b>
                  <span>
                    1RM <Num v={num(data.start[k])} dec={1} />kg
                  </span>
                </div>
                <div className="rg">
                  <div>
                    <small>1주차 · 볼륨 70%</small>
                    <b>
                      <Num v={targetWeight(data, k, 1)} dec={1} />
                      <i>kg</i>
                    </b>
                  </div>
                  <div>
                    <small>3주차 · 헤비 90%</small>
                    <b className="hot">
                      <Num v={targetWeight(data, k, 3)} dec={1} />
                      <i>kg</i>
                    </b>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn solid big" onClick={finish}>
            1주차 1일차 시작하기
          </button>
          <button className="back center" onClick={() => setStep(1)}>
            1RM 다시 입력
          </button>
        </div>
      )}
    </div>
  )
}
