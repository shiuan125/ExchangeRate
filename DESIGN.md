# 視覺設計規格

> 補充 SPEC.md 第 6.9 節。這份文件定義完整的設計 token 與元件視覺規範，請嚴格遵循。

---

## 1. 設計方向

**概念：翻牌顯示板的數位化**

取材自銀行櫃檯上方的翻牌式匯率顯示板——白底、深色數字、嚴謹的欄位對齊、資訊密度高但不擁擠。保留那種「權威、精準、可信賴」的秩序感，用當代的字體與間距重新詮釋。

**不要做的視覺**：
- 深色背景配螢光綠/霓虹色的「金融科技感」
- 玻璃擬態（glassmorphism）、大面積漸層、光暈效果
- 圓角過大的卡片（超過 16px）
- 任何裝飾性的 icon 或插圖

**核心原則**：數字是主角。所有視覺決策都服務於「快速讀懂數字」這個目的。使用者的典型情境是在手機上掃一眼就走。

---

## 2. 色彩系統

亮色是主要設計方向（紙感），深色為對等的第二方案，不是「把顏色反過來」的敷衍版本。

色彩 token 掛在 `<html data-theme="...">` 上，由 JS 控制切換。

```css
:root,
[data-theme="light"] {
  /* 底層 */
  --paper:      #FAFAF8;   /* 頁面底色，帶一點暖的紙白 */
  --board:      #FFFFFF;   /* 卡片底色 */
  --rule:       #E4E4DF;   /* 分隔線、邊框 */
  --rule-bold:  #C9C9C2;   /* 強調分隔線 */

  /* 文字 */
  --ink:        #16161A;   /* 主要數字與標題 */
  --ink-mid:    #55555E;   /* 次要文字 */
  --ink-light:  #8E8E96;   /* 標籤、說明文字 */

  /* 語意色 —— 台灣慣例：紅漲綠跌 */
  --up:         #C8232C;   /* 上漲，沉穩的正紅 */
  --down:       #157A4A;   /* 下跌，深綠 */
  --flat:       #8E8E96;   /* 持平 */

  /* 狀態 */
  --live:       #157A4A;   /* 更新中 */
  --closed:     #8E8E96;   /* 已停止更新 */
  --stale:      #B5721A;   /* 資料延遲，琥珀色 */

  /* 幣別識別色 —— 僅用於細微的標示，不做大面積填色 */
  --usd:        #1E3A5F;   /* 深藍 */
  --jpy:        #7A2E3A;   /* 深酒紅 */
}
```

**用色紀律**：整個介面只有數字的漲跌會用到彩色。其餘一律是 ink 系的灰階。不要為了「豐富」而增加顏色。

詳細的主題切換機制見第 9 節。

---

## 3. 字體

```css
:root {
  /* 數字專用 —— 整站的靈魂 */
  --font-num: 'Roboto Mono', 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;

  /* 介面文字 */
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont,
             'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
}
```

**字體載入**：只從 Google Fonts 載入 `Roboto Mono`（400, 500）與 `Inter`（400, 500, 600）。中文字型一律使用系統字型，**不要載入任何中文 webfont**（檔案動輒 3–5MB，會嚴重拖慢載入）。

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 3.1 字級系統

```css
:root {
  --t-hero:   clamp(2.75rem, 8vw, 4rem);    /* 主要匯率數字 */
  --t-lg:     clamp(1.5rem, 4vw, 1.875rem); /* 次要匯率數字 */
  --t-md:     1.0625rem;                     /* 一般內文 */
  --t-sm:     0.875rem;                      /* 標籤 */
  --t-xs:     0.75rem;                       /* 說明、時間戳 */
  --t-micro:  0.6875rem;                     /* eyebrow 標籤 */
}
```

### 3.2 數字排版（重要）

**所有顯示匯率的元素必須套用**：

```css
.num {
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
  letter-spacing: -0.02em;
}
```

`tabular-nums` 讓每個數字等寬，數值從 `0.1969` 變成 `0.1989` 時版面完全不跳動。金融介面沒做這件事會非常明顯。

**小數位規則**：
- 美金：固定 2 位（`32.25`）
- 日圓：固定 4 位（`0.1969`）
- 用 `toFixed()` 補零，不要讓 `32.2` 和 `32.25` 混在一起

