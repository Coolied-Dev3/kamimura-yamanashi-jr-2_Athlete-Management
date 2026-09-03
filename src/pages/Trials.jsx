import { useState, useEffect, useRef } from 'react'
import * as api from '../api'
import { fmt, todayStr, Loading } from '../App.jsx'
import { PlayerEditModal, orgGrade } from './Players.jsx'

export const STATUSES = ['問合せ', '体験中', '入会', '見送り']
const stCls = { '問合せ': 's1', '体験中': 's2', '入会': 's3', '見送り': 's4' }
const StatusBadge = ({ s }) => <span className={'bst ' + (stCls[s] || '')}>{s}</span>

// ============ 体験申込 一覧 ============
export function TrialsPage({ teams, masters, events, toast }) {
  const [trials, setTrials] = useState(null)
  const [st, setSt] = useState('すべて')
  const [sel, setSel] = useState(null)
  const [edit, setEdit] = useState(undefined)

  async function reload() { setTrials(await api.getTrials()) }
  useEffect(() => { reload() }, [])

  if (sel) {
    return <TrialDetail id={sel} teams={teams} masters={masters} events={events} toast={toast}
      onBack={async () => { setSel(null); await reload() }}
      onDeleted={async () => { setSel(null); await reload(); toast('削除しました') }} />
  }
  if (trials === null) return <Loading />

  const list = trials.filter(t => st === 'すべて' || t.status === st)
  const counts = Object.fromEntries(STATUSES.map(s => [s, trials.filter(t => t.status === s).length]))

  return (
    <>
      <div className="cr">
        {['すべて', ...STATUSES].map(s => (
          <button key={s} className={'ch' + (st === s ? ' on' : '')} onClick={() => setSt(s)}>{s}{s !== 'すべて' ? ` ${counts[s]}` : ''}</button>
        ))}
      </div>
      <div style={{ padding: '0 13px' }}>
        <button className="ab" onClick={() => setEdit(null)}><i className="ti ti-user-plus" /> 体験申込を追加</button>
      </div>
      <p className="st">{list.length}名</p>
      {list.length === 0 && <p className="empty"><i className="ti ti-user-search" />体験申込がありません</p>}
      {list.map(t => (
        <div className="pr" key={t.id} onClick={() => setSel(t.id)}>
          <div className="av avt">{t.name.charAt(0)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{t.name}<StatusBadge s={t.status} /></div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              {orgGrade(t)}{t.school ? `　${t.school}` : ''}
              {t.inquiry_date ? `　問合せ ${fmt(t.inquiry_date)}` : ''}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'right', whiteSpace: 'nowrap' }}>
            体験 {t.visit_count}回{t.last_visit ? <><br />{fmt(t.last_visit)}</> : ''}
          </div>
          <i className="ti ti-chevron-right" style={{ color: 'var(--sax)' }} />
        </div>
      ))}
      {edit !== undefined && (
        <TrialEditModal trial={edit} masters={masters} toast={toast} onClose={() => setEdit(undefined)}
          onSaved={async (id) => { setEdit(undefined); await reload(); toast('保存しました ✓'); if (id) setSel(id) }} />
      )}
    </>
  )
}

