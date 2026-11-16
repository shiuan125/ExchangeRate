# 永豐銀行匯率頁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可與國泰頁切換的永豐即時匯率頁，資料讀 Firestore `sinopac/realtime`。

**Architecture:** GAS（已由使用者部署）每分鐘覆寫 `sinopac/realtime`。前端以 URL hash 決定目前銀行，`useLiveRate(bank)` 依銀行選擇資料來源；永豐頁只渲染即時匯率面板，不顯示依國泰歷史計算的徽章／漲跌箭頭。

**Tech Stack:** React 18、Vite 5、Firebase Web SDK 10（Firestore `getDoc`）、Node 22 內建 `node:test`（不新增測試依賴）。

**Spec:** `docs/superpowers/specs/2026-11-16-sinopac-page-design.md`

## Global Constraints

- Firestore 文件：`sinopac/realtime`，欄位 `boardTime: "YYYY/MM/DD HH:mm:ss"`、`usd|jpy: { spotBuy, spotSell, cashBuy, cashSell }`、`gbp: { spotBuy, spotSell }`（可能缺）、`updatedAt: Timestamp`。
- 一律 `getDoc` 一次性讀取，不用 `onSnapshot`；輪詢節奏沿用 `useLiveRate` 現有邏輯（營業時間 60 秒、分頁可見才抓）。
- 銀行識別字：`'cathay' | 'sinopac'`；hash `#sinopac` → 永豐，其他（含空）→ 國泰。
- 不新增 npm 依賴、不加 router、不改 `vercel.json`。
- 國泰頁行為與畫面維持原樣（含 HistoryChart、徽章、漲跌箭頭）。
- 介面文字：切換按鈕「國泰」「永豐」，群組 `aria-label="銀行"`。
- Commit message 不加 Co-Authored-By。

## Review Focus

1. `sinopac/realtime` 缺 `gbp` → 永豐頁不顯示英鎊卡，不報錯（Task 1 測試）。
2. 欄位為字串數字（例如 `"32.8850"`）→ 仍轉成數字（Task 1 測試）。
3. 缺 `usd` 或 `jpy` → 拋錯，面板顯示「匯率資料暫時無法取得」或保留上一筆（Task 1 測試）。
4. 未知 hash（`#foo`、`#SINOPAC` 大小寫）→ 國泰；`#sinopac` 才是永豐（Task 1 測試）。
5. 快速來回切換銀行 → 不會把前一家晚回來的資料顯示在另一家頁面（Task 3 以 `key={bank}` 重新掛載面板，手動驗證）。

---

### Task 1: 純函式：永豐資料轉換與 hash 解析

**Files:**
- Create: `src/utils/sinopacRate.js`, `src/utils/bank.js`
- Test: `src/utils/sinopacRate.test.js`, `src/utils/bank.test.js`
- Modify: `package.json`（scripts 加 `"test": "node --test"`）

**Interfaces:**
- Produces:
  - `mapSinopacRealtime(d: object) -> { boardTime: string, usd: {cash:{buy,sell}, spot:{buy,sell}}, jpy: 同上, gbp: {spot:{buy,sell}} | null, fetchedAt: string }`；`d.usd` 或 `d.jpy` 缺時 `throw new Error('永豐資料不完整')`。輸出形狀與現有 `fetchFromRealtime()` 相同。
  - `BANKS = ['cathay', 'sinopac']`、`bankFromHash(hash: string) -> 'cathay' | 'sinopac'`、`hashForBank(bank) -> '' | '#sinopac'`

- [ ] **Step 1: 寫失敗測試** `src/utils/sinopacRate.test.js`（`node:test` + `node:assert/strict`）
  - `maps full doc`：輸入 `{ boardTime:'2026/11/16 15:30:37', usd:{spotBuy:32.885,spotSell:32.99,cashBuy:32.685,cashSell:33.19}, jpy:{spotBuy:0.2048,spotSell:0.2085,cashBuy:0.2018,cashSell:0.21}, gbp:{spotBuy:43.2792,spotSell:43.7161} }` → `usd.spot` 深等 `{buy:32.885,sell:32.99}`、`usd.cash` 深等 `{buy:32.685,sell:33.19}`、`gbp` 深等 `{spot:{buy:43.2792,sell:43.7161}}`、`boardTime === '2026/11/16 15:30:37'`。
  - `string numbers become numbers`：`usd.spotBuy:'32.8850'` → `usd.spot.buy === 32.885`。
  - `missing gbp gives null`：刪掉 `gbp` → `result.gbp === null`。
  - `missing usd throws`：`assert.throws(() => mapSinopacRealtime({boardTime:'x', jpy:{...}}), /永豐資料不完整/)`；`jpy` 缺同理。
