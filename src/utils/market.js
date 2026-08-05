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

/** 報價更新時間：週一至週五 09:00–隔日 02:00（台北時間，跨夜延續至隔天凌晨） */
export function isMarketOpen() {
  const { day, minutes } = taipeiNow();
  const isWeekdaySession = day >= 1 && day <= 5 && minutes >= 540; // 週一~週五 09:00 起
  const isOvernightContinuation = day >= 2 && day <= 6 && minutes < 120; // 延續至隔日（週二~週六）02:00 前
  return isWeekdaySession || isOvernightContinuation;
}

/** 15:30 後（含跨夜延續至隔日 02:00）資料來源改為每 5 分鐘更新，前端輪詢間隔改為每 2 分鐘；其餘開盤時間每 1 分鐘 */
export function getPollIntervalMs() {
  const { day, minutes } = taipeiNow();
  const isWeekdaySlow = day >= 1 && day <= 5 && minutes >= 930; // 週一~週五 15:30 起
  const isOvernightSlow = day >= 2 && day <= 6 && minutes < 120; // 延續至隔日 02:00 前皆為慢速更新
  return (isWeekdaySlow || isOvernightSlow) ? 120_000 : 60_000;
}
