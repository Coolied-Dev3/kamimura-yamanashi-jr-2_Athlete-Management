import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { pool, q } from './db.js' // db.js が server/.env を読み込む
import { parseValue, formatValue, parseRankNo } from './time.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist') // フロントの本番ビルド出力

const app = express()
app.use(cors())
app.use(express.json())

// 非同期ルートのエラーを拾う薄いラッパー
const h = (fn) => (req, res) => fn(req, res).catch(e => {
  console.error(e)
  res.status(500).json({ error: e.message })
})
const nz = (v) => (v === '' || v === undefined ? null : v) // 空文字は NULL に

// 選手の共通並び順：小学女子 → 小学男子 → 中学女子 → 中学男子 → 高校 → 一般（各区分内は学年の高い順 → 選手ID）
// 選手一覧・記録の一覧登録・ベスト一覧・注文画面の選手選択で共通
const PLAYER_ORDER = `CASE p.org_kind WHEN '小学' THEN 0 WHEN '中学' THEN 1 WHEN '高校' THEN 2 WHEN '一般' THEN 3 ELSE 9 END,
      CASE p.gender WHEN '女' THEN 0 WHEN '男' THEN 1 ELSE 2 END,
      CAST(p.grade AS UNSIGNED) DESC, p.id`

// ============ 認証（簡易方式：テーブル照合。練習管理System と同じアカウント）============
app.post('/auth/admin', h(async (req, res) => {
  const { loginId, password } = req.body
  const rows = await q('SELECT id, login_id, name FROM admins WHERE login_id=? AND password=? LIMIT 1', [loginId, password])
  res.json(rows[0] || null)
}))

app.post('/auth/player', h(async (req, res) => {
  const { loginId, password } = req.body
  const rows = await q('SELECT * FROM players WHERE login_id=? AND password=? LIMIT 1', [loginId, password])
  res.json(rows[0] || null)
}))

// ============ teams（練習管理System のチーム。表示順に使用）============
app.get('/teams', h(async (_req, res) => {
  res.json(await q('SELECT * FROM teams ORDER BY sort_order'))
}))

// ============ masters（会員区分・団体区分・ユニフォーム）============
const MASTER_KINDS = ['member_rank', 'org_kind', 'uniform']

app.get('/masters', h(async (_req, res) => {
  const rows = await q('SELECT * FROM masters WHERE kind IN (?) ORDER BY kind, sort_order', [MASTER_KINDS])
  const out = Object.fromEntries(MASTER_KINDS.map(k => [k, []]))
  rows.forEach(r => out[r.kind].push(r.value))
  res.json(out)
}))

app.put('/masters/:kind', h(async (req, res) => {
  const { kind } = req.params
  if (!MASTER_KINDS.includes(kind)) return res.status(400).json({ error: 'unknown kind' })
  const values = (req.body.values || []).map(v => String(v).trim()).filter(Boolean)
  await q('DELETE FROM masters WHERE kind=?', [kind])
  for (let i = 0; i < values.length; i++) {
    await q('INSERT INTO masters (kind, value, sort_order) VALUES (?,?,?)', [kind, values[i], i + 1])
  }
  res.json({ ok: true })
}))

// ============ events（種目）============
app.get('/events', h(async (_req, res) => {
  res.json(await q('SELECT e.*, (SELECT COUNT(*) FROM results r WHERE r.event_id=e.id) AS result_count FROM events e ORDER BY sort_order, id'))
}))

app.post('/events', h(async (req, res) => {
  const { id, name, kind = 'time' } = req.body
  if (!name || !String(name).trim()) return res.status(400).json({ error: '種目名を入力してください' })
  if (id) {
    await q('UPDATE events SET name=?, kind=? WHERE id=?', [String(name).trim(), kind, id])
  } else {
    const mx = await q('SELECT COALESCE(MAX(sort_order),0) AS m FROM events')
    await q('INSERT INTO events (name, kind, sort_order) VALUES (?,?,?)', [String(name).trim(), kind, mx[0].m + 1])
  }
  res.json({ ok: true })
}))

