import { useRef, useState, useEffect } from 'react';

/** 數值變動時回傳 true 一小段時間，用來觸發翻牌動畫 */
export function useFlip(value) {
  const prev = useRef(value);
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (prev.current !== value) {
      setFlip(true);
      prev.current = value;
      const t = setTimeout(() => setFlip(false), 340);
      return () => clearTimeout(t);
    }
  }, [value]);
  return flip;
}
