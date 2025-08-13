import { useState } from 'react';

export default function CallActions() {
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text: string }

  const callTest = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/call/test', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setMsg({ type: 'ok', text: `Simulated: ${json.status || 'ok'} (SID: ${json.callSid || '—'})` });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const callLive = async () => {
    if (!to) return setMsg({ type: 'err', text: 'נא להזין מספר יעד' });
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/call/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setMsg({ type: 'ok', text: `Queued: ${json.status || 'queued'} (SID: ${json.callSid || '—'})` });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="actions-card" dir="rtl">
      <h3>פעולות שיחה</h3>

      <div className="actions-row">
        <button className="btn primary" onClick={callTest} disabled={busy}>
          {busy ? 'ממתין…' : 'בדיקת שיחה (ללא חיוב)'}
        </button>
      </div>

      <div className="actions-row">
        <input
          className="input"
          type="tel"
          placeholder="+9725XXXXXXXX"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          dir="ltr"
        />
        <button className="btn" onClick={callLive} disabled={busy}>
          שיחה אמיתית
        </button>
      </div>

      {msg && (
        <div className={`note ${msg.type === 'ok' ? 'ok' : 'err'}`}>
          {msg.text}
        </div>
      )}

      <p className="hint">שיחת בדיקה משתמשת ב־Test Credentials ואינה מחויבת. שיחה אמיתית מחייבת קרדיט.</p>
    </div>
  );
}