app.put('/events/order', h(async (req, res) => {
  const ids = req.body.ids || []
  for (let i = 0; i < ids.length; i++) await q('UPDATE events SET sort_order=? WHERE id=?', [i + 1, ids[i]])
  res.json({ ok: true })
}))

app.delete('/events/:id', h(async (req, res) => {
  const used = await q('SELECT COUNT(*) AS n FROM results WHERE event_id=?', [req.params.id])
  if (used[0].n > 0) return res.status(400).json({ error: `記録が ${used[0].n} 件登録されているため削除できません` })
  await q('DELETE FROM events WHERE id=?', [req.params.id])
  res.json({ ok: true })
}))

// ============ players（練習管理System と共有テーブル）============
const PLAYER_COLS = ['name', 'kana', 'eng', 'birth', 'gender', 'school', 'org_kind', 'grade', 'bib', 'jaaf', 'uniform',
  'note', 'rank', 'joined', 'trainee', 'team_code', 'login_id', 'password']
const qcol = (c) => '`' + c + '`' // rank が MySQL 予約語のため

app.get('/players', h(async (_req, res) => {
  res.json(await q(`SELECT p.*, t.sort_order AS team_sort,
      (SELECT COUNT(*) FROM results r WHERE r.player_id=p.id) AS result_count
    FROM players p LEFT JOIN teams t ON t.code=p.team_code
    ORDER BY ${PLAYER_ORDER}`))
}))

app.get('/players/:id', h(async (req, res) => {
  const id = req.params.id
  const rows = await q('SELECT * FROM players WHERE id=?', [id])
  if (!rows[0]) return res.status(404).json({ error: 'not found' })
  const bests = await q('SELECT * FROM v_personal_bests WHERE player_id=? ORDER BY event_sort', [id])
  const results = await q(`SELECT r.*, e.name AS event_name, e.kind AS event_kind, e.sort_order AS event_sort,
      c.name AS competition_name, c.kind AS competition_kind, c.date_from, c.date_to,
      (v.result_id IS NOT NULL) AS is_pb
    FROM results r JOIN events e ON e.id=r.event_id JOIN competitions c ON c.id=r.competition_id
    LEFT JOIN v_personal_bests v ON v.result_id=r.id
    WHERE r.player_id=? ORDER BY c.date_from DESC, e.sort_order`, [id])
  res.json({ ...rows[0], bests, results })
}))

app.post('/players', h(async (req, res) => {
  const p = { ...req.body }
  if (!p.name || !String(p.name).trim()) return res.status(400).json({ error: '氏名を入力してください' })
  if (!p.login_id || !String(p.login_id).trim()) return res.status(400).json({ error: 'ログインIDを入力してください' })
  p.birth = nz(p.birth)
  p.trainee = p.trainee ? 1 : 0
  p.team_code = nz(p.team_code)
  const dup = await q('SELECT id FROM players WHERE login_id=? AND id<>? LIMIT 1', [p.login_id, p.id || 0])
  if (dup.length) return res.status(400).json({ error: 'そのログインIDは既に使われています' })
  if (p.id) {
    const sets = PLAYER_COLS.map(c => `${qcol(c)}=?`).join(',')
    await q(`UPDATE players SET ${sets} WHERE id=?`, [...PLAYER_COLS.map(c => nz(p[c]) ?? null), p.id])
    res.json({ ok: true, id: p.id })
  } else {
    const cols = PLAYER_COLS.map(qcol).join(',')
    const ph = PLAYER_COLS.map(() => '?').join(',')
    const r = await q(`INSERT INTO players (${cols}) VALUES (${ph})`, PLAYER_COLS.map(c => nz(p[c]) ?? null))
    res.json({ ok: true, id: r.insertId })
  }
}))

app.delete('/players/:id', h(async (req, res) => {
  // 記録・練習管理System側の評価等も FK CASCADE で消える
  await q('DELETE FROM players WHERE id=?', [req.params.id])
  res.json({ ok: true })
}))

// ============ competitions（大会・記録会）============
app.get('/competitions', h(async (_req, res) => {
  res.json(await q(`SELECT c.*, (SELECT COUNT(*) FROM results r WHERE r.competition_id=c.id) AS result_count,
      (SELECT COUNT(DISTINCT r.player_id) FROM results r WHERE r.competition_id=c.id) AS player_count
    FROM competitions c ORDER BY c.date_from DESC, c.id DESC`))
}))

