-- ============================================================
-- 物品注文管理（練習Tシャツ・レースユニフォーム等）のテーブル追加（2026-09-11）
--   order_items : アイテムマスタ（サイズはカンマ区切りで保持。アイテムは追加可能）
--   orders      : 注文（誰が・何を・いつ注文 / いつ手渡し / いつ費用徴収 / 備考）
-- 何度実行しても安全（IF NOT EXISTS / NOT EXISTS ガード）
-- 実行例: mysql -u root -p --default-character-set=utf8mb4 < migration_orders_20260911.sql
-- ============================================================
USE kamimura_club;

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
  SELECT '練習Tシャツ' AS name, '130,140,150,XS,S,M,L,XL' AS sizes, 1 AS sort_order UNION ALL
  SELECT 'レースユニフォーム 上（タンクトップ）', '130,140,150,XS,S,M,L,XL', 2 UNION ALL
  SELECT 'レースユニフォーム 下（レーシングタイツ）', '130,140,150,XS,S,M,L,XL', 3
) v
WHERE NOT EXISTS (SELECT 1 FROM order_items);

SELECT id, name, sizes, price, active, sort_order FROM order_items ORDER BY sort_order;
