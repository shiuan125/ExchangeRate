# 匯率查詢站

查詢美金（USD）與日圓（JPY）即時匯率與歷史走勢。詳細規格見 [SPEC.md](./SPEC.md)、視覺設計見 [DESIGN.md](./DESIGN.md)。

## 開發

```bash
npm install
cp .env.example .env   # 填入 Firebase 設定與 RATE_API_URL
npm run dev             # 前端（不含 /api）
npx vercel dev           # 含 /api/rate 的完整本機環境
```

## 手動測試排程腳本

```bash
RATE_API_URL=... FIREBASE_SERVICE_ACCOUNT='...' node scripts/sync-rates.js
```

## 部署

- 前端 + Function：Vercel（設定 `VITE_FIREBASE_*` 與 `RATE_API_URL` 環境變數）
- 排程：GitHub Actions（`.github/workflows/sync.yml`，設定 `RATE_API_URL` 與 `FIREBASE_SERVICE_ACCOUNT` Secrets）
- 資料庫：Google Cloud Firestore（部署 `firestore.rules`）
