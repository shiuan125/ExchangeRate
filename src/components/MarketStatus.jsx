import { parseBoardTime, minutesSince } from '../utils/boardTime';
import { isMarketOpen } from '../utils/market';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { taipeiToday } from '../utils/date';

export function MarketStatus({ boardTime, fetching }) {
  const online = useOnlineStatus();
  const open = isMarketOpen();
  const parsed = boardTime ? parseBoardTime(boardTime) : null;
  const stale = open && parsed && minutesSince(parsed.ts) > 15;

  let statusClass = 'closed';
  let label = '盤後';
  if (!online) {
    statusClass = 'offline';
    label = '網路中斷';
  } else if (fetching) {
    statusClass = 'live';
    label = '更新中';
  } else if (stale) {
    statusClass = 'stale';
    label = '資料延遲';
  } else if (open) {
    statusClass = 'live';
    label = '即時';
  }

  // 膠囊只放時間：今天的報價只顯示「16:00」，不是今天（週末、連假）才加上月日
  const isToday = parsed && parsed.dateKey === taipeiToday();
  const shortTime = parsed
    ? (isToday ? boardTime.slice(11, 16) : `${boardTime.slice(5, 10)} ${boardTime.slice(11, 16)}`)
    : '';
  const fullTime = parsed ? `${open ? '報價時間' : '最後報價'} ${boardTime.slice(0, -3)}` : '';

  return (
    <span className="status-chip" title={fullTime || undefined}>
      <span className={`status-dot status-dot--${statusClass}`} />
      {label}
      {shortTime && <span className="status-chip-time num">{shortTime}</span>}
      {fullTime && <span className="sr-only">，{fullTime}</span>}
    </span>
  );
}
