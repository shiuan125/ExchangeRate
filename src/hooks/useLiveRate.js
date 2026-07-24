import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isMarketOpen, isSyncPending } from '../utils/market';

/** 開盤中，或收盤後 Firestore 同步尚未完成：都要直接打 API 才拿得到最新報價 */
function shouldUseLiveApi() {
  return isMarketOpen() || isSyncPending();
}

async function fetchFromApi() {
  const r = await fetch('/api/rate');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** 取得目前台北時間所屬年份 */
function taipeiYear() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', year: 'numeric',
  }).format(new Date());
}

/** 從 Firestore 讀出某幣別最近一筆已同步的收盤資料 */
async function fetchLatestFromFirestore(currency, year) {
  const snap = await getDoc(doc(db, 'rates', `${currency}_${year}`));
  const entries = snap.exists() ? snap.data() : null;
  if (!entries) return null;
  const latestKey = Object.keys(entries).sort().at(-1);
  return latestKey ? entries[latestKey] : null;
}

/** 盤後直接讀 Firestore 已同步的收盤價，不再打外部匯率 API */
async function fetchFromFirestore() {
  const year = taipeiYear();
  const [usd, jpy] = await Promise.all([
    fetchLatestFromFirestore('USD', year),
    fetchLatestFromFirestore('JPY', year),
  ]);
  if (!usd || !jpy) throw new Error('Firestore 尚無同步資料');

  return {
    boardTime: usd.boardTime,
    usd: {
      cash: { buy: usd.cashBuy, sell: usd.cashSell },
      spot: { buy: usd.spotBuy, sell: usd.spotSell },
    },
    jpy: {
      cash: { buy: jpy.cashBuy, sell: jpy.cashSell },
      spot: { buy: jpy.spotBuy, sell: jpy.spotSell },
    },
    fetchedAt: new Date().toISOString(),
  };
}

export function useLiveRate() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;

    const fetchRate = async () => {
      try {
        const j = shouldUseLiveApi() ? await fetchFromApi() : await fetchFromFirestore();
        if (alive) { setData(j); setError(null); }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    };

    const schedule = () => {
      clearInterval(timer.current);
      // 完全休市時資料一天只同步一次，不需要輪詢；等分頁重新可見時再補抓
      // 收盤後的同步空窗期（isSyncPending）仍要輪詢 API，才能追到今天最後一筆報價
      if (!shouldUseLiveApi()) return;
      timer.current = setInterval(() => {
        if (document.visibilityState === 'visible') fetchRate();
      }, 60_000);
    };

    fetchRate();
    schedule();

    // 分頁重新可見時立刻補抓一次
    const onVisible = () => {
      if (document.visibilityState === 'visible') { fetchRate(); schedule(); }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { data, error, loading };
}
