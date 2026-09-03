import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// 実行時の作業ディレクトリに関わらず server/.env を確実に読む
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

// MySQL 接続プール（練習管理System と同じ DB を共有）
// dateStrings:true → DATE/DATETIME を 'YYYY-MM-DD' 形式の文字列で返す
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kamimura_club',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  decimalNumbers: true,
})

// 簡易ヘルパー
export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params)
  return rows
}