### 3.3 eyebrow 標籤樣式

用於「即期」「現金」「買入」「賣出」這類欄位標籤：

```css
.eyebrow {
  font-family: var(--font-ui);
  font-size: var(--t-micro);
  font-weight: 500;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink-light);
}
```

---

## 4. 間距與尺寸

```css
:root {
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 48px;
  --s-8: 64px;

  --radius:    10px;
  --radius-sm: 6px;

  --maxw: 720px;   /* 內容最大寬度，刻意收窄以維持資訊的緊湊感 */
}
```

**版面**：單欄置中，最大寬度 720px。不要做寬螢幕的多欄佈局——匯率資訊量少，攤太開反而難讀。

---

## 5. 元件規範

### 5.1 整體結構

```
┌────────────────────────────────┐
│  匯率              ● 更新中     │  ← Header，狀態指示靠右
│  報價時間 14:34:22              │
├────────────────────────────────┤
│                                │
│  USD 美金                       │  ← 幣別匯率卡
│  ┌──────────────────────────┐  │
│  │ 即期                      │  │
│  │  買入        賣出          │  │
│  │  32.25      32.29         │  │  ← hero 級數字
│  │ ─────────────────────     │  │
│  │ 現金                      │  │
│  │  31.94      32.54         │  │  ← lg 級數字
│  └──────────────────────────┘  │
│                                │
│  JPY 日圓                       │
│  ┌──────────────────────────┐  │
│  │  ... 同上結構 ...          │  │
│  └──────────────────────────┘  │
│                                │
├────────────────────────────────┤
│  歷史走勢                       │
│  [即期|現金]      [USD|JPY]     │  ← 切換鈕
│  ┌──────────────────────────┐  │
│  │      折線圖               │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### 5.2 MarketStatus（狀態指示）

三種狀態，用小圓點加文字：

```css
.status {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--t-sm);
  color: var(--ink-mid);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--live {
  background: var(--live);
  animation: pulse 2.4s ease-in-out infinite;
}
.status-dot--closed { background: var(--closed); }
.status-dot--stale  { background: var(--stale); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .status-dot--live { animation: none; }
}
```

**文案**：
- 更新時段內 → 「更新中」
- 時段外 → 「已停止更新」
- 資料停滯超過 15 分鐘且在更新時段 → 「資料延遲」

報價時間獨立一行顯示：`報價時間 14:34:22`，用 `--t-xs` 與 `--ink-light`。

### 5.3 RateCard（幣別匯率卡）

```css
.card {
  background: var(--board);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: var(--s-5);
}

/* 幣別標題：左側一道細色條做識別，不用大面積填色 */
.card-title {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
  padding-left: var(--s-3);
  border-left: 3px solid var(--usd);   /* JPY 用 var(--jpy) */
  margin-bottom: var(--s-5);
}

.card-code {
  font-family: var(--font-num);
  font-size: var(--t-md);
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.card-name {
  font-size: var(--t-sm);
  color: var(--ink-light);
}

/* 即期／現金區塊 */
.rate-group + .rate-group {
  margin-top: var(--s-5);
  padding-top: var(--s-5);
  border-top: 1px solid var(--rule);
}

.rate-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-4);
  margin-top: var(--s-3);
}

.rate-value {
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  letter-spacing: -0.02em;
  color: var(--ink);
  line-height: 1;
}

.rate-value--spot { font-size: var(--t-hero); font-weight: 500; }
.rate-value--cash { font-size: var(--t-lg);   font-weight: 400; color: var(--ink-mid); }
```

**視覺層級很重要**：即期匯率用 hero 字級、深色；現金用較小字級、中灰色。使用者一眼就知道哪個是主要資訊。

**買入／賣出的說明**：這兩個詞很多人會搞混，在標籤旁加一行極小的說明文字：

```
買入  ← 銀行跟你買
賣出  ← 銀行賣給你
```

用 `--t-micro` 與 `--ink-light`，桌面版顯示，手機版可省略以節省空間。

### 5.4 翻牌動畫（簽名元素）

**這是整個介面唯一的主要動態效果**，呼應實體翻牌顯示板的機制。當數值更新時觸發：

```css
@keyframes flip-in {
  0%   { transform: rotateX(-90deg); opacity: 0; }
  100% { transform: rotateX(0);      opacity: 1; }
}

