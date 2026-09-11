import { useState, useEffect } from 'react'
import * as api from '../api'
import { fmt, todayStr, Loading } from '../App.jsx'
import { orgGrade } from './Players.jsx'

// ============ 物品注文管理 ============
// アイテム（練習Tシャツ・レースユニフォーム等）をキーに、誰が・何を・いつ注文 / いつ手渡し / いつ費用徴収 を管理
const splitSizes = (s) => String(s || '').split(/[,、，\s]+/).map(x => x.trim()).filter(Boolean)
const STATUS = ['すべて', '未注文', '注文済み', '未手渡し', '未徴収', '完了']
const yen = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('ja-JP') + '円')
// 状態: 未注文（受付のみ）→ 注文済み（業者へ発注）→ 手渡し済 → 完了（手渡し＋徴収）
const statusOf = (o) => (o.paid_date && o.delivered_date ? '完了' : o.delivered_date ? '手渡し済' : o.placed ? '注文済み' : '未注文')
// onToggle 指定時、未注文／注文済みのバッジはクリックで切替できる
const StatusBadge = ({ o, onToggle }) => {
  const s = statusOf(o)
  const clickable = onToggle && (s === '未注文' || s === '注文済み')
  return (
    <span className={'ost' + (s === '完了' ? ' p' : s === '手渡し済' ? ' d' : s === '未注文' ? ' n' : '') + (clickable ? ' clk' : '')}
      title={clickable ? (s === '未注文' ? 'クリックで注文済みにする' : 'クリックで未注文に戻す') : undefined}
      onClick={clickable ? () => onToggle(o) : undefined}>{s}</span>
  )
}

