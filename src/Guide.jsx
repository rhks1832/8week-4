import { useState } from 'react'
import g from './guide.json'

export default function Guide() {
  const [open, setOpen] = useState(0)
  return (
    <div className="stack">
      <p className="lead">3분이면 끝. 필요한 항목만 펼쳐 보세요.</p>
      {g.sections.map((s, i) => (
        <section className="card acc" key={s.title}>
          <button className="acch" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            <span>{s.title}</span>
            <i>{open === i ? '−' : '+'}</i>
          </button>
          <div className={'accw' + (open === i ? ' open' : '')}>
            <div className="accb">
              {s.intro && <p className="small">{s.intro}</p>}
              {s.items.map((it) => (
                <div className="gi" key={it.label}>
                  <b>{it.label}</b>
                  <p>{it.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
      <p className="warnline">{g.disclaimer}</p>
    </div>
  )
}
