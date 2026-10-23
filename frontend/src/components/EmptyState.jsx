const LEVELS = [
  ["Level 1", "Your file or link", "PDF, Word, PowerPoint, Excel, text and web pages."],
  ["Level 2", "Files and pages it links to", "Links inside your file are followed."],
  ["Level 3", "Files found on those pages", "One more hop, then we stop."],
];

export default function EmptyState() {
  return (
    <div className="empty">
      <h2>Not everything deserves your attention.</h2>
      <h2>Find what does.</h2>
      <p className="sub">
        Your search doesn't stop at the first document. We follow connected links through three levels, helping you find relevant files and see the bigger picture.
      </p>

      <ol className="levels">
        {LEVELS.map(([lv, title, note], i) => (
          <li key={lv} style={{ "--d": i }}>
            <span className="lvl">{lv}</span>
            <div><strong>{title}</strong><span>{note}</span></div>
          </li>
        ))}
      </ol>

      <h3>How to read your score</h3>
      <ul className="legend">
        <li><i className="dot good" /><strong>60% and above</strong><span>Worth reading. Your keywords appear often.</span></li>
        <li><i className="dot maybe" /><strong>30% to 59%</strong><span>Worth a skim. Some keywords appear.</span></li>
        <li><i className="dot bad" /><strong>Below 30%</strong><span>Safe to skip. Few or no matches.</span></li>
      </ul>
      <p className="muted-note">
        The score rewards two things: 
        <ul>
          <li>how many of your keywords appear at all.</li>
          <li>how often they appear for the length of the text.</li>
        </ul>
      </p>
    </div>
  );
}
