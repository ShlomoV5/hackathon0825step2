import { useState } from 'react';
import './App.css';
import TimeButtons from './components/TimeButtons';
import KpiGrid from './components/KpiGrid';
import ChartsDashboard from './components/ChartsDashboard';
import ResultsTable from './components/ResultsTable';
import FloatingBox from './components/FloatingBox';
import LeadsBox from './components/LeadsBox';
import Onboarding from './components/Onboarding';
import FullscreenModal from './components/FullscreenModal';

function App() {
  const [onbOpen, setOnbOpen] = useState(false);

  return (
    <div className="app">
      <header>
        דאשבורד מכירות AI
        <button className="btn onb-launch" onClick={() => setOnbOpen(true)}>
          התחלת קליטת לקוח <span className="arrow">←</span>
        </button>
      </header>

      <TimeButtons />

      {/* First: KPIs */}
      <section className="kpis-row">
        <KpiGrid />
      </section>

      {/* Second: Calls (left/RTL) + Charts (right) */}
      <section className="panel dashboard-box">
        <div className="dashboard-grid">
          <div className="list"><ResultsTable /></div>
          <div className="charts"><ChartsDashboard /></div>
        </div>
      </section>

      {/* Floating boxes */}
      <FloatingBox />        {/* left: project data (existing) */}
      <LeadsBox />    {/* right: leads box */}

      {/* Fullscreen Onboarding Modal */}
      <FullscreenModal open={onbOpen} onClose={() => setOnbOpen(false)} title="קליטת לקוח">
        <Onboarding />
      </FullscreenModal>
    </div>
  );
}

export default App;