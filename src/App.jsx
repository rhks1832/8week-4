import { useState, useEffect, useRef } from 'react'
import { load, save } from './store.js'
import { useRipple, haptic, primeAudio, useWakeLock } from './fx.jsx'
import Home from './Home.jsx'
import Workout from './Workout.jsx'
import Summary from './Summary.jsx'
import Estimator from './Estimator.jsx'
import Guide from './Guide.jsx'
import Onboarding from './Onboarding.jsx'
import Timer from './Timer.jsx'

const TABS = [
  ['home', '홈'],
  ['work', '운동'],
  ['sum', '요약'],
  ['rm', '1RM'],
  ['guide', '설명'],
]

export default function App() {
  const [data, setData] = useState(load)
  const [tab, setTab] = useState(() => (TABS.some((t) => t[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'home'))
  const [toast, setToast] = useState(null)
  const [timer, setTimer] = useState(null)
  const first = useRef(true)
  useRipple()
  useWakeLock(!!data.ui.wake && data.ui.onboarded && (tab === 'work' || !!timer))

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    save(data)
  }, [data])

  useEffect(() => {
    const on = () => {
      const h = location.hash.slice(1)
      if (TABS.some((t) => t[0] === h)) setTab(h)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3400)
    return () => clearTimeout(id)
  }, [toast])

  const update = (fn) =>
    setData((prev) => {
      const n = JSON.parse(JSON.stringify(prev))
      fn(n)
      return n
    })
  const go = (t) => {
    haptic(8)
    setTab(t)
    try {
      history.replaceState(null, '', '#' + t)
    } catch (e) {}
    window.scrollTo({ top: 0 })
  }
  const notify = (msg, kind) => setToast({ id: Date.now(), msg, kind })
  const startTimer = (sec, label) => {
    haptic(15)
    primeAudio()
    setTimer({ end: Date.now() + sec * 1000, total: sec, label, id: Date.now() })
  }

  const P = { data, update, setData, go, notify, startTimer }

  if (!data.ui.onboarded) return <Onboarding {...P} />

  return (
    <div className="app">
      <header className="top">
        <p className="eyebrow">8-WEEK POWERBUILDING</p>
        <h1>4분할 파워빌딩 프로그램</h1>
      </header>
      <main key={tab} className="page">
        {tab === 'home' && <Home {...P} />}
        {tab === 'work' && <Workout {...P} />}
        {tab === 'sum' && <Summary {...P} />}
        {tab === 'rm' && <Estimator {...P} />}
        {tab === 'guide' && <Guide {...P} />}
      </main>
      {toast && (
        <div className={'toast ' + (toast.kind || '')} key={toast.id} role="status">
          {toast.msg}
        </div>
      )}
      {timer && <Timer sound={data.ui.sound !== false} vib={data.ui.vib !== false} timer={timer} close={() => setTimer(null)} add={() => setTimer({ ...timer, end: timer.end + 30000, total: timer.total + 30 })} />}
      <nav className="tabs">
        {TABS.map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => go(k)}>
            {l}
          </button>
        ))}
      </nav>
    </div>
  )
}
