-- ============================================================
-- 小学生女子のレースユニフォーム（トップス）のサイズ表記に「ウィメンズ」を付ける（2026-09-11）
--   例: SS → ウィメンズSS / S → ウィメンズS
-- 既に「ウィメンズ」等の種別が付いているものは変更しない（再実行安全）
-- ============================================================
USE kamimura_club;
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
UPDATE orders o
  JOIN order_items i ON i.id=o.item_id
  JOIN players p ON p.id=o.player_id
SET o.size = CONCAT('ウィメンズ', o.size)
WHERE i.name='レースユニフォーム 上（タンクトップ）'
  AND p.org_kind='小学' AND p.gender='女'
  AND o.size IN ('SS','S','M','L','LL');
SELECT p.name, o.size FROM orders o JOIN order_items i ON i.id=o.item_id JOIN players p ON p.id=o.player_id
WHERE i.name='レースユニフォーム 上（タンクトップ）' AND p.org_kind='小学' AND p.gender='女' ORDER BY o.id;
