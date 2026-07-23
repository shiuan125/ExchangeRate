# 匯率查詢站 — 開發規格文件

> 給 Claude Code 的實作規格。請完整讀完再開始動工。

---

## 0. 專案目標

建立一個查詢美金（USD）與日圓（JPY）匯率的網站，功能包含：

1. **即時匯率** — 顯示當前報價的現金買入/賣出、即期買入/賣出四組數字
2. **歷史匯率走勢圖** — 折線圖，可切換「即期」與「現金」兩種模式
3. **每日自動歸檔** — 每日排程抓取當日最後報價寫入資料庫

**線上部署目標**：Vercel

---

## 1. 技術選型

| 層級 | 技術 | 說明 |
|---|---|---|
| 前端框架 | React 18 + Vite | 純 SPA，無 SSR 需求 |
| 路由 | 不需要 | 單頁應用 |
| 圖表 | Recharts | 折線圖 |
| 資料庫 | Google Cloud Firestore | NoSQL，免費額度充足 |
| 即時 API 代理 | Vercel Serverless Function | 隱藏上游網址、加快取層 |
| 排程 | GitHub Actions | cron 觸發，寫入 Firestore |
| 部署 | Vercel | 前端靜態檔 + Function |
| 樣式 | 純 CSS（CSS Modules 或單一 global.css） | 不引入 UI 框架 |

**不要使用**：Next.js、Tailwind、任何 UI component library、Redux 或其他狀態管理套件。專案規模小，React 內建的 `useState` / `useEffect` 足夠。

---

## 2. 資料來源

### 2.1 上游 API

一支 Google Apps Script Web App，回傳匯率 JSON。

**網址**：由使用者提供，存於環境變數 `RATE_API_URL`（**不加 `VITE_` 前綴**，這是後端專用）。

### 2.2 回傳格式

```json
{
  "boardTime": "2026/07/23 14:34:22",
  "jpycashbuyRate": "0.1919",
  "jpycashsellRate": "0.2019",
  "usdcashbuyRate": "31.9400",
  "usdcashsellRate": "32.5400",
  "jpydigitsbuyRate": "0.1969",
  "jpydigitssellRate": "0.1989",
  "usddigitsbuyRate": "32.2500",
  "usddigitssellRate": "32.2900"
}
```

### 2.3 欄位對照

| API 欄位 | 意義 |
|---|---|
| `boardTime` | 報價時間，**台北時間**，格式 `YYYY/MM/DD HH:mm:ss` |
| `usdcashbuyRate` / `usdcashsellRate` | 美金**現金**買入 / 賣出 |
| `usddigitsbuyRate` / `usddigitssellRate` | 美金**即期**買入 / 賣出 |
| `jpycashbuyRate` / `jpycashsellRate` | 日圓**現金**買入 / 賣出 |
| `jpydigitsbuyRate` / `jpydigitssellRate` | 日圓**即期**買入 / 賣出 |

**注意**：
- `digits` = 即期（spot），`cash` = 現金
- 所有數值都是**字串**，需要 `parseFloat` 轉換
- 「買入」是銀行向你買外幣的價格（你賣外幣拿到的價）
- 「賣出」是銀行賣外幣給你的價格（你買外幣要付的價）
- 賣出價恆大於買入價

### 2.4 已知限制

- **更新時段結束後 API 仍會回傳最後一筆報價**，`boardTime` 不會更新。必須靠 `boardTime` 判斷資料新舊，不能假設「有回應 = 資料是新的」。
- `boardTime` 沒有時區標記，實際為台北時間（UTC+8）。
- 上游是 Google Apps Script，有每日配額限制，且重新部署會導致網址失效。所有呼叫都必須有錯誤處理。

---

## 3. 資料結構設計

### 3.1 Firestore Collection

```
rates/
  USD_2026  (文檔)
  JPY_2026  (文檔)
  USD_2025  (文檔)
  ...
```

**設計理由**：按「幣別_年份」切分文檔。單一文檔上限 1MB，一年約 250 個交易日，每日一個小物件，遠低於上限。前端預設只讀當年度，需要更長區間再多讀幾個文檔。這樣一次頁面載入只有 2 次 Firestore 讀取。

### 3.2 文檔內容

```javascript
// rates/USD_2026
{
  "2026-07-23": {
    boardTime: "2026/07/23 14:34:22",
    cashBuy: 31.94,
    cashSell: 32.54,
    spotBuy: 32.25,
    spotSell: 32.29
  },
  "2026-07-22": { ... }
}
```

