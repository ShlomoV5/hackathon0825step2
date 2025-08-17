import { extractAI } from './ai.js';

const PROVIDER = process.env.LLM_PROVIDER || 'openai';
const MODEL    = process.env.LLM_MODEL    || 'gpt-4o-mini';
const API_KEY  = process.env.LLM_API_KEY  || process.env.OPENAI_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const FAKE     = process.env.AGENT_FAKE_MODE === '1';

const SYSTEM_PROMPT = `
אתה נציג מכירות נדל״ן בעברית. מטרותיך: 1) להציג 1–2 נכסים שמתאימים ללקוח. 2) לאסוף רק מה שחסר (תקציב/עיר/סוג). 3) לסגור: שליחת פרטים/תמונות או קביעת סיור; חוזה רק כשיש התאמה ברורה.
שמור על משפטים קצרים ושאלה אחת בכל פעם. ללא סלנג.

החזר JSON חוקי בלבד. אל תחזיר את המילה המילולית "עברית" — זו רק דוגמא:
{
  "reply": "שלום, מה טווח התקציב בקירוב?",
  "updates": { "name": null|string, "intent": null|"לקנייה"|"לשכירות", "industry": null|string, "budget": null|number, "notes": null|string, "status": null|"interested"|"not_interested"|"callback"|"scheduled"|"details_sent"|"contract_sent" },
  "stage": "open"|"probe"|"qualify"|"suggest"|"close"|"end",
  "next": "continue"|"end",
  "cta": null|"send_details"|"meeting"|"contract",
  "suggest": [ { "id": "propId", "reason": "why it fits" } ]
}
`;

const HEB_INTENT = (s='')=>{
  const t = s.toLowerCase();
  if (/(לקנייה|לקניה|קנייה|קניה|לקנות|רכישה|לרכוש|מכירה|buy|purchase)/.test(t)) return 'לקנייה';
  if (/(לשכירות|שכירות|להשכרה|לשכור|השכרה|rent|lease)/.test(t)) return 'לשכירות';
  return null;
};

const n = (x)=>Number.isFinite(+x)?+x:null;
const il = (x)=> '₪ ' + Number(x).toLocaleString('he-IL');
const fmtProp = (p)=> {
  const price = il(p.price) + (p.intent==='לשכירות' ? ' לחודש' : '');
  const size  = p.size ? `${p.size} מ״ר` : '';
  const rooms = p.rooms ? `${p.rooms} חד׳` : '';
  const extras = [rooms,size,p.area].filter(Boolean).join(', ');
  return `${p.kind} ב${p.city}${extras? ' — ' + extras : ''}, ${price}`;
};

// ---------- simple matcher (FAKE and as hint for LLM) ----------
function matchProps({ lead, catalog=[] }) {
  const intent = lead.intent || null;
  const city   = (lead.location || '').trim();
  const kind   = (lead.industry || '').trim(); // we reuse "industry" as segment/kind
  const budget = lead.budget || null;

  let items = catalog.filter(p => p.status==='available');
  if (intent) items = items.filter(p => p.intent === intent);
  if (city)   items = items.filter(p => p.city.includes(city));
  if (kind)   items = items.filter(p => p.kind.includes(kind));

  // budget logic: for קנייה, aim within ±25%; for שכירות, price <= budget
  if (budget) {
    items = items.filter(p => {
      if (intent === 'לקנייה') {
        return p.price >= budget * 0.75 && p.price <= budget * 1.25;
      }
      if (intent === 'לשכירות') {
        return p.price <= budget * 1.15; // allow slight stretch
      }
      return true;
    });
  }

  // score by closeness to budget, then by any city/kind match
  const score = (p)=>{
    let s = 0;
    if (budget) s -= Math.abs(p.price - budget) / Math.max(1, budget);
    if (city && p.city.includes(city)) s += 0.2;
    if (kind && p.kind.includes(kind)) s += 0.1;
    return s;
  };
  items.sort((a,b)=>score(b)-score(a));
  return items.slice(0,2);
}

function fallbackUpdates(lead, userText) {
  const ai = extractAI({ text: userText || '', website: lead?.website || '' });
  const up = {};
  const intent = HEB_INTENT(userText) || (ai.intent==='buy'?'לקנייה':ai.intent==='rent'?'לשכירות':null);
  if (!lead?.intent && intent) up.intent = intent;
  if (!lead?.industry && ai.industry && ai.industry !== 'General') up.industry = ai.industry; // we treat as kind
  if (!lead?.budget && ai.budget) up.budget = n(ai.budget);
  return up;
}

