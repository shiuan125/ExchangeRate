# 永豐歷史資料 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 永豐頁顯示依永豐歷史資料計算的走勢圖、徽章、漲跌箭頭。

**Architecture:** GAS 回補／歸檔到 `sinopac_rates/{CUR}_{YEAR}`；前端歷史讀取依 bank 選 collection；徽章與走勢圖改為「依欄位」判斷資料是否足夠。

**Tech Stack:** React 18、Vite 5、Firestore、`node:test`。

**Spec:** `docs/superpowers/specs/2026-11-16-sinopac-history-design.md`

## Global Constraints
- collection：`cathay → 'rates'`、`sinopac → 'sinopac_rates'`。
- 國泰頁行為不變。
- 被 `node --test` 載入的 src 模組，其相對 import 必須帶 `.js` 副檔名。
- Commit 不加 Co-Authored-By。

## Review Focus
1. 永豐現鈔只有 0–1 天資料 → 走勢圖「資料累積中」、無徽章（Task 1 測試）。
2. 永豐現鈔有 1 天前次收盤 → 箭頭出現；前次收盤列無現鈔 → 箭頭不出現（既有 `ChangeArrow` 行為，手動驗證）。
3. 國泰完整資料 → 徽章結果與改動前相同（Task 1 測試）。
4. 切換銀行時走勢圖不殘留另一家資料（`key={bank}`，手動驗證）。
5. `sinopac_rates` 尚未存在（回補前）→ 永豐頁走勢圖「資料累積中」、不報錯（手動驗證）。

---

### Task 1: 依欄位判斷資料是否足夠（純函式）

**Files:**
- Modify: `src/utils/rateBadge.js`（import 改 `./date.js`）
- Create: `src/utils/chartData.js`
- Test: `src/utils/rateBadge.test.js`, `src/utils/chartData.test.js`
- Modify: `src/components/HistoryChart.jsx`（`data` useMemo 改呼叫 `buildChartData`）

**Interfaces:**
- Produces: `buildChartData(rows, mode: 'spot'|'cash', cutoff: string) -> Array<{date, buy, sell}>`，只保留 `date >= cutoff` 且 buy、sell 皆為 number 的列。
- `computeRateBadge` 簽名不變；涵蓋天數改用 `rows` 中 `typeof r[field] === 'number'` 的最早日期。

- [ ] **Step 1: 失敗測試** `rateBadge.test.js`：以 `dateKeyDaysAgo` 動態造資料
  - `spot 90 days, cash only today-1 → cashSell badge null`（current 比所有值低）
  - `spot 90 days → spotSell lowest gives 近月最低`（current 最低；近半年不足 → 近月）
  - `field never present → null`
- [ ] **Step 2: 失敗測試** `chartData.test.js`：`cash mode drops rows without cash`、`spot mode keeps rows`、`cutoff filters older rows`。
- [ ] **Step 3:** `npm test` → FAIL。
- [ ] **Step 4:** 實作；HistoryChart 改用 `buildChartData`。
- [ ] **Step 5:** `npm test` PASS、`npx oxlint` exit 0、`npm run build` 成功。
- [ ] **Step 6: Commit** `fix: 徽章與走勢圖依欄位判斷資料是否足夠`

### Task 2: 歷史資料依銀行讀取，永豐頁顯示走勢圖

**Files:**
- Modify: `src/utils/bank.js`(+test), `src/hooks/useHistory.js`, `src/hooks/useRateHistory.js`, `src/components/RateCard.jsx`, `src/components/HistoryChart.jsx`, `src/components/LiveRatePanel.jsx`, `src/App.jsx`

**Interfaces:**
- Produces:
  - `historyCollection(bank) -> 'rates' | 'sinopac_rates'`（bank.js，測試覆蓋兩值與未知值→'rates'）
  - `fetchYearRows(currency, year, collection = 'rates')`
  - `useRateHistory(currency, bank = 'cathay')`（取代第一版 `enabled` 參數）
  - `RateCard({ currency, spot, cash, bank = 'cathay' })`（移除 `withHistory`）
  - `HistoryChart({ bank = 'cathay' })`
  - `App`：`<HistoryChart key={bank} bank={bank} />` 兩頁皆顯示

- [ ] **Step 1: 失敗測試** `historyCollection` → `npm test` FAIL。
- [ ] **Step 2:** 實作上述修改。
- [ ] **Step 3:** `npm test`、`npx oxlint`、`npm run build` 皆通過。
- [ ] **Step 4: 手動驗證**（dev server）：國泰頁不變；永豐頁回補前走勢圖「資料累積中」；回補後即期 7天/1月/3月 有線、現金「資料累積中」；切換銀行無殘留。
- [ ] **Step 5: Commit** `feat: 永豐頁歷史走勢、徽章與漲跌箭頭`

### Task 3: 文件
- [ ] SPEC.md：`sinopac_rates` 格式、回補與每日歸檔資料流、移除「永豐沒有歷史」敘述；補 `useRateHistory.js`、`chartData.js` 到目錄樹。
- [ ] Commit `docs: 記錄永豐歷史資料`
