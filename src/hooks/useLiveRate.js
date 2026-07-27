import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isMarketOpen, isClosingDataReady } from '../utils/market';

/** 即時報價：GAS 定時寫入的 cathaybk/realtime，不再直接打外部匯率 API */
async function fetchFromRealtime() {
  const snap = await getDoc(doc(db, 'cathaybk', 'realtime'));
  if (!snap.exists()) throw new Error('Firestore 尚無即時資料');
  const d = snap.data();

  return {
    boardTime: d.boardTime,
    usd: {
      cash: { buy: +d.usdcashbuyRate, sell: +d.usdcashsellRate },
      spot: { buy: +d.usddigitsbuyRate, sell: +d.usddigitssellRate },
    },
    jpy: {
      cash: { buy: +d.jpycashbuyRate, sell: +d.jpycashsellRate },
      spot: { buy: +d.jpydigitsbuyRate, sell: +d.jpydigitssellRate },
    },
    fetchedAt: new Date().toISOString(),
  };
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
  const [fetching, setFetching] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;

    const fetchRate = async () => {
      const marketOpen = isMarketOpen();
      if (!marketOpen && !isClosingDataReady()) {
        // 收盤後到 15:35 前，GAS 尚未同步完成收盤價，暫不讀取，維持現有資料
        return;
      }
      if (alive) setFetching(true);
      try {
        const j = marketOpen ? await fetchFromRealtime() : await fetchFromFirestore();
        if (alive) { setData(j); setError(null); }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) { setLoading(false); setFetching(false); }
      }
    };

    const schedule = () => {
      clearInterval(timer.current);
      if (isMarketOpen()) {
        timer.current = setInterval(() => {
          if (document.visibilityState === 'visible') fetchRate();
        }, 60_000);
        return;
      }
      if (!isClosingDataReady()) {
        // 尚未到 15:35，短間隔重試直到收盤資料同步完成
        timer.current = setInterval(() => {
          if (document.visibilityState === 'visible') fetchRate();
          if (isClosingDataReady()) schedule();
        }, 30_000);
        return;
      }
      // 收盤後資料一天只同步一次，不需要輪詢；等分頁重新可見時再補抓
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

  return { data, error, loading, fetching };
}