- [ ] **Step 2: 寫失敗測試** `src/utils/bank.test.js`：`bankFromHash('#sinopac')==='sinopac'`；`''`、`'#'`、`'#foo'`、`'#SINOPAC'` 皆 `'cathay'`；`hashForBank('sinopac')==='#sinopac'`、`hashForBank('cathay')===''`。
- [ ] **Step 3: 加 `"test": "node --test"`，執行** `npm test` → Expected: FAIL（模組不存在）。
- [ ] **Step 4: 實作** `src/utils/sinopacRate.js`、`src/utils/bank.js`（不可 import firebase，保持可在 Node 直接測）。
- [ ] **Step 5: 執行** `npm test` → Expected: 全部 PASS；`npm run lint` 無錯。
- [ ] **Step 6: Commit** `git add src/utils/sinopacRate.js src/utils/sinopacRate.test.js src/utils/bank.js src/utils/bank.test.js package.json` → `git commit -m "feat: 永豐即時匯率資料轉換與銀行 hash 解析"`

### Task 2: Hooks 依銀行取資料

**Files:**
- Modify: `src/hooks/useLiveRate.js`, `src/hooks/useRateHistory.js`, `src/components/RateCard.jsx`

**Interfaces:**
- Consumes: `mapSinopacRealtime`（Task 1）
- Produces:
  - `useLiveRate(bank = 'cathay') -> { data, error, loading, fetching }`。`'cathay'` 行為完全不變；`'sinopac'` 無論開盤與否都 `getDoc(doc(db,'sinopac','realtime'))` → `mapSinopacRealtime`，文件不存在時 `throw new Error('Firestore 尚無永豐即時資料')`。effect 依賴 `[bank]`。
  - `useRateHistory(currency, enabled = true)`：`enabled === false` 時不讀 Firestore，回傳 `{ rows: [], loading: false }`。effect 依賴 `[currency, enabled]`。
  - `RateCard({ currency, spot, cash, withHistory = true })`：`withHistory=false` 時傳 `enabled=false` 給 `useRateHistory`，因 `rows` 為空、`prevRow` 為 undefined，徽章與漲跌箭頭自然不顯示。

- [ ] **Step 1: 實作上述三處修改**（hooks 無測試框架；以 build + Task 3 手動驗證把關）。
- [ ] **Step 2: 執行** `npm run lint && npm run build` → Expected: 無錯、build 成功。
- [ ] **Step 3: Commit** `git commit -am "feat: useLiveRate 依銀行選擇資料來源，RateCard 可關閉歷史比較"`

### Task 3: 銀行切換 UI

**Files:**
- Create: `src/hooks/useBank.js`, `src/components/BankSwitch.jsx`
- Modify: `src/App.jsx`, `src/components/LiveRatePanel.jsx`, `src/styles/global.css`（必要時）

**Interfaces:**
- Consumes: `bankFromHash`, `hashForBank`, `BANKS`（Task 1）；`useLiveRate(bank)`、`RateCard withHistory`（Task 2）
- Produces:
  - `useBank() -> [bank, setBank]`：初值 `bankFromHash(location.hash)`；監聽 `hashchange`；`setBank` 用 `history.replaceState(null, '', location.pathname + location.search + hashForBank(b))` 後更新 state（不產生上一頁紀錄、國泰時移除 hash）。
  - `BankSwitch({ bank, onChange })`：沿用 `.segment` 樣式，`role="group" aria-label="銀行"`，兩顆按鈕「國泰」「永豐」用 `aria-pressed`。
  - `LiveRatePanel({ bank, onBankChange })`：`<BankSwitch>` 放在 `.page-title` 下方（header 左欄）；永豐時 `RateCard withHistory={false}`。
  - `App`：`const [bank, setBank] = useBank()`；`<LiveRatePanel key={bank} bank={bank} onBankChange={setBank} />`；`{bank === 'cathay' && <HistoryChart />}`；Footer 不變。

- [ ] **Step 1: 實作上述檔案。**
- [ ] **Step 2: 執行** `npm run lint && npm run build` → Expected: 無錯。
- [ ] **Step 3: 手動驗證** `npm run dev`：
  - 預設國泰頁與改動前一致（三張卡、徽章／箭頭、歷史走勢圖）。
  - 點「永豐」→ 網址變 `#sinopac`、卡片數值與 `sinopac/realtime` 相同、無走勢圖、無徽章／箭頭、狀態列顯示報價時間。
  - 直接開 `/#sinopac` 進入永豐頁；重新整理仍停在永豐；`/#foo` 為國泰。
  - 快速連點切換 5 次，最後顯示的資料屬於當前銀行。
  - 手機寬度（375px）header 不擠壓換行錯亂。
- [ ] **Step 4: Commit** `git add -A src && git commit -m "feat: 新增國泰／永豐切換與永豐即時匯率頁"`

### Task 4: 規則與文件同步

**Files:**
- Modify: `firestore.rules`, `SPEC.md`

- [ ] **Step 1:** `firestore.rules` 改為與線上一致：`match /{document=**} { allow read: if true; allow write: if false; }`。
- [ ] **Step 2:** `SPEC.md`：資料流（第 4 節）補 `GAS --> 永豐 API --> Firestore sinopac/realtime`；第 3 節補 `sinopac/realtime` 欄位格式；第 5 節專案結構補 Task 1、3 新檔；註明永豐頁目前無歷史走勢與徽章。
- [ ] **Step 3: Commit** `git add firestore.rules SPEC.md docs/superpowers && git commit -m "docs: 同步 Firestore 規則並記錄永豐資料流"`
