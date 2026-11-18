import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { LIFT, TYPES, WEEKTYPE, DAYS, TIPS, ACC_REPS, accRest, estMinutes, MAXSETS, exList, trackedDay, WARM, hasWarm, ALTS } from './data.js'
import { cfgOf, targetWeight, warmups, getLog, getSet, e1, fmt, recovery, perf, sev, dayVolume, exVolume, weekVolume, mainBest, prevBest, nextWorkout, SAME, isSkipped, suggestWeight, exBest, exPrevBest } from './logic.js'
import { Num, confetti, haptic } from './fx.jsx'
import { dayImage } from './image.js'
import { INSTAGRAM_URL, INQUIRY_URL } from './config.js'

const dig = (v) => v.replace(/[^0-9.]/g, '')
const int = (v) => v.replace(/[^0-9]/g, '').slice(0, 3)
const mmss = (s) => (s % 60 === 0 ? s / 60 + '분' : Math.floor(s / 60) + '분 ' + (s % 60) + '초')

export default function Workout({ data, update, notify, startTimer, go }) {
  const [sheet, setSheet] = useState(false)
  const [swapOpen, setSwapOpen] = useState(null)
  const [custom, setCustom] = useState('')
  const [skipArm, setSkipArm] = useState(false)
  const w = data.ui.w
  const d = data.ui.d
  const t = WEEKTYPE[w]
  const T = TYPES[t]
  const day = DAYS[d - 1]
  const log = getLog(data, w, d)
  const effective = Math.round(T.pct * cfgOf(data).pf * 100)
  const setUi = (k, v) => update((n) => (n.ui[k] = v))
  const setField = (k, v) =>
    update((n) => {
      const key = w + '-' + d
      n.logs[key] = n.logs[key] || {}
      n.logs[key][k] = v
    })
  const setCell = (ei, si, k, v) =>
    update((n) => {
      const key = w + '-' + d
      const L = (n.logs[key] = n.logs[key] || {})
      L.ex = L.ex || {}
      L.ex[ei] = L.ex[ei] || []
      L.ex[ei][si] = L.ex[ei][si] || {}
      L.ex[ei][si][k] = v
    })

  const mult = day.mult || 1
  const tracked = trackedDay(day)
  const skipped = isSkipped(data, w, d)
  const setSkip = (on) =>
    update((n) => {
      n.skips = n.skips || {}
      if (on) n.skips[w + '-' + d] = 1
      else delete n.skips[w + '-' + d]
    })
  const swapName = (ei, orig) => (data.swaps && data.swaps[d + '-' + ei]) || orig
  const setSwap = (ei, name) =>
    update((n) => {
      n.swaps = n.swaps || {}
      if (name) n.swaps[d + '-' + ei] = name
      else delete n.swaps[d + '-' + ei]
    })
  // 비어 있는 세트에 값 채우기 (이미 입력한 칸은 건드리지 않음)
  const fillWeights = (ei, kg, count) =>
    update((n) => {
      const key = w + '-' + d
      const L = (n.logs[key] = n.logs[key] || {})
      L.ex = L.ex || {}
      L.ex[ei] = L.ex[ei] || []
      for (let si = 0; si < count; si++) {
        L.ex[ei][si] = L.ex[ei][si] || {}
        if (!L.ex[ei][si].w) L.ex[ei][si].w = String(kg)
      }
    })
  const copyFirst = (ei, count) =>
    update((n) => {
      const key = w + '-' + d
      const L = (n.logs[key] = n.logs[key] || {})
      const first = (L.ex && L.ex[ei] && L.ex[ei][0]) || {}
      if (!first.w && !first.r) return
      for (let si = 1; si < count; si++) {
        L.ex[ei][si] = L.ex[ei][si] || {}
        if (!L.ex[ei][si].w && first.w) L.ex[ei][si].w = first.w
        if (!L.ex[ei][si].r && first.r) L.ex[ei][si].r = first.r
      }
    })
  const nav = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const all = Array.from(document.querySelectorAll('.dayc .setrow input'))
    const i = all.indexOf(e.target)
    if (i >= 0 && all[i + 1]) all[i + 1].focus()
    else e.target.blur()
  }
  const exercises = exList(day).map((x) => (x.main ? { ...x, name: day.mainName || LIFT[day.lift].full } : x))
  const order = exercises.map((_, i) => i).sort((a, b) => (exercises[b].lead ? 1 : 0) - (exercises[a].lead ? 1 : 0) || a - b)
  const recMsg = recovery(data, w, d)
  const perfMsg = perf(data, w, d)
  const wu = day.lift ? warmups(data, day.lift, w, mult) : null
  const best = mainBest(data, w, d)
  const pb = prevBest(data, w, d)
  const isPR = tracked && pb > 0 && best.reps <= 10 && best.e > pb + 0.01
  const prRef = useRef(false)
  useEffect(() => {
    if (isPR && !prRef.current) {
      notify('NEW PR · ' + LIFT[day.lift].ko + ' e1RM ' + fmt(best.e) + 'kg (+' + fmt(best.e - pb) + 'kg)', 'pr')
      confetti()
      haptic([30, 40, 30])
    }
    prRef.current = isPR
  }, [isPR, w, d])

  return (
    <div className="stack">
      <div className="weeks" role="tablist">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((x) => (
          <button key={x} className={'wk' + (x === w ? ' on' : '')} style={{ '--c': TYPES[WEEKTYPE[x]].color }} onClick={() => setUi('w', x)}>
            <b>{x}</b>
            <small>{TYPES[WEEKTYPE[x]].name.replace(' 주', '')}</small>
          </button>
        ))}
      </div>

      <section className="card weekinfo" style={{ '--c': T.color }}>
        <h2>
          {w}주차 · {T.name}
        </h2>
        <p>
          {t === 'R'
            ? `회복 주 (수행 1RM의 70% ≈ 실제 1RM의 ${effective}%): 본세트 2세트 × 5회, 여유 3회 이상. 보조운동도 2세트로 줄입니다. 이번 주에는 수행능력 판정을 하지 않습니다 — 회복이 목적입니다.`
            : `${T.name} (수행 1RM의 ${Math.round(T.pct * 100)}% ≈ 실제 1RM의 ${effective}%): 본세트 ${T.sets}세트 × ${T.reps}회, 마지막 렙에서 여유 ${T.rir}회. 첫 본세트가 ${T.floor}회에 못 미치면 ⚠ 휴식 신호가 표시됩니다.`}
        </p>
        <p className="tip">팁: {TIPS[t]}</p>
        <p className="wkvol">이번 주 총 볼륨 <b>{Math.round(weekVolume(data, w)).toLocaleString()}</b> kg×렙</p>
      </section>

      <div className="days">
        {DAYS.map((x) => (
          <button key={x.no} className={x.no === d ? 'on' : ''} onClick={() => setUi('d', x.no)}>
            <b>{x.no}일차</b>
            <small>{x.short || x.name}</small>
            {dayVolume(data, w, x.no) > 0 ? <i>✓</i> : isSkipped(data, w, x.no) ? <i className="sk">✕</i> : null}
          </button>
        ))}
      </div>

      <section className="card dayc" key={w + "-" + d}>
        <h2>
          {d}일차 · {day.dow} · {day.name}
        </h2>
        <p className="small">예상 소요 약 {estMinutes(day, t)}분 (웜업 포함)</p>
        {skipped && (
          <div className="skipbar">
            <span>이 일차는 건너뛰었어요. 다음 운동으로 넘어갑니다.</span>
            <button className="tool" onClick={() => setSkip(false)}>건너뛰기 취소</button>
          </div>
        )}

        <div className="recgrid">
          <label className="fld">
            <span>날짜</span>
            <div className="inw"><input value={log.date || ''} placeholder="예: 11/18" onChange={(e) => setField('date', e.target.value.slice(0, 12))} /></div>
          </label>
          <label className="fld">
            <span>수면(시간)</span>
            <div className="inw"><input inputMode="decimal" value={log.sleep || ''} onChange={(e) => setField('sleep', dig(e.target.value).slice(0, 4))} /></div>
          </label>
          <label className="fld">
            <span>컨디션(1~5)</span>
            <div className="inw"><input inputMode="numeric" value={log.cond || ''} onChange={(e) => setField('cond', e.target.value.replace(/[^1-5]/g, '').slice(0, 1))} /></div>
          </label>
          <label className="fld">
            <span>탄수화물·전해질 충분?</span>
            <div className="inw seg2">
              {['예', '아니오'].map((o) => (
                <button key={o} className={log.carb === o ? 'on' : ''} onClick={() => setField('carb', log.carb === o ? '' : o)}>
                  {o}
                </button>
              ))}
            </div>
          </label>
          <label className="fld">
            <span>총 운동시간(분)</span>
            <div className="inw"><input inputMode="numeric" value={log.time || ''} onChange={(e) => setField('time', int(e.target.value))} /></div>
          </label>
          <label className="fld">
            <span>체중(kg) · 선택</span>
            <div className="inw"><input inputMode="decimal" value={log.bw || ''} onChange={(e) => setField('bw', dig(e.target.value).slice(0, 5))} /></div>
          </label>
        </div>

        <div className={'msg2 ' + sev(recMsg)}>
          <small>회복 체크</small>
          {recMsg}
        </div>
        {tracked && (
          <div className={'msg2 ' + sev(perfMsg)}>
            <small>수행능력 체크 (메인 리프트)</small>
            {perfMsg}
          </div>
        )}

        {hasWarm(day) && (
          <div className="pull">
            <small>상체 웜업 · 모든 상체 운동 전</small>
            <b>{WARM.name}</b>
            <span>{WARM.plan}</span>
            <p>{WARM.tip}</p>
          </div>
        )}
        <div className="warm">
          {!day.lift
            ? '이 일차는 메인 리프트가 없습니다. 첫 종목을 가벼운 중량으로 1~2세트 웜업한 뒤 시작하세요. 중량은 직접 선택합니다.'
            : wu
            ? `웜업 (본세트 ${fmt(wu.tw)}kg 기준): ` + wu.items.map(([p, r, kg]) => `${Math.round(p * 100)}% × ${r}회 → ${fmt(kg)}kg`).join('  ·  ') + '  (웜업 사이 휴식 60~90초, 기록 불필요)'
              : '시작 1RM을 입력하면 웜업 중량이 표시됩니다 (홈 화면)'}
        </div>

        {order.map((ei) => {
          const ex = exercises[ei]
          const sets = T.sets
          const isMain = !!ex.main
          const tgt = isMain ? targetWeight(data, day.lift, w, mult) : ex.lift ? targetWeight(data, ex.lift, w, ex.mult || 1) : null
          const reps = isMain ? T.reps : ACC_REPS[t][ex.kind === 'c' ? 0 : 1]
          const rir = isMain || t === 'R' ? T.rir : '1~2'
          const rest = isMain ? T.rest : accRest(t, ex.kind)
          const name = isMain ? ex.name : swapName(ei, ex.name)
          const swapped = !isMain && name !== ex.name
          const sug = !isMain && !ex.lift ? suggestWeight(data, w, d, ei, ex.kind) : null
          const fillKg = tgt !== null ? tgt : sug ? sug.kg : null
          const bestX = ex.lift && !isMain ? exBest(data, w, d, ei) : null
          const prX = bestX ? exPrevBest(data, w, d, ei) : 0
          const prHit = bestX && prX > 0 && bestX.reps <= 10 && bestX.e > prX + 0.01
          const alts = ALTS[ex.name] || []
          return (
            <div className={'ex' + (isMain ? ' main' : '')} key={ei}>
              <div className="exh">
                <b>{name}</b>
                {isMain && <small>수행 1RM의 {Math.round(T.pct * mult * 100)}%</small>}
                {!isMain && ex.lift && <small>{LIFT[ex.lift].ko} 수행 1RM의 {Math.round(T.pct * (ex.mult || 1) * 100)}%</small>}
                <button className="chip" onClick={() => startTimer(rest, isMain ? LIFT[day.lift].ko : name.slice(0, 10))}>
                  휴식 {mmss(rest)} ▶
                </button>
              </div>
              <p className="target">
                목표 <b>{reps}회</b> · RIR {rir} · 휴식 {mmss(rest)}
                {(isMain || ex.lift) && (
                  <>
                    {' · '}목표 중량 <b className="hl">{tgt === null ? '1RM 입력 필요' : fmt(tgt) + 'kg'}</b>
                  </>
                )}
                {!isMain && !ex.lift && (sug ? <>{' · '}제안 중량 <b className="hl">{fmt(sug.kg)}kg</b></> : ' · 중량 직접 선택')}
              </p>
              {swapped && <p className="swapnote">원래 종목: {ex.name}</p>}
              {!isMain && ex.note && t !== 'R' && !swapped && <p className="exnote">🔥 {ex.note}</p>}
              <div className="tools">
                {fillKg !== null && (
                  <button className="tool" onClick={() => { fillWeights(ei, fillKg, sets); haptic(10) }}>
                    {tgt !== null ? '목표' : '제안'} {fmt(fillKg)}kg 채우기
                  </button>
                )}
                <button className="tool" onClick={() => { copyFirst(ei, sets); haptic(10) }}>1세트 값 복사</button>
                {!isMain && <button className="tool" onClick={() => { setSwapOpen(swapOpen === ei ? null : ei); setCustom('') }}>종목 바꾸기</button>}
              </div>
              {swapOpen === ei && !isMain && (
                <div className="swap">
                  <p className="small">기구가 없거나 통증이 있으면 같은 움직임의 운동으로 바꾸세요. 세트 수와 렙 목표는 그대로입니다.</p>
                  <div className="swaplist">
                    {alts.map((a) => (
                      <button key={a} className={'tool' + (name === a ? ' on' : '')} onClick={() => { setSwap(ei, a); setSwapOpen(null) }}>{a}</button>
                    ))}
                  </div>
                  <div className="swapin">
                    <input style={{ textAlign: 'left', fontSize: 15 }} value={custom} placeholder="직접 입력" onChange={(e) => setCustom(e.target.value.slice(0, 30))} />
                    <button className="tool" disabled={!custom.trim()} onClick={() => { setSwap(ei, custom.trim()); setSwapOpen(null) }}>적용</button>
                  </div>
                  {swapped && <button className="tool" onClick={() => { setSwap(ei, ''); setSwapOpen(null) }}>원래 종목으로</button>}
                </div>
              )}
              {Array.from({ length: sets }, (_, si) => {
                const s = getSet(log, ei, si)
                const pl = w > 1 ? getSet(getLog(data, w - 1, d), ei, si) : {}
                const prev = parseFloat(pl.w) > 0 && parseFloat(pl.r) > 0 ? fmt(parseFloat(pl.w)) + 'kg × ' + pl.r : ''
                const sv = parseFloat(s.w) > 0 && parseFloat(s.r) > 0 ? parseFloat(s.w) * parseFloat(s.r) : 0
                return (
                  <div className="setrow" key={si}>
                    <span className="sn">{si + 1}</span>
                    <input aria-label={`${name} ${si + 1}세트 중량`} inputMode="decimal" enterKeyHint="next" onFocus={(e) => e.target.select()} onKeyDown={nav} placeholder={fillKg !== null ? fmt(fillKg) : 'kg'} value={s.w || ''} onChange={(e) => setCell(ei, si, 'w', dig(e.target.value).slice(0, 6))} />
                    <i>kg ×</i>
                    <input aria-label={`${name} ${si + 1}세트 렙`} inputMode="numeric" enterKeyHint="next" onFocus={(e) => e.target.select()} onKeyDown={nav} placeholder="회" value={s.r || ''} onChange={(e) => setCell(ei, si, 'r', int(e.target.value))} />
                    <em>{sv ? Math.round(sv).toLocaleString() : ''}</em>
                    {prev && <small className="prev">직전 주 {prev}</small>}
                  </div>
                )
              })}
              <div className="exsum">
                {exVolume(data, w, d, ei) > 0 && <span>종목 총 볼륨 {Math.round(exVolume(data, w, d, ei)).toLocaleString()}</span>}
                {isMain && tracked && (() => {
                  const m = Math.max(0, ...Array.from({ length: MAXSETS }, (_, i) => i).map((si) => e1(getSet(log, 0, si).w, getSet(log, 0, si).r)))
                  return m > 0 ? <span className="hl">e1RM {fmt(m)}kg{isPR && <b className="prtag">NEW PR</b>}</span> : null
                })()}
                {bestX && bestX.e > 0 && <span className="hl">e1RM {fmt(bestX.e)}kg{prHit && <b className="prtag">NEW PR</b>}</span>}
              </div>
            </div>
          )
        })}

        <label className="fld">
          <span>메모</span>
          <div className="inw">
            <textarea rows={2} value={log.memo || ''} onChange={(e) => setField('memo', e.target.value.slice(0, 300))} placeholder="컨디션, 느낀 점 등" />
          </div>
        </label>
        <div className="daytotal">
          오늘 총 볼륨 <b><Num v={Math.round(dayVolume(data, w, d))} /></b> kg×렙
        </div>
        <button
          className="btn solid"
          disabled={dayVolume(data, w, d) === 0}
          onClick={() => {
            haptic([20, 30, 20])
            setSheet(true)
            setTimeout(() => confetti(), 250)
          }}
        >
          {dayVolume(data, w, d) === 0 ? '기록을 입력하면 완료할 수 있어요' : '오늘 운동 완료'}
        </button>
        {!skipped && dayVolume(data, w, d) === 0 && (
          <button
            className="reset"
            onClick={() => {
              if (!skipArm) {
                setSkipArm(true)
                setTimeout(() => setSkipArm(false), 3000)
                return
              }
              setSkip(true)
              setSkipArm(false)
              const nx = nextWorkout({ ...data, skips: { ...(data.skips || {}), [w + '-' + d]: 1 } })
              if (nx) {
                setUi('w', nx.w)
                setUi('d', nx.d)
              }
              notify('이 일차를 건너뛰었어요')
              window.scrollTo({ top: 0 })
            }}
          >
            {skipArm ? '한 번 더 누르면 이 일차를 건너뜁니다' : '이 일차 건너뛰기'}
          </button>
        )}
      </section>
      {sheet && createPortal(<DoneSheet data={data} w={w} d={d} isPR={isPR} close={() => setSheet(false)} go={go} setUi={setUi} />, document.body)}
    </div>
  )
}