**設計理由**：日期字串當 key，四個價格全存（就算前端目前只顯示部分，之後要加功能不用回頭補資料）。原始 `boardTime` 字串一併保留，方便日後除錯與驗證資料來源。

### 3.3 Firestore 安全規則

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rates/{document} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

前端只讀，寫入一律透過 Admin SDK（GitHub Actions）繞過規則。

---

## 4. 系統架構

兩條獨立的資料路徑，**不要混在一起**：

```
【即時路徑】更新時段內
瀏覽器 --輪詢--> /api/rate (Vercel Function) --> Apps Script API
                     ↓
              直接回傳，不寫 Firestore

【歷史路徑】每日一次
GitHub Actions (cron) --> Apps Script API --> Firestore (Admin SDK)
                                                    ↓
瀏覽器 --getDocs (一次性)--> Firestore --> 繪製折線圖
```

**關鍵設計決策**：即時路徑**絕對不寫入 Firestore**。更新時段內每分鐘輪詢，若每次都寫會產生大量雜訊資料，歷史圖表變得難以處理，也會浪費寫入配額。歷史資料只保留每日最後一筆。

---

## 5. 專案結構

```
/
├── api/
│   └── rate.js                 # Vercel Serverless Function
├── scripts/
│   └── sync-rates.js           # GitHub Actions 執行的寫入腳本
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── firebase.js             # Firebase 初始化
│   ├── components/
│   │   ├── LiveRatePanel.jsx   # 即時匯率面板
│   │   ├── RateCard.jsx        # 單一幣別卡片
│   │   ├── HistoryChart.jsx    # 歷史折線圖
│   │   └── MarketStatus.jsx    # 資料更新狀態指示
│   ├── hooks/
│   │   ├── useLiveRate.js      # 輪詢即時匯率
│   │   └── useHistory.js       # 讀取歷史資料
│   ├── utils/
│   │   ├── boardTime.js        # boardTime 解析
│   │   └── market.js           # 更新時段判斷
│   └── styles/
│       └── global.css
├── .github/workflows/
│   └── sync.yml
├── public/
├── .env.example
├── .gitignore
├── firestore.rules
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

---

## 6. 實作細節

### 6.1 `src/utils/boardTime.js`

**必須手動解析 `boardTime`**。`new Date("2026/07/23 14:34:22")` 在 Safari 會回傳 `Invalid Date`，只有 Chrome 容錯。

```javascript
/**
 * 解析報價時間字串（台北時間）
 * @param {string} s - "2026/07/23 14:34:22"
 * @returns {{ dateKey: string, ts: Date } | null}
 */
export function parseBoardTime(s) {
  if (typeof s !== 'string') return null;
  const m = s.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m.map(Number);
  return {
    dateKey: `${m[1]}-${m[2]}-${m[3]}`,        // "2026-07-23"
    ts: new Date(Date.UTC(y, mo - 1, d, h - 8, mi, se)), // 台北 → UTC
  };
}

