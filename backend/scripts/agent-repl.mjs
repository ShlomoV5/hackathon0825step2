// node backend/scripts/agent-repl.mjs
import 'dotenv/config.js';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { agentDecideTurn } from '../lib/agent.js';
import { db } from '../lib/db.js';

// ----------- Safe fallbacks so you never get "offer is not defined" -----------
const defaultOffer = {
  name: 'Office Park',
  headline: 'יש לנו נכסים רלוונטיים זמינים',
  benefits: ['התאמה מהירה לנדרש', 'אפשרות לסיור השבוע'],
  incentive: 'חודש ראשון חינם',
  meetingLink: 'https://example.com/schedule'
};
const offer = db?.offer && Object.keys(db.offer).length ? db.offer : defaultOffer;

const defaultCatalog = [
  { id:'p1', kind:'דירה', intent:'לקנייה',   city:'ת״א', area:'רמת החייל',   price:2900000, size:75, rooms:3,  highlights:['משופצת','מרפסת'], status:'available' },
  { id:'p2', kind:'דירה', intent:'לקנייה',   city:'חיפה', area:'כרמל',        price:1850000, size:90, rooms:4,  highlights:['נוף פתוח'], status:'available' },
  { id:'p3', kind:'מגרש', intent:'לקנייה',   city:'ראשל״צ', area:'מערב',     price:1200000, size:350, rooms:null, highlights:['מתאים לבנייה נמוכה'], status:'available' },
  { id:'p4', kind:'משרד', intent:'לשכירות', city:'ת״א', area:'עזריאלי',      price:12000,  size:85, rooms:3,  highlights:['נוף','מטבחון'], status:'available' },
  { id:'p5', kind:'חנות', intent:'לשכירות', city:'ירושלים', area:'מרכז העיר', price:9000,   size:60, rooms:2,  highlights:['חזית לרחוב'], status:'available' },
  { id:'p6', kind:'מחסן', intent:'לשכירות', city:'ב״ש', area:'תעשייה צפון',  price:6500,   size:180, rooms:null, highlights:['גישה למשאיות'], status:'available' }
];
const catalog = Array.isArray(db?.properties) && db.properties.length ? db.properties : defaultCatalog;

// ---------------- helpers ----------------
function il(n) { return '₪ ' + Number(n).toLocaleString('he-IL'); }
function fmtProp(p) {
  const price = il(p.price) + (p.intent === 'לשכירות' ? ' לחודש' : '');
  const size  = p.size ? `${p.size} מ״ר` : '';
  const rooms = p.rooms ? `${p.rooms} חד׳` : '';
  const extras = [rooms, size, p.area].filter(Boolean).join(', ');
  return `${p.kind} ב${p.city}${extras ? ' — ' + extras : ''}, ${price}`;
}
function applyUpdates(lead, up = {}) {
  const changed = {};
  const before = { ...lead };
  if (up.name && (!lead.name || lead.name === 'ממתין לשם')) { lead.name = up.name; changed.name = [before.name, lead.name]; }
  if (up.intent && !lead.intent) { lead.intent = up.intent; changed.intent = [before.intent, lead.intent]; }
  if (up.industry && !lead.industry) { lead.industry = up.industry; changed.industry = [before.industry, lead.industry]; }
  if (typeof up.budget === 'number' && !lead.budget) { lead.budget = up.budget; changed.budget = [before.budget, lead.budget]; }
  if (up.status) { lead.status = up.status; changed.status = [before.status, lead.status]; }
  if (up.notes) lead.notes = ((lead.notes || '') + `\n${up.notes}`).slice(-4000);
  return changed;
}
function printSuggestions(suggest = []) {
  if (!suggest.length) return;
  const byId = Object.fromEntries(catalog.map(p => [p.id, p]));
  console.log('Suggestions:');
  for (const s of suggest) {
    const p = byId[s.id];
    if (p) console.log(' •', fmtProp(p), s.reason ? `(${s.reason})` : '');
  }
}

// ---------------- main ----------------
async function main() {
  const rl = readline.createInterface({ input, output });

  // start with an empty-ish lead (adjust as you like)
  const lead = {
    name: 'לקוח', email: null, phone: null, website: '', company: null,
    industry: null, budget: null, intent: null, location: null,
    status: null, notes: ''
  };
  const history = [];
  const maxTurns = Number(process.env.MAX_TURNS || 8);

  // first agent turn (sales opener)
  console.log("Debug LLM config:", process.env.LLM_PROVIDER, process.env.LLM_MODEL, process.env.LLM_API_KEY?.slice(0,5));

  let out = await agentDecideTurn({ lead, history, userText: '__start__', offer, catalog });
  history.push({ role: 'assistant', content: out.reply });
  console.log(`\nAgent: ${out.reply}`);
  if (out.suggest?.length) printSuggestions(out.suggest);
  const ch0 = applyUpdates(lead, out.updates);
  if (Object.keys(ch0).length) console.log('Updates:', ch0);

  let next = out.next;
  let turns = 0;

  while (next !== 'end' && turns < maxTurns) {
    const user = await rl.question('You : ');
    if (!user.trim()) continue;

    history.push({ role: 'user', content: user });

    out = await agentDecideTurn({ lead, history, userText: user, offer, catalog });
    const changed = applyUpdates(lead, out.updates);
    history.push({ role: 'assistant', content: out.reply });

    console.log('Agent:', out.reply);
    if (out.suggest?.length) printSuggestions(out.suggest);
    if (out.cta) console.log('CTA:', out.cta);
    if (Object.keys(changed).length) console.log('Updates:', changed);

    next = out.next;
    turns++;
  }

  console.log('\n✅ Conversation complete.\nLead summary:', {
    name: lead.name, intent: lead.intent, industry: lead.industry,
    budget: lead.budget, status: lead.status
  });
  if (lead.notes) console.log('Notes (tail):\n' + lead.notes.split('\n').slice(-3).join('\n'));
  rl.close();
}

main().catch(err => { console.error(err); process.exit(1); });