function DoneSheet({ data, w, d, isPR, close, go, setUi }) {
  const [img, setImg] = useState(null)
  const day = DAYS[d - 1]
  const vol = dayVolume(data, w, d)
  const best = mainBest(data, w, d)
  const same = SAME[w]
  const pv = same ? dayVolume(data, same, d) : 0
  const vsText = pv > 0 ? same + '주차(같은 유형) 대비 볼륨 ' + (vol >= pv ? '+' : '') + (Math.round((vol / pv - 1) * 1000) / 10).toFixed(1) + '%' : ''
  const nx = nextWorkout(data)
  const msg = perf(data, w, d)
  const goNext = () => {
    if (nx) {
      setUi('w', nx.w)
      setUi('d', nx.d)
    }
    close()
    window.scrollTo({ top: 0 })
  }
  return (
    <div className="modal" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">{w}주차 · {d}일차 {day.name}</p>
        <h2 className="h2">오늘도 해냈어요</h2>
        <div className="bigstat">
          <small>오늘 총 볼륨</small>
          <b><Num v={Math.round(vol)} dur={1100} /><i> kg×렙</i></b>
          {vsText && <em>{vsText}</em>}
        </div>
        <div className="mini">
          {best.e > 0 && day.track !== false && (
            <div>
              <small>{LIFT[day.lift].ko} e1RM</small>
              <b>{fmt(best.e)}kg{isPR && <span className="prtag">NEW PR</span>}</b>
            </div>
          )}
          <div>
            <small>총 운동시간</small>
            <b>{getLog(data, w, d).time ? getLog(data, w, d).time + '분' : '—'}</b>
          </div>
        </div>
        <div className={'msg2 ' + sev(msg)}>{msg}</div>
        <p className="small">{nx ? `다음 운동은 ${nx.w}주차 ${nx.d}일차 ${DAYS[nx.d - 1].name}입니다.` : '8주 프로그램을 모두 마쳤습니다. 홈 화면에서 다음 사이클 1RM을 확인하세요.'}</p>
        <button className="btn solid" onClick={goNext}>{nx ? '다음 운동으로' : '닫기'}</button>
        <button className="btn ghost" onClick={() => setImg(dayImage(data, w, d, { vol, vsText, e1: day.track === false ? 0 : best.e, pr: isPR }))}>오늘 기록 이미지 저장</button>
        {img && (
          <div className="imgbox">
            <p className="tip">이미지를 길게 눌러 저장하세요</p>
            <img src={img} alt="오늘 운동 결과" />
          </div>
        )}
        {(INSTAGRAM_URL || INQUIRY_URL) && (
          <div className="cta">
            {INSTAGRAM_URL && <a className="btn ghost" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">인스타그램 팔로우</a>}
            {INQUIRY_URL && <a className="btn ghost" href={INQUIRY_URL} target="_blank" rel="noopener noreferrer">온라인 PT 문의</a>}
          </div>
        )}
        <button className="reset" onClick={close}>닫기</button>
      </div>
    </div>
  )
}
