import { readTodayHolidayFlagSync, refreshHolidayCalendarIfNeeded } from './taiwanCalendar';

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

/**
 * 報價更新時間：09:00–16:00（台北時間）。交易日判斷優先用台灣行事曆（含國定假日、補班日，
 * 資料來源見 taiwanCalendar.js），抓不到資料時 fallback 用週末（週六、週日）為休市基準。
 */
export function isMarketOpen() {
  refreshHolidayCalendarIfNeeded(); // 背景非同步更新今天的行事曆快取，不阻塞這次判斷
  const { day, minutes } = taipeiNow();
  const holiday = readTodayHolidayFlagSync();
  const isBusinessDay = holiday === null ? (day >= 1 && day <= 5) : !holiday;
  return isBusinessDay && minutes >= 540 && minutes <= 960;
}
