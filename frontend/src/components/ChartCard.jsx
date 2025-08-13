/**
 * Charts Component
 * - Line chart: shows calls per day for the last 7 days
 * - Pie chart: shows distribution of call outcomes
 * 
 * Uses Chart.js and is fully responsive.
 */

import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

function ChartCard({ title, type, data }) {
  const canvasRef = useRef();

  useEffect(() => {
    const chartInstance = new Chart(canvasRef.current, { type, data, options: { responsive: true, maintainAspectRatio: false } });
    return () => chartInstance.destroy();
  }, [type, data]);

  return (
    <div className="chart">
      <h3>{title}</h3>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

export default ChartCard;