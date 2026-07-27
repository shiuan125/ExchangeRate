/** 取得當前台北時間的 { day, minutes } */
function taipeiNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: dayMap[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** 報價更新時間：週一至週五 09:00–15:31（台北時間） */
export function isMarketOpen() {
  const { day, minutes } = taipeiNow();
  return day >= 1 && day <= 5 && minutes >= 540 && minutes <= 931;
}

/**
 * 盤後收盤資料是否已同步完成可讀取。
 * 收盤（15:31）到 GAS 完成同步前有落差，需等到 15:35 才去讀 Firestore 的收盤價；
 * 非交易日或隔天開盤前，前一交易日的收盤資料早已同步完成，隨時可讀取。
 */
export function isClosingDataReady() {
  const { day, minutes } = taipeiNow();
  if (day === 0 || day === 6) return true;
  return minutes >= 935 || minutes < 540;
}
