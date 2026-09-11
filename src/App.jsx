import { useState, useEffect, useCallback, useRef } from 'react'
import * as api from './api'
import { PlayersPage, PlayerDetail } from './pages/Players.jsx'
import { ResultsPage } from './pages/Results.jsx'
import { BestsPage } from './pages/Bests.jsx'
import { TrialsPage } from './pages/Trials.jsx'
import { OrdersPage } from './pages/Orders.jsx'
import { AdminPage } from './pages/Admin.jsx'

// 日付ユーティリティ
export const fmt = (d) => (d ? String(d).slice(0, 10).replaceAll('-', '/') : '')
export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ============ トースト ============
function useToast() {
  const [msg, setMsg] = useState('')
  const show = useCallback((m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2200)
  }, [])
  const node = <div className={'tst' + (msg ? ' on' : '')}>{msg}</div>
  return [show, node]
}

// ============ ローディング ============
export const Loading = () => (
  <div className="load"><div className="spin" /><div>読み込み中...</div></div>
)

// ============ テーマ（ライト/ダーク）============
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  return [theme, toggle]
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="lo" onClick={onToggle} aria-label="ライト/ダーク切替" title="ライト/ダーク切替">
      <i className={'ti ' + (theme === 'dark' ? 'ti-sun' : 'ti-moon')} />
    </button>
  )
}

const EMPTY_MASTERS = { member_rank: [], org_kind: [], uniform: [] }

// ============ メインApp ============
export default function App() {
  const [session, setSession] = useState(null) // {role:'admin'|'player', user}
  const [teams, setTeams] = useState([])
  const [masters, setMasters] = useState(EMPTY_MASTERS)
  const [events, setEvents] = useState([])
  const [toast, toastNode] = useToast()
  const [theme, toggleTheme] = useTheme()

  // ログイン後に共通マスタを読む
  const reloadCommon = useCallback(async () => {
    const [t, m, e] = await Promise.all([api.getTeams(), api.getMasters(), api.getEvents()])
    setTeams(t); setMasters({ ...EMPTY_MASTERS, ...m }); setEvents(e)
  }, [])
  useEffect(() => { if (session) reloadCommon().catch(e => console.error(e)) }, [session, reloadCommon])

  if (!session) return <><Login onLogin={setSession} theme={theme} toggleTheme={toggleTheme} />{toastNode}</>

  return (
    <>
      <Main session={session} teams={teams} masters={masters} events={events} reloadCommon={reloadCommon}
        toast={toast} onLogout={() => setSession(null)} theme={theme} toggleTheme={toggleTheme} />
      {toastNode}
    </>
  )
}

// ============ ログイン ============
// ログインは管理者（コーチ）のみ。選手タブは非表示（選手ログインのAPIは残してある）
const LOGIN_TAB = 'admin'
function Login({ onLogin, theme, toggleTheme }) {
  const tab = LOGIN_TAB
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  // ブラウザの自動入力で React の state と入力欄の値がずれることがあるため、
  // 送信時に入力欄そのものの値を読む（非制御コンポーネント）
  const idRef = useRef(null)
  const pwRef = useRef(null)

  async function doLogin() {
    const id = (idRef.current?.value || '').trim()
    const pw = pwRef.current?.value || ''
    if (!id || !pw) { setErr('IDとパスワードを入力してください'); return }
    setErr(''); setBusy(true)
    try {
      const u = tab === 'admin' ? await api.loginAdmin(id, pw) : await api.loginPlayer(id, pw)
      if (!u) { setErr(`IDまたはパスワードが違います（${tab === 'admin' ? '管理者' : '選手'}として照合）`); return }
      onLogin({ role: tab, user: u })
    } catch (e) {
      setErr('接続エラー: ' + (e.message || e))
    } finally { setBusy(false) }
  }

  return (
    <div className="app">
      <div className="lw">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <div className="ll">
          <h2>神村学園山梨Jr陸上Club</h2>
          {/* 選手・記録のピクトグラム */}
          <div className="lpic">
            <div className="lpic-i">
              <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="13" cy="4" r="1.6" />
                <path d="M4 17l5 1l.75 -1.5" /><path d="M15 21l0 -4l-4 -3l1 -6" /><path d="M7 12l0 -3l5 -1l3 3l3 1" />
              </svg>
              <span>選手</span>
            </div>
            <div className="lpic-i">
              <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="13" r="7" /><path d="M14.5 10.5l-2.5 2.5" /><path d="M17 8l1 -1" /><path d="M14 3h-4" /><path d="M12 3v2" />
              </svg>
              <span>記録</span>
            </div>
          </div>
          <p className="lt">選手管理システム</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); doLogin() }}>
          <div className="fg"><label>ユーザーID（コーチ）</label>
            <input ref={idRef} name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} /></div>
          <div className="fg"><label>パスワード</label>
            <input ref={pwRef} type="password" name="password" autoComplete="current-password" /></div>
          <button className="bp" type="submit" disabled={busy}>{busy ? '...' : 'ログイン'}</button>
        </form>
        {err && <p className="err">{err}</p>}
        <p className="hint">練習管理システムと同じ ID・パスワードでログインできます</p>
      </div>
    </div>
  )
}

// ============ メイン画面 ============
function Main({ session, teams, masters, events, reloadCommon, toast, onLogout, theme, toggleTheme }) {
  const isAdmin = session.role === 'admin'
  const me = session.user

  const adminTabs = [
    ['players', 'ti-users', '選手'],
    ['results', 'ti-stopwatch', '記録'],
    ['bests', 'ti-trophy', 'ベスト'],
    ['trials', 'ti-user-plus', '体験'],
    ['orders', 'ti-shirt', '物品'],
    ['admin', 'ti-settings', '管理'],
  ]
  const playerTabs = [
    ['bests', 'ti-trophy', 'ベストタイム'],
    ['mine', 'ti-history', '自分の記録'],
  ]
  const tabs = isAdmin ? adminTabs : playerTabs
  const [tab, setTab] = useState(tabs[0][0])
  const teamCodes = teams.map(t => t.code)

  return (
    <div className="app">
      <div className="hdr">
        <i className="ti ti-trophy" style={{ fontSize: 19, color: 'var(--sax)' }} />
        <div style={{ flex: 1 }}>
          <h1>選手管理</h1>
          <div className="hsub">{isAdmin ? me.name : `${me.name}${me.trainee ? ' (練習生)' : me.team_code ? ` (${me.team_code}チーム)` : ''}`}</div>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <button className="lo" onClick={onLogout}><i className="ti ti-logout" /></button>
      </div>

      <div className="nav">
        {tabs.map(([key, icon, label]) => (
          <button key={key} className={'nb' + (tab === key ? ' on' : '')} onClick={() => setTab(key)}>
            <i className={'ti ' + icon} />{label}
          </button>
        ))}
      </div>

      <div className="con">
        {tab === 'players' && <PlayersPage teams={teamCodes} masters={masters} toast={toast} />}
        {tab === 'results' && <ResultsPage events={events} masters={masters} toast={toast} />}
        {tab === 'bests' && <BestsPage myId={isAdmin ? null : me.id} />}
        {tab === 'trials' && <TrialsPage teams={teamCodes} masters={masters} events={events} toast={toast} />}
        {tab === 'orders' && <OrdersPage masters={masters} toast={toast} />}
        {tab === 'admin' && <AdminPage masters={masters} events={events} reloadCommon={reloadCommon} toast={toast} />}
        {tab === 'mine' && <PlayerDetail id={me.id} teams={teamCodes} masters={masters} toast={toast} canEdit={false} />}
      </div>
    </div>
  )
}
