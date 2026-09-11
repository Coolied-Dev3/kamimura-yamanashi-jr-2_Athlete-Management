// ローカルMySQLバックエンド（server/）と通信するAPIクライアント。
// 接続先は .env の VITE_API_BASE。
// 開発時は http://localhost:3002、本番ビルド時は空文字（＝同一オリジンへ相対アクセス）。
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3002'

async function req(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = res.statusText
    try { const j = await res.json(); if (j.error) msg = j.error } catch { /* ignore */ }
    throw new Error(msg)
  }
  return res.json()
}

const enc = encodeURIComponent

// ---- 認証 ----
export const loginAdmin = (loginId, password) => req('/auth/admin', { method: 'POST', body: { loginId, password } })
export const loginPlayer = (loginId, password) => req('/auth/player', { method: 'POST', body: { loginId, password } })

// ---- 共通マスタ ----
export const getTeams = () => req('/teams')
export const getMasters = () => req('/masters')
export const replaceMasters = (kind, values) => req('/masters/' + enc(kind), { method: 'PUT', body: { values } })

// ---- 種目 ----
export const getEvents = () => req('/events')
export const saveEvent = (ev) => req('/events', { method: 'POST', body: ev })
export const reorderEvents = (ids) => req('/events/order', { method: 'PUT', body: { ids } })
export const deleteEvent = (id) => req('/events/' + enc(id), { method: 'DELETE' })

// ---- 選手 ----
export const getPlayers = () => req('/players')
export const getPlayer = (id) => req('/players/' + enc(id))
export const savePlayer = (player) => req('/players', { method: 'POST', body: player })
export const deletePlayer = (id) => req('/players/' + enc(id), { method: 'DELETE' })

// ---- 大会・記録 ----
export const getCompetitions = () => req('/competitions')
export const saveCompetition = (c) => req('/competitions', { method: 'POST', body: c })
export const deleteCompetition = (id) => req('/competitions/' + enc(id), { method: 'DELETE' })
export const getCompetitionResults = (id) => req('/competitions/' + enc(id) + '/results')
export const saveCompetitionResults = (id, rows) => req('/competitions/' + enc(id) + '/results', { method: 'PUT', body: { rows } })
export const getPbBaseline = (excludeCompetitionId) => req('/pb/baseline?exclude=' + enc(excludeCompetitionId || 0))
export const getPlayerResults = (playerId) => req('/results/player/' + enc(playerId))

// ---- ベストタイム ----
export const getPersonalBests = () => req('/pb')

// ---- 体験申込 ----
export const getTrials = () => req('/trials')
export const getTrial = (id) => req('/trials/' + enc(id))
export const saveTrial = (t) => req('/trials', { method: 'POST', body: t })
export const deleteTrial = (id) => req('/trials/' + enc(id), { method: 'DELETE' })
export const saveTrialVisits = (id, rows) => req('/trials/' + enc(id) + '/visits', { method: 'PUT', body: { rows } })
export const joinTrial = (id, body) => req('/trials/' + enc(id) + '/join', { method: 'POST', body })

// ---- 物品注文管理 ----
export const getOrderItems = () => req('/order-items')
export const saveOrderItem = (it) => req('/order-items', { method: 'POST', body: it })
export const reorderOrderItems = (ids) => req('/order-items/order', { method: 'PUT', body: { ids } })
export const deleteOrderItem = (id) => req('/order-items/' + enc(id), { method: 'DELETE' })
export const getOrders = () => req('/orders')
export const saveOrder = (o) => req('/orders', { method: 'POST', body: o })
export const saveOrdersBulk = (rows) => req('/orders/bulk', { method: 'POST', body: { rows } })
export const markOrder = (id, field, date) => req('/orders/' + enc(id) + '/mark', { method: 'POST', body: { field, date } })
export const setOrderPlaced = (id, value) => req('/orders/' + enc(id) + '/mark', { method: 'POST', body: { field: 'placed', value: value ? 1 : 0 } })
export const deleteOrder = (id) => req('/orders/' + enc(id), { method: 'DELETE' })
