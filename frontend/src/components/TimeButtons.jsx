/**
 * TimeButtons Component
 * Displays a set of buttons to filter the dashboard's data by time range.
 * Options: Today, Yesterday, This Week, This Month, Custom.
 * 
 * State: Active button is highlighted.
 */

function TimeButtons() {
  return (
    <div className="time-buttons">
      <button className="active">היום</button>
      <button>אתמול</button>
      <button>השבוע</button>
      <button>החודש</button>
      <button>מותאם</button>
    </div>
  );
}
export default TimeButtons;