# 永豐歷史資料 設計

## 目的
永豐頁比照國泰頁：歷史走勢圖、「近 N 天最高／最低」徽章、與前次收盤比較的漲跌箭頭。

## 目標 / 非目標
- 目標：回補永豐近 3 個月即期（USD/JPY/GBP）；之後每個交易日歸檔即期＋現鈔；永豐頁顯示走勢圖、徽章、箭頭。
- 非目標：回補現鈔歷史（永豐 API 不提供，`NoteFlag=Y` 一律回「系統忙線中」）；回補超過 3 個月。
- 反目標：現鈔資料不足時顯示誤導性的徽章（例如只有 1 天現鈔卻標「近月最低」）或斷線的走勢圖；改變國泰頁行為。

## 資料來源
- 歷史即期：`https://bank.sinopac.com/GCSDsp/ETS_ListHistory.aspx?BeginTime=YYYY/MM/DD&EndTime=YYYY/MM/DD&DispCode={USD|JPY|GBP}&NoteFlag=N&BaseFlag=00&ETSLIST=ETSListHistory`
  - 回 JSONP `ETSListHistory([...])`；`[0].SubInfo[]` 每列 `categories:"YYYY/MM/DD"`、`buyRates`、`sellRates`（6 位小數）。最多回 365 天。
  - 週末／假日會以前一日價格補值 → 需以台灣行事曆濾掉非交易日。
  - 數值四捨五入到小數 4 位，與牌告一致（例：JPY `0.204760` → `0.2048`）。

## 做法（唯一合理做法）
資料端全在使用者既有 GAS（已有服務帳戶與 `getTaiwanCalendar_`）。Node script／GitHub Actions 需另外配置服務帳戶，不採用。

## 設計
1. **Firestore** `sinopac_rates/{CUR}_{YEAR}`，格式同 `rates/`：`{ "YYYY-MM-DD": { spotBuy, spotSell, cashBuy?, cashSell?, boardTime? } }`。回補資料只有 spot、無 boardTime。
2. **GAS**
   - `backfillSinopacHistory()`：一次性手動執行；抓 3 個月即期，以 `getTaiwanCalendar_`（失敗退回週末判斷）濾掉非交易日；排除今天（今天由盤後歸檔寫入）；以 `updateDocument(path, payload, Object.keys(payload))` merge 寫入。
   - `marketClose` 追加：`syncSinopacExchangeRate()` 結果同時寫 `sinopac/realtime` 與 `sinopac_rates`（含現鈔，key 取自 boardTime 日期）。
3. **前端**
   - 歷史讀取依銀行選 collection：`cathay → rates`、`sinopac → sinopac_rates`。
   - `HistoryChart` 接收 `bank`，兩頁都顯示；資料先濾掉缺該模式欄位的日子，不足 2 筆顯示「資料累積中」。
   - `computeRateBadge` 的「資料涵蓋天數」改以**該欄位**最早有值的日期判斷。
   - `RateCard` 以 `bank` 取歷史；移除第一版的 `withHistory`。
   - 漲跌箭頭：前次收盤列缺現鈔時不顯示（現有 `Number.isFinite` 已處理）。
4. **文件**：SPEC.md 補 `sinopac_rates` 與資料流。