app.post('/competitions', h(async (req, res) => {
  const c = req.body
  if (!c.name || !String(c.name).trim()) return res.status(400).json({ error: '大会名を入力してください' })
  if (!c.date_from) return res.status(400).json({ error: '開催日を入力してください' })
  const vals = [String(c.name).trim(), c.kind || '大会', c.date_from, nz(c.date_to), nz(c.place), nz(c.note)]
  if (c.id) {
    await q('UPDATE competitions SET name=?, kind=?, date_from=?, date_to=?, place=?, note=? WHERE id=?', [...vals, c.id])
    res.json({ ok: true, id: c.id })
  } else {
    const r = await q('INSERT INTO competitions (name, kind, date_from, date_to, place, note) VALUES (?,?,?,?,?,?)', vals)
    res.json({ ok: true, id: r.insertId })
  }
}))

app.delete('/competitions/:id', h(async (req, res) => {
  await q('DELETE FROM competitions WHERE id=?', [req.params.id])
  res.json({ ok: true })
}))

// ============ results（記録）============
// 大会ごとの記録一覧（PB判定付き）
app.get('/competitions/:id/results', h(async (req, res) => {
  res.json(await q(`SELECT r.*, e.name AS event_name, e.kind AS event_kind, p.name AS player_name,
      (v.result_id IS NOT NULL) AS is_pb
    FROM results r JOIN events e ON e.id=r.event_id JOIN players p ON p.id=r.player_id
    LEFT JOIN v_personal_bests v ON v.result_id=r.id
    WHERE r.competition_id=? ORDER BY ${PLAYER_ORDER}, e.sort_order, r.id`, [req.params.id]))
}))

// 一覧登録：大会の記録を丸ごと置き換え（body: { rows:[{player_id, event_id, mark, rank_text, note}] }）
app.put('/competitions/:id/results', h(async (req, res) => {
  const compId = Number(req.params.id)
  const rows = req.body.rows || []
  const events = await q('SELECT id, kind FROM events')
  const kindOf = Object.fromEntries(events.map(e => [e.id, e.kind]))
  // 入力チェック
  for (const r of rows) {
    if (!r.player_id || !r.event_id) return res.status(400).json({ error: '選手と種目を選択してください' })
    if (r.mark && parseValue(r.mark, kindOf[r.event_id]) === null) return res.status(400).json({ error: `記録の形式が不正です: ${r.mark}` })
  }
  // 保存前のベスト（この大会を除く）を取得 → 新記録件数を返す
  const before = await bestsExcluding(compId)
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query('DELETE FROM results WHERE competition_id=?', [compId])
    let pbCount = 0
    for (const r of rows) {
      const kind = kindOf[r.event_id] || 'time'
      const value = r.mark ? parseValue(r.mark, kind) : null
      const mark = value === null ? nz(r.mark) : formatValue(value, kind)
      const rankText = nz(r.rank_text)
      await conn.query(
        'INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no, note) VALUES (?,?,?,?,?,?,?,?)',
        [compId, r.player_id, r.event_id, value, mark, rankText, parseRankNo(rankText), nz(r.note)])
      const b = before[`${r.player_id}:${r.event_id}`]
      if (value !== null && (b === undefined || (kind === 'distance' ? value > b : value < b))) pbCount++
    }
    await conn.commit()
    res.json({ ok: true, pbCount })
  } catch (e) {
    await conn.rollback(); throw e
  } finally { conn.release() }
}))

// 指定大会を除いた選手×種目のベスト値（一覧登録画面のPB判定用）
async function bestsExcluding(compId) {
  const rows = await q(`SELECT r.player_id, r.event_id, e.kind,
      MIN(r.value) AS min_v, MAX(r.value) AS max_v
    FROM results r JOIN events e ON e.id=r.event_id
    WHERE r.competition_id<>? AND r.value IS NOT NULL GROUP BY r.player_id, r.event_id, e.kind`, [compId])
  const out = {}
  rows.forEach(r => { out[`${r.player_id}:${r.event_id}`] = r.kind === 'distance' ? Number(r.max_v) : Number(r.min_v) })
  return out
}

