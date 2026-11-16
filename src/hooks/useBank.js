import { useState, useEffect, useCallback } from 'react';
import { bankFromHash, hashForBank } from '../utils/bank';

/** 目前顯示的銀行，以 URL hash 記住（#sinopac = 永豐，無 hash = 國泰） */
export function useBank() {
  const [bank, setBankState] = useState(() => bankFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setBankState(bankFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setBank = useCallback((next) => {
    const { pathname, search } = window.location;
    // replaceState 不會觸發 hashchange，也不會多一筆上一頁紀錄
    window.history.replaceState(null, '', pathname + search + hashForBank(next));
    setBankState(next);
  }, []);

  return [bank, setBank];
}
