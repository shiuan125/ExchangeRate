import { LiveRatePanel } from './components/LiveRatePanel';
import { HistoryChart } from './components/HistoryChart';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="page">
      <LiveRatePanel />
      <HistoryChart />
      <Footer />
    </div>
  );
}

export default App;