.rate-value.is-updating {
  animation: flip-in 320ms cubic-bezier(0.2, 0.8, 0.3, 1);
  transform-origin: center top;
}

@media (prefers-reduced-motion: reduce) {
  .rate-value.is-updating { animation: none; }
}
```

**實作方式**：在 React 中比對前後值，變動時加上 `is-updating` class，動畫結束後移除。

```javascript
function useFlip(value) {
  const prev = useRef(value);
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (prev.current !== value) {
      setFlip(true);
      prev.current = value;
      const t = setTimeout(() => setFlip(false), 340);
      return () => clearTimeout(t);
    }
  }, [value]);
  return flip;
}
```

**紀律**：除了這個翻牌動畫與狀態燈的呼吸效果，其餘一律不加動畫。不要做 hover 放大、不要做進場淡入、不要做 skeleton 閃爍。

### 5.5 切換鈕（Segmented Control）

即期/現金、USD/JPY 都用同一種樣式：

```css
.segment {
  display: inline-flex;
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.segment button {
  font-family: var(--font-ui);
  font-size: var(--t-sm);
  font-weight: 500;
  padding: var(--s-2) var(--s-4);
  border: none;
  background: transparent;
  color: var(--ink-light);
  border-radius: 4px;
  cursor: pointer;
  transition: color 140ms ease, background 140ms ease;
}

.segment button[aria-pressed="true"] {
  background: var(--board);
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

.segment button:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}
```

必須用 `aria-pressed` 標示選中狀態，不要只靠 class。

### 5.6 HistoryChart（Recharts 設定）

```jsx
<LineChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
  <CartesianGrid stroke="var(--rule)" strokeDasharray="0" vertical={false} />
  <XAxis
    dataKey="date"
    tick={{ fontSize: 11, fill: 'var(--ink-light)', fontFamily: 'var(--font-num)' }}
    tickLine={false}
    axisLine={{ stroke: 'var(--rule)' }}
    minTickGap={40}
    tickFormatter={(d) => d.slice(5).replace('-', '/')}  /* 07/23 */
  />
  <YAxis
    domain={['dataMin - dataMin * 0.004', 'dataMax + dataMax * 0.004']}
    tick={{ fontSize: 11, fill: 'var(--ink-light)', fontFamily: 'var(--font-num)' }}
    tickLine={false}
    axisLine={false}
    width={52}
    tickFormatter={(v) => v.toFixed(currency === 'JPY' ? 4 : 2)}
  />
  <Tooltip content={<CustomTooltip />} />
  <Line type="monotone" dataKey="buy"  stroke="var(--down)" strokeWidth={1.75} dot={false} />
  <Line type="monotone" dataKey="sell" stroke="var(--up)"   strokeWidth={1.75} dot={false} />
</LineChart>
```

**關鍵設定**：
- `domain` 絕對不能從 0 開始。匯率波動幅度小，從 0 開始會看到一條完全平坦的線。用 `dataMin/dataMax` 加減 0.4% 留白。
- `vertical={false}` 只留水平格線，垂直線在時間序列圖上是雜訊。
- `dot={false}` 資料點多時圓點會糊成一片。
- Tooltip 必須自訂，套用 `--font-num` 與 tabular-nums。

**空狀態**：資料少於 2 筆時不要渲染圖表，顯示：

```
資料累積中
每個交易日自動記錄
```

置中，`--ink-light`，不要用 icon 或插圖。

---

## 6. 響應式

單一斷點 `768px`。

**手機版調整**：
- `--t-hero` 透過 `clamp()` 自動縮小，不需額外處理
- 買入/賣出的說明文字隱藏
- 卡片 padding 從 `--s-5` 降為 `--s-4`
- 切換鈕改為全寬（`width: 100%`，內部按鈕 `flex: 1`）
- 圖表高度固定 `260px`（桌面 `320px`）

---

## 6.5 主題切換

見第 9 節完整規格。

---

## 7. 品質底線

以下每一項都必須做到：

- [ ] 所有互動元素有 `:focus-visible` 樣式，鍵盤可完整操作
- [ ] `prefers-reduced-motion` 被尊重（翻牌與呼吸燈都要停）
- [ ] 三段式主題切換（自動/亮/深）可用，設定持久化且不閃白
- [ ] 文字對比度符合 WCAG AA（`--ink-light` 在 `--board` 上實測 4.5:1）
- [ ] 手機 375px 寬度不出現橫向捲軸
- [ ] 數字全部套用 tabular-nums
- [ ] 中文不載入 webfont

---

## 8. CSS 撰寫注意

寫在單一 `src/styles/global.css`，用註解分區。**不要用 CSS Modules**（專案太小，多此一舉）。

**選擇器特異性陷阱**：避免同時用類型選擇器（`.card`）與元素選擇器（`.card div`）控制同一個屬性，容易互相覆蓋。所有間距統一由父層的 `gap` 或子層的 `margin-top` 單向控制，不要混用 `margin-bottom` 與 `margin-top`。

---

## 9. 主題切換系統

### 9.1 三段式，不是二選一

提供三個選項，**不要只做亮/暗切換**：

| 值 | 行為 |
|---|---|
| `system` | 跟隨作業系統設定（**預設值**） |
| `light` | 強制亮色 |
| `dark` | 強制深色 |

理由：多數使用者的偏好其實是「跟系統走」，但也有人在深色系統下想強制看亮色（例如白天在戶外、或單純覺得數字在亮底上比較清楚）。只給二選一會讓「跟隨系統」這個最合理的預設無法回頭選。

### 9.2 深色 token

深色不是把亮色反相，是重新調過的一套值。

```css
[data-theme="dark"] {
  /* 底層 —— 不用純黑，帶一點藍調的深灰較不刺眼 */
  --paper:      #101013;
  --board:      #18181C;
  --rule:       #26262C;
  --rule-bold:  #35353D;

  /* 文字 —— 不用純白，降低眩光 */
  --ink:        #EDEDEA;
  --ink-mid:    #A4A4AC;
  --ink-light:  #6E6E78;

  /* 語意色 —— 深底上需要提高明度與降低彩度才看得清楚 */
  --up:         #E8636B;
  --down:       #3FB07E;
  --flat:       #6E6E78;

  --live:       #3FB07E;
  --closed:     #6E6E78;
  --stale:      #D19A3E;

  --usd:        #6E9BD1;
  --jpy:        #CF8592;
}
```

**調色重點**：
- 底色用 `#101013` 而非 `#000000`。純黑在 OLED 螢幕上與內容的對比過強，長時間看很累，也會讓卡片邊界消失。
- 文字用 `#EDEDEA` 而非純白。純白配深底會產生光暈（halation），數字邊緣看起來會糊。
- 紅綠兩色在深底上必須提高明度：亮色的 `#C8232C` 直接搬到深底會暗到看不清，所以改用 `#E8636B`。

### 9.3 系統偏好對應

`system` 模式下，靠 media query 把深色 token 套用到 `[data-theme="system"]`：

```css
@media (prefers-color-scheme: dark) {
  [data-theme="system"] {
    --paper:      #101013;
    --board:      #18181C;
    --rule:       #26262C;
    --rule-bold:  #35353D;
    --ink:        #EDEDEA;
    --ink-mid:    #A4A4AC;
    --ink-light:  #6E6E78;
    --up:         #E8636B;
    --down:       #3FB07E;
    --flat:       #6E6E78;
    --live:       #3FB07E;
    --closed:     #6E6E78;
    --stale:      #D19A3E;
    --usd:        #6E9BD1;
    --jpy:        #CF8592;
  }
}
```

為避免重複維護兩份深色 token，建議把深色值抽成一個 CSS 檔或用 `@media` 內 `@import`。若嫌麻煩，直接重複貼一份也可接受——token 數量不多，但**修改時務必兩處同步**。

### 9.4 防止 FOUC（重要）

主題必須在 React 掛載**之前**就套用到 `<html>`，否則頁面會先閃一下亮色再變深色。深色模式下這一閃非常刺眼。

在 `index.html` 的 `<head>` 內、所有 CSS 之前，放一段同步執行的 inline script：

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('theme') || 'system';
      document.documentElement.setAttribute('data-theme', t);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'system');
    }
  })();
