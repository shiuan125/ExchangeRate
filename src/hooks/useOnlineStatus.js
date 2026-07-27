import { useState, useEffect } from 'react';

/** 瀏覽器網路連線狀態，跟著 online/offline 事件即時更新 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const setOn = () => setOnline(true);
    const setOff = () => setOnline(false);
    window.addEventListener('online', setOn);
    window.addEventListener('offline', setOff);
    return () => {
      window.removeEventListener('online', setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);

  return online;
}
