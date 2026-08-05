import { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isMarketOpen, getPollIntervalMs } from '../utils/market';

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
    // 英鎊只有即期，沒有現金
    gbp: {
      spot: { buy: +d.gbpdigitsbuyRate, sell: +d.gbpdigitssellRate },
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
  const [usd, jpy, gbp] = await Promise.all([
    fetchLatestFromFirestore('USD', year),
    fetchLatestFromFirestore('JPY', year),
    fetchLatestFromFirestore('GBP', year),
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
    gbp: gbp ? { spot: { buy: gbp.spotBuy, sell: gbp.spotSell } } : null,
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

    const runFetch = async (source) => {
      if (alive) setFetching(true);
      try {
        const j = await source();
        if (alive) { setData(j); setError(null); }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) { setLoading(false); setFetching(false); }
      }
    };

    const fetchRate = async () => {
      const marketOpen = isMarketOpen();
      if (marketOpen) return runFetch(fetchFromRealtime);
      return runFetch(fetchFromFirestore);
    };

    // 用遞迴 setTimeout 而非固定 setInterval，讓輪詢間隔能隨時段（15:30 後變慢）動態調整
    const schedule = () => {
      clearTimeout(timer.current);
      if (!isMarketOpen()) return; // 收盤後資料一天只同步一次，不需要輪詢；等分頁重新可見時再補抓

      timer.current = setTimeout(async () => {
        if (document.visibilityState === 'visible') await fetchRate();
        if (alive) schedule(); // 避免 unmount 後（fetchRate 期間卸載）仍持續排下一輪
      }, getPollIntervalMs());
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
      clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { data, error, loading, fetching };
}
