import { useEffect, useState } from 'react';
import Kpi from './Kpi';
import { apiGet } from '../api';

function KpiGrid() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | error

  useEffect(() => {
    let mounted = true;
    setStatus('loading');
    apiGet('/api/kpi')
      .then((json) => {
        if (mounted) {
          setData(json);
          setStatus('idle');
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setStatus('error');
      });
    return () => { mounted = false; };
  }, []);

  if (status === 'loading') {
    return (
      <section className="kpi-container">
        <Kpi label="שיחות היום" value="…" />
        <Kpi label="אחוזי הצלחה" value="…" />
        <Kpi label="לידים חדשים" value="…" />
        <Kpi label="משך שיחה ממוצע" value="…" />
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

  // Map backend fields → KPIs you already display
  const { callsToday = 52, successRate = 38, leads = 17, avgCallDuration = '03:12' } = data;

  return (
    <section className="kpi-container">
      <Kpi label="שיחות היום" value={String(callsToday)} />
      <Kpi label="אחוזי הצלחה" value={`${successRate}%`} />
      <Kpi label="לידים חדשים" value={String(leads)} />
      <Kpi label="משך שיחה ממוצע" value={avgCallDuration} />
    </section>
  );
}

export default KpiGrid;
