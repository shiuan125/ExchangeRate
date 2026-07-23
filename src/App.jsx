import { LiveRatePanel } from './components/LiveRatePanel';
import { HistoryChart } from './components/HistoryChart';

function App() {
  return (
    <div className="page">
      <LiveRatePanel />
      <HistoryChart />
    </div>
  );
}

export default App;
