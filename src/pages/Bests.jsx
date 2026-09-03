import { useState, useEffect, useRef } from 'react'
import * as api from '../api'
import { fmt, Loading } from '../App.jsx'

// ============ ベストタイム一覧 ============
// myId: 選手ログイン時は自分の行を強調
export function BestsPage({ myId }) {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    api.getPersonalBests().then(setRows).catch(e => setErr(e.message || String(e)))
  }, [])
  if (err) return <p className="empty"><i className="ti ti-plug-x" />ベストタイムを取得できません<br /><span style={{ fontSize: 12 }}>{err}</span></p>
  if (rows === null) return <Loading />
  return <BestsView rows={rows} myId={myId} />
}

const uniq = (arr) => [...new Set(arr)]
const daysAgo = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000)

// rows: /pb の戻り（player_id, player_name, org_kind, grade, gender, event_id, event_name, event_kind, event_sort, value, mark, competition_name, date_from, rank_text）
export function BestsView({ rows, myId }) {
  const [org, setOrg] = useState('全員')
  const [gender, setGender] = useState('全')
  const [view, setView] = useState('table')
  const [pop, setPop] = useState(null)
  const [sortEv, setSortEv] = useState(null)       // 並べ替え中の種目ID（null=既定順）
  const twRef = useRef(null)                        // 表のスクロール容器
  const [scr, setScr] = useState({ left: false, right: false }) // 左右に隠れた列があるか

  const orgs = ['全員', ...uniq(rows.map(r => r.org_kind).filter(Boolean))]
  const filtered = rows.filter(r => (org === '全員' || r.org_kind === org) && (gender === '全' || r.gender === gender))

  // 選手（登場順＝チーム順・ID順）と種目（種目マスタ順）
  let players = []
  const seen = new Set()
  filtered.forEach(r => { if (!seen.has(r.player_id)) { seen.add(r.player_id); players.push(r) } })
  const evs = []
  const seenE = new Set()
  ;[...filtered].sort((a, b) => a.event_sort - b.event_sort).forEach(r => { if (!seenE.has(r.event_id)) { seenE.add(r.event_id); evs.push(r) } })
  const cell = (pid, eid) => filtered.find(r => r.player_id === pid && r.event_id === eid)
  const isNew = (r) => daysAgo(r.date_from) <= 30

  // 種目ソート：その種目の記録が良い順（タイム=小さい順、距離=大きい順）。記録の無い選手は末尾（既定順のまま）
  const sortTarget = evs.find(e => e.event_id === sortEv)
  if (sortTarget) {
    const dir = sortTarget.event_kind === 'distance' ? -1 : 1
    players = players.map((p, i) => ({ p, i, v: cell(p.player_id, sortEv)?.value ?? null }))
      .sort((a, b) => {
        if (a.v === null && b.v === null) return a.i - b.i
        if (a.v === null) return 1
        if (b.v === null) return -1
        return (Number(a.v) - Number(b.v)) * dir || a.i - b.i
      }).map(x => x.p)
  }

  // 横スクロール（1列ぶん）
  const updateScr = () => {
    const el = twRef.current
    if (!el) return
    setScr({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 })
  }
  useEffect(() => { updateScr() }, [view, org, gender, rows])
  const scrollCols = (dir) => {
    const el = twRef.current
    if (!el) return
    const ths = el.querySelectorAll('thead th')
    const w = ths[1] ? ths[1].offsetWidth : 90
    el.scrollBy({ left: dir * w, behavior: 'smooth' })
    setTimeout(updateScr, 500) // スムーズスクロール完了後にボタンの有効/無効を更新
  }

  return (
    <>
      <div className="cr">
        {orgs.map(o => <button key={o} className={'ch' + (org === o ? ' on' : '')} onClick={() => setOrg(o)}>{o}</button>)}
        <span style={{ borderLeft: '1px solid var(--line2)', margin: '0 3px' }} />
        {['全', '男', '女'].map(g => <button key={g} className={'ch' + (gender === g ? ' on' : '')} onClick={() => setGender(g)}>{g === '全' ? '男女' : g + '子'}</button>)}
        <span style={{ borderLeft: '1px solid var(--line2)', margin: '0 3px' }} />
        <button className={'ch' + (view === 'table' ? ' on' : '')} onClick={() => setView('table')}><i className="ti ti-table" /> 表</button>
        <button className={'ch' + (view === 'cards' ? ' on' : '')} onClick={() => setView('cards')}><i className="ti ti-id" /> 選手別</button>
      </div>
      <p className="st">{players.length}名　<span className="bnew">NEW</span> = 30日以内の記録　タップで詳細</p>

      {players.length === 0 && <p className="empty"><i className="ti ti-trophy" />ベストタイムがありません</p>}

      {view === 'table' && players.length > 0 && (
        <>
          {/* 種目（距離）の左右スクロールボタン */}
          <div className="scb">
            <button className="mnav-b" onClick={() => scrollCols(-1)} disabled={!scr.left} aria-label="左の種目へ" title="左の種目へ"><i className="ti ti-chevron-left" /></button>
            <span className="scb-l">
              <i className="ti ti-arrows-horizontal" /> 距離（種目）を移動
              {sortTarget && <button className="ch on" style={{ marginLeft: 8, padding: '2px 9px', fontSize: 12 }} onClick={() => setSortEv(null)}>{sortTarget.event_name} 早い順 <i className="ti ti-x" /></button>}
            </span>
            <button className="mnav-b" onClick={() => scrollCols(1)} disabled={!scr.right} aria-label="右の種目へ" title="右の種目へ"><i className="ti ti-chevron-right" /></button>
          </div>
          <div className="tw" ref={twRef} onScroll={updateScr}><table className="tb">
            <thead><tr>
              <th>選手</th>
              {evs.map(e => (
                <th key={e.event_id} style={{ textAlign: 'center' }} className={sortEv === e.event_id ? 'sorted' : ''}>
                  <div>{e.event_name}</div>
                  <button className={'sortb' + (sortEv === e.event_id ? ' on' : '')} title={`${e.event_name} の記録が良い順に並べ替え`}
                    onClick={() => setSortEv(sortEv === e.event_id ? null : e.event_id)}>
                    <i className="ti ti-sort-ascending" /> {e.event_kind === 'distance' ? '遠い順' : '早い順'}
                  </button>
                </th>
              ))}
            </tr></thead>
            <tbody>
              {players.map((p, idx) => (
                <tr key={p.player_id} className={myId === p.player_id ? 'me' : ''}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{sortTarget && cell(p.player_id, sortEv) && <span className="rk">{idx + 1}</span>}{p.player_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{p.org_kind || ''}{p.grade ? p.grade + '年' : ''}{p.gender ? '・' + p.gender : ''}</div>
                  </td>
                  {evs.map(e => {
                    const r = cell(p.player_id, e.event_id)
                    return (
                      <td key={e.event_id} className={'num' + (r ? ' cell' : '') + (sortEv === e.event_id ? ' sorted' : '')} style={{ textAlign: 'center' }} onClick={() => r && setPop(r)}>
                        {r ? <><span style={{ fontWeight: 600 }}>{r.mark}</span>{isNew(r) && <span className="bnew">NEW</span>}</> : <span style={{ color: 'var(--line2)' }}>—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}

      {view === 'cards' && players.map(p => (
        <div className="cd" key={p.player_id} style={myId === p.player_id ? { borderColor: 'var(--sax)' } : undefined}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{p.player_name}
            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 400, marginLeft: 8 }}>{p.org_kind || ''}{p.grade ? p.grade + '年' : ''}{p.gender ? '・' + p.gender : ''}</span>
          </div>
          {filtered.filter(r => r.player_id === p.player_id).sort((a, b) => a.event_sort - b.event_sort).map(r => (
            <div key={r.event_id} className="row" style={{ padding: '5px 0', borderTop: '1px solid var(--line)', cursor: 'pointer' }} onClick={() => setPop(r)}>
              <span style={{ width: 62, fontSize: 13, color: 'var(--text2)' }}>{r.event_name}</span>
              <span style={{ fontSize: 16, fontWeight: 600, width: 80 }}>{r.mark}</span>
              {isNew(r) && <span className="bnew">NEW</span>}
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}>{fmt(r.date_from)}　{r.competition_name}</span>
            </div>
          ))}
        </div>
      ))}

      {pop && (
        <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) setPop(null) }}>
          <div className="mb">
            <div className="mh" />
            <p style={{ fontSize: 15, fontWeight: 600 }}>{pop.player_name}　{pop.event_name}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--sax)', margin: '6px 0' }}>{pop.mark}{isNew(pop) && <span className="bnew">NEW</span>}</p>
            <div className="kv">
              <div><div className="k">大会・記録会</div><div className="v">{pop.competition_name}</div></div>
              <div><div className="k">日付</div><div className="v">{fmt(pop.date_from)}</div></div>
              <div><div className="k">順位</div><div className="v">{pop.rank_text || '—'}</div></div>
            </div>
            <div className="mf"><button className="bc" onClick={() => setPop(null)}>閉じる</button></div>
          </div>
        </div>
      )}
    </>
  )
}
