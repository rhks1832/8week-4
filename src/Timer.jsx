import { useEffect, useState } from 'react'
import { haptic, beep } from './fx.jsx'

export default function Timer({ timer, close, add, sound = true, vib = true }) {
  const [now, setNow] = useState(Date.now())
  const left = Math.max(0, Math.ceil((timer.end - now) / 1000))
  const done = left === 0
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [timer.id])
  useEffect(() => {
    if (done) {
      if (vib) haptic([200, 100, 200])
      if (sound) beep(3)
    }
  }, [done])
  const pct = Math.min(100, Math.max(0, (1 - left / timer.total) * 100))
  const m = Math.floor(left / 60)
  const s = String(left % 60).padStart(2, '0')
  return (
    <div className={'timer' + (done ? ' done' : '')} role="timer">
      <div className="tbar" style={{ width: pct + '%' }} />
      <div className="tin">
        <div>
          <small>{done ? '휴식 끝' : '휴식 중'} · {timer.label}</small>
          <b>{done ? '다음 세트 시작' : `${m}:${s}`}</b>
        </div>
        <div className="tbtn">
          {!done && <button onClick={add}>+30초</button>}
          <button onClick={close}>닫기</button>
        </div>
      </div>
    </div>
  )
}
