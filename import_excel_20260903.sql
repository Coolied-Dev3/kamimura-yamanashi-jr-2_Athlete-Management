-- ============================================================
-- 選手リストExcel（神村山梨Jr陸上- 選手リスト-1.xlsx, 更新 2026-07-20）からの初期データ投入
-- 生成日: 2026-09-03 ／ 何度実行しても重複登録しない（NOT EXISTS ガード）
-- 実行例: mysql -u root -p --default-character-set=utf8mb4 < import_excel_20260903.sql
-- ============================================================
USE kamimura_club;
START TRANSACTION;

-- ---- 選手情報の補完（団体区分・学年・ユニフォーム。ゼッケン/JAAF-IDは未設定または不正値の場合のみ） ----
UPDATE players SET org_kind='中学', grade='2', uniform='L', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '2062', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200459143', jaaf) WHERE login_id='s.watanabe';
UPDATE players SET org_kind='中学', grade='1', uniform='L', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '2061', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200150000', jaaf) WHERE login_id='s.onozaki';
UPDATE players SET org_kind='小学', grade='5', uniform='S', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1231', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200149972', jaaf) WHERE login_id='k.hirose';
UPDATE players SET org_kind='小学', grade='4', uniform='M', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1234', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200205723', jaaf) WHERE login_id='m.kaminuma';
UPDATE players SET org_kind='小学', grade='6', uniform='M', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1232', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200150034', jaaf) WHERE login_id='s.ota';
UPDATE players SET org_kind='小学', grade='4', uniform='XS', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1233', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200187033', jaaf) WHERE login_id='r.hirose';
UPDATE players SET org_kind='小学', grade='4', uniform='M', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1236', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200336174', jaaf) WHERE login_id='h.ishihara';
UPDATE players SET org_kind='小学', grade='4', uniform='M', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1237', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200336176', jaaf) WHERE login_id='r.ishihara';
UPDATE players SET org_kind='小学', grade='3', uniform='XS', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1235', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200272652', jaaf) WHERE login_id='h.ota';
UPDATE players SET org_kind='小学', grade='4', uniform='M', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1238', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200468984', jaaf) WHERE login_id='s.sugiyama';
UPDATE players SET org_kind='小学', grade='2', uniform='XS', bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1239', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200468993', jaaf) WHERE login_id='r.sugiyama';
UPDATE players SET org_kind='小学', grade='6', uniform=NULL, bib=IF(bib IS NULL OR bib='' OR bib NOT REGEXP '^[0-9]+$', '1240', bib), jaaf=IF(jaaf IS NULL OR CHAR_LENGTH(jaaf) < 8, '00200561856', jaaf) WHERE login_id='y.kato';
UPDATE players SET org_kind='小学', grade='4', uniform=NULL, bib=IF(bib IN ('小学','中学','高校','一般'), NULL, bib), jaaf=IF(jaaf REGEXP '^[0-9]{1,2}$', NULL, jaaf) WHERE login_id='a.mochizuki';
UPDATE players SET org_kind='小学', grade='6', uniform=NULL, bib=IF(bib IN ('小学','中学','高校','一般'), NULL, bib), jaaf=IF(jaaf REGEXP '^[0-9]{1,2}$', NULL, jaaf) WHERE login_id='a.iwama';
UPDATE players SET org_kind='小学', grade='4', uniform=NULL, bib=IF(bib IN ('小学','中学','高校','一般'), NULL, bib), jaaf=IF(jaaf REGEXP '^[0-9]{1,2}$', NULL, jaaf) WHERE login_id='n.nezu';
UPDATE players SET org_kind='小学', grade='1', uniform=NULL, bib=IF(bib IN ('小学','中学','高校','一般'), NULL, bib), jaaf=IF(jaaf REGEXP '^[0-9]{1,2}$', NULL, jaaf) WHERE login_id='s.nezu';
UPDATE players SET org_kind='小学', grade='6', uniform=NULL, bib=IF(bib IN ('小学','中学','高校','一般'), NULL, bib), jaaf=IF(jaaf REGEXP '^[0-9]{1,2}$', NULL, jaaf) WHERE login_id='s.ichikawa';
UPDATE players SET org_kind='高校', grade='1', uniform=NULL, bib=IF(bib IN ('小学','中学','高校','一般'), NULL, bib), jaaf=IF(jaaf REGEXP '^[0-9]{1,2}$', NULL, jaaf) WHERE login_id='t.chiyoda';

