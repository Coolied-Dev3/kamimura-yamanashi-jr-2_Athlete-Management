import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 練習管理System(5173/3001)と同居できるよう 5174 を使う
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, host: true },
})
