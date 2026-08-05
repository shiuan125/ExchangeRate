import admin from 'firebase-admin';

const RATE_API_URL = process.env.RATE_API_URL;
const SA = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({ credential: admin.credential.cert(SA) });
const db = admin.firestore();

// 交易日的星期幾（0=日 ... 6=六）。dateKey 是純日期字串（YYYY-MM-DD），用 UTC 建構避免受執行環境時區影響
function weekdayOfDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// 台北時間的星期幾（執行當下）
function taipeiWeekday() {
  const w = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', weekday: 'short',
  }).format(new Date());
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[w];
}

/**
 * 營業時間延伸到隔日 02:00，00:00–08:59 的報價屬於前一天開盤延續的收盤價，
 * 歸屬前一個交易日，dateKey／year 都要回推一天，歷史走勢圖的日期才會對齊實際開盤日
 * （例如週五 09:00 開盤、週六 01:58 收盤的最後一筆報價，要記成週五而不是週六）。
 */
function parseBoardTime(s) {
  const m = String(s).match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h] = m;
  if (Number(h) >= 9) return { dateKey: `${y}-${mo}-${d}`, year: y };

  const prevDay = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  prevDay.setUTCDate(prevDay.getUTCDate() - 1);
  const dateKey = prevDay.toISOString().slice(0, 10);
  return { dateKey, year: String(prevDay.getUTCFullYear()) };
}

async function main() {
  // 早退防呆：週日全天不可能有任何交易日的收盤資料（唯一跨夜的週五~週六場次不會延續到週日），
  // 直接跳過可省下一次上游配額；週六則必須先抓資料才能判斷（可能是週五收盤延續到週六 02:00 的資料）
  if (taipeiWeekday() === 0) {
    console.log('非營業日（週日），跳過');
    return;
  }

  const res = await fetch(RATE_API_URL);
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const d = await res.json();

  const bt = parseBoardTime(d.boardTime);
  if (!bt) throw new Error(`boardTime 格式錯誤: ${d.boardTime}`);

  // 防呆一：非營業日不寫入。用交易日（bt.dateKey）判斷，而非「腳本執行當下」的星期——
  // 若排在收盤時刻（隔日 02:00）執行，執行當下可能已經是週六，但資料其實屬於週五
  const tradingDay = weekdayOfDateKey(bt.dateKey);
  if (tradingDay === 0 || tradingDay === 6) {
    console.log(`非營業日（交易日 ${bt.dateKey}），跳過`);
    return;
  }

  const payload = {
    USD: {
      boardTime: d.boardTime,
      cashBuy: +d.usdcashbuyRate, cashSell: +d.usdcashsellRate,
      spotBuy: +d.usddigitsbuyRate, spotSell: +d.usddigitssellRate,
    },
    JPY: {
      boardTime: d.boardTime,
      cashBuy: +d.jpycashbuyRate, cashSell: +d.jpycashsellRate,
      spotBuy: +d.jpydigitsbuyRate, spotSell: +d.jpydigitssellRate,
    },
    // 英鎊只有即期，沒有現金
    GBP: {
      boardTime: d.boardTime,
      spotBuy: +d.gbpdigitsbuyRate, spotSell: +d.gbpdigitssellRate,
    },
  };

  // 防呆二：數值合理性檢查
  for (const [cur, v] of Object.entries(payload)) {
    const fields = cur === 'GBP' ? ['spotBuy', 'spotSell'] : ['cashBuy', 'cashSell', 'spotBuy', 'spotSell'];
    for (const k of fields) {
      if (!Number.isFinite(v[k]) || v[k] <= 0) {
        throw new Error(`${cur}.${k} 數值異常: ${v[k]}`);
      }
    }
    if (v.spotSell <= v.spotBuy) {
      throw new Error(`${cur} 即期買賣價邏輯異常`);
    }
    if (cur !== 'GBP' && v.cashSell <= v.cashBuy) {
      throw new Error(`${cur} 現金買賣價邏輯異常`);
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

main().catch((e) => { console.error(e); process.exit(1); });