-- ---- 種目 ----
INSERT INTO events (name, kind, sort_order) SELECT '50m', 'time', 50 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='50m');
INSERT INTO events (name, kind, sort_order) SELECT '100m', 'time', 100 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='100m');
INSERT INTO events (name, kind, sort_order) SELECT '200m', 'time', 200 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='200m');
INSERT INTO events (name, kind, sort_order) SELECT '400m', 'time', 400 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='400m');
INSERT INTO events (name, kind, sort_order) SELECT '800m', 'time', 800 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='800m');
INSERT INTO events (name, kind, sort_order) SELECT '1000m', 'time', 1000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='1000m');
INSERT INTO events (name, kind, sort_order) SELECT '1500m', 'time', 1500 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='1500m');
INSERT INTO events (name, kind, sort_order) SELECT '3000m', 'time', 3000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='3000m');
INSERT INTO events (name, kind, sort_order) SELECT '5000m', 'time', 5000 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM events WHERE name='5000m');

-- ---- 大会・記録会 ----
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '甲府市選手権', '大会', '2026-06-18', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='甲府市選手権' AND date_from='2026-06-18');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '峡中選手権', '大会', '2026-06-12', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='峡中選手権' AND date_from='2026-06-12');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '長距離記録会', '記録会', '2026-06-11', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='長距離記録会' AND date_from='2026-06-11');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '中学通信陸上', '大会', '2026-06-27', '2026-06-28', NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='中学通信陸上' AND date_from='2026-06-27');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '山梨県小学生陸上競技会', '大会', '2026-06-20', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='山梨県小学生陸上競技会' AND date_from='2026-06-20');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '山梨県中学生選手権', '大会', '2026-06-13', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='山梨県中学生選手権' AND date_from='2026-06-13');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '山梨県長距離記録会', '記録会', '2026-06-06', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='山梨県長距離記録会' AND date_from='2026-06-06');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '甲斐市陸上競技会', '大会', '2026-05-24', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='甲斐市陸上競技会' AND date_from='2026-05-24');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT 'やまびこ記録会', '記録会', '2026-05-16', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='やまびこ記録会' AND date_from='2026-05-16');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '小瀬カーニバル', '大会', '2026-04-25', '2026-04-26', NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='小瀬カーニバル' AND date_from='2026-04-25');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '神村TT（グループTT）', 'TT', '2026-04-19', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='神村TT（グループTT）' AND date_from='2026-04-19');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '神村TT（個別TT）', 'TT', '2026-04-14', NULL, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='神村TT（個別TT）' AND date_from='2026-04-14');
INSERT INTO competitions (name, kind, date_from, date_to, note) SELECT '過去ベスト（Excel申告値）', 'その他', '2026-03-31', NULL, '選手リストExcelのベストタイム欄のうち、大会記録として登録できなかった値' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name='過去ベスト（Excel申告値）' AND date_from='2026-03-31');