app.get('/pb/baseline', h(async (req, res) => {
  res.json(await bestsExcluding(Number(req.query.exclude || 0)))
}))

// 選手の全記録
app.get('/results/player/:playerId', h(async (req, res) => {
  res.json(await q(`SELECT r.*, e.name AS event_name, e.kind AS event_kind, c.name AS competition_name, c.kind AS competition_kind, c.date_from,
      (v.result_id IS NOT NULL) AS is_pb
    FROM results r JOIN events e ON e.id=r.event_id JOIN competitions c ON c.id=r.competition_id
    LEFT JOIN v_personal_bests v ON v.result_id=r.id
    WHERE r.player_id=? ORDER BY c.date_from DESC, e.sort_order`, [req.params.playerId]))
}))

// ============ ベストタイム一覧（練習管理System からも参照）============
app.get('/pb', h(async (_req, res) => {
  res.json(await q(`SELECT v.*, p.name AS player_name, p.kana, p.gender, p.org_kind, p.grade, p.team_code, p.trainee, p.\`rank\` AS member_rank,
      COALESCE(t.sort_order, 99) AS team_sort
    FROM v_personal_bests v JOIN players p ON p.id=v.player_id LEFT JOIN teams t ON t.code=p.team_code
    ORDER BY ${PLAYER_ORDER}, v.event_sort`))
}))

// ============ trials（体験申込）============
app.get('/trials', h(async (_req, res) => {
  res.json(await q(`SELECT t.*, p.name AS player_name,
      (SELECT COUNT(*) FROM trial_visits v WHERE v.trial_id=t.id) AS visit_count,
      (SELECT MAX(v.visit_date) FROM trial_visits v WHERE v.trial_id=t.id) AS last_visit
    FROM trials t LEFT JOIN players p ON p.id=t.player_id
    ORDER BY COALESCE(t.inquiry_date, t.created_at) DESC, t.id DESC`))
}))

app.get('/trials/:id', h(async (req, res) => {
  const rows = await q('SELECT t.*, p.name AS player_name FROM trials t LEFT JOIN players p ON p.id=t.player_id WHERE t.id=?', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'not found' })
  const visits = await q('SELECT * FROM trial_visits WHERE trial_id=? ORDER BY visit_no, visit_date', [req.params.id])
  res.json({ ...rows[0], visits })
}))

const TRIAL_COLS = ['name', 'kana', 'eng', 'gender', 'org_kind', 'grade', 'school', 'guardian', 'contact', 'inquiry_date', 'status', 'joined_date', 'note']
app.post('/trials', h(async (req, res) => {
  const t = req.body
  if (!t.name || !String(t.name).trim()) return res.status(400).json({ error: '氏名を入力してください' })
  const vals = TRIAL_COLS.map(c => c === 'status' ? (t.status || '問合せ') : (nz(t[c]) ?? null))
  if (t.id) {
    await q(`UPDATE trials SET ${TRIAL_COLS.map(c => c + '=?').join(',')} WHERE id=?`, [...vals, t.id])
    res.json({ ok: true, id: t.id })
  } else {
    const r = await q(`INSERT INTO trials (${TRIAL_COLS.join(',')}) VALUES (${TRIAL_COLS.map(() => '?').join(',')})`, vals)
    res.json({ ok: true, id: r.insertId })
  }
}))

app.delete('/trials/:id', h(async (req, res) => {
  await q('DELETE FROM trials WHERE id=?', [req.params.id])
  res.json({ ok: true })
}))

// 体験の各回を丸ごと置き換え（body: { rows:[{visit_date, event_text, result, coach}] }）
app.put('/trials/:id/visits', h(async (req, res) => {
  const id = req.params.id
  const rows = (req.body.rows || []).filter(r => r.visit_date)
  rows.sort((a, b) => a.visit_date.localeCompare(b.visit_date))
  await q('DELETE FROM trial_visits WHERE trial_id=?', [id])
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    await q('INSERT INTO trial_visits (trial_id, visit_no, visit_date, event_text, result, coach) VALUES (?,?,?,?,?,?)',
      [id, i + 1, r.visit_date, nz(r.event_text), nz(r.result), nz(r.coach)])
  }
  // 体験が1回以上あり、まだ問合せ状態なら「体験中」へ
  if (rows.length) await q("UPDATE trials SET status='体験中' WHERE id=? AND status='問合せ'", [id])
  res.json({ ok: true })
}))

