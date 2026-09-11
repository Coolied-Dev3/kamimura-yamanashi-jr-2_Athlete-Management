-- ============================================================
-- 神村学園山梨Jr陸上Club 選手管理システム
-- MySQL スキーマ構築 SQL（練習管理System と同じ DB kamimura_club に追加）
--   ・players テーブルは練習管理System と共有（列を追加するのみ。既存データは保持）
--   ・大会/記録会・記録・体験申込 用のテーブルとベストタイムViewを追加
-- 何度実行しても安全（IF NOT EXISTS / 列存在チェック）
-- 実行例:
--   mysql -u root -p --default-character-set=utf8mb4 < schema_players.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS kamimura_club
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kamimura_club;

-- ------------------------------------------------------------
-- 0. players に列を追加（団体区分・学年・ユニフォームサイズ）
--    ※ 会員区分は既存列 `rank` を使用
-- ------------------------------------------------------------
SET @s = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE players ADD COLUMN org_kind VARCHAR(16) NULL COMMENT ''団体区分'' AFTER school',
  'SELECT ''org_kind exists''')
  FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='players' AND column_name='org_kind');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE players ADD COLUMN grade VARCHAR(8) NULL COMMENT ''学年'' AFTER org_kind',
  'SELECT ''grade exists''')
  FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='players' AND column_name='grade');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @s = (SELECT IF(COUNT(*)=0,
  'ALTER TABLE players ADD COLUMN uniform VARCHAR(8) NULL COMMENT ''ユニフォームサイズ'' AFTER jaaf',
  'SELECT ''uniform exists''')
  FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='players' AND column_name='uniform');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ------------------------------------------------------------
