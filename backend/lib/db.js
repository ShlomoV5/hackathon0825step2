// Singleton in-memory "DB"
export const db = {
  onboarding: [], calls: [], clients: [],
  properties: [
    // BUY (₪)
    { id:'p1', kind:'דירה',   intent:'לקנייה',   city:'ת״א', area:'רמת החייל',   price: 2900000, size:75, rooms:3,  highlights:['משופצת','מרפסת'], status:'available' },
    { id:'p2', kind:'דירה',   intent:'לקנייה',   city:'חיפה', area:'כרמל',        price: 1850000, size:90, rooms:4,  highlights:['נוף פתוח'], status:'available' },
    { id:'p3', kind:'מגרש',   intent:'לקנייה',   city:'ראשל״צ', area:'מערב',     price: 1200000, size:350, rooms:null, highlights:['מתאים לבנייה נמוכה'], status:'available' },

    // RENT (₪/mo)
    { id:'p4', kind:'משרד',   intent:'לשכירות', city:'ת״א', area:'עזריאלי',      price: 12000,  size:85, rooms:3,  highlights:['נוף','מטבחון'], status:'available' },
    { id:'p5', kind:'חנות',   intent:'לשכירות', city:'ירושלים', area:'מרכז העיר', price: 9000,   size:60, rooms:2,  highlights:['חזית לרחוב'], status:'available' },
    { id:'p6', kind:'מחסן',   intent:'לשכירות', city:'ב״ש', area:'תעשייה צפון',  price: 6500,   size:180, rooms:null, highlights:['גישה למשאיות'], status:'available' }
  ],
  offer: {
    // optional marketing text; the agent will still push concrete listings first
    headline: 'יש לנו נכסים זמינים שמתאימים לתקציב שלך',
    benefits: ['התאמה מהירה לנדרש', 'אפשרות לסיור השבוע'],
    meetingLink: 'https://example.com/schedule'
  }
};

export const nextId = (() => { let i = 1; return (pfx) => `${pfx}_${i++}`; })();

export function seedMock() {
  // Reset arrays (preserve object reference)
  db.calls.length = 0;
  db.clients.length = 0;
  db.onboarding.length = 0;

  const now = new Date();

  // Onboarding leads across last 30 days
  for (let i = 1; i <= 15; i++) {
    const stamp = new Date(now);
    stamp.setDate(now.getDate() - Math.floor(Math.random() * 30)); // Random day in last 30 days
    stamp.setHours(Math.floor(Math.random() * 10) + 9, Math.floor(Math.random() * 60), 0, 0);

    db.onboarding.push({
      id: nextId('ob'),
      ts: stamp.toISOString(),
      name: `Lead ${i}`,
      phone: `+9725${Math.floor(10000000 + Math.random() * 89999999)}`,
      notes: i % 3 === 0 ? 'Looking to rent office' : 'Interested buyer',
      email: `lead${i}@example.com`,
      company: `Company ${i}`,
      industry: 'Real Estate',
      budget: (Math.floor(Math.random()*90)+10) * 10000,
      intent: 'Buy',
      location: 'Tel Aviv'
    });
  }

  // Sort onboarding leads by timestamp
  db.onboarding.sort((a, b) => new Date(b.ts) - new Date(a.ts));

  // Populate clients from onboarding for compatibility
  db.clients.push(...db.onboarding.map(lead => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    notes: lead.notes
  })));


  // Calls for some of the leads
  const results = ['answered', 'no_answer', 'voicemail', 'bad_number'];
  
  // Create calls for a subset of leads
  const leadsWithCalls = db.onboarding.slice(0, Math.floor(db.onboarding.length * 0.7)); // 70% of leads will have calls

  for (const lead of leadsWithCalls) {
      const numCalls = 1 + Math.floor(Math.random() * 3); // 1 to 3 calls per lead
      for (let k = 0; k < numCalls; k++) {
          const callTs = new Date(lead.ts);
          // make call timestamp slightly after lead timestamp
          callTs.setMinutes(callTs.getMinutes() + Math.floor(Math.random() * 60)); 

          db.calls.push({
              id: `call_${lead.id}_${k}`,
              ts: callTs.toISOString(),
              clientId: lead.id,
              result: results[Math.floor(Math.random() * results.length)],
              durationSec: Math.floor(Math.random() * 240)
          });
      }
  }
  
  // Sort calls by timestamp
  db.calls.sort((a, b) => new Date(b.ts) - new Date(a.ts));
}