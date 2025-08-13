import './App.css';
import TimeButtons from './components/TimeButtons';
import KpiGrid from './components/KpiGrid';
import ChartCard from './components/ChartCard';
import ResultsTable from './components/ResultsTable';
import FloatingBox from './components/FloatingBox';
import CallActions from './components/CallActions';

function App() {
  return (
    <div className="app">
      <header>דאשבורד מכירות AI</header>
      <TimeButtons />
      <div className="layout-row">
        <KpiGrid />
        <CallActions />
      </div>
      <div className="main-content">
        <ChartCard
          title="גרף שיחות (7 ימים)"
          type="line"
          data={{
            labels: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
            datasets: [{
              label: 'שיחות',
              data: [5, 12, 9, 15, 7, 18, 10],
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              fill: true
            }]
          }}
        />
        <ChartCard
          title="חלוקת תוצאות שיחה"
          type="pie"
          data={{
            labels: ['נסגר', 'חם', 'לא ענה', 'לא רלוונטי'],
            datasets: [{
              data: [12, 7, 5, 3],
              backgroundColor: ['#4caf50', '#2196f3', '#9e9e9e', '#ff9800']
            }]
          }}
        />
        <ResultsTable />
      </div>
      <FloatingBox />
    </div>
  );
}

export default App;
