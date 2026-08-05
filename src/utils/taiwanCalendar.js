/**
 * 台灣行事曆（國定假日／補班日）。原始資料來源 https://github.com/ruyut/TaiwanCalendar，
 * 由 scripts/sync-calendar.js 排程每天寫進 Firestore（calendar/{year}），
 * 前端只讀 Firestore，不直接打外部 API，避免每個使用者各自打一次。
 * isHoliday === true 表示當天休假（含週末、國定假日）；false 表示上班日（含補班的週六）。
 */
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { taipeiToday } from './date';

const CACHE_KEY = 'tw-calendar-v1';
const RETRY_INTERVAL_MS = 5 * 60_000; // 抓取失敗後至少間隔 5 分鐘才重試，避免每次輪詢都打一次

function readPersistedCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // localStorage 不可用（例如無痕模式關閉儲存）
  }
}

function writePersistedCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 持久化失敗沒關係，記憶體快取（memoryCache）已經是對的，這個 session 不會受影響，
    // 只是下次重新整理／開新分頁時要重抓一次
  }
}

// 記憶體快取：只在 module 載入時讀一次 localStorage，之後 isMarketOpen() 都只碰這個變數，
// 不會每次呼叫都重新 JSON.parse 一整年的行事曆資料
let memoryCache = readPersistedCache();
let fetchInFlight = false;
let lastFailedAt = 0;

function isFresh(cache) {
  return cache?.fetchedAt === taipeiToday();
}

async function fetchYearCalendar(year) {
  try {
    const snap = await getDoc(doc(db, 'calendar', year));
    if (!snap.exists()) return null;
    const data = snap.data()?.data;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null; // Firestore 讀取失敗（離線、規則變動等）
  }
}

/**
 * 讀取「記憶體快取裡」今天是否為假日，純同步、不發任何請求、不碰 localStorage。
 * 快取不是今天的資料、或根本沒有快取時回傳 null（呼叫端要自行 fallback）。
 */
export function readTodayHolidayFlagSync() {
  if (!isFresh(memoryCache)) return null;
  const todayKey = taipeiToday();
  const flag = memoryCache.data?.[todayKey];
  return typeof flag === 'boolean' ? flag : null;
}

/**
 * 如果今天的行事曆記憶體快取還不是最新的，背景非同步抓一次（fire-and-forget，不阻塞呼叫端）。
 * 「今天抓過了沒」只看記憶體是否新鮮，不依賴 localStorage 是否寫入成功——
 * 就算 localStorage 滿了或被停用，這次 session 內也只會真正打一次網路請求，不會每次呼叫都重抓。
 * 失敗的話至少間隔 5 分鐘才會重試。
 */
export function refreshHolidayCalendarIfNeeded() {
  if (isFresh(memoryCache)) return;
  if (fetchInFlight) return;
  if (Date.now() - lastFailedAt < RETRY_INTERVAL_MS) return;

  fetchInFlight = true;
  const todayKey = taipeiToday();
  const year = todayKey.slice(0, 4);
  fetchYearCalendar(year)
    .then((data) => {
      if (data) {
        memoryCache = { year, fetchedAt: todayKey, data };
        writePersistedCache(memoryCache); // 盡量持久化；失敗也沒關係，記憶體已經是最新的
      } else {
        lastFailedAt = Date.now();
      }
    })
    .catch(() => {
      lastFailedAt = Date.now();
    })
    .finally(() => {
      fetchInFlight = false;
    });
}