// 入会登録：選手を作成（または既存選手に紐付け）して status=入会
// body: { joined_date, player_id? , player: {...PLAYER_COLS} }
app.post('/trials/:id/join', h(async (req, res) => {
  const id = req.params.id
  const { joined_date, player } = req.body
  let playerId = req.body.player_id || null
  if (!playerId) {
    if (!player || !player.name || !player.login_id) return res.status(400).json({ error: '選手の氏名とログインIDを入力してください' })
    const dup = await q('SELECT id FROM players WHERE login_id=? LIMIT 1', [player.login_id])
    if (dup.length) return res.status(400).json({ error: 'そのログインIDは既に使われています' })
    const p = { ...player, birth: nz(player.birth), trainee: player.trainee ? 1 : 0, team_code: nz(player.team_code) }
    const cols = PLAYER_COLS.map(qcol).join(',')
    const ph = PLAYER_COLS.map(() => '?').join(',')
    const r = await q(`INSERT INTO players (${cols}) VALUES (${ph})`, PLAYER_COLS.map(c => nz(p[c]) ?? null))
    playerId = r.insertId
  }
  await q("UPDATE trials SET status='入会', joined_date=?, player_id=? WHERE id=?", [nz(joined_date), playerId, id])
  res.json({ ok: true, player_id: playerId })
}))

// ============ 物品注文管理（order_items / orders）============
const splitSizes = (s) => String(s || '').split(/[,、，\s]+/).map(x => x.trim()).filter(Boolean)

app.get('/order-items', h(async (_req, res) => {
  res.json(await q(`SELECT i.*, (SELECT COUNT(*) FROM orders o WHERE o.item_id=i.id) AS order_count
    FROM order_items i ORDER BY i.sort_order, i.id`))
}))

app.post('/order-items', h(async (req, res) => {
  const it = req.body
  const name = String(it.name || '').trim()
  if (!name) return res.status(400).json({ error: 'アイテム名を入力してください' })
  const sizes = splitSizes(it.sizes).join(',')
  const price = it.price === '' || it.price === undefined || it.price === null ? null : Number(it.price)
  if (it.id) {
    await q('UPDATE order_items SET name=?, sizes=?, price=?, note=?, active=? WHERE id=?',
      [name, sizes, price, nz(it.note), it.active === false || it.active === 0 ? 0 : 1, it.id])
    res.json({ ok: true, id: it.id })
  } else {
    const mx = await q('SELECT COALESCE(MAX(sort_order),0) AS m FROM order_items')
    const r = await q('INSERT INTO order_items (name, sizes, price, note, sort_order) VALUES (?,?,?,?,?)', [name, sizes, price, nz(it.note), mx[0].m + 1])
    res.json({ ok: true, id: r.insertId })
  }
}))

app.put('/order-items/order', h(async (req, res) => {
  const ids = req.body.ids || []
  for (let i = 0; i < ids.length; i++) await q('UPDATE order_items SET sort_order=? WHERE id=?', [i + 1, ids[i]])
  res.json({ ok: true })
}))

app.delete('/order-items/:id', h(async (req, res) => {
  const used = await q('SELECT COUNT(*) AS n FROM orders WHERE item_id=?', [req.params.id])
  if (used[0].n > 0) return res.status(400).json({ error: `注文が ${used[0].n} 件あるため削除できません（受付終了にしてください）` })
  await q('DELETE FROM order_items WHERE id=?', [req.params.id])
  res.json({ ok: true })
}))

