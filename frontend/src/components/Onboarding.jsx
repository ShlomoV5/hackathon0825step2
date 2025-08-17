import { useEffect, useRef, useState } from 'react';
import { apiPost } from '../api';
import './Onboarding.css';

const INDUSTRIES = [
  'מגורים', 'משרדים', 'מסחר/קמעונאות', 'תעשייה/לוגיסטיקה',
  'אירוח/מלונאות', 'בריאות', 'מולטיפמילי', 'נתונים/דאטה-סנטרים',
  'קרקע/פיתוח', 'שימוש מעורב', 'אחר...'
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('website'); // 'website' | 'manual'
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  // structured fields + notes
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [budget, setBudget] = useState(250000);
  const [intent, setIntent] = useState('לקנייה');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // AI suggestions (website mode)
  const [parsed, setParsed] = useState(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState('');
  const debounceRef = useRef(null);

  function next() { setStep(s => Math.min(s + 1, totalSteps - 1)); }
  function prev() { setStep(s => Math.max(0, s - 1)); }

  // Auto-parse when website changes (debounced)
  useEffect(() => {
    if (mode !== 'website') return;
    if (!website || website.trim().length < 5) {
      setParsed(null); setParseError(''); setParseLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setParseLoading(true); setParseError('');
      try {
        const res = await apiPost('/api/ai/extract', { website });
        setParsed(res || null);
      } catch {
        setParsed(null); setParseError('נכשלה קריאת פרטי האתר');
      } finally { setParseLoading(false); }
    }, 450);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [mode, website]);

  async function submit() {
    setBusy(true); setErr('');
    try {
      const payload = {
        name, email, phone,
        website: mode === 'website' ? website : '',
        company: mode === 'manual' ? company : null,
        industry,
        budget,
        intent,
        location,
        notes
      };
      await apiPost('/api/onboarding/submissions', payload);
      setBusy(false);
      setDone(true);
    } catch (e) {
      setBusy(false);
      setErr(e.message || 'שגיאה בשליחה');
    }
  }

  // validation per step
  const canNext = (() => {
    if (step === 0) return !!name.trim();
    if (step === 1) return !!(email.trim() || phone.trim()); // at least one
    if (step === 2) return true; // mode pick
    if (mode === 'website') {
      if (step === 3) return !!website.trim();
      if (step === 4) return true; // notes optional
    } else {
      if (step === 3) return !!company.trim();
      if (step === 4) return !!industry;
      if (step === 5) return true; // budget ok
      if (step === 6) return !!intent;
      if (step === 7) return !!location.trim();
      if (step === 8) return true; // notes optional
    }
    return true;
  })();

  // --- Steps ---
  const stepsWebsite = [
    <Step key="name" title="שם מלא" value={name} onChange={setName} placeholder="ישראל ישראלי" />,
    <StepContact key="contact" email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} />,
    <ModeStep key="mode" mode={mode} setMode={setMode} />,
    <WebsiteStep
      key="website" website={website} setWebsite={setWebsite}
      parsed={parsed} parseLoading={parseLoading} parseError={parseError}
      applyAI={() => {
        if (parsed?.industry) setIndustry(parsed.industry);
        if (parsed?.intent) setIntent(parsed.intent);
        if (parsed?.budget) setBudget(Number(parsed.budget));
      }}
    />,
    <NotesStep key="notes" notes={notes} setNotes={setNotes} />,
    <ReviewStep
      key="review"
      mode={mode}
      values={{ name, email, phone, website, industry, budget, intent, notes }}
    />,
  ];

  const stepsManual = [
    <Step key="name" title="שם מלא" value={name} onChange={setName} placeholder="ישראל ישראלי" />,
    <StepContact key="contact" email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} />,
    <ModeStep key="mode" mode={mode} setMode={setMode} />,
    <Step key="company" title="שם החברה" value={company} onChange={setCompany} placeholder="חברת נדל״ן בע״מ" />,
    <SelectStep key="industry" title="ענף" value={industry} onChange={setIndustry} options={INDUSTRIES} />,
    <RangeStep key="budget" title="תקציב משוער" value={budget} onChange={setBudget} min={50000} max={5000000} step={50000} />,
    <SelectStep key="intent" title="כוונה" value={intent} onChange={setIntent} options={['לקנייה','לשכירות']} />,
    <Step key="location" title="אזור מועדף" value={location} onChange={setLocation} placeholder="עיר / אזור" />,
    <NotesStep key="notes" notes={notes} setNotes={setNotes} />,
    <ReviewStep
      key="review"
      mode={mode}
      values={{ name, email, phone, company, industry, budget, intent, location, notes }}
    />,
  ];

  const activeList = mode === 'website' ? stepsWebsite : stepsManual;
  const totalSteps = activeList.length;

  if (done) {
    return (
      <div className="onb">
        <div className="onb-bg" />
        <div className="onb-card fade-in">
          <h2>תודה! קיבלנו את הפרטים</h2>
          <p>ניצור איתך קשר בהקדם.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onb">
      <div className="onb-bg" />
      <div className="onb-card fade-in">
        <ProgressDots current={step} total={totalSteps} />
        {activeList[step]}
        {err && <div className="onb-error">{err}</div>}

        <div className="onb-actions">
          {step > 0 && (
            <button className="btn ghost" onClick={prev} disabled={busy}>חזרה</button>
          )}
          {step < totalSteps - 1 ? (
            <button className="btn next" onClick={next} disabled={!canNext || busy}>
              הבא <span className="arrow">→</span>
            </button>
          ) : (
            <button className="btn submit" onClick={submit} disabled={!canNext || busy}>
              שלח <span className="arrow">✓</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */
function Step({ title, value, onChange, placeholder, dir='rtl' }) {
  return (
    <>
      <h2 className="onb-title">{title}</h2>
      <input className="onb-input" dir={dir} value={value}
             onChange={e=>onChange(e.target.value)} placeholder={placeholder} />
    </>
  );
}

function StepContact({ email, setEmail, phone, setPhone }) {
  return (
    <>
      <h2 className="onb-title">אימייל ומספר טלפון</h2>
      <input className="onb-input" dir="ltr" type="email"
             value={email} onChange={e=>setEmail(e.target.value)}
             placeholder="name@example.com" />
      <input className="onb-input" dir="ltr" type="tel"
             value={phone} onChange={e=>setPhone(e.target.value)}
             placeholder="+972-5X-XXXXXXX" />
      <div className="onb-hint">אפשר להשאיר אימייל או טלפון — לפחות אחד נדרש</div>
    </>
  );
}

function ModeStep({ mode, setMode }) {
  return (
    <>
      <h2 className="onb-title">איך נעדיף לקלוט פרטים?</h2>
      <div className="onb-mode">
        <button className={`pill ${mode==='website'?'active':''}`} onClick={()=>setMode('website')}>אתר חברה</button>
        <button className={`pill ${mode==='manual'?'active':''}`} onClick={()=>setMode('manual')}>מילוי ידני</button>
      </div>
    </>
  );
}

function WebsiteStep({ website, setWebsite, parsed, parseLoading, parseError, applyAI }) {
  return (
    <>
      <h2 className="onb-title">כתובת אתר החברה</h2>
      <input className="onb-input" dir="ltr"
             value={website} onChange={e=>setWebsite(e.target.value)}
             placeholder="https://example.com" />
      <div className="onb-parse">
        {parseLoading && <span className="onb-parse-badge loading">קורא נתונים…</span>}
        {!parseLoading && parsed && (
          <>
            <div className="onb-parse-card">
              <div><b>תעשייה:</b> {parsed.industry || '—'}</div>
              <div><b>כוונה:</b> {parsed.intent || '—'}</div>
              <div><b>תקציב מזוהה:</b> {parsed.budget ? `₪ ${Number(parsed.budget).toLocaleString('he-IL')}` : '—'}</div>
            </div>
            <div className="onb-parse-actions">
              <button className="btn ghost" onClick={applyAI}>החלת הצעת AI</button>
            </div>
          </>
        )}
        {parseError && <span className="onb-parse-badge err">{parseError}</span>}
      </div>
    </>
  );
}

function SelectStep({ title, value, onChange, options }) {
  return (
    <>
      <h2 className="onb-title">{title}</h2>
      <select className="onb-input" value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(op => <option key={op} value={op}>{op}</option>)}
      </select>
    </>
  );
}

function RangeStep({ title, value, onChange, min, max, step }) {
  return (
    <>
      <h2 className="onb-title">{title}</h2>
      <div className="onb-range">
        <input type="range" min={min} max={max} step={step}
               value={value} onChange={e=>onChange(Number(e.target.value))} />
        <div className="onb-range-value">₪ {value.toLocaleString('he-IL')}</div>
      </div>
    </>
  );
}

function NotesStep({ notes, setNotes }) {
  return (
    <>
      <h2 className="onb-title">הערות</h2>
      <textarea className="onb-input" rows={4}
                value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="הערות חופשיות (לקריאה ע״י סוכן הטלפון)" />
    </>
  );
}

function ReviewStep({ mode, values }) {
  return (
    <>
      <h2 className="onb-title">סקירה לפני שליחה</h2>
      <div className="onb-review">
        {mode === 'website' ? (
          <>
            <Row k="שם" v={values.name} />
            <Row k="אימייל" v={values.email || '—'} />
            <Row k="טלפון" v={values.phone || '—'} />
            <Row k="אתר" v={values.website || '—'} />
            <Row k="ענף" v={values.industry || '—'} />
            <Row k="תקציב" v={values.budget ? `₪ ${values.budget.toLocaleString('he-IL')}` : '—'} />
            <Row k="כוונה" v={values.intent || '—'} />
            <Row k="הערות" v={values.notes || '—'} />
          </>
        ) : (
          <>
            <Row k="שם" v={values.name} />
            <Row k="אימייל" v={values.email || '—'} />
            <Row k="טלפון" v={values.phone || '—'} />
            <Row k="חברה" v={values.company || '—'} />
            <Row k="ענף" v={values.industry || '—'} />
            <Row k="תקציב" v={values.budget ? `₪ ${values.budget.toLocaleString('he-IL')}` : '—'} />
            <Row k="כוונה" v={values.intent || '—'} />
            <Row k="מיקום" v={values.location || '—'} />
            <Row k="הערות" v={values.notes || '—'} />
          </>
        )}
      </div>
      <div className="onb-hint">ניתן לחזור אחורה ולתקן לפני שליחה.</div>
    </>
  );
}

function Row({ k, v }) {
  return (
    <div className="onb-row">
      <div className="onb-row-k">{k}</div>
      <div className="onb-row-v">{v}</div>
    </div>
  );
}

function ProgressDots({ current, total }) {
  return (
    <div className="onb-dots">
      {Array.from({length: total}).map((_, i) => (
        <span key={i} className={`dot ${i===current?'active':''}`} />
      ))}
    </div>
  );
}
