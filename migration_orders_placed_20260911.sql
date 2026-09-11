-- ============================================================
-- 物品注文に「注文状態（未注文／注文済み）」を追加（2026-09-11）
--   orders.placed : 0=未注文（受付のみ・業者未発注） / 1=注文済み
--   既存の注文は 未注文（0）として登録
-- 何度実行しても安全（列存在チェック）
-- 実行例: mysql -u root -p --default-character-set=utf8mb4 < migration_orders_placed_20260911.sql
-- ============================================================
USE kamimura_club;
SET @s = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE orders ADD COLUMN placed TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''0=未注文 1=注文済み'' AFTER qty',
  'SELECT ''placed exists''')
  FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='orders' AND column_name='placed');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
SELECT placed, COUNT(*) AS n FROM orders GROUP BY placed;
