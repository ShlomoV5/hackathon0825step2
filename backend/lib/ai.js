export function extractAI({ text = '', website = '' } = {}) {
  const src = `${text} ${website}`.toLowerCase();

  // ---- Intent (Hebrew + English) ----
  const intent = detectIntent(src); // <-- NEW

  // ---- Industry (light heuristics; add as needed) ----
  const industry =
    /משרד|משרד|משרדים|office/.test(src) ? 'Offices' :
    /מגורים|דירות|residential/.test(src) ? 'Residential' :
    /מסחר|קמעונ|חנויות|retail/.test(src) ? 'Retail' :
    /לוגיסט|תעש|industrial|logistics/.test(src) ? 'Industrial/Logistics' :
    /נדל|real\s*estate/.test(src) ? 'Real Estate' :
    'General';

  // ---- Budget (same as before, plus plain digits) ----
  const budget = parseBudget(src);

  return { industry, intent, budget };
}

// Map Hebrew/English phrases → 'buy' | 'rent' | 'unknown'
function detectIntent(s) {
  // buy: קנייה/קניה/לקנות/רכישה/לרכוש/מכירה (treat "מכירה" as buy-side intent to proceed)
  if (/(לקנייה|לקניה|קנייה|קניה|לקנות|רכישה|לרכוש|מכירה|buy|purchase)/.test(s)) return 'buy';
  // rent: לשכירות/שכירות/להשכרה/לשכור/השכרה/rent/lease
  if (/(לשכירות|שכירות|להשכרה|לשכור|השכרה|rent|lease)/.test(s)) return 'rent';
  return 'unknown';
}

function parseBudget(s) {
  const norm = s.replace(/\u200f/g, '').replace(/\s+/g, ' ');

  // 1) 250k / 1.2m
  const m1 = norm.match(/(\d+(?:\.\d+)?)\s*(k|m)\b/i);
  if (m1) {
    const n = parseFloat(m1[1]);
    const mult = m1[2].toLowerCase() === 'm' ? 1_000_000 : 1_000;
    return Math.round(n * mult);
  }

  // 2) Hebrew units: "250 אלף", "1.5 מיליון"
  const m2 = norm.match(/(\d+(?:\.\d+)?)\s*(אלפים?|אלף|מיליון)/);
  if (m2) {
    const n = parseFloat(m2[1]);
    const mult = /מיליון/.test(m2[2]) ? 1_000_000 : 1_000;
    return Math.round(n * mult);
  }

  // 3) Currency formats: "₪ 250,000" / "$250,000"
  const m3 = norm.match(/(?:₪|\$)\s*([\d][\d,.\s]{3,})/);
  if (m3) return digitsOnly(m3[1]);

  // 4) Plain long digits: "250000"
  const m4 = norm.match(/\b\d{5,}\b/);
  if (m4) return parseInt(m4[0], 10);

  return null;
}

function digitsOnly(str) {
  return parseInt(String(str).replace(/[^\d]/g, ''), 10);
}