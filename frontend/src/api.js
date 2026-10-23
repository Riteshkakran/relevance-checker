export async function analyze({ mode, url, file, keywords }) {
  const form = new FormData();
  form.append("keywords", keywords);
  if (mode === "pdf") form.append("file", file);
  else form.append("url", url);

  let res;
  try {
    res = await fetch("/api/analyze", { method: "POST", body: form });
  } catch {
    throw new Error(
      "Can't reach the server. If it was idle it may be waking up. Wait a minute and try again."
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Something went wrong. Try again.");
  return data;
}