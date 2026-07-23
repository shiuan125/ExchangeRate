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
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[w];
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
      cashBuy: +d.usdcashbuyRate, cashSell: +d.usdcashsellRate,
      spotBuy: +d.usddigitsbuyRate, spotSell: +d.usddigitssellRate,
    },
    JPY: {
      boardTime: d.boardTime,
      cashBuy: +d.jpycashbuyRate, cashSell: +d.jpycashsellRate,
      spotBuy: +d.jpydigitsbuyRate, spotSell: +d.jpydigitssellRate,
    },
  };

  // 防呆二：數值合理性檢查
  for (const [cur, v] of Object.entries(payload)) {
    for (const k of ['cashBuy', 'cashSell', 'spotBuy', 'spotSell']) {
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

main().catch((e) => { console.error(e); process.exit(1); });
