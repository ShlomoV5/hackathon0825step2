import { useEffect, useRef } from "react";
import { CountUp } from "countup.js";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function Kpi({ label, value }) {
  const numberRef = useRef(null);

  useEffect(() => {
    if (!numberRef.current) return;

    const strVal = String(value).trim();

    // 1️⃣ Time format mm:ss
    if (/^\d+:\d{2}$/.test(strVal)) {
      const [m, s] = strVal.split(":").map(Number);
      const totalSeconds = m * 60 + s;
      const start = performance.now();
      const duration = 2000; // ms

      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const current = totalSeconds * t;
        numberRef.current.textContent = formatTime(current);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

    // 2️⃣ Percentage format (e.g. "35%")
    } else if (/^\d+(\.\d+)?%$/.test(strVal)) {
      const num = parseFloat(strVal.replace("%", ""));
      const counter = new CountUp(numberRef.current, num, {
        duration: 2,
        suffix: "%",
        decimalPlaces: strVal.includes(".") ? strVal.split(".")[1].replace("%", "").length : 0
      });
      if (!counter.error) counter.start();

    // 3️⃣ Plain number
    } else if (!isNaN(strVal)) {
      const num = parseFloat(strVal);
      const counter = new CountUp(numberRef.current, num, {
        duration: 2,
        separator: ",",
        decimalPlaces: strVal.includes(".") ? strVal.split(".")[1].length : 0
      });
      if (!counter.error) counter.start();

    // 4️⃣ Fallback: just set text
    } else {
      numberRef.current.textContent = strVal;
    }

  }, [value]);

  return (
    <div className="kpi">
      <div className="kpi-controls">
        <span>☰</span><span>✖</span>
      </div>
      <div className="kpi-label">{label}</div>
      <div ref={numberRef} className="kpi-number">0</div>
    </div>
  );
}

export default Kpi;
