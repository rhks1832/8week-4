import { useState, useEffect } from 'react'
import { LIFT, LIFT_ORDER, COPY_TXT, dailyQuote, DAYS, TYPES, WEEKTYPE } from './data.js'
import { Num, beep, haptic } from './fx.jsx'
import { INSTAGRAM_URL, INQUIRY_URL } from './config.js'
import { num, fmt, doneDays, cfgOf, nextWorkout, weekDone } from './logic.js'
import { defaults, merge } from './store.js'

const clean = (v) => v.replace(/[^0-9.]/g, '')

function Field({ label, value, onChange, hint, unit }) {
  return (
    <label className="fld">
      <span>{label}</span>
      <div className="inw">
        <input inputMode="decimal" value={value} onChange={(e) => onChange(clean(e.target.value))} />
        {unit && <i>{unit}</i>}
      </div>
      {hint && <em>{hint}</em>}
    </label>
  )
}

export default function Home({ data, update, setData, go }) {
  const done = doneDays(data)
  const nx = nextWorkout(data)
  const [backup, setBackup] = useState('')
  const [msg, setMsg] = useState('')
  const [armed, setArmed] = useState(false)
  const c = data.cfg
  const setCfg = (k, v) => update((n) => (n.cfg[k] = v))
  const cfgVal = (k) => String(c[k])
  const cc = cfgOf(data)

  const [inst, setInst] = useState(null)
  useEffect(() => {
    const on = (e) => {
      e.preventDefault()
      setInst(e)
    }
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])
  const setUiK = (k, v) => update((n) => (n.ui[k] = v))
  const Tog = ({ k, label, hint, test }) => (
    <button className={'tog' + (data.ui[k] !== false ? ' on' : '')} onClick={() => { const v = data.ui[k] === false; setUiK(k, v); if (v && test) test() }} role="switch" aria-checked={data.ui[k] !== false}>
      <span><b>{label}</b><small>{hint}</small></span>
      <i />
    </button>
  )

  const exportText = () => JSON.stringify(data)
  const doCopy = () => {
    const t = exportText()
    setBackup(t)
    try {
      navigator.clipboard.writeText(t).then(
        () => setMsg('복사되었습니다. 메모 앱 등에 붙여 넣어 보관하세요.'),
        () => setMsg('아래 내용을 길게 눌러 전체 선택 후 복사하세요.')
      )
    } catch (e) {
      setMsg('아래 내용을 길게 눌러 전체 선택 후 복사하세요.')
    }
  }
  const [restore, setRestore] = useState('')
  const doRestore = () => {
    try {
      const d = JSON.parse(restore)
      if (!d || typeof d !== 'object' || d.v !== 1) throw new Error()
      setData(merge(null, d))
      setMsg('복원되었습니다.')
      setRestore('')
    } catch (e) {
      setMsg('백업 내용이 올바르지 않습니다. 복사한 내용 전체를 붙여 넣었는지 확인하세요.')
    }
  }
  const reset = () => {
    if (!armed) {
      setArmed(true)
      setTimeout(() => setArmed(false), 3000)
      return
    }
    setData(defaults())
    setArmed(false)
    setMsg('모든 기록이 삭제되었습니다.')
  }

  const next = LIFT_ORDER.map((k) => {
    const base = num(data.late[k]) > 0 ? num(data.late[k]) : num(data.start[k])
    const inc = k === 'BP' || k === 'OHP' ? cc.upInc : cc.lowInc
    return { k, base, inc, nxt: base > 0 ? base + inc : 0 }
  })

  return (
    <div className="stack">
      <section className="card quote">
        <p className="qlab">TODAY</p>
        <p className="qtxt">“{dailyQuote()}”</p>
      </section>
      <section className="card prog hero2">
        <div className="progtop">
          <b><Num v={done} /></b>
          <span> / {DAYS.length * 8} 일차 완료</span>
        </div>
        <div className="bar">
          <i style={{ width: (done / (DAYS.length * 8)) * 100 + '%' }} />
        </div>
        {nx ? (
          <>
            <p className="nxt">
              다음 운동 <b>{nx.w}주차 {nx.d}일차 · {DAYS[nx.d - 1].name}</b>
              <span style={{ color: TYPES[WEEKTYPE[nx.w]].color }}> {TYPES[WEEKTYPE[nx.w]].name}</span>
            </p>
            <button
              className="btn solid"
              onClick={() => {
                update((n) => {
                  n.ui.w = nx.w
                  n.ui.d = nx.d
                })
                go('work')
              }}
            >
              이어서 운동하기
            </button>
          </>
        ) : (
          <p className="nxt"><b>8주 프로그램 완료</b> 아래에서 다음 사이클 1RM을 확인하세요.</p>
        )}
      </section>

      <section className="card">
        <h2>8주 로드맵</h2>
        <div className="road">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((x, i) => (
            <button
              key={x}
              className="rn"
              style={{ '--c': TYPES[WEEKTYPE[x]].color, '--p': (weekDone(data, x) / DAYS.length) * 360 + 'deg', '--d': i * 60 + 'ms' }}
              onClick={() => {
                update((n) => {
                  n.ui.w = x
                  n.ui.d = 1
                })
                go('work')
              }}
            >
              <span className="ring">
                <b>{x}</b>
              </span>
              <small>{TYPES[WEEKTYPE[x]].name.replace(' 주', '')}</small>
            </button>
          ))}
        </div>
        <p className="small">링은 그 주에 기록한 일차 수({DAYS.length}일 기준)입니다. 눌러서 해당 주차로 이동하세요.</p>
      </section>

      <section className="card">
        <h2>① 내 1RM 입력 (kg)</h2>
        <p className="small">모르면 <button className="lnk" onClick={() => go('rm')}>1RM 탭</button>에서 최근 기록으로 추정해 ‘홈에 적용’을 누르세요.</p>
        <div className="lifts">
          {LIFT_ORDER.map((k) => (
            <div className="lrow" key={k}>
              <div className="lname">
                {LIFT[k].ko}
                <small>{LIFT[k].en}</small>
              </div>
              <Field label="시작 1RM" value={data.start[k]} onChange={(v) => update((n) => (n.start[k] = v))} />
              <Field label="③ 5주차부터 (선택)" value={data.late[k]} onChange={(v) => update((n) => (n.late[k] = v))} hint={data.late[k] === '' && num(data.start[k]) > 0 ? '비우면 시작 1RM 그대로' : ''} />
              <div className="perf">
                수행 1RM
                <b>{num(data.start[k]) > 0 ? fmt(num(data.start[k]) * cc.pf) + 'kg' : '—'}</b>
              </div>
            </div>
          ))}
        </div>
        <p className="small">1~4주차는 ‘시작 1RM’, 5~8주차는 ‘③’(비우면 시작 1RM) 기준으로 중량이 계산됩니다. 3주차(헤비 주)가 끝난 뒤 e1RM이 시작 1RM보다 5% 이상 높게 나오면 ℹ 강도 부족 신호가 표시됩니다.</p>
        <p className="warnline">진행 중에는 시작 1RM과 보정 비율을 바꾸지 마세요. 해당 구간의 목표 중량이 모두 바뀝니다.</p>
      </section>

      <section className="card">
        <h2>앱 설정</h2>
        <div className="togs">
          <Tog k="sound" label="휴식 종료 소리" hint="타이머가 끝나면 알림음이 울려요" test={() => beep(2)} />
          <Tog k="vib" label="진동" hint="타이머 종료 · 버튼 터치" test={() => haptic(60)} />
          <Tog k="wake" label="운동 중 화면 꺼짐 방지" hint="운동 탭이나 타이머가 켜진 동안 화면이 유지돼요" />
        </div>
        {inst && (
          <button className="btn ghost" onClick={() => { inst.prompt(); setInst(null) }}>
            홈 화면에 앱 설치하기
          </button>
        )}
        <p className="small">홈 화면에 추가하면 앱처럼 바로 열리고, 한 번 열어 두면 헬스장에서 신호가 약해도 열립니다. 아이폰은 사파리에서 공유 → ‘홈 화면에 추가’를 누르세요.</p>
      </section>

      <section className="card">
        <details>
          <summary>고급 설정 (보통 그대로 사용하세요)</summary>
          <div className="cfg">
            <Field label="무게 반올림 단위 (kg)" value={cfgVal('step')} onChange={(v) => setCfg('step', v)} hint="보유 원판에 맞게 (1.25 · 2.5 · 5)" />
            <Field label="수행 1RM 보정 비율" value={cfgVal('pf')} onChange={(v) => setCfg('pf', v)} hint="0.85~1.0, 1.0이면 실제 1RM의 90/80/70%" />
            <Field label="수행능력 감소 판정 기준 (%)" value={cfgVal('thr')} onChange={(v) => setCfg('thr', v)} hint="같은 유형 주 대비 e1RM이 이만큼 줄면 ⚠ (절반이면 △)" />
            <Field label="강도 부족 신호 기준 (%)" value={cfgVal('easy')} onChange={(v) => setCfg('easy', v)} hint="e1RM이 기준 1RM보다 이만큼 높으면 ℹ" />
            <Field label="최소 수면 시간 (시간)" value={cfgVal('minSleep')} onChange={(v) => setCfg('minSleep', v)} />
            <Field label="낮은 컨디션 기준 (1~5점 이하)" value={cfgVal('lowCond')} onChange={(v) => setCfg('lowCond', v)} />
            <Field label="다음 사이클 증량 · 상체 (kg)" value={cfgVal('upInc')} onChange={(v) => setCfg('upInc', v)} />
            <Field label="다음 사이클 증량 · 하체 (kg)" value={cfgVal('lowInc')} onChange={(v) => setCfg('lowInc', v)} />
          </div>
        </details>
      </section>

      <section className="card">
        <h2>8주가 끝난 뒤 — 다음 시작 1RM</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>종목</th>
                <th>현재 기준</th>
                <th>증량</th>
                <th>다음 시작</th>
              </tr>
            </thead>
            <tbody>
              {next.map((x) => (
                <tr key={x.k}>
                  <td>{LIFT[x.k].ko}</td>
                  <td>{x.base > 0 ? fmt(x.base) : '—'}</td>
                  <td>+{x.inc}</td>
                  <td className="hl">{x.nxt > 0 ? fmt(x.nxt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">새 사이클은 이 값을 시작 1RM에 입력하고 1주차부터 다시 시작합니다. 증량 폭은 설계 값입니다. 사용 설명 8번도 확인하세요.</p>
      </section>

      <section className="card">
        <h2>구매자 정보</h2>
        <label className="fld">
          <span>구매자 이름 / 주문번호</span>
          <div className="inw">
            <input style={{ textAlign: 'left' }} value={data.buyer} onChange={(e) => update((n) => (n.buyer = e.target.value.slice(0, 40)))} />
          </div>
        </label>
        <p className="small">{COPY_TXT}</p>
      </section>

      <section className="card">
        <details>
          <summary>기록 백업 · 복원</summary>
          <p className="small">입력한 기록은 이 기기의 브라우저에 자동 저장됩니다. 브라우저 데이터를 지우거나 기기를 바꾸면 사라지므로, 가끔 백업해 두세요.</p>
          <button className="btn ghost" onClick={doCopy}>
            기록 백업 복사
          </button>
          {backup && <textarea readOnly rows={4} value={backup} onFocus={(e) => e.target.select()} />}
          <p className="small">다른 기기로 옮길 때는 복사한 내용을 아래에 붙여 넣고 ‘복원’을 누르세요. 현재 기록은 덮어쓰기 됩니다.</p>
          <textarea rows={3} placeholder="백업 내용 붙여넣기" value={restore} onChange={(e) => setRestore(e.target.value)} />
          <button className="btn ghost" onClick={doRestore} disabled={!restore}>
            복원
          </button>
          {msg && <p className="msg">{msg}</p>}
          <button className={'reset' + (armed ? ' warn' : '')} onClick={reset}>
            {armed ? '한 번 더 누르면 모든 기록이 삭제됩니다' : '모든 기록 삭제'}
          </button>
        </details>
      </section>

      {(INSTAGRAM_URL || INQUIRY_URL) && (
        <div className="cta">
          {INSTAGRAM_URL && <a className="btn ghost" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">인스타그램 팔로우</a>}
          {INQUIRY_URL && <a className="btn solid" href={INQUIRY_URL} target="_blank" rel="noopener noreferrer">온라인 PT 문의</a>}
        </div>
      )}
      <button className="reset" onClick={() => update((n) => (n.ui.onboarded = false))}>시작 화면 다시 보기</button>
    </div>
  )
}
