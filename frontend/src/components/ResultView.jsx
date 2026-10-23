import { useState } from "react";
import ScoreRing from "./ScoreRing.jsx";

const VERDICTS = {
  useful: { tone: "good", title: "Worth reading", text: "Your keywords appear throughout this material. It's worth your time." },
  maybe: { tone: "maybe", title: "Worth a skim", text: "Some of your keywords appear. Check the passages below before reading it all." },
  not_useful: { tone: "bad", title: "Safe to skip", text: "Few of your keywords appear. You can most likely leave this one." },
};

const KINDS = { pdf: "PDF", docx: "Word", pptx: "PowerPoint", xlsx: "Excel", text: "Text file", html: "Web page" };
const toneOf = (s) => (s >= 60 ? "good" : s >= 30 ? "maybe" : "bad");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlight({ text, term }) {
  const parts = text.split(new RegExp(`(${esc(term)})`, "gi"));
  return parts.map((p, i) => (i % 2 === 1 ? <mark key={i}>{p}</mark> : p));
}

function shortUrl(u) {
  try {
    const x = new URL(u);
    const path = x.pathname === "/" ? "" : x.pathname;
    return { host: x.hostname.replace(/^www\./, ""), path: decodeURIComponent(path) };
  } catch {
    return { host: u, path: "" };
  }
}

export default function ResultView({ result, onReset }) {
  const v = VERDICTS[result.verdict];
  const [copied, setCopied] = useState(false);
  const sorted = [...result.keywords].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...sorted.map((k) => k.count));
  const readable = result.documents.filter((d) => !d.error);
  const failed = result.documents.length - readable.length;
  const best = readable.length > 1 ? [...readable].sort((a, b) => b.score - a.score)[0] : null;

  async function copy() {
    const lines = [
      `${v.title}: ${result.score}% relevance`,
      `${result.keywords_matched} of ${result.keywords_total} keywords found, ${result.total_hits} matches in ${result.total_words} words across ${readable.length} file(s).`,
      "",
      ...sorted.map((k) => `${k.keyword}: ${k.count}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="result">
      <section className={`verdict ${v.tone}`}>
        <ScoreRing value={result.score} tone={v.tone} />
        <div className="verdict-body">
          <h2>{v.title}</h2>
          <p>{v.text}</p>
          {readable.length > 1 && (
            <p className="linknote">
              Your file linked to {readable.length - 1} other file{readable.length > 2 ? "s" : ""}, so we read {readable.length > 2 ? "those" : "that one"} too. The score covers everything together.
            </p>
          )}
          <dl className="facts">
            <div><dt>Keywords found</dt><dd>{result.keywords_matched} of {result.keywords_total}</dd></div>
            <div><dt>Total matches</dt><dd>{result.total_hits.toLocaleString()}</dd></div>
            <div><dt>Words read</dt><dd>{result.total_words.toLocaleString()}</dd></div>
            <div><dt>Files read</dt><dd>{readable.length}</dd></div>
            {failed > 0 && <div><dt>Couldn't open</dt><dd>{failed}</dd></div>}
          </dl>
          {best && (
            <p className="best">
              Strongest match: <strong>{shortUrl(best.url).host}{shortUrl(best.url).path}</strong> at {best.score}%
            </p>
          )}
          <div className="actions">
            <button type="button" className="btn primary" onClick={copy}>{copied ? "Copied" : "Copy summary"}</button>
            <button type="button" className="btn" onClick={onReset}>Clear results</button>
          </div>
        </div>
      </section>

      <section className="block">
        <h3>Keywords</h3>
        <p className="hint">Select a found keyword to see where it appears.</p>
        <ul className="kws">
          {sorted.map((k) => {
            const row = (
              <>
                <span className="kw-name">{k.keyword}</span>
                <span className="kw-track"><i style={{ width: `${(k.count / max) * 100}%` }} /></span>
                <span className="kw-count">{k.count ? k.count : "Not found"}</span>
              </>
            );
            return (
              <li key={k.keyword} className={k.count ? "hit" : "miss"}>
                {k.count ? (
                  <details>
                    <summary>{row}</summary>
                    <div className="snips">
                      {k.snippets.map((s, i) => <p key={i}><Highlight text={s} term={k.keyword} /></p>)}
                    </div>
                  </details>
                ) : (
                  <div className="row">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="block">
        <h3>Files we read</h3>
        {/* <p className="hint">Indented items were found by following links from the item above them.</p> */}
        <ul className="docs">
          {result.documents.map((d, i) => {
            const u = shortUrl(d.url);
            return (
              <li key={i} style={{ "--d": d.depth - 1 }} className={d.error ? "failed" : ""}>
                <div className="doc-top">
                  <span className="lvl">Level {d.depth}</span>
                  <span className="kind">{KINDS[d.type] || "File"}</span>
                  {!d.error && <span className={`pill ${toneOf(d.score)}`}>{d.score}%</span>}
                </div>
                <div className="doc-url"><strong>{u.host}</strong>{u.path}</div>
                {d.error ? (
                  <p className="doc-note bad">Couldn&rsquo;t open this one: {d.error}</p>
                ) : (
                  <>
                    <div className="mini"><i className={toneOf(d.score)} style={{ width: `${Math.max(2, d.score)}%` }} /></div>
                    <p className="doc-note">
                      {d.warning || `${d.words.toLocaleString()} words, ${d.hits} keyword matches`}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
