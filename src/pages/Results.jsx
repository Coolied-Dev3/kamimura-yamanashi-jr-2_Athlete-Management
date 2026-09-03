import { useState, useEffect, useRef } from 'react'
import * as api from '../api'
import { fmt, todayStr, Loading } from '../App.jsx'
import { parseValue, formatValue, isBetter } from '../time.js'
import { orgGrade } from './Players.jsx'

const KINDS = ['大会', '記録会', 'TT', 'その他']
const kindCls = { '大会': 'bs', '記録会': 'be', 'TT': 'bt', 'その他': 'bt' }
export const dateRange = (c) => fmt(c.date_from) + (c.date_to && c.date_to !== c.date_from ? '〜' + fmt(c.date_to) : '')

// ============ 大会・記録会 一覧 ============
export function ResultsPage({ events, masters, toast }) {
  const [comps, setComps] = useState(null)
  const [sel, setSel] = useState(null)
  const [edit, setEdit] = useState(undefined)

  async function reload() { setComps(await api.getCompetitions()) }
  useEffect(() => { reload() }, [])

  if (sel) {
    return <ResultsEntry comp={sel} events={events} masters={masters} toast={toast}
      onBack={async () => { setSel(null); await reload() }}
      onChanged={async (c) => { await reload(); if (c) setSel(c) }}
      onDeleted={async () => { setSel(null); await reload(); toast('削除しました') }} />
  }
  if (comps === null) return <Loading />

  return (
    <>
      <div style={{ padding: '10px 13px 0' }}>
        <button className="ab" onClick={() => setEdit(null)}><i className="ti ti-plus" /> 大会・記録会を追加</button>
      </div>
      <p className="st">大会・記録会（{comps.length}件）　タップで結果を一覧登録</p>
      {comps.length === 0 && <p className="empty"><i className="ti ti-flag" />大会・記録会がありません</p>}
      {comps.map(c => (
        <div className="hr" key={c.id} onClick={() => setSel(c)}>
          <div className="ni"><i className={'ti ' + (c.kind === 'TT' ? 'ti-stopwatch' : 'ti-flag')} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{c.name}<span className={kindCls[c.kind] || 'bt'}>{c.kind}</span></div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{dateRange(c)}{c.place ? `　${c.place}` : ''}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'right', whiteSpace: 'nowrap' }}>{c.player_count}名<br />{c.result_count}記録</div>
          <i className="ti ti-chevron-right" style={{ color: 'var(--sax)' }} />
        </div>
      ))}
      {edit !== undefined && (
        <CompetitionModal comp={edit} toast={toast} onClose={() => setEdit(undefined)}
          onSaved={async (c) => { setEdit(undefined); await reload(); toast('保存しました ✓'); if (c) setSel(c) }} />
      )}
    </>
  )
}