// ============ 体験申込 詳細（各回の記録・入会登録）============
function TrialDetail({ id, teams, masters, events, toast, onBack, onDeleted }) {
  const [t, setT] = useState(null)
  const [rows, setRows] = useState([])
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [edit, setEdit] = useState(false)
  const [join, setJoin] = useState(false)     // 新規選手として入会登録
  const [link, setLink] = useState(false)     // 既存選手に紐付け
  const seq = useRef(0)

  async function reload() {
    const d = await api.getTrial(id)
    setT(d)
    setRows(d.visits.map(v => ({ key: 'v' + v.id, visit_date: v.visit_date, event_text: v.event_text || '', result: v.result || '', coach: v.coach || '' })))
    setDirty(false)
  }
  useEffect(() => { reload() }, [id])
  if (!t) return <Loading />

  const upd = (i, k, v) => { setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [k]: v } : r)); setDirty(true) }
  const add = () => { setRows(rs => [...rs, { key: 'n' + (seq.current++), visit_date: todayStr(), event_text: '', result: '', coach: '' }]); setDirty(true) }
  const del = (i) => { setRows(rs => rs.filter((_, idx) => idx !== i)); setDirty(true) }

  async function saveVisits() {
    if (rows.some(r => !r.visit_date)) { toast('体験日を入力してください'); return }
    setBusy(true)
    try { await api.saveTrialVisits(id, rows); await reload(); toast('体験記録を保存しました ✓') }
    catch (e) { toast('保存エラー: ' + e.message) } finally { setBusy(false) }
  }
  async function delTrial() {
    if (!confirm(`${t.name} の体験申込を削除しますか？`)) return
    try { await api.deleteTrial(id); onDeleted() } catch (e) { toast('削除エラー: ' + e.message) }
  }
  function back() {
    if (dirty && !confirm('保存していない変更があります。破棄して戻りますか？')) return
    onBack()
  }

  const kv = [
    ['カナ', t.kana], ['英語名', t.eng], ['性別', t.gender], ['団体区分・学年', [t.org_kind, t.grade ? t.grade + '年' : ''].filter(Boolean).join(' ')],
    ['学校', t.school], ['保護者', t.guardian], ['連絡先', t.contact], ['初回問い合わせ', fmt(t.inquiry_date)],
  ]
  const initialPlayer = {
    name: t.name, kana: t.kana || '', eng: t.eng || '', gender: t.gender || '', org_kind: t.org_kind || '', grade: t.grade || '', school: t.school || '',
    note: t.note ? `体験時メモ: ${t.note}` : '',
  }

  return (
    <>
      <button className="bb" onClick={back}><i className="ti ti-chevron-left" />体験申込一覧へ戻る</button>
      <div className="pnl">
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="av avt" style={{ width: 40, height: 40, fontSize: 17 }}>{t.name.charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{t.name}<StatusBadge s={t.status} /></div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{orgGrade(t)}</div>
          </div>
          <button className="bsm" onClick={() => setEdit(true)}><i className="ti ti-edit" /> 編集</button>
          <button className="delbtn" onClick={delTrial}><i className="ti ti-trash" /></button>
        </div>
        <div className="kv">
          {kv.map(([k, v]) => <div key={k}><div className="k">{k}</div><div className="v">{v || '—'}</div></div>)}
        </div>
        {t.note && <div style={{ fontSize: 13, marginTop: 10, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>備考：{t.note}</div>}
      </div>

      {/* 入会状況 */}
      <div className="cd" style={{ background: 'var(--bg2)' }}>
        {t.status === '入会' ? (
          <div className="row">
            <i className="ti ti-circle-check" style={{ fontSize: 22, color: 'var(--green)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>入会済み{t.joined_date ? `（${fmt(t.joined_date)}）` : ''}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t.player_name ? `選手登録: ${t.player_name}` : '選手未登録（「編集」から紐付けできます）'}</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>入会が決まったら、選手として登録します（練習管理システムにも同時に反映）</div>
            <div className="row">
              <button className="bsm g" style={{ flex: 1, padding: 9 }} onClick={() => setJoin(true)}><i className="ti ti-user-check" /> 入会登録（新規選手として登録）</button>
              <button className="bsm" style={{ padding: 9 }} onClick={() => setLink(true)}>既存選手に紐付け</button>
            </div>
          </>
        )}
      </div>

      <p className="st"><i className="ti ti-calendar-event" />体験の記録（{rows.length}回）{dirty && <span style={{ color: 'var(--amber)', marginLeft: 6 }}>● 未保存</span>}</p>
      {rows.map((r, i) => (
        <div className="cd" key={r.key}>
          <div className="row" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sax)' }}>{i === 0 ? '初回体験' : `${i + 1}回目体験`}</span>
            <span style={{ flex: 1 }} />
            <button className="iconbtn" onClick={() => del(i)}><i className="ti ti-x" /></button>
          </div>
          <div className="g2">
            <div className="fg"><label>体験日</label><input type="date" value={r.visit_date} onChange={e => upd(i, 'visit_date', e.target.value)} /></div>
            <div className="fg"><label>体験した種目</label>
              <input list="ev-list" value={r.event_text} placeholder="例: 800m / 1000m" onChange={e => upd(i, 'event_text', e.target.value)} />
            </div>
          </div>
          <div className="fg"><label>体験結果・コメント</label><textarea rows={2} value={r.result} placeholder="タイム、様子、次回への課題など" onChange={e => upd(i, 'result', e.target.value)} /></div>
          <div className="fg"><label>担当</label><input value={r.coach} onChange={e => upd(i, 'coach', e.target.value)} /></div>
        </div>
      ))}
      <datalist id="ev-list">{events.map(e => <option key={e.id} value={e.name} />)}</datalist>
      <div style={{ padding: '0 13px 14px' }}>
        <button className="ab" onClick={add}><i className="ti ti-plus" /> 体験の回を追加</button>
        <button className="bp" disabled={busy || !dirty} onClick={saveVisits} style={{ marginTop: 10 }}>{busy ? '保存中...' : '体験記録を保存'}</button>
      </div>

      {edit && <TrialEditModal trial={t} masters={masters} toast={toast} onClose={() => setEdit(false)}
        onSaved={async () => { setEdit(false); await reload(); toast('保存しました ✓') }} />}
      {join && (
        <PlayerEditModal player={null} initial={initialPlayer} teams={teams} masters={masters} toast={toast} joinMode
          title={`入会登録（${t.name}）`}
          onSave={(payload, joinedDate) => api.joinTrial(id, { joined_date: joinedDate, player: payload })}
          onClose={() => setJoin(false)}
          onSaved={async () => { setJoin(false); await reload(); toast('入会登録しました ✓ 選手一覧に追加されました') }} />
      )}
      {link && <LinkPlayerModal trial={t} toast={toast} onClose={() => setLink(false)}
        onSaved={async () => { setLink(false); await reload(); toast('既存選手に紐付けました ✓') }} />}
    </>
  )
}

// ============ 既存選手に紐付け ============
function LinkPlayerModal({ trial, toast, onClose, onSaved }) {
  const [players, setPlayers] = useState(null)
  const [pid, setPid] = useState('')
  const [joinedDate, setJoinedDate] = useState(todayStr())
  const [busy, setBusy] = useState(false)
  useEffect(() => { api.getPlayers().then(ps => { setPlayers(ps); const m = ps.find(p => p.name.replace(/\s/g, '') === trial.name.replace(/\s/g, '')); if (m) setPid(String(m.id)) }) }, [])
  async function save() {
    if (!pid) { toast('選手を選択してください'); return }
    setBusy(true)
    try { await api.joinTrial(trial.id, { joined_date: joinedDate, player_id: Number(pid) }); onSaved() }
    catch (e) { toast('エラー: ' + e.message); setBusy(false) }
  }
  return (
    <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>既存の選手に紐付けて入会にする</p>
        <div className="fg"><label>入会日</label><input type="date" value={joinedDate} onChange={e => setJoinedDate(e.target.value)} /></div>
        <div className="fg"><label>選手</label>
          {players === null ? <Loading /> : (
            <select value={pid} onChange={e => setPid(e.target.value)}>
              <option value="">選択</option>{players.map(p => <option key={p.id} value={p.id}>{p.name}{p.org_kind ? `（${orgGrade(p)}）` : ''}</option>)}
            </select>
          )}
        </div>
        <div className="mf">
          <button className="bp" disabled={busy} onClick={save}>{busy ? '保存中...' : '紐付けて入会にする'}</button>
          <button className="bc" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}

// ============ 体験申込 編集モーダル ============
function TrialEditModal({ trial, masters, toast, onClose, onSaved }) {
  const blank = { name: '', kana: '', eng: '', gender: '', org_kind: '', grade: '', school: '', guardian: '', contact: '', inquiry_date: todayStr(), status: '問合せ', joined_date: '', note: '' }
  const [f, setF] = useState(() => {
    if (!trial) return blank
    const o = { ...blank }; Object.keys(blank).forEach(k => { o[k] = trial[k] ?? '' }); o.id = trial.id; return o
  })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  async function save() {
    if (!f.name.trim()) { toast('氏名を入力してください'); return }
    setBusy(true)
    try { const r = await api.saveTrial({ ...f, name: f.name.trim(), inquiry_date: f.inquiry_date || null, joined_date: f.status === '入会' ? (f.joined_date || null) : null }); onSaved(r.id) }
    catch (e) { toast('保存エラー: ' + e.message); setBusy(false) }
  }

  return (
    <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{trial ? `体験申込を編集（${trial.name}）` : '体験申込を追加'}</p>
        <div className="g2">
          <div className="fg"><label>氏名 *</label><input value={f.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="fg"><label>カナ</label><input value={f.kana} onChange={e => set('kana', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="fg"><label>英語名</label><input value={f.eng} onChange={e => set('eng', e.target.value)} /></div>
          <div className="fg"><label>性別</label>
            <select value={f.gender} onChange={e => set('gender', e.target.value)}><option value="">選択</option><option>男</option><option>女</option></select>
          </div>
        </div>
        <div className="g2">
          <div className="fg"><label>団体区分</label>
            <select value={f.org_kind} onChange={e => set('org_kind', e.target.value)}><option value="">選択</option>{masters.org_kind.map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div className="fg"><label>学年</label><input value={f.grade} inputMode="numeric" placeholder="例: 4" onChange={e => set('grade', e.target.value)} /></div>
        </div>
        <div className="fg"><label>学校</label><input value={f.school} onChange={e => set('school', e.target.value)} /></div>
        <div className="g2">
          <div className="fg"><label>保護者名</label><input value={f.guardian} onChange={e => set('guardian', e.target.value)} /></div>
          <div className="fg"><label>連絡先</label><input value={f.contact} onChange={e => set('contact', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="fg"><label>初回問い合わせ日</label><input type="date" value={f.inquiry_date || ''} onChange={e => set('inquiry_date', e.target.value)} /></div>
          <div className="fg"><label>状況</label>
            <select value={f.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
          </div>
        </div>
        {f.status === '入会' && <div className="fg"><label>入会日</label><input type="date" value={f.joined_date || ''} onChange={e => set('joined_date', e.target.value)} /></div>}
        <div className="fg"><label>備考（問い合わせ内容・希望など）</label><textarea rows={3} value={f.note} onChange={e => set('note', e.target.value)} /></div>
        <div className="mf">
          <button className="bp" disabled={busy} onClick={save}>{busy ? '保存中...' : '保存'}</button>
          <button className="bc" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}
