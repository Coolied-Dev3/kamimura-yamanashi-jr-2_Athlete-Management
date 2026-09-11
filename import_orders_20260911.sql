-- ============================================================
-- 2026-09-11 時点の受注（練習Tシャツ・レースユニフォーム）を登録
--   ・アイテムマスタのサイズを実際の受注体系（ユニセックス／ウィメンズ／ジュニア、SS〜LL）に合わせて更新
--   ・同じ選手×アイテムの注文が既にある場合は登録しない（再実行安全）
-- 実行例: mysql -u root -p --default-character-set=utf8mb4 < import_orders_20260911.sql
-- ============================================================
USE kamimura_club;
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;  -- 文字列リテラルの照合順序をテーブルに合わせる
START TRANSACTION;

UPDATE order_items SET sizes='130,140,150,SS,S,M,L,LL,XL' WHERE name='練習Tシャツ';
UPDATE order_items SET sizes='ジュニア130cm,ジュニア140cm,ジュニア150cm,ウィメンズSS,ウィメンズS,ウィメンズM,ウィメンズL,ウィメンズLL,ユニセックスSS,ユニセックスS,ユニセックスM,ユニセックスL,ユニセックスLL,SS,S,M,L,LL'
  WHERE name='レースユニフォーム 上（タンクトップ）';
UPDATE order_items SET sizes='130cm,140cm,150cm,SS,S,M,L,LL' WHERE name='レースユニフォーム 下（レーシングタイツ）';

-- 一時テーブル：氏名（空白なし）→ アイテム名 → サイズ
CREATE TEMPORARY TABLE tmp_orders (pname VARCHAR(64), item VARCHAR(128), size VARCHAR(32), note VARCHAR(255))
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
INSERT INTO tmp_orders VALUES
  -- 練習Tシャツ
  ('望月夢菜',   '練習Tシャツ', 'M', NULL),
  ('飯野優介',   '練習Tシャツ', 'M', NULL),
  ('山中斗稀',   '練習Tシャツ', 'M', NULL),
  ('荒井輝之介', '練習Tシャツ', 'M', NULL),
  -- レースユニフォーム 上（タンクトップ）
  ('太田幸音',   'レースユニフォーム 上（タンクトップ）', 'ユニセックスLL', NULL),
  ('太田誉',     'レースユニフォーム 上（タンクトップ）', 'ユニセックスS',  NULL),
  ('廣瀬凌久',   'レースユニフォーム 上（タンクトップ）', 'ウィメンズSS',   NULL),
  ('石原颯飛',   'レースユニフォーム 上（タンクトップ）', 'ウィメンズL',    NULL),
  ('石原颯大',   'レースユニフォーム 上（タンクトップ）', 'ウィメンズL',    NULL),
  ('杉山大空',   'レースユニフォーム 上（タンクトップ）', 'ウィメンズM',    NULL),
  ('杉山凜空',   'レースユニフォーム 上（タンクトップ）', 'ジュニア140cm',  NULL),
  ('廣瀬栞和',   'レースユニフォーム 上（タンクトップ）', 'SS', NULL),
  ('石原杏奈',   'レースユニフォーム 上（タンクトップ）', 'SS', NULL),
  ('上沼真子',   'レースユニフォーム 上（タンクトップ）', 'S',  NULL),
  ('小野崎蒼真', 'レースユニフォーム 上（タンクトップ）', 'M',  NULL),
  ('渡邉朔',     'レースユニフォーム 上（タンクトップ）', 'L',  NULL),
  ('牛山煌志朗', 'レースユニフォーム 上（タンクトップ）', 'M',  NULL),
  -- レースユニフォーム 下（レーシングタイツ）※男子（小学）は全員SS
  ('太田幸音',   'レースユニフォーム 下（レーシングタイツ）', 'SS', NULL),
  ('太田誉',     'レースユニフォーム 下（レーシングタイツ）', 'SS', NULL),
  ('廣瀬凌久',   'レースユニフォーム 下（レーシングタイツ）', 'SS', NULL),
  ('石原颯飛',   'レースユニフォーム 下（レーシングタイツ）', 'SS', NULL),
  ('石原颯大',   'レースユニフォーム 下（レーシングタイツ）', 'SS', NULL),
  ('杉山大空',   'レースユニフォーム 下（レーシングタイツ）', 'SS', NULL),
  ('杉山凜空',   'レースユニフォーム 下（レーシングタイツ）', 'SS', NULL),
  ('廣瀬栞和',   'レースユニフォーム 下（レーシングタイツ）', 'SS', NULL),
  ('石原杏奈',   'レースユニフォーム 下（レーシングタイツ）', 'S',  NULL),
  ('上沼真子',   'レースユニフォーム 下（レーシングタイツ）', 'S',  NULL),
  ('小野崎蒼真', 'レースユニフォーム 下（レーシングタイツ）', 'M',  NULL),
  ('渡邉朔',     'レースユニフォーム 下（レーシングタイツ）', 'M',  NULL),
  ('牛山煌志朗', 'レースユニフォーム 下（レーシングタイツ）', 'M',  NULL);

-- 氏名が一致しない行があれば表示（0件が正常）
SELECT t.pname AS not_found FROM tmp_orders t
  LEFT JOIN players p ON REPLACE(REPLACE(p.name,'　',''),' ','') = t.pname WHERE p.id IS NULL;

INSERT INTO orders (item_id, player_id, size, qty, ordered_date, note)
SELECT i.id, p.id, t.size, 1, '2026-09-11', t.note
FROM tmp_orders t
JOIN players p     ON REPLACE(REPLACE(p.name,'　',''),' ','') = t.pname
JOIN order_items i ON i.name = t.item
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.player_id = p.id AND o.item_id = i.id);

DROP TEMPORARY TABLE tmp_orders;
COMMIT;

SELECT i.name AS item, COUNT(*) AS orders, GROUP_CONCAT(CONCAT(REPLACE(p.name,'　',''),':',o.size) ORDER BY p.id SEPARATOR ' / ') AS detail
FROM orders o JOIN order_items i ON i.id=o.item_id JOIN players p ON p.id=o.player_id
GROUP BY i.id, i.name ORDER BY i.sort_order;
