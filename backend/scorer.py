"""Keyword matching + relevance percentage."""
import re
import unicodedata

COVERAGE_WEIGHT = 0.7      # how many of the user's keywords appear at all
DENSITY_WEIGHT = 0.3       # how often they appear
DENSITY_FULL = 5.0         # 5 hits per 1000 words = full density score
USEFUL_AT = 60
MAYBE_AT = 30


_HYPHEN_BREAK = re.compile(r"(\w)[-\u2010\u2011]\s*\n\s*(\w)")


def normalize(text: str) -> str:
    """Put text AND keywords into one plain, comparable form:
    - fixes ligatures / odd characters (NFKC, e.g. the single 'fi' glyph -> 'fi')
    - joins words split across lines ('emis-\nsions' -> 'emissions')
    - lowercases (casefold also handles e.g. German ss)
    - removes accents ('cafe' matches 'caf\u00e9')
    - collapses all whitespace/line breaks so 'carbon\ntax' matches 'carbon tax'
    """
    text = unicodedata.normalize("NFKC", text).replace("\u00ad", "")
    text = _HYPHEN_BREAK.sub(r"\1\2", text)
    text = unicodedata.normalize("NFD", text.casefold())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return " ".join(text.split())


def _pattern(kw: str):
    return re.compile(rf"(?<!\w){re.escape(normalize(kw))}(?!\w)")


def count_keywords(text: str, keywords: list[str]):
    """{keyword: {count, snippets}} for one text."""
    out = {}
    for kw in keywords:
        matches = list(_pattern(kw).finditer(text))
        snippets = []
        for m in matches[:2]:
            s, e = max(0, m.start() - 60), min(len(text), m.end() + 60)
            snippets.append("..." + " ".join(text[s:e].split()) + "...")
        out[kw] = {"count": len(matches), "snippets": snippets}
    return out


def relevance(counts: dict, word_count: int):
    total_kw = len(counts) or 1
    matched = sum(1 for v in counts.values() if v["count"] > 0)
    hits = sum(v["count"] for v in counts.values())
    coverage = matched / total_kw
    density = (hits / word_count * 1000) if word_count else 0
    density_score = min(1.0, density / DENSITY_FULL)
    score = round(100 * (COVERAGE_WEIGHT * coverage + DENSITY_WEIGHT * density_score), 1)
    return score, matched, hits


def verdict(score: float):
    if score >= USEFUL_AT:
        return "useful"
    if score >= MAYBE_AT:
        return "maybe"
    return "not_useful"


def analyze(nodes: list[dict], keywords: list[str]):
    per_doc, merged = [], {kw: {"count": 0, "snippets": []} for kw in keywords}
    total_words = 0
    for n in nodes:
        clean = normalize(n["text"])          # same clean-up the keywords get
        words = len(clean.split())
        total_words += words
        counts = count_keywords(clean, keywords)
        score, matched, hits = relevance(counts, words)
        for kw, v in counts.items():
            merged[kw]["count"] += v["count"]
            if len(merged[kw]["snippets"]) < 3:
                merged[kw]["snippets"] += v["snippets"][: 3 - len(merged[kw]["snippets"])]
        warning = None
        if not n["error"] and words < 20:
            warning = "Almost no readable text (scanned PDF or empty page?)"
        per_doc.append({
            "url": n["url"], "depth": n["depth"], "type": n["type"], "parent": n["parent"],
            "words": words, "score": score, "matched": matched, "hits": hits,
            "error": n["error"], "warning": warning,
        })
    score, matched, hits = relevance(merged, total_words)
    return {
        "score": score,
        "verdict": verdict(score),
        "keywords_total": len(keywords),
        "keywords_matched": matched,
        "total_hits": hits,
        "total_words": total_words,
        "keywords": [{"keyword": k, **v} for k, v in merged.items()],
        "documents": per_doc,
    }
