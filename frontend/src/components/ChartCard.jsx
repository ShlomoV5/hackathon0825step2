// components/ChartCard.jsx
import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

function ChartCard({ title, type, data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy any previous instance to avoid resize/duplication issues
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false, // allow container to control height
        animation: false,
        plugins: {
          legend: { display: true }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, data]);

  return (
    <div className="chart">
      <h3>{title}</h3>
      <div className="chart-inner">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default ChartCard;