// 注文一覧（アイテム・注文者名を結合。絞り込みは画面側）
const ORDER_SELECT = `SELECT o.*, i.name AS item_name, i.price AS item_price, i.sort_order AS item_sort,
    COALESCE(p.name, o.orderer_name) AS who, p.name AS player_name, p.org_kind, p.grade, p.gender, p.team_code
  FROM orders o JOIN order_items i ON i.id=o.item_id LEFT JOIN players p ON p.id=o.player_id`

app.get('/orders', h(async (_req, res) => {
  res.json(await q(`${ORDER_SELECT} ORDER BY i.sort_order, o.ordered_date DESC, o.id DESC`))
}))

const ORDER_COLS = ['item_id', 'player_id', 'orderer_name', 'size', 'qty', 'placed', 'ordered_date', 'delivered_date', 'paid_date', 'amount', 'note']
function orderVals(o) {
  if (!o.item_id) throw Object.assign(new Error('アイテムを選択してください'), { status: 400 })
  if (!o.player_id && !String(o.orderer_name || '').trim()) throw Object.assign(new Error('注文者（選手または氏名）を入力してください'), { status: 400 })
  if (!o.ordered_date) throw Object.assign(new Error('注文日を入力してください'), { status: 400 })
  return [
    Number(o.item_id), o.player_id ? Number(o.player_id) : null, o.player_id ? null : String(o.orderer_name).trim(),
    nz(o.size), Math.max(1, Number(o.qty) || 1), o.placed ? 1 : 0, o.ordered_date, nz(o.delivered_date), nz(o.paid_date),
    o.amount === '' || o.amount === undefined || o.amount === null ? null : Number(o.amount), nz(o.note),
  ]
}
const badReq = (res, e) => (e.status === 400 ? (res.status(400).json({ error: e.message }), true) : false)

app.post('/orders', h(async (req, res) => {
  const o = req.body
  let vals
  try { vals = orderVals(o) } catch (e) { if (badReq(res, e)) return; throw e }
  if (o.id) {
    await q(`UPDATE orders SET ${ORDER_COLS.map(c => c + '=?').join(',')} WHERE id=?`, [...vals, o.id])
    res.json({ ok: true, id: o.id })
  } else {
    const r = await q(`INSERT INTO orders (${ORDER_COLS.join(',')}) VALUES (${ORDER_COLS.map(() => '?').join(',')})`, vals)
    res.json({ ok: true, id: r.insertId })
  }
}))

// まとめて注文（body: { rows:[{item_id, player_id, size, qty, ordered_date, note}] }）
app.post('/orders/bulk', h(async (req, res) => {
  const rows = req.body.rows || []
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    for (const o of rows) {
      const vals = orderVals(o)
      await conn.query(`INSERT INTO orders (${ORDER_COLS.join(',')}) VALUES (${ORDER_COLS.map(() => '?').join(',')})`, vals)
    }
    await conn.commit()
    res.json({ ok: true, count: rows.length })
  } catch (e) {
    await conn.rollback()
    if (badReq(res, e)) return
    throw e
  } finally { conn.release() }
}))

// ワンタップ更新（body: { field:'delivered_date'|'paid_date', date:'yyyy-mm-dd'|null } または { field:'placed', value:0|1 }）
app.post('/orders/:id/mark', h(async (req, res) => {
  const { field, date, value } = req.body
  if (field === 'placed') {
    await q('UPDATE orders SET placed=? WHERE id=?', [value ? 1 : 0, req.params.id])
    return res.json({ ok: true })
  }
  if (!['delivered_date', 'paid_date'].includes(field)) return res.status(400).json({ error: 'bad field' })
  await q(`UPDATE orders SET ${field}=? WHERE id=?`, [nz(date), req.params.id])
  res.json({ ok: true })
}))

app.delete('/orders/:id', h(async (req, res) => {
  await q('DELETE FROM orders WHERE id=?', [req.params.id])
  res.json({ ok: true })
}))

// ============ フロント本番ビルドの配信 ============
// dist/ があれば静的配信し、未知のGETパスは index.html を返す（SPAフォールバック）
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get(/.*/, (req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

// ============ 起動 ============
const PORT = Number(process.env.PORT || 3002)
// 0.0.0.0 で待ち受け → LAN 内の他端末からもアクセス可能
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Players server listening on http://0.0.0.0:${PORT}`)
})