// ============ 大会 編集モーダル ============
function CompetitionModal({ comp, toast, onClose, onSaved }) {
  const [f, setF] = useState(comp ? { ...comp } : { name: '', kind: '大会', date_from: todayStr(), date_to: '', place: '', note: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  async function save() {
    if (!f.name.trim()) { toast('大会名を入力してください'); return }
    if (!f.date_from) { toast('開催日を入力してください'); return }
    setBusy(true)
    try {
      const r = await api.saveCompetition({ id: f.id, name: f.name.trim(), kind: f.kind, date_from: f.date_from, date_to: f.date_to || null, place: f.place, note: f.note })
      onSaved({ ...f, id: r.id, name: f.name.trim(), date_to: f.date_to || null })
    } catch (e) { toast('保存エラー: ' + e.message); setBusy(false) }
  }

  return (
    <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{comp ? '大会・記録会を編集' : '大会・記録会を追加'}</p>
        <div className="fg"><label>名称 *</label><input value={f.name} placeholder="例: 山梨県小学生陸上競技会" onChange={e => set('name', e.target.value)} /></div>
        <div className="g2">
          <div className="fg"><label>種別</label>
            <select value={f.kind} onChange={e => set('kind', e.target.value)}>{KINDS.map(k => <option key={k}>{k}</option>)}</select>
          </div>
          <div className="fg"><label>場所</label><input value={f.place || ''} onChange={e => set('place', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="fg"><label>開催日 *</label><input type="date" value={f.date_from || ''} onChange={e => set('date_from', e.target.value)} /></div>
          <div className="fg"><label>終了日（複数日の場合）</label><input type="date" value={f.date_to || ''} onChange={e => set('date_to', e.target.value)} /></div>
        </div>
        <div className="fg"><label>備考</label><textarea rows={2} value={f.note || ''} onChange={e => set('note', e.target.value)} /></div>
        <div className="mf">
          <button className="bp" disabled={busy} onClick={save}>{busy ? '保存中...' : '保存'}</button>
          <button className="bc" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}

// ============ 結果 一覧登録画面 ============
function ResultsEntry({ comp: comp0, events, masters, toast, onBack, onChanged, onDeleted }) {
  const [comp, setComp] = useState(comp0)
  const [players, setPlayers] = useState(null)
  const [rows, setRows] = useState(null)
  const [base, setBase] = useState({})    // "player:event" → この大会を除いたベスト値
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [edit, setEdit] = useState(false)
  const [bulk, setBulk] = useState(false)
  const seq = useRef(0)

  async function load() {
    const [ps, rs, b] = await Promise.all([api.getPlayers(), api.getCompetitionResults(comp.id), api.getPbBaseline(comp.id)])
    setPlayers(ps); setBase(b)
    setRows(rs.map(r => ({ key: 'r' + r.id, player_id: String(r.player_id), event_id: String(r.event_id), mark: r.mark || '', rank_text: r.rank_text || '' })))
    setDirty(false)
  }
  useEffect(() => { load() }, [comp.id])

  if (players === null || rows === null) return <Loading />

  const evById = Object.fromEntries(events.map(e => [String(e.id), e]))
  const upd = (i, k, v) => { setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [k]: v } : r)); setDirty(true) }
  const del = (i) => { setRows(rs => rs.filter((_, idx) => idx !== i)); setDirty(true) }
  const newRow = (player_id, event_id) => ({ key: 'n' + (seq.current++), player_id: String(player_id || ''), event_id: String(event_id || ''), mark: '', rank_text: '' })
  const add = () => {
    const last = rows[rows.length - 1]
    setRows(rs => [...rs, newRow('', last ? last.event_id : (events[0]?.id ?? ''))]); setDirty(true)
  }
  const addBulk = (playerIds, eventId) => {
    const adds = playerIds.filter(pid => !rows.some(r => r.player_id === String(pid) && r.event_id === String(eventId))).map(pid => newRow(pid, eventId))
    if (adds.length) { setRows(rs => [...rs, ...adds]); setDirty(true) }
    toast(`${adds.length}名を追加しました`)
  }

  // PB判定：この大会を除いたベストより良ければ PB。同大会内に同一選手・種目のより良い行があれば非PB
  function pbInfo(r) {
    const ev = evById[r.event_id]
    if (!ev) return {}
    const value = parseValue(r.mark, ev.kind)
    const invalid = r.mark.trim() !== '' && value === null
    const b = base[`${r.player_id}:${r.event_id}`]
    const betterInComp = value !== null && rows.some(o => o !== r && o.player_id === r.player_id && o.event_id === r.event_id && (() => {
      const v = parseValue(o.mark, ev.kind); return v !== null && isBetter(v, value, ev.kind)
    })())
    const pb = value !== null && !betterInComp && isBetter(value, b, ev.kind)
    return { value, base: b, pb, first: pb && b === undefined, invalid, kind: ev.kind }
  }
  const pbCount = rows.filter(r => pbInfo(r).pb).length

  async function save() {
    for (const r of rows) {
      if (!r.player_id || !r.event_id) { toast('選手と種目を選択してください'); return }
      if (pbInfo(r).invalid) { toast(`記録の形式が不正です: ${r.mark}`); return }
    }
    setBusy(true)
    try {
      const res = await api.saveCompetitionResults(comp.id, rows.map(r => ({ player_id: Number(r.player_id), event_id: Number(r.event_id), mark: r.mark.trim(), rank_text: r.rank_text.trim() })))
      toast(`保存しました ✓（新記録 ${res.pbCount}件）`)
      await load(); onChanged && onChanged()
    } catch (e) { toast('保存エラー: ' + e.message) } finally { setBusy(false) }
  }

  async function delComp() {
    if (!confirm(`「${comp.name}」を削除しますか？\n登録済みの記録 ${rows.length} 件も削除されます。`)) return
    try { await api.deleteCompetition(comp.id); onDeleted() } catch (e) { toast('削除エラー: ' + e.message) }
  }

  function back() {
    if (dirty && !confirm('保存していない変更があります。破棄して戻りますか？')) return
    onBack()
  }

  return (
    <>
      <button className="bb" onClick={back}><i className="ti ti-chevron-left" />大会一覧へ戻る</button>
      <div className="pnl" style={{ paddingBottom: 4 }}>
        <div className="row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{comp.name}<span className={kindCls[comp.kind] || 'bt'}>{comp.kind}</span></div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{dateRange(comp)}{comp.place ? `　${comp.place}` : ''}</div>
          </div>
          <button className="bsm" onClick={() => setEdit(true)}><i className="ti ti-edit" /> 編集</button>
          <button className="delbtn" onClick={delComp}><i className="ti ti-trash" /></button>
        </div>
        {comp.note && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, whiteSpace: 'pre-wrap' }}>{comp.note}</div>}
      </div>

      <div className="actbar">
        <button className="ab" onClick={add}><i className="ti ti-plus" /> 行を追加</button>
        <button className="ab" onClick={() => setBulk(true)}><i className="ti ti-users-plus" /> 選手をまとめて追加</button>
      </div>
      <p className="st">記録 {rows.length}件　<span className="bpb">PB</span> {pbCount}件{dirty && <span style={{ color: 'var(--amber)', marginLeft: 6 }}>● 未保存</span>}</p>

      <div className="rhead"><div>選手</div><div>種目</div><div>記録</div><div>順位</div><div>PB判定</div></div>
      {rows.length === 0 && <p className="empty"><i className="ti ti-stopwatch" />「行を追加」または「選手をまとめて追加」で記録を入力してください</p>}
      {rows.map((r, i) => {
        const inf = pbInfo(r)
        return (
          <div className="rrow" key={r.key}>
            <div className="fg"><label>選手</label>
              <select value={r.player_id} onChange={e => upd(i, 'player_id', e.target.value)}>
                <option value="">選手を選択</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}{p.org_kind ? `（${orgGrade(p)}）` : ''}</option>)}
              </select>
            </div>
            <div className="fg"><label>種目</label>
              <select value={r.event_id} onChange={e => upd(i, 'event_id', e.target.value)}>
                <option value="">種目</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="fg"><label>記録</label>
              <input value={r.mark} inputMode="decimal" placeholder={inf.kind === 'distance' ? '例: 5.23' : '例: 2:52.39'}
                style={inf.invalid ? { borderColor: 'var(--red)' } : undefined} onChange={e => upd(i, 'mark', e.target.value)} />
            </div>
            <div className="fg"><label>順位</label>
              <input value={r.rank_text} placeholder="例: 総合2位" onChange={e => upd(i, 'rank_text', e.target.value)} />
            </div>
            <div className="rrow-foot">
              <span>
                {inf.invalid && <span style={{ color: 'var(--red)' }}>形式が不正です</span>}
                {inf.pb && <span className={'bpb' + (inf.first ? ' first' : '')}>{inf.first ? 'PB（初記録）' : 'PB！'}</span>}
                {inf.pb && !inf.first && <span style={{ marginLeft: 5 }}>前 {formatValue(inf.base, inf.kind)}</span>}
                {!inf.pb && !inf.invalid && inf.base !== undefined && inf.value !== null && <span>PB {formatValue(inf.base, inf.kind)}</span>}
              </span>
              <button className="iconbtn" title="行を削除" onClick={() => del(i)}><i className="ti ti-x" /></button>
            </div>
          </div>
        )
      })}

      <div style={{ padding: '14px 13px' }}>
        <button className="bp" disabled={busy || !dirty} onClick={save}>{busy ? '保存中...' : `この大会の記録を保存（${rows.length}件）`}</button>
        <p className="hint">記録は 2:52.39 / 15.09 / 18:27.19 のように入力。空欄は「記録なし（出場のみ）」として保存されます</p>
      </div>

      {edit && <CompetitionModal comp={comp} toast={toast} onClose={() => setEdit(false)}
        onSaved={async (c) => { setEdit(false); setComp(c); toast('保存しました ✓'); onChanged && onChanged(c) }} />}
      {bulk && <BulkAddModal players={players} events={events} masters={masters} defaultEvent={rows[rows.length - 1]?.event_id || String(events[0]?.id ?? '')}
        onClose={() => setBulk(false)} onAdd={(pids, eid) => { addBulk(pids, eid); setBulk(false) }} />}
    </>
  )
}

