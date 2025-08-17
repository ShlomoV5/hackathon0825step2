import { useEffect, useState } from 'react';
import Kpi from './Kpi';
import { apiGet } from '../api';

function KpiGrid() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | error

  async function load(from, to) {
    setStatus('loading');
    try {
      const json = await apiGet('/api/kpis', { from, to });
      setData(json.kpis);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  useEffect(() => {
    let mounted = true;
    // initial: try thisWeek
    apiGet('/api/time-periods/presets', { tz: 'Asia/Jerusalem' })
      .then(p => {
        if (!mounted) return;
        const sel = p.presets?.thisWeek || p.presets?.today;
        load(sel?.from, sel?.to);
      })
      .catch(()=> load());

    const handler = (e) => load(e.detail?.from, e.detail?.to);
    window.addEventListener('range:change', handler);
    return () => { mounted = false; window.removeEventListener('range:change', handler); };
  }, []);

  if (status === 'loading') {
    return (
      <section className="kpi-container">
        <Kpi label="שיחות" value="..." />
        <Kpi label="אחוזי הצלחה" value="..." />
        <Kpi label="לידים חדשים" value="..." />
        <Kpi label="משך שיחה ממוצע" value="..." />
      </section>
    );
  }

  if (status === 'error' || !data) {
    return (
      <section className="kpi-container">
        <Kpi label="שגיאה בטעינת נתונים" value="—" />
        <Kpi label="אחוזי הצלחה" value="—" />
        <Kpi label="לידים חדשים" value="—" />
        <Kpi label="משך שיחה ממוצע" value="—" />
      </section>
    );
  }

  const { totalCalls = 0, answerRatePct = 0, leads = 0, avgCallDuration = '00:00' } = data;

  return (
    <section className="kpi-container">
      <Kpi label="שיחות" value={String(totalCalls)} />
      <Kpi label="אחוזי הצלחה" value={`${answerRatePct}%`} />
      <Kpi label="לידים חדשים" value={String(leads)} />
      <Kpi label="משך שיחה ממוצע" value={avgCallDuration} />
    </section>
  );
}

export default KpiGrid;