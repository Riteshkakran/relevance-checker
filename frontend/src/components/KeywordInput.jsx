import { useState } from "react";

const MAX = 20;

export default function KeywordInput({ value, onChange }) {
  const [text, setText] = useState("");

  function add(raw) {
    const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length < MAX && !next.some((k) => k.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setText("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="chips-box">
      {value.map((k) => (
        <span className="chip" key={k}>
          {k}
          <button type="button" aria-label={`Remove ${k}`} onClick={() => onChange(value.filter((x) => x !== k))}>
            &times;
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(text)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          if (/[,\n]/.test(pasted)) { e.preventDefault(); add(pasted); }
        }}
        placeholder={value.length ? "Add another" : "Type a keyword, press Enter"}
        aria-label="Keywords"
      />
    </div>
  );
}
