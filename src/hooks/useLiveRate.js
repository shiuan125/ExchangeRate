import { useState, useEffect, useRef } from 'react';
import { isMarketOpen } from '../utils/market';

export function useLiveRate() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;

    const fetchRate = async () => {
      try {
        const r = await fetch('/api/rate');
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (alive) { setData(j); setError(null); }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    };

    const schedule = () => {
      clearInterval(timer.current);
      // 更新時段內 60 秒輪詢；時段外 10 分鐘一次即可
      const interval = isMarketOpen() ? 60_000 : 600_000;
      timer.current = setInterval(() => {
        if (document.visibilityState === 'visible') fetchRate();
      }, interval);
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
