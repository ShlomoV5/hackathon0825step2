import { useEffect, useState } from 'react';
import { apiGet } from '../api';

/**
 * TimeButtons Component
 * Fetches date presets from backend and dispatches 'range:change' on selection.
 */
function TimeButtons() {
  const [presets, setPresets] = useState(null);
  const [active, setActive] = useState('thisWeek');

  useEffect(() => {
    let mounted = true;
    apiGet('/api/time-periods/presets', { tz: 'Asia/Jerusalem' })
      .then((json) => { 
        if (mounted) { 
          setPresets(json.presets);
          // initial emit
          const sel = json.presets['thisWeek'];
          window.dispatchEvent(new CustomEvent('range:change', { detail: sel }));
        } 
      })
      .catch(console.error);

    return () => { mounted = false; };
  }, []);

  function select(key) {
    if (!presets) return;
    setActive(key);
    const sel = presets[key];
    window.dispatchEvent(new CustomEvent('range:change', { detail: sel }));
  }

  return (
    <div className="time-buttons">
      <button className={active==='today'?'active':''} onClick={()=>select('today')}>היום</button>
      <button className={active==='yesterday'?'active':''} onClick={()=>select('yesterday')}>אתמול</button>
      <button className={active==='thisWeek'?'active':''} onClick={()=>select('thisWeek')}>השבוע</button>
      <button className={active==='thisMonth'?'active':''} onClick={()=>select('thisMonth')}>החודש</button>
      <button className={active==='custom'?'active':''} onClick={()=>select('custom')}>מותאם</button>
    </div>
  );
}

export default TimeButtons;
