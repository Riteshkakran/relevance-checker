import { useRef, useState } from "react";
import KeywordInput from "./KeywordInput.jsx";

const MAX_MB = 25;
const EXTS = [".pdf", ".docx", ".pptx", ".xlsx", ".html", ".htm", ".txt", ".md", ".csv", ".tsv", ".json", ".log"];

function size(bytes) {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function UploadForm({ onSubmit, loading }) {
  const [mode, setMode] = useState("pdf");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  function pick(f) {
    if (!f) return;
    if (!EXTS.some((x) => f.name.toLowerCase().endsWith(x)))
      return setError("That file type isn't supported. Use PDF, Word, PowerPoint, Excel, TXT, CSV, MD, JSON or HTML.");
    if (f.size > MAX_MB * 1048576) return setError(`That file is over ${MAX_MB} MB.`);
    setError("");
    setFile(f);
  }

  function submit(e) {
    e.preventDefault();
    if (mode === "pdf" && !file) return setError("Choose a file to check.");
    if (mode === "url" && !/^https?:\/\//i.test(url.trim()))
      return setError("Enter a full link starting with http:// or https://");
    if (!keywords.length) return setError("Add at least one keyword.");
    setError("");
    onSubmit({ mode, file, url: url.trim(), keywords: keywords.join(",") });
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="seg" role="tablist" aria-label="Source type">
        {[["pdf", "File"], ["url", "Web link"]].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id}
            className={mode === id ? "on" : ""} onClick={() => { setMode(id); setError(""); }}>
            {label}
          </button>
        ))}
      </div>

      {mode === "pdf" ? (
        file ? (
          <div className="filecard">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 2h8l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" fill="#7CF5D4" />
              <path d="M14 2v5h5" fill="#0B2B25" fillOpacity=".25" />
            </svg>
            <div className="fileinfo"><strong>{file.name}</strong><span>{size(file.size)}</span></div>
            <button type="button" className="ghost" onClick={() => setFile(null)}>Change</button>
          </div>
        ) : (
          <div
            className={"drop" + (drag ? " over" : "")}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            role="button" tabIndex={0}
          >
            <svg width="30" height="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
            </svg>
            <strong>Drop a file here</strong>
            <span>PDF, Word, PowerPoint, Excel, TXT, CSV and more</span>
            <span>or click to browse, up to {MAX_MB} MB</span>
            <input ref={inputRef} type="file" accept={EXTS.join(",")} hidden onChange={(e) => pick(e.target.files[0])} />
          </div>
        )
      ) : (
        <label className="field">
          <span>Link to a web page or a file</span>
          <input type="url" className="text" placeholder="https://example.com/report.pdf"
            value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
      )}

      <div className="field">
        <span>Keywords you&rsquo;re looking for</span>
        <KeywordInput value={keywords} onChange={setKeywords} />
        {/* <small className="tip">Capital letters, accents and line breaks don&rsquo;t matter. &ldquo;Carbon Tax&rdquo; also finds &ldquo;carbon tax&rdquo;.</small> */}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button className="go" type="submit" disabled={loading}>
        {loading && <i className="spin" aria-hidden="true" />}
        {loading ? "Reading your document" : "Check relevance"}
      </button>
    </form>
  );
}
