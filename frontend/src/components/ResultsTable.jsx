/**
 * ResultsTable Component
 * Displays a table of recent calls with:
 * - Name
 * - Time
 * - Outcome (color-coded)
 * - Rating stars
 * - 'View' button for details
 */

function ResultsTable() {
  const rows = [
    { name: 'דוד כהן', time: '10:15', result: 'נסגר', color: 'green', rating: '★★★★☆' },
    { name: 'שרה לוי', time: '11:00', result: 'חם', color: 'blue', rating: '★★★☆☆' },
    { name: 'אבי ישראלי', time: '12:30', result: 'לא ענה', color: 'gray', rating: '☆☆☆☆☆' }
  ];

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>שעה</th>
            <th>תוצאה</th>
            <th>דירוג</th>
            <th>פרטים</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
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
