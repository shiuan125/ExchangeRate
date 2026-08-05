import admin from 'firebase-admin';

const SA = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({ credential: admin.credential.cert(SA) });
const db = admin.firestore();

/** 台北時間的日期字串 YYYY-MM-DD */
function taipeiDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(date);
}

/**
 * 台灣行事曆（國定假日／補班日）：https://github.com/ruyut/TaiwanCalendar
 * isHoliday === true 表示當天休假；false 表示上班日（含補班的週六）。
 */
async function fetchYearCalendar(year) {
  const urls = [
    `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`,
    `https://raw.githubusercontent.com/ruyut/TaiwanCalendar/master/data/${year}.json`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const list = await res.json();
      const data = {};
      for (const item of list) {
        // isHoliday 不是布林值就跳過這筆（例如上游資料缺欄位），避免 undefined 寫入 Firestore 導致整年寫入失敗
        if (typeof item.isHoliday !== 'boolean') {
          console.error(`跳過格式異常的資料：${JSON.stringify(item)}`);
          continue;
        }
        const key = `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`;
        data[key] = item.isHoliday;
      }
      return data;
    } catch {
      // 換下一個來源
    }
  }
  return null;
}

async function main() {
  const year = taipeiDateKey().slice(0, 4);
  const data = await fetchYearCalendar(year);
  if (!data) throw new Error(`TaiwanCalendar ${year} 年度資料抓取失敗（jsDelivr、raw.githubusercontent 都失敗）`);

  await db.collection('calendar').doc(year).set({
    data,
    updatedAt: new Date().toISOString(),
  });
  console.log(`calendar/${year} 已寫入，共 ${Object.keys(data).length} 天`);
}

main().catch((e) => { console.error(e); process.exit(1); });