// ============ 選手をまとめて追加 ============
function BulkAddModal({ players, events, masters, defaultEvent, onClose, onAdd }) {
  const [eventId, setEventId] = useState(defaultEvent)
  const [org, setOrg] = useState('全員')
  const [checked, setChecked] = useState(new Set())
  const orgs = ['全員', ...masters.org_kind]
  const list = players.filter(p => org === '全員' || p.org_kind === org)
  const toggle = (id) => setChecked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const all = () => setChecked(new Set(list.map(p => p.id)))

  return (
    <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>選手をまとめて追加</p>
        <div className="fg"><label>種目</label>
          <select value={eventId} onChange={e => setEventId(e.target.value)}>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
        </div>
        <div className="cr" style={{ padding: '0 0 8px' }}>
          {orgs.map(o => <button key={o} className={'ch' + (org === o ? ' on' : '')} onClick={() => setOrg(o)}>{o}</button>)}
          <button className="ch" onClick={all}>表示中を全選択</button>
          <button className="ch" onClick={() => setChecked(new Set())}>解除</button>
        </div>
        {list.map(p => (
          <label className="chk" key={p.id}>
            <input type="checkbox" checked={checked.has(p.id)} onChange={() => toggle(p.id)} />
            <span>{p.name}<span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 6 }}>{orgGrade(p)}</span></span>
          </label>
        ))}
        <div className="mf">
          <button className="bp" disabled={!eventId || checked.size === 0} onClick={() => onAdd([...checked], eventId)}>{checked.size}名を追加</button>
          <button className="bc" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}
