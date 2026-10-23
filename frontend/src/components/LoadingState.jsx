import { useEffect, useState } from "react";

const STEPS = [
  ["Level 1", "Opening your file or link"],
  ["Level 2", "Following the links inside it"],
  ["Level 3", "Checking the pages those links lead to"],
];

export default function LoadingState() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, STEPS.length - 1)), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="empty" role="status" aria-live="polite">
      <h2>Reading your document</h2>
      <p className="sub">Following links can take up to a minute. You can leave this tab open.</p>
      <ol className="levels">
        {STEPS.map(([lv, text], i) => (
          <li key={lv} style={{ "--d": i }} className={i < active ? "done" : i === active ? "now" : "wait"}>
            <span className="lvl">{lv}</span>
            <div><strong>{text}</strong></div>
          </li>
        ))}
      </ol>
    </div>
  );
}
