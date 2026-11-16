import { LiveRatePanel } from './components/LiveRatePanel';
import { HistoryChart } from './components/HistoryChart';
import { Footer } from './components/Footer';
import { useBank } from './hooks/useBank';

function App() {
  const [bank, setBank] = useBank();

  return (
    <div className="page">
      {/* 切換銀行時重新掛載，避免前一家晚回來的資料顯示在另一家頁面。
          兩個兄弟元件的 key 必須不同：重複的 key 會讓 React 對錯元件，留下舊銀行的面板 */}
      <LiveRatePanel key={`panel-${bank}`} bank={bank} onBankChange={setBank} />
      <HistoryChart key={`chart-${bank}`} bank={bank} />
      <Footer />
    </div>
  );
}

export default App;
