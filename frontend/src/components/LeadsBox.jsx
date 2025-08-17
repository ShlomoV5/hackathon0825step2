import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

export default function LeadsBox() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [rawData, setRawData] = useState(null);

  async function load() {
    const data = await apiGet('/api/onboarding/submissions');
    setRows((data.items || []).slice().reverse()); // newest first
  }

  async function addExample() {
    setBusy(true);
    try {
      await apiPost('/api/onboarding/seed?count=1');
      await load();
      setOpen(true);
    } finally { setBusy(false); }
  }

  async function callLead(row) {
    try {
      await apiPost('/api/agent/call-lead', { leadId: row.id });
    } catch {}
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="leads-floating">
      <div className="leads-header" onClick={() => setOpen(!open)} role="button" aria-expanded={open}>
        <span className="title">לידים</span>
        <span className="caret" aria-hidden>{open ? '▴' : '▾'}</span>
      </div>

      {open && (
        <div className="leads-body">
          <div className="leads-actions">
            <button className="btn add" onClick={addExample} disabled={busy}>הוסף ליד לדוגמה</button>
          </div>
          <div className="leads-table">
            <table>
              <thead>
                <tr>
                  <th>שם</th><th>טלפון</th><th>אימייל</th><th>חברה</th>
                  <th>ענף</th><th>תקציב</th><th>כוונה</th><th>הערות</th><th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(rows || []).map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td dir="ltr">{r.phone || '—'}</td>
                    <td dir="ltr">{r.email || '—'}</td>
                    <td>{r.company || '—'}</td>
                    <td>{r.industry || '—'}</td>
                    <td>{typeof r.budget === 'number' ? `₪ ${r.budget.toLocaleString('he-IL')}` : '—'}</td>
                    <td>{r.intent || '—'}</td>
                    <td className="notes">{r.notes || '—'}</td>
                    <td><button className="btn call" onClick={() => callLead(r)}>התקשר</button></td>
                    <td>
                      <button 
                        className="btn"
                        onMouseDown={() => setRawData(r)}
                        onMouseUp={() => setRawData(null)}
                        onMouseLeave={() => setRawData(null)}
                      >
                        Raw
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rawData && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          border: '1px solid black',
          zIndex: 1000
        }}>
          <pre>{JSON.stringify(rawData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}