-- 1. events : 種目マスタ
--    kind = 'time'（タイム：小さいほど良い） | 'distance'（距離：大きいほど良い）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(64) NOT NULL UNIQUE,
  kind        VARCHAR(16) NOT NULL DEFAULT 'time',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. competitions : 大会・記録会・TT
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitions (
  id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  kind        VARCHAR(32) NOT NULL DEFAULT '大会',   -- 大会 | 記録会 | TT | その他
  date_from   DATE NOT NULL,
  date_to     DATE NULL,
  place       VARCHAR(255),
  note        TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comp_date (date_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. results : 記録（大会 × 選手 × 種目）
--    value = 秒（タイム種目）または m（距離種目）。mark = 表示用文字列（例 2:52.39）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
  id              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  competition_id  BIGINT NOT NULL,
  player_id       BIGINT NOT NULL,
  event_id        BIGINT NOT NULL,
  value           DECIMAL(9,2) NULL,
  mark            VARCHAR(32),
  rank_text       VARCHAR(64),        -- 順位（例：総合2位 / 共通:5位 / 中1:3位）
  rank_no         INT NULL,           -- 順位の数値部分（並べ替え用）
  note            VARCHAR(255),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_res_player_event (player_id, event_id),
  INDEX idx_res_comp (competition_id),
  CONSTRAINT fk_res_comp   FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  CONSTRAINT fk_res_player FOREIGN KEY (player_id)      REFERENCES players(id)      ON DELETE CASCADE,
  CONSTRAINT fk_res_event  FOREIGN KEY (event_id)       REFERENCES events(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. trials : 体験申込者
--    status = 問合せ | 体験中 | 入会 | 見送り
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trials (
  id            BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  kana          VARCHAR(255),
  eng           VARCHAR(255),
  gender        VARCHAR(16),
  org_kind      VARCHAR(16),
  grade         VARCHAR(8),
  school        VARCHAR(255),
  guardian      VARCHAR(255),          -- 保護者名
  contact       VARCHAR(255),          -- 連絡先
  inquiry_date  DATE NULL,             -- 初回問い合わせ日
  status        VARCHAR(16) NOT NULL DEFAULT '問合せ',
  joined_date   DATE NULL,             -- 入会日
  player_id     BIGINT NULL,           -- 入会後に作成した選手
  note          TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_trial_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. trial_visits : 体験の各回（いつ・何の種目・結果）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trial_visits (
  id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  trial_id    BIGINT NOT NULL,
  visit_no    INT NOT NULL,
  visit_date  DATE NOT NULL,
  event_text  VARCHAR(128),            -- 体験した種目（自由入力・複数可）
  result      TEXT,                    -- 体験結果・コメント
  coach       VARCHAR(64),             -- 担当
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tv_trial (trial_id),
  CONSTRAINT fk_tv_trial FOREIGN KEY (trial_id) REFERENCES trials(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. v_personal_bests : 選手×種目のベスト記録 View
--    タイム種目は最小値、距離種目は最大値。同記録は先に出した方を採用
--    ※ 練習管理System からもこの View を参照する
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_personal_bests AS
SELECT
  x.id            AS result_id,
  x.player_id,
  x.event_id,
  e.name          AS event_name,
  e.kind          AS event_kind,
  e.sort_order    AS event_sort,
  x.value,
  x.mark,
  x.rank_text,
  x.competition_id,
  c.name          AS competition_name,
  c.date_from
FROM (
  SELECT r.*,
         ROW_NUMBER() OVER (
           PARTITION BY r.player_id, r.event_id
           ORDER BY (CASE WHEN e2.kind = 'distance' THEN -r.value ELSE r.value END) ASC,
                    c2.date_from ASC, r.id ASC
         ) AS rn
  FROM results r
  JOIN events e2       ON e2.id = r.event_id
  JOIN competitions c2 ON c2.id = r.competition_id
  WHERE r.value IS NOT NULL
) x
JOIN events e       ON e.id = x.event_id
JOIN competitions c ON c.id = x.competition_id
WHERE x.rn = 1;

-- ------------------------------------------------------------
-- 7. マスタ初期値（練習管理System の masters テーブルに kind を追加して共用）
--    member_rank=会員区分 / org_kind=団体区分 / uniform=ユニフォームサイズ
-- ------------------------------------------------------------
INSERT INTO masters (kind, value, sort_order)
SELECT * FROM (
  SELECT 'member_rank' AS kind, 'ピュア　スカラシップ' AS value, 1 AS sort_order UNION ALL
  SELECT 'member_rank', 'ピュア-2 500', 2 UNION ALL
  SELECT 'member_rank', 'ピュア-3-1000', 3 UNION ALL
  SELECT 'member_rank', 'エリート', 4 UNION ALL
  SELECT 'member_rank', 'フューチャー', 5 UNION ALL
  SELECT 'member_rank', '練習生', 6 UNION ALL
  SELECT 'member_rank', '練習生（エリート）', 7 UNION ALL
  SELECT 'org_kind', '小学', 1 UNION ALL
  SELECT 'org_kind', '中学', 2 UNION ALL
  SELECT 'org_kind', '高校', 3 UNION ALL
  SELECT 'org_kind', '一般', 4 UNION ALL
  SELECT 'uniform', 'XS', 1 UNION ALL
  SELECT 'uniform', 'S', 2 UNION ALL
  SELECT 'uniform', 'M', 3 UNION ALL
  SELECT 'uniform', 'L', 4 UNION ALL
  SELECT 'uniform', 'XL', 5
) v
WHERE NOT EXISTS (SELECT 1 FROM masters m WHERE m.kind = v.kind);

-- 種目初期値
INSERT INTO events (name, kind, sort_order)
SELECT * FROM (
  SELECT '50m' AS name, 'time' AS kind, 1 AS sort_order UNION ALL
  SELECT '100m', 'time', 2 UNION ALL
  SELECT '200m', 'time', 3 UNION ALL
  SELECT '400m', 'time', 4 UNION ALL
  SELECT '800m', 'time', 5 UNION ALL
  SELECT '1000m', 'time', 6 UNION ALL
  SELECT '1500m', 'time', 7 UNION ALL
  SELECT '3000m', 'time', 8 UNION ALL
  SELECT '5000m', 'time', 9
) v
WHERE NOT EXISTS (SELECT 1 FROM events e WHERE e.name = v.name);

-- ------------------------------------------------------------
-- 8. 物品注文管理（order_items / orders）
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_items (
  id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(128) NOT NULL,
  sizes       VARCHAR(255) NOT NULL DEFAULT 'XS,S,M,L,XL',  -- 選択できるサイズ（カンマ区切り）
  price       INT NULL,                                       -- 単価（円）任意
  note        VARCHAR(255),
  active      TINYINT(1) NOT NULL DEFAULT 1,                  -- 0=受付終了（一覧では選べない）
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  item_id         BIGINT NOT NULL,
  player_id       BIGINT NULL,                 -- 注文者（選手）。選手以外は orderer_name に記載
  orderer_name    VARCHAR(255) NULL,           -- 選手以外の注文者名（コーチ・保護者など）
  size            VARCHAR(32),
  qty             INT NOT NULL DEFAULT 1,
  placed          TINYINT(1) NOT NULL DEFAULT 0,  -- 0=未注文 1=注文済み
  ordered_date    DATE NOT NULL,               -- 注文日
  delivered_date  DATE NULL,                   -- 手渡し日
  paid_date       DATE NULL,                   -- 費用徴収日
  amount          INT NULL,                    -- 徴収金額（円）任意
  note            TEXT,                        -- 備考コメント
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_item (item_id),
  INDEX idx_orders_player (player_id),
  CONSTRAINT fk_orders_item   FOREIGN KEY (item_id)   REFERENCES order_items(id),
  CONSTRAINT fk_orders_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- アイテム初期値
INSERT INTO order_items (name, sizes, sort_order)
SELECT * FROM (
  SELECT '練習Tシャツ（選手用）' AS name, '130,140,150,SS,S,M,L,LL,XL' AS sizes, 1 AS sort_order UNION ALL
  SELECT '練習Tシャツ（保護者用）', 'S,M,L,LL,XL,3L', 2 UNION ALL
  SELECT 'レースユニフォーム 上（タンクトップ）', 'ジュニア130cm,ジュニア140cm,ジュニア150cm,ウィメンズSS,ウィメンズS,ウィメンズM,ウィメンズL,ウィメンズLL,ユニセックスSS,ユニセックスS,ユニセックスM,ユニセックスL,ユニセックスLL,SS,S,M,L,LL', 3 UNION ALL
  SELECT 'レースユニフォーム 下（レーシングタイツ）', '130cm,140cm,150cm,SS,S,M,L,LL', 4
) v
WHERE NOT EXISTS (SELECT 1 FROM order_items);


SELECT '選手管理システムのスキーマ構築が完了しました ✓' AS result;
