// Sends the form to the FastAPI backend (proxied by Vite to :8000).
export async function analyze({ mode, url, file, keywords }) {
  const form = new FormData();
  form.append("keywords", keywords);
  if (mode === "pdf") form.append("file", file);
  else form.append("url", url);

  const res = await fetch("/api/analyze", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Something went wrong. Try again.");
  return data;
}