-- ---- 記録 ----
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 271.72, '4:31.72', '総合2位', 2
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='s.watanabe' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 174.89, '2:54.89', '総合2位', 2
  FROM competitions c, players p, events e
  WHERE c.name='長距離記録会' AND c.date_from='2026-06-11' AND p.login_id='s.watanabe' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 594.77, '9:54.77', '共通:5位', 5
  FROM competitions c, players p, events e
  WHERE c.name='中学通信陸上' AND c.date_from='2026-06-27' AND p.login_id='s.watanabe' AND e.name='3000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 272.88, '4:32.88', '共通:7位', 7
  FROM competitions c, players p, events e
  WHERE c.name='中学通信陸上' AND c.date_from='2026-06-27' AND p.login_id='s.watanabe' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 284.44, '4:44.44', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県中学生選手権' AND c.date_from='2026-06-13' AND p.login_id='s.watanabe' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 286.39, '4:46.39', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='s.watanabe' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 283.49, '4:43.49', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='s.watanabe' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 142.38, '2:22.38', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='s.watanabe' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 279.34, '4:39.34', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='s.watanabe' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 295.52, '4:55.52', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='s.watanabe' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 1107.19, '18:27.19', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='過去ベスト（Excel申告値）' AND c.date_from='2026-03-31' AND p.login_id='s.watanabe' AND e.name='5000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 293.04, '4:53.04', '総合2位', 2
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='s.onozaki' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 293.9, '4:53.90', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='s.onozaki' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 181.51, '3:01.51', '総合5位', 5
  FROM competitions c, players p, events e
  WHERE c.name='長距離記録会' AND c.date_from='2026-06-11' AND p.login_id='s.onozaki' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 288.36, '4:48.36', '中1:3位', 3
  FROM competitions c, players p, events e
  WHERE c.name='中学通信陸上' AND c.date_from='2026-06-27' AND p.login_id='s.onozaki' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 297.09, '4:57.09', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県中学生選手権' AND c.date_from='2026-06-13' AND p.login_id='s.onozaki' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 298.63, '4:58.63', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='s.onozaki' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 298.39, '4:58.39', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='s.onozaki' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 148.17, '2:28.17', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='s.onozaki' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 301.95, '5:01.95', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='s.onozaki' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 318.09, '5:18.09', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='s.onozaki' AND e.name='1500m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 1161.02, '19:21.02', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='過去ベスト（Excel申告値）' AND c.date_from='2026-03-31' AND p.login_id='s.onozaki' AND e.name='5000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 166.63, '2:46.63', '総合3位', 3
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 165.22, '2:45.22', '総合3位', 3
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 168.51, '2:48.51', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 165.81, '2:45.81', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 167.32, '2:47.32', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 169.03, '2:49.03', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 173.64, '2:53.64', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 173.77, '2:53.77', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 175.65, '2:55.65', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（個別TT）' AND c.date_from='2026-04-14' AND p.login_id='k.hirose' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 8.75, '8.75', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='m.kaminuma' AND e.name='50m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 180.68, '3:00.68', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='長距離記録会' AND c.date_from='2026-06-11' AND p.login_id='m.kaminuma' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 180.56, '3:00.56', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='m.kaminuma' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 183.96, '3:03.96', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='m.kaminuma' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 184.35, '3:04.35', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='m.kaminuma' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 191.55, '3:11.55', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='m.kaminuma' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 183.79, '3:03.79', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='m.kaminuma' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 186.93, '3:06.93', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='m.kaminuma' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 188.37, '3:08.37', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（個別TT）' AND c.date_from='2026-04-14' AND p.login_id='m.kaminuma' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 192.24, '3:12.24', '総合2位', 2
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 215.21, '3:35.21', '総合7位', 7
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 194.07, '3:14.07', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 197.29, '3:17.29', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 204.27, '3:24.27', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 202.65, '3:22.65', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 197.62, '3:17.62', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 206.89, '3:26.89', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 197.56, '3:17.56', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（個別TT）' AND c.date_from='2026-04-14' AND p.login_id='s.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 8.98, '8.98', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='r.hirose' AND e.name='50m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 208.95, '3:28.95', '総合5位', 5
  FROM competitions c, players p, events e
  WHERE c.name='長距離記録会' AND c.date_from='2026-06-11' AND p.login_id='r.hirose' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 208.69, '3:28.69', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='r.hirose' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 211.34, '3:31.34', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='r.hirose' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 212.38, '3:32.38', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='r.hirose' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 214.51, '3:34.51', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='r.hirose' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 216.67, '3:36.67', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='r.hirose' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 218.31, '3:38.31', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='r.hirose' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 218.98, '3:38.98', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（個別TT）' AND c.date_from='2026-04-14' AND p.login_id='r.hirose' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 8.36, '8.36', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='h.ishihara' AND e.name='50m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 200.84, '3:20.84', '総合4位', 4
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='h.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 200.95, '3:20.95', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='h.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 204.03, '3:24.03', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='h.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 205.72, '3:25.72', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='h.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 203.5, '3:23.50', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='h.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 208.73, '3:28.73', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='h.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 216.13, '3:36.13', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='h.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 212.91, '3:32.91', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（個別TT）' AND c.date_from='2026-04-14' AND p.login_id='h.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 9.18, '9.18', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='r.ishihara' AND e.name='50m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 209.56, '3:29.56', '総合6位', 6
  FROM competitions c, players p, events e
  WHERE c.name='長距離記録会' AND c.date_from='2026-06-11' AND p.login_id='r.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 211.12, '3:31.12', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='r.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 214.57, '3:34.57', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='r.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 217.72, '3:37.72', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='r.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 216.52, '3:36.52', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='r.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 222.58, '3:42.58', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='r.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 227.87, '3:47.87', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='r.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 226.08, '3:46.08', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（個別TT）' AND c.date_from='2026-04-14' AND p.login_id='r.ishihara' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 218.54, '3:38.54', '総合1位-GR', 1
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='h.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 221.36, '3:41.36', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='h.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 227.03, '3:47.03', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='h.ota' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 8.47, '8.47', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='s.sugiyama' AND e.name='50m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 206.86, '3:26.86', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='s.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 224.14, '3:44.14', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='s.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 215.62, '3:35.62', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='s.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 222.11, '3:42.11', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='s.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 222.85, '3:42.85', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='s.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 232.72, '3:52.72', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='s.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 226.08, '3:46.08', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（個別TT）' AND c.date_from='2026-04-14' AND p.login_id='s.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 236.31, '3:56.31', '総合3位', 3
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='r.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 230.71, '3:50.71', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県小学生陸上競技会' AND c.date_from='2026-06-20' AND p.login_id='r.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 241.62, '4:01.62', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='山梨県長距離記録会' AND c.date_from='2026-06-06' AND p.login_id='r.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 251.99, '4:11.99', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲斐市陸上競技会' AND c.date_from='2026-05-24' AND p.login_id='r.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 268.93, '4:28.93', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='やまびこ記録会' AND c.date_from='2026-05-16' AND p.login_id='r.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 255.07, '4:15.07', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='小瀬カーニバル' AND c.date_from='2026-04-25' AND p.login_id='r.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 289.03, '4:49.03', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（グループTT）' AND c.date_from='2026-04-19' AND p.login_id='r.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 277.51, '4:37.51', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='神村TT（個別TT）' AND c.date_from='2026-04-14' AND p.login_id='r.sugiyama' AND e.name='1000m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 162.43, '2:42.43', '総合2位', 2
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='y.kato' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 8.18, '8.18', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='甲府市選手権' AND c.date_from='2026-06-18' AND p.login_id='a.mochizuki' AND e.name='50m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 15.32, '15.32', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='a.mochizuki' AND e.name='100m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 177.46, '2:57.46', '総合7位', 7
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='a.mochizuki' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 15.09, '15.09', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='過去ベスト（Excel申告値）' AND c.date_from='2026-03-31' AND p.login_id='a.mochizuki' AND e.name='100m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 172.9, '2:52.90', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='過去ベスト（Excel申告値）' AND c.date_from='2026-03-31' AND p.login_id='a.mochizuki' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 16.2, '16.20', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='n.nezu' AND e.name='100m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 192.16, '3:12.16', '総合11位', 11
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='n.nezu' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 19.29, '19.29', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='s.nezu' AND e.name='100m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 223.11, '3:43.11', '総合6位', 6
  FROM competitions c, players p, events e
  WHERE c.name='峡中選手権' AND c.date_from='2026-06-12' AND p.login_id='s.nezu' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);
INSERT INTO results (competition_id, player_id, event_id, value, mark, rank_text, rank_no)
  SELECT c.id, p.id, e.id, 172.39, '2:52.39', NULL, NULL
  FROM competitions c, players p, events e
  WHERE c.name='過去ベスト（Excel申告値）' AND c.date_from='2026-03-31' AND p.login_id='a.iwama' AND e.name='800m'
    AND NOT EXISTS (SELECT 1 FROM results x WHERE x.competition_id=c.id AND x.player_id=p.id AND x.event_id=e.id);

COMMIT;
SELECT (SELECT COUNT(*) FROM competitions) AS competitions, (SELECT COUNT(*) FROM results) AS results, (SELECT COUNT(*) FROM v_personal_bests) AS pbs;