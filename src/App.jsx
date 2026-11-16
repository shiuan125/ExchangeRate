import { LiveRatePanel } from './components/LiveRatePanel';
import { HistoryChart } from './components/HistoryChart';
import { Footer } from './components/Footer';
import { useBank } from './hooks/useBank';

function App() {
  const [bank, setBank] = useBank();

  return (
    <div className="page">
      {/* 即時面板切換銀行時重新掛載，避免前一家晚回來的資料顯示在另一家頁面 */}
      <LiveRatePanel key={`panel-${bank}`} bank={bank} onBankChange={setBank} />
      {/* 走勢圖不重新掛載，保留幣別／即期現金／區間設定；舊資料由 useRateHistory 擋掉 */}
      <HistoryChart bank={bank} />
      <Footer />
    </div>
  );
}

export default App;
