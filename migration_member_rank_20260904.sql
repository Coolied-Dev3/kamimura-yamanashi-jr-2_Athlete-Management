-- ============================================================
-- 会員区分マスタを 7 区分に更新（2026-09-04）
--   ピュア　スカラシップ / ピュア-2 500 / ピュア-3-1000 / エリート / フューチャー / 練習生 / 練習生（エリート）
-- ※ 選手に登録済みの会員区分（players.rank）の値は変更しない
-- 実行例: mysql -u root -p --default-character-set=utf8mb4 < migration_member_rank_20260904.sql
-- ============================================================
USE kamimura_club;
START TRANSACTION;
DELETE FROM masters WHERE kind = 'member_rank';
INSERT INTO masters (kind, value, sort_order) VALUES
  ('member_rank', 'ピュア　スカラシップ', 1),
  ('member_rank', 'ピュア-2 500', 2),
  ('member_rank', 'ピュア-3-1000', 3),
  ('member_rank', 'エリート', 4),
  ('member_rank', 'フューチャー', 5),
  ('member_rank', '練習生', 6),
  ('member_rank', '練習生（エリート）', 7);
COMMIT;
SELECT value, sort_order FROM masters WHERE kind = 'member_rank' ORDER BY sort_order;
