/**
 * KPI Component
 * Displays a single KPI metric with:
 * - Large number (centered, fills most of the space)
 * - Label in the top-right corner
 * - Control buttons (move/delete) in the top-left corner
 *
 * Props:
 * - label (string): KPI title in Hebrew
 * - value (string|number): KPI value to display
 */

function Kpi({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-controls"><span>☰</span><span>✖</span></div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-number">{value}</div>
    </div>
  );
}
export default Kpi;
