/**
 * 包一層記憶體快取：同一個 key 在 ttlMs 內只呼叫一次 loader，同時進來的呼叫共用同一個 Promise。
 * 失敗不快取，下次呼叫會重試。
 * @template T
 * @param {(key: string) => Promise<T>} loader
 * @param {number} ttlMs
 * @param {() => number} [now] 測試用，預設 Date.now
 * @returns {(key: string) => Promise<T>}
 */
export function createCachedLoader(loader, ttlMs, now = Date.now) {
  const entries = new Map();

  return (key) => {
    const hit = entries.get(key);
    if (hit && now() - hit.at <= ttlMs) return hit.promise;

    const promise = loader(key);
    entries.set(key, { promise, at: now() });
    promise.catch(() => {
      if (entries.get(key)?.promise === promise) entries.delete(key);
    });
    return promise;
  };
}
