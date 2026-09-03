import { useState, useEffect } from 'react'
import * as api from '../api'

// ============ 管理（マスタ）============
export function AdminPage({ masters, events, reloadCommon, toast }) {
  const [tab, setTab] = useState('events')
  const tabs = [['events', '種目'], ['member_rank', '会員区分'], ['org_kind', '団体区分'], ['uniform', 'ユニフォーム']]
  return (
    <>
      <div style={{ padding: '10px 13px 0' }}>
        <div className="cr" style={{ padding: 0, gap: 5, flexWrap: 'wrap' }}>
          {tabs.map(([k, l]) => <button key={k} className={'ch' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>)}
        </div>
      </div>
      {tab === 'events' && <EventsTab events={events} reloadCommon={reloadCommon} toast={toast} />}
      {tab !== 'events' && <MasterTab key={tab} kind={tab} label={tabs.find(t => t[0] === tab)[1]} values={masters[tab] || []} reloadCommon={reloadCommon} toast={toast} />}
    </>
  )
}

// ============ 種目マスタ ============
function EventsTab({ events, reloadCommon, toast }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState('time')
  const [busy, setBusy] = useState(false)

  async function run(fn, msg) {
    setBusy(true)
    try { await fn(); await reloadCommon(); if (msg) toast(msg) }
    catch (e) { toast('エラー: ' + e.message) } finally { setBusy(false) }
  }
  const add = () => {
    if (!name.trim()) { toast('種目名を入力してください'); return }
    run(async () => { await api.saveEvent({ name: name.trim(), kind }); setName('') }, '種目を追加しました ✓')
  }
  const rename = (e) => {
    const n = prompt('種目名を変更', e.name)
    if (n && n.trim() && n.trim() !== e.name) run(() => api.saveEvent({ id: e.id, name: n.trim(), kind: e.kind }), '変更しました ✓')
  }
  const del = (e) => { if (confirm(`「${e.name}」を削除しますか？`)) run(() => api.deleteEvent(e.id), '削除しました') }
  const move = (i, d) => {
    const ids = events.map(e => e.id); const j = i + d
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    run(() => api.reorderEvents(ids))
  }

  return (
    <div style={{ padding: '12px 13px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>種目を追加</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <input className="in" style={{ flex: 1 }} placeholder="例: 3000mSC" value={name} onChange={e => setName(e.target.value)} />
        <select className="in" style={{ width: 110 }} value={kind} onChange={e => setKind(e.target.value)}>
          <option value="time">タイム</option><option value="distance">距離</option>
        </select>
        <button className="bsm" disabled={busy} onClick={add}><i className="ti ti-plus" /> 追加</button>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>種目（{events.length}件）　表示順は矢印で変更</p>
      {events.map((e, i) => (
        <div className="tor" key={e.id}>
          <span style={{ flex: 1 }}>{e.name}<span className="bk">{e.kind === 'distance' ? '距離' : 'タイム'}</span>
            <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 6 }}>記録 {e.result_count}件</span></span>
          <button className="iconbtn" disabled={busy || i === 0} onClick={() => move(i, -1)}><i className="ti ti-arrow-up" /></button>
          <button className="iconbtn" disabled={busy || i === events.length - 1} onClick={() => move(i, 1)}><i className="ti ti-arrow-down" /></button>
          <button className="iconbtn" disabled={busy} onClick={() => rename(e)}><i className="ti ti-edit" /></button>
          <button className="delbtn" disabled={busy || e.result_count > 0} title={e.result_count > 0 ? '記録があるため削除できません' : ''} onClick={() => del(e)}><i className="ti ti-trash" /></button>
        </div>
      ))}
    </div>
  )
}

// ============ 汎用マスタ（会員区分・団体区分・ユニフォーム）============
function MasterTab({ kind, label, values, reloadCommon, toast }) {
  const [list, setList] = useState(values)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { setList(values) }, [values])
  const dirty = JSON.stringify(list) !== JSON.stringify(values)

  const add = () => {
    const v = name.trim()
    if (!v) return
    if (list.includes(v)) { toast('既に登録されています'); return }
    setList([...list, v]); setName('')
  }
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= list.length) return; const a = [...list]; [a[i], a[j]] = [a[j], a[i]]; setList(a) }
  const del = (i) => setList(list.filter((_, idx) => idx !== i))

  async function save() {
    setBusy(true)
    try { await api.replaceMasters(kind, list); await reloadCommon(); toast(`${label}を保存しました ✓`) }
    catch (e) { toast('保存エラー: ' + e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ padding: '12px 13px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}を追加</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <input className="in" style={{ flex: 1 }} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
        <button className="bsm" onClick={add}><i className="ti ti-plus" /> 追加</button>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}（{list.length}件）</p>
      {list.map((v, i) => (
        <div className="tor" key={v}>
          <span style={{ flex: 1 }}>{v}</span>
          <button className="iconbtn" disabled={i === 0} onClick={() => move(i, -1)}><i className="ti ti-arrow-up" /></button>
          <button className="iconbtn" disabled={i === list.length - 1} onClick={() => move(i, 1)}><i className="ti ti-arrow-down" /></button>
          <button className="delbtn" onClick={() => del(i)}><i className="ti ti-trash" /></button>
        </div>
      ))}
      <button className="bp" disabled={busy || !dirty} onClick={save} style={{ marginTop: 10 }}>{busy ? '保存中...' : '保存'}</button>
      <p className="hint">※ 名称を変更・削除しても、登録済みの選手情報の値はそのまま残ります</p>
    </div>
  )
}
