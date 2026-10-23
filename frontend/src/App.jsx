import { useEffect, useRef, useState } from "react";
import { analyze } from "./api.js";
import UploadForm from "./components/UploadForm.jsx";
import ResultView from "./components/ResultView.jsx";
import EmptyState from "./components/EmptyState.jsx";
import LoadingState from "./components/LoadingState.jsx";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const mainRef = useRef(null);

  async function handleSubmit(payload) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await analyze(payload));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // On phones the results sit below the form, so bring them into view.
  useEffect(() => {
    if ((loading || result || error) && window.innerWidth < 980) {
      mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, result, error]);

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
            <rect width="34" height="34" rx="9" fill="#7CF5D4" />
            <path d="M10 8h10l5 5v13a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill="#0B2B25" />
            <path d="M13 19.5l3 3 5.5-6" stroke="#7CF5D4" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Solarman Technologies</span>
        </div>
        <h3>Worth a read?</h3>
        <h3>Know if it's worth reading before you read it.</h3>
        <p className="lede">
          Upload a file or a link and the keywords you care about. We read it, and the files it
          links to, then tell you whether to read it or skip it.
        </p>

        <UploadForm onSubmit={handleSubmit} loading={loading} />

        {/* <p className="privacy">Files are read in memory and never saved.</p> */}
      </aside>

      <main className="main" ref={mainRef}>
        {error && (
          <div className="alert" role="alert">
            <strong>We couldn&rsquo;t check that.</strong>
            <span>{error}</span>
          </div>
        )}
        {loading ? <LoadingState /> : result ? (
          <ResultView result={result} onReset={() => setResult(null)} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