export function OrdersPage({ masters, toast }) {
  const [items, setItems] = useState(null)
  const [orders, setOrders] = useState(null)
  const [players, setPlayers] = useState([])
  const [itemId, setItemId] = useState('all')   // アイテムで絞り込み（キー）
  const [st, setSt] = useState('すべて')          // 進捗で絞り込み
  const [qtext, setQtext] = useState('')
  const [edit, setEdit] = useState(undefined)     // undefined=閉, null=新規, obj=編集
  const [bulk, setBulk] = useState(false)
  const [manage, setManage] = useState(false)

  async function reload() {
    const [it, os, ps] = await Promise.all([api.getOrderItems(), api.getOrders(), api.getPlayers()])
    setItems(it); setOrders(os); setPlayers(ps)
  }
  useEffect(() => { reload() }, [])
  if (items === null || orders === null) return <Loading />

  const activeItems = items.filter(i => i.active)
  const match = (o) =>
    (itemId === 'all' || String(o.item_id) === itemId) &&
    (st === 'すべて' || (st === '未注文' ? !o.placed : st === '注文済み' ? !!o.placed : st === '未手渡し' ? !o.delivered_date : st === '未徴収' ? !o.paid_date : !!(o.delivered_date && o.paid_date))) &&
    (!qtext || `${o.who || ''}${o.note || ''}${o.size || ''}`.includes(qtext.trim()))
  const shown = orders.filter(match)
  // アイテムごとにグループ表示（表示順＝アイテムの並び順）
  const groups = items.filter(i => itemId === 'all' || String(i.id) === itemId)
    .map(i => ({ item: i, rows: shown.filter(o => o.item_id === i.id) }))
    .filter(g => g.rows.length > 0 || itemId !== 'all')

  async function quick(o, field) {
    const has = !!o[field]
    const label = field === 'delivered_date' ? '手渡し' : '費用徴収'
    if (has && !confirm(`${o.who} の${label}日（${fmt(o[field])}）を取り消しますか？`)) return
    try {
      await api.markOrder(o.id, field, has ? null : todayStr())
      await reload()
      toast(has ? `${label}を取り消しました` : `${label}を記録しました（${fmt(todayStr())}）✓`)
    } catch (e) { toast('エラー: ' + e.message) }
  }
  async function togglePlaced(o) {
    try {
      await api.setOrderPlaced(o.id, !o.placed)
      await reload()
      toast(o.placed ? `${o.who} を未注文に戻しました` : `${o.who} を注文済みにしました ✓`)
    } catch (e) { toast('エラー: ' + e.message) }
  }
  // アイテム内の表示中の注文をまとめて注文済み／未注文に
  async function placeAll(rows, value) {
    const targets = rows.filter(o => !!o.placed !== value)
    if (!targets.length) return
    if (!confirm(`表示中の ${targets.length} 件を${value ? '注文済み' : '未注文'}にしますか？`)) return
    try {
      for (const o of targets) await api.setOrderPlaced(o.id, value)
      await reload()
      toast(`${targets.length} 件を${value ? '注文済み' : '未注文'}にしました ✓`)
    } catch (e) { toast('エラー: ' + e.message) }
  }

  return (
    <>
      <div className="cr">
        <button className={'ch' + (itemId === 'all' ? ' on' : '')} onClick={() => setItemId('all')}>すべてのアイテム</button>
        {items.map(i => (
          <button key={i.id} className={'ch' + (String(i.id) === itemId ? ' on' : '')} onClick={() => setItemId(String(i.id))}>
            {i.name}{!i.active && '（終了）'} {i.order_count}
          </button>
        ))}
      </div>
      <div className="cr" style={{ paddingTop: 0 }}>
        {STATUS.map(s => <button key={s} className={'ch' + (st === s ? ' on' : '')} onClick={() => setSt(s)}>{s}</button>)}
        <span style={{ borderLeft: '1px solid var(--line2)', margin: '0 3px' }} />
        <button className="ch" onClick={() => setManage(true)}><i className="ti ti-settings" /> アイテム設定</button>
      </div>
      <div className="srch"><input className="in" placeholder="注文者・サイズ・備考で検索" value={qtext} onChange={e => setQtext(e.target.value)} /></div>
      <div className="actbar">
        <button className="ab" onClick={() => setEdit(null)}><i className="ti ti-plus" /> 注文を追加</button>
        <button className="ab" onClick={() => setBulk(true)}><i className="ti ti-users-plus" /> 選手をまとめて注文</button>
      </div>

      {groups.length === 0 && <p className="empty"><i className="ti ti-shirt" />該当する注文がありません</p>}

      {groups.map(({ item, rows }) => {
        const n = rows.reduce((a, o) => a + o.qty, 0)
        const placed = rows.filter(o => o.placed).length
        const dlv = rows.filter(o => o.delivered_date).length
        const paid = rows.filter(o => o.paid_date).length
        const sum = rows.reduce((a, o) => a + (o.amount ?? (item.price ? item.price * o.qty : 0)), 0)
        // サイズ別の集計（発注用）
        const bySize = {}
        rows.forEach(o => { const k = o.size || '未指定'; bySize[k] = (bySize[k] || 0) + o.qty })
        return (
          <div key={item.id}>
            <div className="ohead">
              <i className="ti ti-shirt" style={{ color: 'var(--sax)', fontSize: 18 }} />
              <span className="t">{item.name}{!item.active && <span className="bt">受付終了</span>}</span>
              {item.price != null && <span style={{ fontSize: 12, color: 'var(--text2)' }}>単価 {yen(item.price)}</span>}
            </div>
            <div className="osum">
              <span>受付 <b>{rows.length}件 / {n}点</b></span>
              <span>注文済み <b>{placed}</b>／未注文 <b style={{ color: placed < rows.length ? 'var(--red)' : undefined }}>{rows.length - placed}</b></span>
              <span>手渡し済 <b>{dlv}</b>／未 <b style={{ color: dlv < rows.length ? 'var(--amber)' : undefined }}>{rows.length - dlv}</b></span>
              <span>徴収済 <b>{paid}</b>／未 <b style={{ color: paid < rows.length ? 'var(--amber)' : undefined }}>{rows.length - paid}</b></span>
              {sum > 0 && <span>金額計 <b>{yen(sum)}</b></span>}
              <span>サイズ別: {Object.entries(bySize).map(([k, v]) => `${k}×${v}`).join('　')}</span>
              {rows.length > 0 && (placed < rows.length
                ? <button className="qb" onClick={() => placeAll(rows, true)}><i className="ti ti-checks" /> 表示中を全て注文済みに</button>
                : <button className="qb done" onClick={() => placeAll(rows, false)}>全て未注文に戻す</button>)}
            </div>
            {rows.length === 0 ? <p className="empty" style={{ padding: '14px 0' }}>注文がありません</p> : (
              <div className="tw"><table className="tb">
                <thead><tr><th>注文者</th><th>サイズ</th><th>数量</th><th>注文</th><th>受付日</th><th>手渡し日</th><th>徴収日</th><th>金額</th><th>状況</th><th>備考</th><th></th></tr></thead>
                <tbody>{rows.map(o => (
                  <tr key={o.id}>
                    <td className="cell" onClick={() => setEdit(o)} style={{ fontWeight: 500 }}>
                      {o.who}{!o.player_id && <span className="bk">選手外</span>}
                      {o.player_name && <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 400 }}>{orgGrade(o)}</div>}
                    </td>
                    <td className="cell" onClick={() => setEdit(o)}>{o.size || '—'}</td>
                    <td className="cell num" onClick={() => setEdit(o)}>{o.qty}</td>
                    <td><button className={'qb tg' + (o.placed ? ' on' : '')} title={o.placed ? 'クリックで未注文に戻す' : 'クリックで注文済みにする'} onClick={() => togglePlaced(o)}>
                      {o.placed ? <><i className="ti ti-check" /> 注文済み</> : <><i className="ti ti-circle" /> 未注文</>}</button></td>
                    <td className="cell" onClick={() => setEdit(o)}>{fmt(o.ordered_date)}</td>
                    <td><button className={'qb' + (o.delivered_date ? ' done' : '')} title={o.delivered_date ? 'タップで取消' : '今日の日付で手渡し記録'} onClick={() => quick(o, 'delivered_date')}>
                      {o.delivered_date ? fmt(o.delivered_date) : <><i className="ti ti-hand-move" /> 手渡し</>}</button></td>
                    <td><button className={'qb' + (o.paid_date ? ' done' : '')} title={o.paid_date ? 'タップで取消' : '今日の日付で徴収記録'} onClick={() => quick(o, 'paid_date')}>
                      {o.paid_date ? fmt(o.paid_date) : <><i className="ti ti-coin-yen" /> 徴収</>}</button></td>
                    <td className="cell num" onClick={() => setEdit(o)}>{yen(o.amount ?? (item.price ? item.price * o.qty : null))}</td>
                    <td><StatusBadge o={o} onToggle={togglePlaced} /></td>
                    <td className="cell" onClick={() => setEdit(o)} style={{ maxWidth: 260, whiteSpace: 'normal', fontSize: 13, color: 'var(--text2)' }}>{o.note || ''}</td>
                    <td><button className="iconbtn" title="編集" onClick={() => setEdit(o)}><i className="ti ti-edit" /></button></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        )
      })}

      {edit !== undefined && (
        <OrderModal order={edit} items={activeItems.length ? activeItems : items} players={players} defaultItem={itemId !== 'all' ? itemId : ''} toast={toast}
          onClose={() => setEdit(undefined)}
          onSaved={async () => { setEdit(undefined); await reload(); toast('保存しました ✓') }}
          onDeleted={async () => { setEdit(undefined); await reload(); toast('削除しました') }} />
      )}
      {bulk && (
        <BulkOrderModal items={activeItems} players={players} masters={masters} defaultItem={itemId !== 'all' ? itemId : ''} toast={toast}
          onClose={() => setBulk(false)}
          onSaved={async (n) => { setBulk(false); await reload(); toast(`${n}件の注文を登録しました ✓`) }} />
      )}
      {manage && <ItemsModal items={items} toast={toast} onClose={async () => { setManage(false); await reload() }} />}
    </>
  )
}

// ============ 注文 追加・編集 ============
function OrderModal({ order, items, players, defaultItem, toast, onClose, onSaved, onDeleted }) {
  const blank = { item_id: defaultItem || String(items[0]?.id || ''), player_id: '', orderer_name: '', size: '', qty: 1, placed: 0, ordered_date: todayStr(), delivered_date: '', paid_date: '', amount: '', note: '' }
  const [f, setF] = useState(() => {
    if (!order) return blank
    const o = { ...blank }
    Object.keys(blank).forEach(k => { o[k] = order[k] ?? '' })
    o.id = order.id; o.item_id = String(order.item_id); o.player_id = order.player_id ? String(order.player_id) : ''; o.placed = order.placed ? 1 : 0
    return o
  })
  const [other, setOther] = useState(!!(order && !order.player_id))
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const item = items.find(i => String(i.id) === f.item_id)
  const sizes = splitSizes(item?.sizes)
  const sizeOpts = f.size && !sizes.includes(f.size) ? [f.size, ...sizes] : sizes

  // 選手を選んだら登録済みユニフォームサイズを既定に
  function pickPlayer(pid) {
    set('player_id', pid)
    const p = players.find(x => String(x.id) === pid)
    if (p && p.uniform && !f.size && sizes.includes(p.uniform)) set('size', p.uniform)
  }

  async function save() {
    if (!f.item_id) { toast('アイテムを選択してください'); return }
    if (!other && !f.player_id) { toast('注文者（選手）を選択してください'); return }
    if (other && !f.orderer_name.trim()) { toast('注文者名を入力してください'); return }
    if (!f.ordered_date) { toast('受付日を入力してください'); return }
    setBusy(true)
    try {
      await api.saveOrder({ ...f, player_id: other ? null : Number(f.player_id), orderer_name: other ? f.orderer_name.trim() : null })
      onSaved()
    } catch (e) { toast('保存エラー: ' + e.message); setBusy(false) }
  }
  async function del() {
    if (!confirm(`${order.who} の「${order.item_name}」の注文を削除しますか？`)) return
    setBusy(true)
    try { await api.deleteOrder(order.id); onDeleted() } catch (e) { toast('削除エラー: ' + e.message); setBusy(false) }
  }
  const defaultAmount = item?.price != null ? item.price * (Number(f.qty) || 1) : null

  return (
    <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{order ? '注文を編集' : '注文を追加'}</p>
        <div className="fg"><label>アイテム *</label>
          <select value={f.item_id} onChange={e => { set('item_id', e.target.value); set('size', '') }}>
            <option value="">選択</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="fg"><label>注文者 *</label>
          <div className="cr" style={{ padding: '0 0 6px' }}>
            <button className={'ch' + (!other ? ' on' : '')} onClick={() => setOther(false)}>選手</button>
            <button className={'ch' + (other ? ' on' : '')} onClick={() => setOther(true)}>選手以外（コーチ・保護者など）</button>
          </div>
          {other
            ? <input value={f.orderer_name} placeholder="氏名" onChange={e => set('orderer_name', e.target.value)} />
            : <select value={f.player_id} onChange={e => pickPlayer(e.target.value)}>
                <option value="">選手を選択</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}{p.org_kind ? `（${orgGrade(p)}）` : ''}{p.uniform ? `　${p.uniform}` : ''}</option>)}
              </select>}
        </div>
        <div className="g2">
          <div className="fg"><label>サイズ</label>
            <select value={f.size} onChange={e => set('size', e.target.value)}>
              <option value="">未指定</option>{sizeOpts.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="fg"><label>数量</label><input type="number" min={1} value={f.qty} onChange={e => set('qty', e.target.value)} /></div>
        </div>
        <div className="sd"><i className="ti ti-calendar" />状態・日付</div>
        <div className="g2">
          <div className="fg"><label>注文状態</label>
            <select value={f.placed} onChange={e => set('placed', Number(e.target.value))}>
              <option value={0}>未注文</option><option value={1}>注文済み</option>
            </select>
          </div>
          <div className="fg"><label>受付日 *</label><input type="date" value={f.ordered_date || ''} onChange={e => set('ordered_date', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="fg"><label>手渡し日</label>
            <div className="row"><input type="date" value={f.delivered_date || ''} onChange={e => set('delivered_date', e.target.value)} />
              <button className="qb" onClick={() => set('delivered_date', todayStr())}>今日</button></div>
          </div>
          <div className="fg"><label>費用徴収日</label>
            <div className="row"><input type="date" value={f.paid_date || ''} onChange={e => set('paid_date', e.target.value)} />
              <button className="qb" onClick={() => set('paid_date', todayStr())}>今日</button></div>
          </div>
        </div>
        <div className="fg"><label>金額（円）{defaultAmount != null && !f.amount ? `　空欄なら単価×数量 = ${yen(defaultAmount)}` : ''}</label>
          <input type="number" min={0} value={f.amount} placeholder={defaultAmount != null ? String(defaultAmount) : ''} onChange={e => set('amount', e.target.value)} /></div>
        <div className="fg"><label>備考コメント</label><textarea rows={3} value={f.note} placeholder="例: 名入れあり／保護者から預かり済み など" onChange={e => set('note', e.target.value)} /></div>
        <div className="mf">
          <button className="bp" disabled={busy} onClick={save}>{busy ? '保存中...' : '保存'}</button>
          <button className="bc" onClick={onClose}>キャンセル</button>
          {order && <button className="delbtn" disabled={busy} onClick={del} style={{ marginTop: 8 }}><i className="ti ti-trash" /> この注文を削除</button>}
        </div>
      </div>
    </div>
  )
}

// ============ 選手をまとめて注文 ============
function BulkOrderModal({ items, players, masters, defaultItem, toast, onClose, onSaved }) {
  const [itemId, setItemId] = useState(defaultItem || String(items[0]?.id || ''))
  const [date, setDate] = useState(todayStr())
  const [org, setOrg] = useState('全員')
  const [sel, setSel] = useState({}) // player_id → {size, qty}
  const [busy, setBusy] = useState(false)
  const item = items.find(i => String(i.id) === itemId)
  const sizes = splitSizes(item?.sizes)
  const orgs = ['全員', ...masters.org_kind]
  const list = players.filter(p => org === '全員' || p.org_kind === org)
  const toggle = (p) => setSel(s => {
    const n = { ...s }
    if (n[p.id]) delete n[p.id]
    else n[p.id] = { size: p.uniform && sizes.includes(p.uniform) ? p.uniform : '', qty: 1 }
    return n
  })
  const upd = (pid, k, v) => setSel(s => ({ ...s, [pid]: { ...s[pid], [k]: v } }))
  const all = () => { const n = { ...sel }; list.forEach(p => { if (!n[p.id]) n[p.id] = { size: p.uniform && sizes.includes(p.uniform) ? p.uniform : '', qty: 1 } }); setSel(n) }
  const count = Object.keys(sel).length

  async function save() {
    if (!itemId) { toast('アイテムを選択してください'); return }
    if (!count) { toast('選手を選択してください'); return }
    setBusy(true)
    try {
      const rows = Object.entries(sel).map(([pid, v]) => ({ item_id: Number(itemId), player_id: Number(pid), size: v.size, qty: v.qty, ordered_date: date }))
      const r = await api.saveOrdersBulk(rows)
      onSaved(r.count)
    } catch (e) { toast('保存エラー: ' + e.message); setBusy(false) }
  }

  return (
    <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>選手をまとめて注文</p>
        <div className="g2">
          <div className="fg"><label>アイテム *</label>
            <select value={itemId} onChange={e => { setItemId(e.target.value); setSel({}) }}>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
          </div>
          <div className="fg"><label>受付日 *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div className="cr" style={{ padding: '0 0 8px' }}>
          {orgs.map(o => <button key={o} className={'ch' + (org === o ? ' on' : '')} onClick={() => setOrg(o)}>{o}</button>)}
          <button className="ch" onClick={all}>表示中を全選択</button>
          <button className="ch" onClick={() => setSel({})}>解除</button>
        </div>
        <p className="hint" style={{ textAlign: 'left', marginBottom: 6 }}>サイズは選手情報のユニフォームサイズを既定にしています</p>
        {list.map(p => (
          <div className="brow" key={p.id}>
            <label className="chk" style={{ padding: 0 }}>
              <input type="checkbox" checked={!!sel[p.id]} onChange={() => toggle(p)} />
              <span>{p.name}<span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 6 }}>{orgGrade(p)}</span></span>
            </label>
            <div className="fg"><select disabled={!sel[p.id]} value={sel[p.id]?.size || ''} onChange={e => upd(p.id, 'size', e.target.value)}>
              <option value="">サイズ</option>{sizes.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="fg"><input type="number" min={1} disabled={!sel[p.id]} value={sel[p.id]?.qty ?? 1} onChange={e => upd(p.id, 'qty', e.target.value)} /></div>
          </div>
        ))}
        <div className="mf">
          <button className="bp" disabled={busy || !count} onClick={save}>{busy ? '登録中...' : `${count}名分を注文登録`}</button>
          <button className="bc" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}

// ============ アイテム設定（追加・編集・並び替え・受付終了）============
function ItemsModal({ items: init, toast, onClose }) {
  const [items, setItems] = useState(init)
  const [edit, setEdit] = useState(undefined) // undefined=閉, null=新規, obj=編集
  const [busy, setBusy] = useState(false)
  const reload = async () => setItems(await api.getOrderItems())

  async function run(fn, msg) {
    setBusy(true)
    try { await fn(); await reload(); if (msg) toast(msg) }
    catch (e) { toast('エラー: ' + e.message) } finally { setBusy(false) }
  }
  const move = (i, d) => { const ids = items.map(x => x.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; run(() => api.reorderOrderItems(ids)) }
  const del = (it) => { if (confirm(`「${it.name}」を削除しますか？`)) run(() => api.deleteOrderItem(it.id), '削除しました') }
  const toggleActive = (it) => run(() => api.saveOrderItem({ ...it, active: !it.active }), it.active ? '受付終了にしました' : '受付中に戻しました')

  return (
    <div className="ov" onClick={e => { if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>アイテム設定</p>
        {items.map((it, i) => (
          <div className="tor" key={it.id} style={{ flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 160 }}>
              <span style={{ fontWeight: 500 }}>{it.name}</span>{!it.active && <span className="bt">受付終了</span>}
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>サイズ: {it.sizes || '—'}{it.price != null ? `　単価 ${yen(it.price)}` : ''}　注文 {it.order_count}件</div>
            </span>
            <button className="iconbtn" disabled={busy || i === 0} onClick={() => move(i, -1)}><i className="ti ti-arrow-up" /></button>
            <button className="iconbtn" disabled={busy || i === items.length - 1} onClick={() => move(i, 1)}><i className="ti ti-arrow-down" /></button>
            <button className="iconbtn" disabled={busy} title="編集" onClick={() => setEdit(it)}><i className="ti ti-edit" /></button>
            <button className="iconbtn" disabled={busy} title={it.active ? '受付終了にする' : '受付中に戻す'} onClick={() => toggleActive(it)}><i className={'ti ' + (it.active ? 'ti-eye-off' : 'ti-eye')} /></button>
            <button className="delbtn" disabled={busy || it.order_count > 0} title={it.order_count > 0 ? '注文があるため削除できません' : ''} onClick={() => del(it)}><i className="ti ti-trash" /></button>
          </div>
        ))}
        <button className="ab" onClick={() => setEdit(null)}><i className="ti ti-plus" /> アイテムを追加</button>
        <div className="mf"><button className="bc" onClick={onClose}>閉じる</button></div>
        {edit !== undefined && <ItemEditModal item={edit} toast={toast} onClose={() => setEdit(undefined)}
          onSaved={async () => { setEdit(undefined); await reload(); toast('保存しました ✓') }} />}
      </div>
    </div>
  )
}

function ItemEditModal({ item, toast, onClose, onSaved }) {
  const [f, setF] = useState(item ? { id: item.id, name: item.name, sizes: item.sizes || '', price: item.price ?? '', note: item.note || '', active: !!item.active }
    : { name: '', sizes: '130,140,150,XS,S,M,L,XL', price: '', note: '', active: true })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  async function save() {
    if (!f.name.trim()) { toast('アイテム名を入力してください'); return }
    setBusy(true)
    try { await api.saveOrderItem(f); onSaved() } catch (e) { toast('保存エラー: ' + e.message); setBusy(false) }
  }
  return (
    <div className="ov" style={{ zIndex: 300 }} onClick={e => { e.stopPropagation(); if (e.target.classList.contains('ov')) onClose() }}>
      <div className="mb">
        <div className="mh" />
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{item ? 'アイテムを編集' : 'アイテムを追加'}</p>
        <div className="fg"><label>アイテム名 *</label><input value={f.name} placeholder="例: ウィンドブレーカー" onChange={e => set('name', e.target.value)} /></div>
        <div className="fg"><label>サイズ（カンマ区切り）</label><input value={f.sizes} placeholder="例: 130,140,150,XS,S,M,L,XL" onChange={e => set('sizes', e.target.value)} /></div>
        <div className="fg"><label>単価（円・任意）</label><input type="number" min={0} value={f.price} onChange={e => set('price', e.target.value)} /></div>
        <div className="fg"><label>備考</label><input value={f.note} onChange={e => set('note', e.target.value)} /></div>
        <div className="mf">
          <button className="bp" disabled={busy} onClick={save}>{busy ? '保存中...' : '保存'}</button>
          <button className="bc" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}
