# 匯率查詢站

查詢美金（USD）與日圓（JPY）即時匯率與歷史走勢。詳細規格見 [SPEC.md](./SPEC.md)、視覺設計見 [DESIGN.md](./DESIGN.md)。

## 開發

```bash
npm install
cp .env.example .env   # 填入 Firebase 設定
npm run dev
```

## 手動測試同步腳本

```bash
RATE_API_URL=... FIREBASE_SERVICE_ACCOUNT='...' node scripts/sync-rates.js
```

## 部署

- 前端：Vercel（設定 `VITE_FIREBASE_*` 環境變數）
- 即時匯率：Google Apps Script 排程寫入 Firestore（前端直接讀取，不再打外部 API）
- 每日收盤同步：`scripts/sync-rates.js`，寫入 `rates/{currency}_{year}`；`.github/workflows/sync.yml` 保留為手動觸發（`workflow_dispatch`）備用
- 資料庫：Google Cloud Firestore（部署 `firestore.rules`）
