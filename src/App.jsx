import { LiveRatePanel } from './components/LiveRatePanel';
import { HistoryChart } from './components/HistoryChart';
import { Footer } from './components/Footer';
import { useBank } from './hooks/useBank';

function App() {
  const [bank, setBank] = useBank();

  return (
    <div className="page">
      {/* key={bank}：切換銀行時重新掛載，避免前一家晚回來的資料顯示在另一家頁面 */}
      <LiveRatePanel key={bank} bank={bank} onBankChange={setBank} />
      {/* 歷史走勢圖目前只有國泰的資料 */}
      {bank === 'cathay' && <HistoryChart />}
      <Footer />
    </div>
  );
}

export default App;
