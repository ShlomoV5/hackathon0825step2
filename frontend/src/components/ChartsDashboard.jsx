import { useEffect, useState } from 'react';
import { apiGet } from '../api';
import ChartCard from './ChartCard';

/**
 * ChartsDashboard
 * Loads line (calls-per-day) and pie (call-results) charts for selected range.
 */
export default function ChartsDashboard() {
  const [lineData, setLineData] = useState({ labels: [], datasets: [] });
  const [pieData, setPieData] = useState({ labels: [], datasets: [] });

  async function load(from, to) {
    const [perDay, results] = await Promise.all([
      apiGet('/api/metrics/calls-per-day', { from, to }),
      apiGet('/api/metrics/call-results', { from, to }),
    ]);

    setLineData({
      labels: (perDay.series || []).map(p => p.date.slice(5)), // MM-DD
      datasets: [{
        label: 'שיחות',
        data: (perDay.series || []).map(p => p.value),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25,118,210,0.2)',
        fill: true
      }]
    });

    const labelMap = { answered: 'נענו', no_answer: 'לא נענו', voicemail: 'משיבון', bad_number: 'מספר שגוי' };
    setPieData({
      labels: (results.breakdown || []).map(b => labelMap[b.label] || b.label),
      datasets: [{
        data: (results.breakdown || []).map(b => b.value),
        backgroundColor: ['#4caf50', '#2196f3', '#9e9e9e', '#ff9800', '#ab47bc']
      }]
    });
  }

  useEffect(() => {
    let mounted = true;
    apiGet('/api/time-periods/presets', { tz: 'Asia/Jerusalem' })
      .then(p => mounted && load(p.presets.thisWeek.from, p.presets.thisWeek.to))
      .catch(console.error);
    const handler = (e) => load(e.detail?.from, e.detail?.to);
    window.addEventListener('range:change', handler);
    return () => { mounted = false; window.removeEventListener('range:change', handler); };
  }, []);

  return (
    <div className="main-content">
      <ChartCard title="גרף שיחות" type="line" data={lineData} />
      <ChartCard title="חלוקת תוצאות שיחה" type="pie" data={pieData} />
    </div>
  );
}