// ---------- FAKE sales flow (no network) ----------
function fakeTurn({ lead, history, userText, offer, catalog }) {
  const t = (userText||'').toLowerCase();
  const saysYes = /(כן|נשמע טוב|יאללה|מעוניין|סבבה|בטח|go|yes|ok)/.test(t);
  const saysNo  = /(לא|עזוב|לא מעוניין|לא רלוונטי)/.test(t);
  const askWhat = /(מה ההצעה|מה ההצעה\?|איזה נכס|מה יש|ספר|פרטים)/.test(t);
  const wantsTour = /(סיור|פגישה|לראות|זום|יומן|לקבוע)/.test(t);
  const wantsDetails = /(שלח|פרטים|תמונות|מפרט|מידע)/.test(t);

  // open
  if (userText === '__start__') {
    const k = lead.intent || 'לקנייה';
    const teaser = offer?.headline || 'יש לנו נכסים רלוונטיים פנויים';
    return {
      reply: `שלום${lead?.name? ' ' + lead.name : ''}! ${teaser}. נוכל לכוון לפי תקציב / עיר / סוג נכס. מאיזה טווח תקציב נתחיל?`,
      updates:{ status:'interested' }, stage:'open', next:'continue', cta:null, suggest:[]
    };
  }

  const up = fallbackUpdates(lead, userText);

  if (saysNo) {
    return { reply:'מבין. אם יתפנה נכס רלוונטי אעדכן. תודה ויום נעים!', updates:{ status:'not_interested' }, stage:'end', next:'end', cta:null, suggest:[] };
  }

  // do we have enough to suggest?
  const tmpLead = { ...lead, ...up };
  const suggestions = matchProps({ lead: tmpLead, catalog });
  if (askWhat || (saysYes && suggestions.length) || wantsDetails) {
    if (!suggestions.length) {
      const ask = !tmpLead.budget ? 'מה טווח התקציב?' : !tmpLead.intent ? 'לקנייה או לשכירות?' : 'באיזו עיר/אזור לחפש?';
      return { reply: `אשמח לדייק. ${ask}`, updates: up, stage:'probe', next:'continue', cta:null, suggest:[] };
    }
    const lines = suggestions.map(p => '• ' + fmtProp(p));
    const reply = `על סמך מה שאמרת יש לי ${suggestions.length} התאמות:\n${lines.join('\n')}\nמה נוח לך עכשיו — לשלוח פרטים/תמונות או לקבוע סיור?`;
    return { reply, updates: up, stage:'suggest', next:'continue', cta:null, suggest: suggestions.map(p=>({id:p.id, reason:'תקציב/אזור מתאימים'})) };
  }

  if (wantsTour || saysYes) {
    if (!suggestions.length) {
      // ask one key thing before scheduling
      const ask = !tmpLead.budget ? 'מה טווח התקציב?' : !tmpLead.intent ? 'לקנייה או לשכירות?' : 'עיר מועדפת?';
      return { reply:`בשמחה. כדי לתאם סיור—${ask}`, updates: up, stage:'qualify', next:'continue', cta:null, suggest:[] };
    }
    return { reply:'מצוין, אשלח קישור לתיאום סיור ביומן. יש שעה מועדפת—בוקר או צהריים?', updates:{...up, status:'scheduled'}, stage:'close', next:'continue', cta:'meeting', suggest: suggestions.map(p=>({id:p.id})) };
  }

  if (wantsDetails) {
    return { reply:'שולח כעת פרטים ותמונות לנכס/ים הרלוונטיים. אפשר גם לתאם סיור קצר כבר השבוע.', updates:{...up, status:'details_sent'}, stage:'close', next:'continue', cta:'send_details', suggest: suggestions.map(p=>({id:p.id})) };
  }

  // default: if missing data, ask one precise question
  if (!tmpLead.budget)   return { reply:'כדי להתאים נכס מדויק—מה טווח התקציב? מספר בקירוב מספיק.', updates: up, stage:'probe', next:'continue', cta:null, suggest:[] };
  if (!tmpLead.intent)   return { reply:'נכס לקנייה או לשכירות?', updates: up, stage:'probe', next:'continue', cta:null, suggest:[] };
  if (!tmpLead.location) return { reply:'איזו עיר או אזור מועדפים?', updates: up, stage:'probe', next:'continue', cta:null, suggest:[] };

  // with enough data but no explicit ask, suggest top matches
  const s2 = matchProps({ lead: tmpLead, catalog });
  if (s2.length) {
    const lines = s2.map(p => '• ' + fmtProp(p));
    return { reply:`יש לי התאמות: \n${lines.join('\n')}\nלהעביר פרטים או לקבוע סיור?`, updates: up, stage:'suggest', next:'continue', cta:null, suggest: s2.map(p=>({id:p.id})) };
  }
  return { reply:'אקדם איתור נכסים מתאימים ואעדכן בהודעה. יש אזור נוסף לשקול?', updates: up, stage:'probe', next:'continue', cta:null, suggest:[] };
}

export async function agentDecideTurn({ lead, history, userText, offer, catalog=[] }) {
  if (FAKE) {
    return fakeTurn({ lead, history, userText, offer, catalog });
  }

  if (!API_KEY) throw new Error('LLM_API_KEY missing');

  const messages = [
    { role:'system', content: SYSTEM_PROMPT },
    { role:'user', content: JSON.stringify({
        catalog: catalog.map(p => ({ id:p.id, kind:p.kind, intent:p.intent, city:p.city, area:p.area, price:p.price, size:p.size, rooms:p.rooms, highlights:p.highlights, status:p.status })),
        lead: { name: lead?.name||null, intent: lead?.intent||null, industry: lead?.industry||null, budget: lead?.budget||null, location: lead?.location||null, notes:(lead?.notes||'').slice(-400), status: lead?.status||null },
        offer,
        transcript: history.slice(-8),
        last_user: userText||''
      })
    }
  ];

  const json = await callLLM({ messages });
  const reply = (json.reply||'').toString().trim() || 'יש לי 2 נכסים רלוונטיים. לשלוח פרטים או לקבוע סיור?';
  const updates = Object.assign({ name:null,intent:null,industry:null,budget:null,notes:null,status:null }, json.updates||{});
  if (updates.intent) updates.intent = HEB_INTENT(updates.intent) || updates.intent;
  if (updates.budget!=null) updates.budget = n(updates.budget);
  const out = { reply, updates, next: json.next==='end' ? 'end' : 'continue', stage: json.stage||null, cta: json.cta||null, suggest: Array.isArray(json.suggest)?json.suggest:[] };
  return out;
}

async function callLLM({ messages }) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${API_KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model: MODEL, messages, response_format:{ type:'json_object' }, temperature:0.3, max_tokens:300 })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'LLM error');
  try { return JSON.parse(data.choices?.[0]?.message?.content || '{}'); } catch { return {}; }
}
