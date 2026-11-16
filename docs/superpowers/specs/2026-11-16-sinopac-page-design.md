# 永豐銀行匯率頁 設計

## 目的
使用者國泰、永豐都有在用，想在同一個 App 裡分別看兩家的牌告匯率。新增一個獨立的永豐頁面，結構與現有國泰頁相同。

## 目標 / 非目標
- 目標：永豐頁顯示 USD、JPY、GBP 的即期與現鈔買進／賣出（GBP 只有即期），營業時間內每分鐘更新，與國泰頁可互相切換。
- 非目標（本版不做）：永豐歷史走勢圖與每日收盤歸檔、兩家並排比價。
- 反目標：每個使用者的瀏覽器各自打永豐 API；破壞現有國泰頁的行為。

## 限制
- 永豐 API `https://mma.sinopac.com/ws/share/rate/ws_exchange.ashx?exchangeType=REMIT|CASH` 回 JSON，但**沒有 CORS 標頭**，前端無法直接呼叫。
- 回應格式：`[0].TitleInfo` 內含「報價時間：YYYY-MM-DD HH:mm:ss」；`[0].SubInfo[]` 每列 `DataValue4`=幣別代碼、`DataValue2`=銀行買進、`DataValue3`=銀行賣出；沒有報價時為 `"-"`。
- REMIT = 即期（匯款），CASH = 現鈔。

## 做法（已選 A）
- **A. Google Apps Script 定時抓永豐 → 寫 Firestore `sinopac/realtime`（採用）**：與國泰架構一致，全站共用一份資料。
- B. Vercel Function 代抓：違背 SPEC 中「即時匯率不再透過 Function 打上游」的決定。
- C. GitHub Actions cron：最短 5 分鐘且常延遲，不適合即時。

## 設計
1. **GAS（使用者貼上並設定觸發）**：一支 `syncSinopac()`，抓 REMIT 與 CASH，解析 USD/JPY/GBP，寫入 `sinopac/realtime`：
   ```
   {
     boardTime: "YYYY/MM/DD HH:mm:ss",   // 由報價時間轉為前端 parseBoardTime 可解析的格式
     usd: { spotBuy, spotSell, cashBuy, cashSell },
     jpy: { spotBuy, spotSell, cashBuy, cashSell },
     gbp: { spotBuy, spotSell },          // 現鈔為 "-" 時不寫
     updatedAt: Timestamp                // 與 cathaybk/realtime 一致
   }
   ```
   防呆：任一必要數值不是正數就不寫入，保留上一筆。不另建觸發器，掛在既有的 `realtimeTask`（09:00–16:00 每分鐘）與 `marketClose` 上，與國泰共用排程；兩家各自 try/catch，互不影響。
2. **Firestore 規則**：`firestore.rules` 補上 `cathaybk` 與 `sinopac` 的公開讀取（repo 目前與線上不同步）。
3. **前端**：
   - 抽出共用的即時匯率 hook，用參數區分銀行；永豐的資料來源一律讀 `sinopac/realtime`（盤後即為 15:30 收盤價，不需另讀 `rates`）。
   - 頁首加「國泰／永豐」切換，以 URL hash（`#sinopac`）記住目前頁面，不加 router、不改 Vercel 設定。
   - 永豐頁只有即時匯率區塊；國泰頁維持原樣（含歷史走勢圖）。
4. **文件**：SPEC.md 補上永豐資料流與 Firestore 文件格式。

## 留給實作者
- 切換按鈕的視覺細節沿用現有 DESIGN.md 風格。
- GAS 寫 Firestore 沿用使用者現有的 `FirestoreApp.getFirestore(...).updateDocument`（已提供程式碼給使用者貼上）。
