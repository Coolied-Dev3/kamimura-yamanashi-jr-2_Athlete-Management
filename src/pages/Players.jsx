import { useState, useEffect } from 'react'
import * as api from '../api'
import { fmt, todayStr, Loading } from '../App.jsx'

const GENDERS = ['男', '女']

// 団体区分＋学年＋性別 の短い表示（例：小学4年・男）
export const orgGrade = (p) =>
  [p.org_kind || '', p.grade ? p.grade + '年' : ''].join('') + (p.gender ? `・${p.gender}` : '')

// ============ 選手一覧 ============
export function PlayersPage({ teams, masters, toast }) {
  const [players, setPlayers] = useState(null)
  const [org, setOrg] = useState('全員')
  const [qtext, setQtext] = useState('')
  const [sel, setSel] = useState(null)       // 詳細表示中の選手ID
  const [edit, setEdit] = useState(undefined) // undefined=閉, null=新規

  async function reload() { setPlayers(await api.getPlayers()) }
  useEffect(() => { reload() }, [])

  if (sel) {
    return <PlayerDetail id={sel} teams={teams} masters={masters} toast={toast} canEdit
      onBack={async () => { setSel(null); await reload() }}
      onDeleted={async () => { setSel(null); await reload(); toast('選手を削除しました') }} />
  }
  if (players === null) return <Loading />

  const orgs = ['全員', ...masters.org_kind, '練習生']
  const list = players.filter(p =>
    (org === '全員' || (org === '練習生' ? !!p.trainee : p.org_kind === org)) &&
    (!qtext || `${p.name}${p.kana || ''}${p.school || ''}`.includes(qtext.trim())))

  return (
    <>
      <div className="cr">
        {orgs.map(o => <button key={o} className={'ch' + (org === o ? ' on' : '')} onClick={() => setOrg(o)}>{o}</button>)}
      </div>
      <div className="srch"><input className="in" placeholder="氏名・カナ・学校で検索" value={qtext} onChange={e => setQtext(e.target.value)} /></div>
      <p className="st">{list.length}名</p>
      {list.map(p => (
        <div className="pr" key={p.id} onClick={() => setSel(p.id)}>
          <div className={'av' + (p.trainee ? ' avt' : '')}>{p.name.charAt(0)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}{p.rank && <span className="bk">{p.rank}</span>}{!!p.trainee && <span className="bt">練習生</span>}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{orgGrade(p)}{p.team_code ? `　${p.team_code}チーム` : ''}{p.school ? `　${p.school}` : ''}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>記録 {p.result_count}</div>
          <i className="ti ti-chevron-right" style={{ color: 'var(--sax)' }} />
        </div>
      ))}
      <div style={{ padding: '10px 13px' }}>
        <button className="ab" onClick={() => setEdit(null)}><i className="ti ti-user-plus" /> 選手を追加</button>
      </div>
      {edit !== undefined && (
        <PlayerEditModal player={edit} teams={teams} masters={masters} toast={toast} onClose={() => setEdit(undefined)}
          onSaved={async () => { setEdit(undefined); await reload(); toast('選手情報を保存しました ✓') }} />
      )}
    </>
  )
}