/** 距今幾分鐘 */
export function minutesSince(ts) {
  return (Date.now() - ts.getTime()) / 60000;
}
```

### 6.2 `src/utils/market.js`

報價更新時間：**週一至週五 09:00–15:30（台北時間）**。此為預設值，若實際來源的更新區間不同，請調整 `market.js` 中的常數。

```javascript
/** 取得當前台北時間的 { day, minutes } */
function taipeiNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find(p => p.type === t)?.value;
  const dayMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return {
    day: dayMap[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function isMarketOpen() {
  const { day, minutes } = taipeiNow();
  return day >= 1 && day <= 5 && minutes >= 540 && minutes <= 930;
}
```

**已知限制**：無法判斷國定假日。非營業日 API 會回傳前一交易日的值，前端靠 `boardTime` 顯示「最後更新於 X」即可，不需要額外處理。

### 6.3 `api/rate.js` — Vercel Serverless Function

```javascript
export default async function handler(req, res) {
  const url = process.env.RATE_API_URL;
  if (!url) return res.status(500).json({ error: 'RATE_API_URL not configured' });

  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const d = await upstream.json();

    // Edge 快取 60 秒；上游失敗時回舊值最多 5 分鐘
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({
      boardTime: d.boardTime,
      usd: {
        cash: { buy: +d.usdcashbuyRate,   sell: +d.usdcashsellRate },
        spot: { buy: +d.usddigitsbuyRate, sell: +d.usddigitssellRate },
      },
      jpy: {
        cash: { buy: +d.jpycashbuyRate,   sell: +d.jpycashsellRate },
        spot: { buy: +d.jpydigitsbuyRate, sell: +d.jpydigitssellRate },
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    res.status(502).json({ error: 'upstream failed', detail: String(e) });
  }
}
```

**重點**：
- `s-maxage=60` 讓 Vercel Edge 快取一分鐘。十個使用者同時開站，上游只被打一次。
- `stale-while-revalidate=300` 是保險：上游掛掉時先回舊值，背景重試，使用者不會看到空白。
- 上游網址存在 `RATE_API_URL`，**不會出現在前端 bundle**。

### 6.4 `src/hooks/useLiveRate.js`

```javascript
import { useState, useEffect, useRef } from 'react';
import { isMarketOpen } from '../utils/market';

export function useLiveRate() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;

    const fetchRate = async () => {
      try {
        const r = await fetch('/api/rate');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (alive) { setData(j); setError(null); }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    };

    const schedule = () => {
      clearInterval(timer.current);
      // 更新時段內 60 秒輪詢；時段外 10 分鐘一次即可
      const interval = isMarketOpen() ? 60_000 : 600_000;
      timer.current = setInterval(() => {
        if (document.visibilityState === 'visible') fetchRate();
      }, interval);
    };

    fetchRate();
    schedule();

    // 分頁重新可見時立刻補抓一次
    const onVisible = () => {
      if (document.visibilityState === 'visible') { fetchRate(); schedule(); }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { data, error, loading };
}
```

**必須做到**：
- `useEffect` 的 cleanup 一定要 `clearInterval`，否則元件重新掛載會疊加多個計時器。
- 用 `document.visibilityState` 在分頁切到背景時暫停輪詢，避免使用者開著分頁去吃飯還在無謂消耗配額。
- `alive` flag 防止元件卸載後才回來的請求造成 setState warning。

### 6.5 `src/firebase.js`

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
});

export const db = getFirestore(app);
```

### 6.6 `src/hooks/useHistory.js`

**必須用 `getDoc` 一次性讀取，不要用 `onSnapshot`。** 歷史資料一天只變一次，即時監聽只會浪費讀取配額。

```javascript
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useHistory(currency, year = new Date().getFullYear()) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'rates', `${currency}_${year}`));
        if (!alive) return;
        const raw = snap.exists() ? snap.data() : {};
        const list = Object.entries(raw)
          .map(([date, v]) => ({ date, ...v }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setRows(list);
      } catch (e) {
        console.error(e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [currency, year]);

  return { rows, loading };
}
```

### 6.7 `scripts/sync-rates.js` — 排程寫入腳本

用 **firebase-admin**（不是前端 SDK），憑證從環境變數讀 Service Account JSON。

```javascript
import admin from 'firebase-admin';

const RATE_API_URL = process.env.RATE_API_URL;
const SA = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({ credential: admin.credential.cert(SA) });
const db = admin.firestore();

function parseBoardTime(s) {
  const m = String(s).match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return { dateKey: `${m[1]}-${m[2]}-${m[3]}`, year: m[1] };
}

// 台北時間的星期幾
function taipeiWeekday() {
  const w = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', weekday: 'short',
  }).format(new Date());
  return { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }[w];
}

async function main() {
  // 防呆一：非營業日不寫入
  const day = taipeiWeekday();
  if (day === 0 || day === 6) {
    console.log('非營業日，跳過');
    return;
  }

  const res = await fetch(RATE_API_URL);
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const d = await res.json();

  const bt = parseBoardTime(d.boardTime);
  if (!bt) throw new Error(`boardTime 格式錯誤: ${d.boardTime}`);

  const payload = {
    USD: {
      boardTime: d.boardTime,
      cashBuy:  +d.usdcashbuyRate,   cashSell:  +d.usdcashsellRate,
      spotBuy:  +d.usddigitsbuyRate, spotSell:  +d.usddigitssellRate,
    },
    JPY: {
      boardTime: d.boardTime,
      cashBuy:  +d.jpycashbuyRate,   cashSell:  +d.jpycashsellRate,
      spotBuy:  +d.jpydigitsbuyRate, spotSell:  +d.jpydigitssellRate,
    },
  };

  // 防呆二：數值合理性檢查
  for (const [cur, v] of Object.entries(payload)) {
    for (const k of ['cashBuy','cashSell','spotBuy','spotSell']) {
      if (!Number.isFinite(v[k]) || v[k] <= 0) {
        throw new Error(`${cur}.${k} 數值異常: ${v[k]}`);
      }
    }
    if (v.cashSell <= v.cashBuy || v.spotSell <= v.spotBuy) {
      throw new Error(`${cur} 買賣價邏輯異常`);
    }
  }

  for (const [cur, v] of Object.entries(payload)) {
    const ref = db.collection('rates').doc(`${cur}_${bt.year}`);

    // 防呆三：boardTime 相同表示資料未更新，跳過寫入
    const snap = await ref.get();
    const existing = snap.exists ? snap.data()?.[bt.dateKey] : null;
    if (existing?.boardTime === d.boardTime) {
      console.log(`${cur} ${bt.dateKey} boardTime 未變動，跳過`);
      continue;
    }

    await ref.set({ [bt.dateKey]: v }, { merge: true });
    console.log(`${cur} ${bt.dateKey} 已寫入`, v);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
```

**三道防呆的用意**：
1. 週末不寫（API 會回傳週五的值，直接寫會污染資料）
2. 數值範圍與買賣價邏輯檢查（上游改格式或回傳異常值時，寧可 fail 也不要寫髒資料）
3. `boardTime` 去重（重複執行不會重複寫入，這也讓手動觸發變得安全）

### 6.8 `.github/workflows/sync.yml`

```yaml
name: Sync Exchange Rates

on:
  schedule:
    # 台北時間 15:40（更新時段結束後 10 分鐘）= UTC 07:40，週一至週五
    - cron: '40 7 * * 1-5'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: node scripts/sync-rates.js
        env:
          RATE_API_URL: ${{ secrets.RATE_API_URL }}
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
```

**注意**：GitHub Actions 的 cron 在尖峰時段常延遲 5–15 分鐘。因為抓的是當日最後一筆定值，延遲不影響正確性。

### 6.9 前端元件需求

**`MarketStatus.jsx`**
- 更新時段內：綠點 + 「更新中」+ 「報價時間 14:34:22」
- 時段外：灰點 + 「已停止更新」+ 「最後報價 14:34」
- 若 `boardTime` 距今超過 15 分鐘且處於更新時段 → 橘點 + 「資料延遲」

**`RateCard.jsx`**
- 一張卡片一個幣別，同時顯示現金與即期兩組買入/賣出
- 標示清楚「買入 = 銀行跟你買」「賣出 = 銀行賣給你」，避免使用者誤解
- 日圓數值小數位需 4 位（0.1969），美金 2–4 位

**`HistoryChart.jsx`**
- Recharts `LineChart`
- **切換鈕**：即期 / 現金（這是必要功能，使用者明確要求）
- 每種模式下畫兩條線：買入、賣出
- 幣別切換：USD / JPY
- X 軸日期，Y 軸自動縮放（**不要從 0 開始**，匯率波動小，從 0 開始會看不出變化，需設 `domain={['dataMin - padding', 'dataMax + padding']}`）
- 資料點少於 2 筆時顯示「資料累積中」而非空白圖表

---

## 7. 環境變數

### 7.1 `.env`（本機開發，加入 `.gitignore`）

```bash
# 前端用（會被打包進 bundle，公開無妨）
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# 後端用（絕不可加 VITE_ 前綴）
RATE_API_URL=
```

### 7.2 兩組憑證的性質差異

| 憑證 | 用途 | 存放位置 | 可否公開 |
|---|---|---|---|
| `VITE_FIREBASE_*` | 前端讀 Firestore | `.env` + Vercel 環境變數 | 可（靠 Rules 把關） |
| `RATE_API_URL` | Function / 腳本呼叫上游 | Vercel 環境變數 + GitHub Secrets | 否 |
| `FIREBASE_SERVICE_ACCOUNT` | Actions 寫入 Firestore | GitHub Secrets | **絕對不可** |

**`VITE_` 前綴機制**：Vite 只會把 `VITE_` 開頭的變數注入前端 bundle，其他一律忽略。這是刻意的安全設計——強制開發者明確標示「這個值會公開」。所以後端專用的變數千萬不要加前綴。

Firebase 的 `apiKey` 名字容易誤導，它不是密碼，只是專案識別字串，Google 官方允許放在前端。真正的安全防線是 `firestore.rules`。

### 7.3 Vercel 環境變數設定

Vercel 專案 → Settings → Environment Variables，加入所有 `VITE_FIREBASE_*` 與 `RATE_API_URL`。本機的 `.env` 不會自動上傳。

### 7.4 GitHub Secrets 設定

Repository → Settings → Secrets and variables → Actions：
- `RATE_API_URL`
- `FIREBASE_SERVICE_ACCOUNT` — 整份 Service Account JSON 貼進去（Firebase Console → 專案設定 → 服務帳戶 → 產生新的私密金鑰）

---

## 8. 開發流程

### 階段一：骨架
1. `npm create vite@latest . -- --template react`
2. 安裝依賴：`npm i firebase recharts` / `npm i -D firebase-admin`
3. 建立目錄結構、`.env.example`、`.gitignore`
4. 確認 `npm run dev` 可跑

### 階段二：即時匯率
5. 寫 `api/rate.js`
6. 本機用 `vercel dev` 測試 Function（`npx vercel dev`，`npm run dev` 不會啟動 `api/`）
7. 寫 `utils/boardTime.js`、`utils/market.js`
8. 寫 `useLiveRate` hook
9. 寫 `MarketStatus`、`RateCard`、`LiveRatePanel`
10. 驗收：頁面顯示四組數字與報價時間，60 秒自動更新

### 階段三：資料庫與排程
11. 建立 Firebase 專案、開啟 Firestore、部署 `firestore.rules`
12. 寫 `scripts/sync-rates.js`
13. 本機測試：`RATE_API_URL=... FIREBASE_SERVICE_ACCOUNT='...' node scripts/sync-rates.js`
14. 確認 Firestore Console 出現正確文檔
15. 寫 `.github/workflows/sync.yml`，設定 Secrets，用 `workflow_dispatch` 手動觸發驗證

### 階段四：歷史圖表
16. 寫 `firebase.js`、`useHistory` hook
17. 寫 `HistoryChart`，含即期/現金切換與幣別切換
18. 驗收：圖表正確渲染，切換即時反應

### 階段五：部署
19. push 到 GitHub，Vercel 匯入專案
20. 設定 Vercel 環境變數
21. 部署後驗證 `/api/rate` 可正常回應
22. 觀察數日，確認排程穩定寫入

---

## 9. 驗收清單

**功能**
- [ ] 更新時段內每 60 秒自動更新，時段外降為 10 分鐘
- [ ] 分頁切到背景時停止輪詢
- [ ] 四組匯率（USD/JPY × 現金/即期 × 買入/賣出）全部正確顯示
- [ ] 顯示 `boardTime`，且更新時段內資料停滯超過 15 分鐘會提示
- [ ] 歷史圖表可切換即期/現金、USD/JPY
- [ ] Y 軸不從 0 開始
- [ ] 排程每個交易日成功寫入一筆

**穩健性**
- [ ] 上游 API 失敗時前端顯示錯誤訊息，不是白畫面
- [ ] `sync-rates.js` 遇到異常數值會 fail，不寫髒資料
- [ ] 重複執行 `sync-rates.js` 不會產生重複或錯誤資料
- [ ] `boardTime` 解析在 Safari 正常運作

**安全**
- [ ] `RATE_API_URL` 不出現在前端 bundle（`npm run build` 後 grep 確認）
- [ ] Service Account 金鑰只存在 GitHub Secrets
- [ ] `firestore.rules` 已部署且寫入被拒絕
- [ ] `.env` 在 `.gitignore` 內

---

## 10. 已知風險

| 風險 | 影響 | 因應 |
|---|---|---|
| Apps Script 重新部署導致網址失效 | 全站無資料 | 環境變數集中管理，換網址不需改碼 |
| Apps Script 每日配額耗盡 | 即時功能失效 | Edge 快取 60 秒大幅降低呼叫量 |
| 國定假日誤判為更新時段 | 顯示「更新中」但資料不動 | 靠 `boardTime` 停滯提示補足 |
| GitHub Actions cron 延遲 | 寫入時間不固定 | 抓當日最後定值，延遲無影響 |
| 上游回傳格式變更 | 資料錯誤 | `sync-rates.js` 的數值驗證會擋下 |

---

## 11. 明確不要做的事

- 不要在即時路徑寫入 Firestore
- 不要用 `onSnapshot` 讀歷史資料
- 不要把 `RATE_API_URL` 加上 `VITE_` 前綴
- 不要用 `new Date(boardTime)` 直接解析
- 不要引入 UI 框架或狀態管理套件
- 不要在前端直接呼叫上游 Apps Script（會暴露網址、也有 CORS 問題）
