// 記録（タイム／距離）の文字列 ⇔ 数値 変換（server/time.js と src/time.js は同じ内容）
//   parseValue('2:52.39','time') → 172.39   parseValue('8.75','time') → 8.75
//   parseValue('2.52.39','time') → 172.39（Excel由来のドット区切りも許容）
//   formatValue(172.39,'time') → '2:52.39'

const toHalf = (s) => s.replace(/[０-９．：]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))

export function parseValue(input, kind = 'time') {
  if (input === null || input === undefined) return null
  let t = toHalf(String(input)).trim()
  if (!t || t === '-' || t === '－' || t === '—') return null
  t = t.replace(/\s+/g, '').replace(/[′']/g, ':').replace(/[″"]/g, '.').replace(/,/g, '.')
  if (kind === 'distance') {
    t = t.replace(/m$/i, '')
    const n = Number(t)
    return Number.isFinite(n) ? round2(n) : null
  }
  let m
  // h:mm:ss.xx
  if ((m = t.match(/^(\d+):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/)))
    return round2(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + frac(m[4]))
  // m:ss.xx
  if ((m = t.match(/^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/)))
    return round2(Number(m[1]) * 60 + Number(m[2]) + frac(m[3]))
  // m.ss.xx（ドット区切り）
  if ((m = t.match(/^(\d+)\.(\d{1,2})\.(\d{1,3})$/)))
    return round2(Number(m[1]) * 60 + Number(m[2]) + frac(m[3]))
  // ss.xx
  if ((m = t.match(/^(\d+)(?:\.(\d{1,3}))?$/)))
    return round2(Number(m[1]) + frac(m[2]))
  return null
}

function frac(d) {
  if (!d) return 0
  return Number(d) / Math.pow(10, d.length)
}
const round2 = (n) => Math.round(n * 100) / 100

export function formatValue(value, kind = 'time') {
  if (value === null || value === undefined || value === '') return ''
  const v = Number(value)
  if (!Number.isFinite(v)) return ''
  if (kind === 'distance') return v.toFixed(2) + 'm'
  const h = Math.floor(v / 3600)
  const m = Math.floor((v % 3600) / 60)
  const s = v - h * 3600 - m * 60
  const ss = s.toFixed(2).padStart(5, '0')
  if (h) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  if (m) return `${m}:${ss}`
  return s.toFixed(2)
}

// 順位文字列から数値を抜き出す（'総合2位' → 2, '共通:5位' → 5）
export function parseRankNo(text) {
  if (!text) return null
  const m = toHalf(String(text)).match(/(\d+)\s*位/)
  return m ? Number(m[1]) : null
}

// 新記録判定：kind に応じて比較（best が無ければ true）
export function isBetter(value, best, kind = 'time') {
  if (value === null || value === undefined) return false
  if (best === null || best === undefined) return true
  return kind === 'distance' ? Number(value) > Number(best) : Number(value) < Number(best)
}
