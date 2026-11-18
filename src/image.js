import { DAYS, LIFT, TYPES, WEEKTYPE } from './data.js'
import { getLog, getSet, fmt } from './logic.js'

// 오늘 운동 결과를 1080px 폭 PNG(data URL)로 그립니다. 외부 라이브러리 없음.
export function dayImage(data, w, d, info) {
  const day = DAYS[d - 1]
  const T = TYPES[WEEKTYPE[w]]
  const log = getLog(data, w, d)
  const sets = Array.from({ length: 5 }, (_, i) => i).map((si) => getSet(log, 0, si)).filter((s) => parseFloat(s.w) > 0 && parseFloat(s.r) > 0)
  const W = 1080
  const pad = 64
  const H = 1000 + sets.length * 96
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const font = '-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif'
  g.fillStyle = '#f7f4ea'
  g.fillRect(0, 0, W, H)
  const gr = g.createLinearGradient(0, 0, 0, 300)
  gr.addColorStop(0, '#e6f7a6')
  gr.addColorStop(1, '#f7f4ea')
  g.fillStyle = gr
  g.fillRect(0, 0, W, 300)
  g.fillStyle = '#9bc21a'
  g.fillRect(0, 296, W, 6)
  g.fillStyle = '#4c6a00'
  g.font = '800 26px ' + font
  g.fillText('8-WEEK POWERBUILDING', pad, 96)
  g.fillStyle = '#1d2410'
  g.font = '900 76px ' + font
  g.fillText(w + '주차 · ' + d + '일차 ' + day.name, pad, 196)
  g.fillStyle = '#6b6f58'
  g.font = '600 30px ' + font
  g.fillText(T.name + (log.date ? '  ·  ' + log.date : ''), pad, 252)

  let y = 420
  g.fillStyle = '#6b6f58'
  g.font = '600 30px ' + font
  g.fillText('오늘 총 볼륨', pad, y)
  g.fillStyle = '#4c6a00'
  g.font = '900 120px ' + font
  g.fillText(Math.round(info.vol).toLocaleString('ko-KR'), pad, y + 130)
  const vw = g.measureText(Math.round(info.vol).toLocaleString('ko-KR')).width
  g.fillStyle = '#6b6f58'
  g.font = '700 36px ' + font
  g.fillText('kg×렙', pad + vw + 16, y + 130)
  if (info.vsText) {
    g.fillStyle = '#1d2410'
    g.font = '700 32px ' + font
    g.fillText(info.vsText, pad, y + 190)
  }

  y += 260
  g.fillStyle = '#1d2410'
  g.font = '800 38px ' + font
  g.fillText(LIFT[day.lift].ko + ' ' + LIFT[day.lift].en, pad, y)
  y += 30
  sets.forEach((s, i) => {
    g.fillStyle = '#ffffff'
    g.fillRect(pad, y, W - pad * 2, 80)
    g.fillStyle = '#9bc21a'
    g.font = '800 30px ' + font
    g.fillText(i + 1 + '세트', pad + 28, y + 52)
    g.fillStyle = '#1d2410'
    g.font = '800 38px ' + font
    g.textAlign = 'right'
    g.fillText(fmt(parseFloat(s.w)) + ' kg × ' + s.r, W - pad - 28, y + 54)
    g.textAlign = 'left'
    y += 96
  })
  y += 30
  if (info.e1 > 0) {
    g.fillStyle = '#6b6f58'
    g.font = '600 30px ' + font
    g.fillText('추정 1RM (e1RM)', pad, y + 20)
    g.fillStyle = '#4c6a00'
    g.font = '900 64px ' + font
    g.fillText(fmt(info.e1) + ' kg' + (info.pr ? '   NEW PR' : ''), pad, y + 100)
  }
  g.fillStyle = '#8a8d73'
  g.font = '500 22px ' + font
  g.fillText('추정치입니다 · © 좌용관', pad, H - 50)
  return c.toDataURL('image/png')
}
