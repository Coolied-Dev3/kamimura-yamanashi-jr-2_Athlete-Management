# 神村学園山梨Jr陸上Club 選手管理システム

React + Vite（フロント）／ Node.js + Express（API）／ MySQL（DB）で構築した、
**練習管理システムと同じ構成のローカル運用版**の選手管理アプリです。スマホ・PC どちらのブラウザでも利用できます。

## 構成

```
[ブラウザ React (Vite :5174)]
        │  fetch
        ▼
[API サーバー Express (:3002)]   ← server/
        │  mysql2
        ▼
[MySQL (:3306)  DB: kamimura_club]  ← 練習管理システムと同じ DB を共有
```

- 練習管理システム（`C:\2026.06-ed-yamanashi_jr-1\kamimura`, :3001）とは **ポートを変えて同居**します。
- `players`（選手）・`admins`（管理者）・`teams`・`masters` は練習管理システムと **共有**。
  選手の追加・変更はどちらのシステムからでも反映され、ログインID/パスワードも共通です。
- 本システムで追加したテーブル：`events`（種目）、`competitions`（大会・記録会）、`results`（記録）、
  `trials`（体験申込）、`trial_visits`（体験の各回）、View `v_personal_bests`（ベストタイム）。

## 必要なもの

- Node.js 18 以上
- MySQL 8.0 以上（練習管理システムでインストール済みのもの）

---

## セットアップ手順

### 1. MySQL にスキーマを追加

```bash
mysql -u root -p --default-character-set=utf8mb4 < schema_players.sql
```

`players` に列を追加（団体区分・学年・ユニフォーム）し、新テーブル・View・マスタ初期値を作成します。何度実行しても安全です。

### 2. Excel の選手リストから初期データを投入（初回のみ）

```bash
mysql -u root -p --default-character-set=utf8mb4 < import_excel_20260903.sql
```

`神村山梨Jr陸上- 選手リスト-1.xlsx` の内容（団体区分・学年・ユニフォーム、大会13件・記録106件）を登録します。重複登録はしません。

### 3. バックエンドの設定

`server/.env`（`server/.env.example` をコピー）に MySQL 接続情報を設定します。

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=（あなたのrootパスワード）
DB_NAME=kamimura_club
PORT=3002
```

### 4. フロントの設定

プロジェクト直下の `.env`（`.env.example` をコピー）：

```
VITE_API_BASE=http://localhost:3002
```

### 5. 依存パッケージのインストール

```bash
npm install
cd server && npm install && cd ..
```

### 6. 起動（開発）

```bash
npm run dev:all
```

ブラウザで `http://localhost:5174` を開きます。

### 7. 本番運用（自動起動・LAN公開）

管理者権限の PowerShell で：

```powershell
npm run build
powershell -ExecutionPolicy Bypass -File .\install-autostart.ps1
```

タスク `KamimuraPlayers` が登録され、PC 起動時に `http://<このPCのIP>:3002` で自動起動します（ファイアウォール TCP 3002 開放）。
コード変更後は `update-prod.ps1` を管理者で実行すると再ビルド＋再起動します。

## ログイン

練習管理システムと同じアカウントを使います（管理者＝コーチ、選手＝選手ID）。

## 主な機能

| 画面 | 内容 |
|------|------|
| **選手** | 選手一覧（団体区分・検索）、個人情報の登録・編集（会員区分・団体区分・学年・ゼッケン・JAAF-ID・ユニフォーム等）、選手ごとのベストタイムと全記録 |
| **記録** | 大会・記録会・TT の登録、**結果の一覧登録**（選手×種目×タイム×順位を複数行まとめて保存）。入力中にベストタイム更新なら **PB！** を表示（初記録は「PB（初記録）」） |
| **ベスト** | 全選手のベストタイム一覧（表／選手別、団体区分・性別で絞込、30日以内の記録に NEW） |
| **体験** | 体験申込の管理（問合せ→体験中→入会/見送り）、各回の体験日・種目・結果コメント、入会時は選手として登録（練習管理システムにも反映） |
| **管理** | 種目マスタ、会員区分・団体区分・ユニフォームのマスタ |

選手でログインすると「ベストタイム」（全員）と「自分の記録」を閲覧できます。

## 練習管理システムからのベストタイム参照

練習管理システムに「ベスト」タブを追加済みです（`GET /pb` を同一オリジンで取得。旧サーバー稼働中は本システム `:3002/pb` に自動フォールバック）。

## タイムの入力形式

`2:52.39` / `15.09` / `18:27.19` / `1:02:30.5` のほか、Excel 由来の `2.52.39` も受け付けます。
種目マスタで「距離」にした種目は `5.23`（m）のように入力します。

## ファイル構成

```
schema_players.sql          追加スキーマ（players 列追加・新テーブル・View・マスタ初期値）
import_excel_20260903.sql   Excel 選手リストからの初期データ
server/
  index.js                  Express ルート定義（全エンドポイント）
  db.js                     MySQL 接続プール
  time.js                   タイム文字列 ⇔ 秒 変換
src/
  App.jsx                   ログイン・ナビ・全体構成
  api.js                    API クライアント
  time.js                   タイム変換（server/time.js と同一）
  pages/Players.jsx         選手一覧・詳細・編集
  pages/Results.jsx         大会一覧・結果の一覧登録
  pages/Bests.jsx           ベストタイム一覧
  pages/Trials.jsx          体験申込
  pages/Admin.jsx           マスタ管理
```

## バックアップ

```bash
mysqldump -u root -p kamimura_club > backup.sql
```

## 注意

- 認証は簡易方式（平文照合）です。LAN 内・個人利用を想定しています。
- 選手を削除すると、その選手の記録と練習管理システム側の評価データも削除されます。