</script>
```

**必須是 inline、必須同步、必須在 CSS 之前**。放進 React 元件裡就失去意義了。`try/catch` 是因為隱私模式下 `localStorage` 可能拋錯。

### 9.5 瀏覽器 UI 配色

讓手機的網址列跟著主題變色：

```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#FAFAF8">
<meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#101013">
```

另外在 CSS 加上，讓捲軸與表單元件也跟著切換：

```css
[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }
[data-theme="system"] { color-scheme: light dark; }
```

### 9.6 `useTheme` hook

```javascript
// src/hooks/useTheme.js
import { useState, useEffect, useCallback } from 'react';

const KEY = 'theme';
const ORDER = ['system', 'light', 'dark'];

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(KEY) || 'system'; }
    catch { return 'system'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch {}
  }, [theme]);

  const setTheme = useCallback((t) => {
    if (!ORDER.includes(t)) return;
    setThemeState(t);
  }, []);

  // 供 UI 顯示目前實際生效的是亮還是暗
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  return { theme, setTheme, resolved };
}
```

**注意**：不需要監聽 `matchMedia` 的 change 事件來重新渲染，因為 `system` 模式下的樣式由 CSS media query 直接處理，系統切換時瀏覽器會自動重繪。只有當 UI 需要顯示「目前是亮還是暗」時才需要監聽——若有此需求再加。

### 9.7 切換 UI

沿用第 5.5 節的 segmented control 樣式，放在 Header 右側、狀態指示的旁邊。

```jsx
<div className="segment segment--theme" role="group" aria-label="外觀主題">
  <button aria-pressed={theme === 'system'} onClick={() => setTheme('system')}
          title="跟隨系統">自動</button>
  <button aria-pressed={theme === 'light'}  onClick={() => setTheme('light')}
          title="亮色">亮</button>
  <button aria-pressed={theme === 'dark'}   onClick={() => setTheme('dark')}
          title="深色">深</button>
