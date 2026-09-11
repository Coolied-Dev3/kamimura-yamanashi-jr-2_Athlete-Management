-- ============================================================
-- 練習Tシャツを「選手用」「保護者用」の2アイテムに分割（2026-09-11）
--   ・既存の「練習Tシャツ」→「練習Tシャツ（選手用）」に改名（注文はそのまま引き継ぐ）
--   ・「練習Tシャツ（保護者用）」を追加（大人サイズ）
--   ・岩間 陽莉 さんの分を保護者用として登録（サイズ未確認）
-- 何度実行しても安全
-- ============================================================
USE kamimura_club;
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
START TRANSACTION;

UPDATE order_items SET name='練習Tシャツ（選手用）' WHERE name='練習Tシャツ';

INSERT INTO order_items (name, sizes, sort_order)
SELECT '練習Tシャツ（保護者用）', 'S,M,L,LL,XL,3L', 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE name='練習Tシャツ（保護者用）');

-- 並び順: 選手用=1, 保護者用=2, ユニ上=3, ユニ下=4
UPDATE order_items SET sort_order=1 WHERE name='練習Tシャツ（選手用）';
UPDATE order_items SET sort_order=2 WHERE name='練習Tシャツ（保護者用）';
UPDATE order_items SET sort_order=3 WHERE name='レースユニフォーム 上（タンクトップ）';
UPDATE order_items SET sort_order=4 WHERE name='レースユニフォーム 下（レーシングタイツ）';

-- 岩間 陽莉 さんの練習Tシャツ注文（選手用として登録済み）を保護者用へ移す
UPDATE orders o
  JOIN order_items i ON i.id=o.item_id
  JOIN players p ON p.id=o.player_id
SET o.item_id=(SELECT id FROM order_items WHERE name='練習Tシャツ（保護者用）'),
    o.note=CONCAT_WS(' ', o.note, '保護者用')
WHERE i.name='練習Tシャツ（選手用）' AND REPLACE(REPLACE(p.name,'　',''),' ','')='岩間陽莉';

COMMIT;
SELECT i.sort_order, i.name, i.sizes, (SELECT COUNT(*) FROM orders o WHERE o.item_id=i.id) AS orders FROM order_items i ORDER BY i.sort_order;
