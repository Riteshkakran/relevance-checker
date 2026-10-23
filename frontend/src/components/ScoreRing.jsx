import { useEffect, useState } from "react";

export default function ScoreRing({ value, tone }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf, start;
    const step = (t) => {
      start ??= t;
      const p = Math.min(1, (t - start) / 1000);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const r = 76, c = 2 * Math.PI * r;
  return (
    <div className={`ring ${tone}`} role="img" aria-label={`Relevance score ${value} percent`}>
      <svg viewBox="0 0 190 190">
        <circle className="track" cx="95" cy="95" r={r} />
        <circle className="bar" cx="95" cy="95" r={r}
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} transform="rotate(-90 95 95)" />
      </svg>
      <div className="ring-num"><b>{Math.round(shown)}</b><span>%</span></div>
    </div>
  );
}