</div>
```

**文案**用「自動／亮／深」三個字，不用 icon。理由：太陽月亮 icon 在三段式下很難表達「自動」，而且圖示語意不如文字明確。字少反而乾淨。

手機版縮小尺寸：

```css
.segment--theme button {
  padding: var(--s-1) var(--s-3);
  font-size: var(--t-xs);
}
```

### 9.8 切換時的過場

**不要**對全站加 `transition: background 300ms`。大面積顏色漸變會讓切換顯得遲鈍，而且會拖慢渲染。

正確做法是只讓少數元素有短過場，或乾脆不加：

```css
.card,
.segment {
  transition: background-color 120ms ease, border-color 120ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .card, .segment { transition: none; }
}
```

`<body>` 本身不加過場，瞬間切換即可。

### 9.9 圖表的主題適配

Recharts 用的是 inline SVG 屬性，`var(--rule)` 這類 CSS 變數在部分 SVG 屬性上不會生效。**必須在元件內讀取實際計算值**：

```javascript
function useChartColors() {
  const { resolved } = useTheme();
  return useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      rule: s.getPropertyValue('--rule').trim(),
      inkLight: s.getPropertyValue('--ink-light').trim(),
      up: s.getPropertyValue('--up').trim(),
      down: s.getPropertyValue('--down').trim(),
      board: s.getPropertyValue('--board').trim(),
    };
  }, [resolved]);
}
```

把回傳的色值傳給 Recharts 的 `stroke`、`fill`、`tick.fill`。`resolved` 變動時會重新計算，圖表就會跟著換色。

Tooltip 的背景要用 `--board` 加 `--rule` 邊框，深色下才不會出現白底白字。

### 9.10 驗收

- [ ] 首次載入不閃白（深色模式下重新整理數次確認）
- [ ] 重新整理後主題設定保留
- [ ] 選 `system` 時，在系統設定切換亮暗，網頁即時跟著變
- [ ] 深色下折線圖的紅綠線、格線、Tooltip 都清楚可見
- [ ] 深色下所有文字對比度達 WCAG AA
- [ ] 手機網址列顏色跟著主題變
- [ ] 隱私模式（localStorage 不可用）下不報錯，退回 `system`
