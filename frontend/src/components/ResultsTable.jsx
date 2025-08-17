/**
 * ResultsTable Component
 * Loads recent calls for the selected date range (falls back to static if API not available).
 */
import { useEffect, useState } from 'react';
import { apiGet } from '../api'; // when bundled at project root

function ResultsTable() {
  const [rows, setRows] = useState(null);

  async function load(from, to) {
    try {
      const json = await apiGet('/api/calls', { from, to, limit: 5 });
      const mapped = (json.items || []).map(it => ({
        name: it.clientName || it.clientId || 'לקוח',
        time: new Date(it.ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        result: it.result,
        color: it.result === 'answered' ? 'green' : it.result === 'voicemail' ? 'orange' : '#607d8b',
        rating: '☆☆☆☆☆'
      }));
      setRows(mapped);
    } catch (e) {
      // Fallback to previous static example
      setRows([
        { name: 'דוד כהן', time: '10:15', result: 'נסגר', color: 'green', rating: '★★★★☆' },
        { name: 'שרה לוי', time: '11:00', result: 'חם', color: 'blue', rating: '★★★☆☆' },
        { name: 'אבי ישראלי', time: '12:30', result: 'לא ענה', color: 'gray', rating: '☆☆☆☆☆' }
      ]);
    }
  }

  useEffect(() => {
    let mounted = true;
    // initial: try thisWeek
    fetch('/api/time-periods/presets').then(r=>r.json()).then(p => {
      if (!mounted) return;
      const sel = p.presets?.thisWeek || p.presets?.today;
      load(sel?.from, sel?.to);
    }).catch(()=> load());
    const handler = (e) => load(e.detail?.from, e.detail?.to);
    window.addEventListener('range:change', handler);
    return () => { mounted = false; window.removeEventListener('range:change', handler); };
  }, []);

  const data = rows || [];

  return (
    <div className="table">
      <h3>תוצאות שיחות אחרונות</h3>
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>שעה</th>
            <th>תוצאה</th>
            <th>דירוג</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td>{r.time}</td>
              <td style={{ color: r.color }}>{r.result}</td>
              <td>{r.rating}</td>
              <td><button>צפה</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default ResultsTable;