// ============ 選手詳細（個人情報＋ベスト＋記録一覧）============
export function PlayerDetail({ id, teams, masters, toast, canEdit, onBack, onDeleted }) {
  const [p, setP] = useState(null)
  const [edit, setEdit] = useState(false)

  async function reload() { setP(await api.getPlayer(id)) }
  useEffect(() => { reload() }, [id])
  if (!p) return <Loading />

  const kv = [
    ['カナ', p.kana], ['英語名', p.eng], ['生年月日', fmt(p.birth)], ['性別', p.gender],
    ['団体区分', p.org_kind], ['学年', p.grade ? p.grade + '年' : ''], ['学校', p.school], ['チーム', p.team_code ? p.team_code + 'チーム' : ''],
    ['会員区分', p.rank], ['入会年月', p.joined ? p.joined.replace('-', '/') : ''], ['ゼッケンNo', p.bib], ['JAAF-ID', p.jaaf],
    ['ユニフォーム', p.uniform], ['ログインID', p.login_id],
  ]

  return (
    <>
      {onBack && <button className="bb" onClick={onBack}><i className="ti ti-chevron-left" />選手一覧へ戻る</button>}
      <div className="pnl">
        <div className="row" style={{ marginBottom: 12 }}>
          <div className={'av' + (p.trainee ? ' avt' : '')} style={{ width: 40, height: 40, fontSize: 17 }}>{p.name.charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{p.name}{p.rank && <span className="bk">{p.rank}</span>}{!!p.trainee && <span className="bt">練習生</span>}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{orgGrade(p)}</div>
          </div>
          {canEdit && <button className="bsm" onClick={() => setEdit(true)}><i className="ti ti-edit" /> 編集</button>}
        </div>
        <div className="kv">
          {kv.map(([k, v]) => <div key={k}><div className="k">{k}</div><div className="v">{v || '—'}</div></div>)}
        </div>
        {p.note && <div style={{ fontSize: 13, marginTop: 10, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>備考：{p.note}</div>}
      </div>

      <p className="st"><i className="ti ti-trophy" />ベストタイム</p>
      {p.bests.length === 0 ? <p className="empty">記録がありません</p> : (
        <div className="tw"><table className="tb">
          <thead><tr><th>種目</th><th>記録</th><th>大会・記録会</th><th>日付</th><th>順位</th></tr></thead>
          <tbody>{p.bests.map(b => (
            <tr key={b.result_id}><td>{b.event_name}</td><td className="num" style={{ fontWeight: 600 }}>{b.mark}</td><td>{b.competition_name}</td><td>{fmt(b.date_from)}</td><td>{b.rank_text || ''}</td></tr>
          ))}</tbody>
        </table></div>
      )}

      <p className="st"><i className="ti ti-history" />記録一覧（{p.results.length}件）</p>
      {p.results.length === 0 ? <p className="empty">記録がありません</p> : (
        <div className="tw"><table className="tb">
          <thead><tr><th>日付</th><th>大会・記録会</th><th>種目</th><th>記録</th><th>順位</th></tr></thead>
          <tbody>{p.results.map(r => (
            <tr key={r.id}>
              <td>{fmt(r.date_from)}</td><td>{r.competition_name}</td><td>{r.event_name}</td>
              <td className="num">{r.mark || '—'}{!!r.is_pb && <span className="bpb">PB</span>}</td><td>{r.rank_text || ''}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}

      {edit && (
        <PlayerEditModal player={p} teams={teams} masters={masters} toast={toast} onClose={() => setEdit(false)}
          onSaved={async () => { setEdit(false); await reload(); toast('選手情報を保存しました ✓') }}
          onDeleted={onDeleted} />
      )}
    </>
  )
}

// ============ 選手 編集モーダル ============
// player: 編集対象（null=新規） / initial: 新規時の初期値 / joinMode: 体験→入会登録（入会日入力を表示）
// onSave(payload, joinedDate): 指定時は api.savePlayer の代わりに呼ぶ
const PLAYER_KEYS = ['id', 'name', 'kana', 'eng', 'birth', 'gender', 'school', 'org_kind', 'grade', 'bib', 'jaaf', 'uniform',
  'note', 'rank', 'joined', 'trainee', 'team_code', 'login_id', 'password']

export function PlayerEditModal({ player, initial, teams, masters, toast, onClose, onSaved, onDeleted, joinMode, onSave, title }) {
  const blank = {
    name: '', kana: '', eng: '', birth: '', gender: '', school: '', org_kind: '', grade: '', bib: '', jaaf: '', uniform: '',
    note: '', rank: masters.member_rank[0] || '', joined: todayStr().slice(0, 7), trainee: false, team_code: teams[0] || '',
    login_id: '', password: '', ...(initial || {}),
  }
  const [f, setF] = useState(() => {
    if (!player) return blank
    const o = {}; PLAYER_KEYS.forEach(k => { o[k] = player[k] ?? '' }); o.trainee = !!player.trainee; return o
  })
  const [joinedDate, setJoinedDate] = useState(todayStr())
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const rankOpts = masters.member_rank.includes(f.rank) || !f.rank ? masters.member_rank : [f.rank, ...masters.member_rank]
  const orgOpts = masters.org_kind.includes(f.org_kind) || !f.org_kind ? masters.org_kind : [f.org_kind, ...masters.org_kind]
  const uniOpts = masters.uniform.includes(f.uniform) || !f.uniform ? masters.uniform : [f.uniform, ...masters.uniform]

  async function save() {
    if (!f.name.trim()) { toast('氏名を入力してください'); return }
    if (!f.login_id.trim()) { toast('ログインIDを入力してください'); return }
    if (!f.password) { toast('パスワードを入力してください'); return }
    setBusy(true)
    try {
      const payload = { ...f, name: f.name.trim(), login_id: f.login_id.trim(), birth: f.birth || null, trainee: !!f.trainee }
      if (onSave) await onSave(payload, joinedDate)
      else await api.savePlayer(payload)
      onSaved()
    } catch (e) { toast('保存エラー: ' + e.message); setBusy(false) }
  }

  async function del() {
    if (!confirm(`${player.name} を削除しますか？\n登録済みの記録、練習管理システムの評価データも削除されます。`)) return
    setBusy(true)
    try { await api.deletePlayer(player.id); onDeleted && onDeleted() }
    catch (e) { toast('削除エラー: ' + e.message); setBusy(false) }
  }

  return (
    <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{title || (player ? `選手を編集（${player.name}）` : '選手を追加')}</p>

        {joinMode && (
          <div className="fg"><label>入会日</label><input type="date" value={joinedDate} onChange={e => setJoinedDate(e.target.value)} /></div>
        )}

        <div className="sd"><i className="ti ti-user" />基本情報</div>
        <div className="g2">
          <div className="fg"><label>氏名 *</label><input value={f.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="fg"><label>カナ</label><input value={f.kana} onChange={e => set('kana', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="fg"><label>英語名</label><input value={f.eng} onChange={e => set('eng', e.target.value)} /></div>
          <div className="fg"><label>生年月日</label><input type="date" value={f.birth || ''} onChange={e => set('birth', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="fg"><label>性別</label>
            <select value={f.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">選択</option>{GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="fg"><label>団体区分</label>
            <select value={f.org_kind} onChange={e => set('org_kind', e.target.value)}>
              <option value="">選択</option>{orgOpts.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="g2">
          <div className="fg"><label>学年</label><input value={f.grade} inputMode="numeric" placeholder="例: 4" onChange={e => set('grade', e.target.value)} /></div>
          <div className="fg"><label>学校</label><input value={f.school} onChange={e => set('school', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="fg"><label>ゼッケンNo</label><input value={f.bib} onChange={e => set('bib', e.target.value)} /></div>
          <div className="fg"><label>JAAF-ID</label><input value={f.jaaf} onChange={e => set('jaaf', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="fg"><label>ユニフォームサイズ</label>
            <select value={f.uniform} onChange={e => set('uniform', e.target.value)}>
              <option value="">選択</option>{uniOpts.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="fg"><label>会員区分</label>
            <select value={f.rank} onChange={e => set('rank', e.target.value)}>
              <option value="">選択</option>{rankOpts.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="g2">
          <div className="fg"><label>入会年月</label><input type="month" value={f.joined || ''} onChange={e => set('joined', e.target.value)} /></div>
          <div className="fg"><label>チーム（練習管理）</label>
            <select value={f.team_code} onChange={e => set('team_code', e.target.value)}>
              <option value="">未設定</option>{teams.map(t => <option key={t} value={t}>{t}チーム</option>)}
            </select>
          </div>
        </div>
        <label className="chk"><input type="checkbox" checked={!!f.trainee} onChange={e => set('trainee', e.target.checked)} />練習生フラグ</label>
        <div className="fg"><label>備考</label><textarea rows={2} value={f.note} onChange={e => set('note', e.target.value)} /></div>

        <div className="sd"><i className="ti ti-lock" />ログイン情報（練習管理システムと共通）</div>
        <div className="g2">
          <div className="fg"><label>ログインID *</label><input value={f.login_id} autoCapitalize="none" onChange={e => set('login_id', e.target.value)} /></div>
          <div className="fg"><label>パスワード *</label><input value={f.password} onChange={e => set('password', e.target.value)} /></div>
        </div>

        <div className="mf">
          <button className="bp" disabled={busy} onClick={save}>{busy ? '保存中...' : (joinMode ? '入会登録する' : '保存')}</button>
          <button className="bc" onClick={onClose}>キャンセル</button>
          {player && onDeleted && <button className="delbtn" disabled={busy} onClick={del} style={{ marginTop: 8 }}><i className="ti ti-trash" /> この選手を削除</button>}
        </div>
      </div>
    </div>
  )
}
