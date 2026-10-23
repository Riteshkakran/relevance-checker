import os
import re

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from crawler import crawl, is_safe_url, MAX_BYTES
from extractor import SUPPORTED_EXTS
from scorer import analyze

app = FastAPI(title="Relevance Checker")

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
origins += [o.strip().rstrip("/") for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_keywords(raw: str) -> list[str]:
    items = [k.strip() for k in re.split(r"[,\n]", raw)]
    return list(dict.fromkeys(k for k in items if k))      # unique, non-empty


@app.get("/api/health")
def health():
    return {"ok": True}


# Plain `def` (not async) so FastAPI runs the blocking crawl in a worker thread.
@app.post("/api/analyze")
def analyze_endpoint(
    keywords: str = Form(...),
    url: str | None = Form(None),
    file: UploadFile | None = File(None),
):
    kws = parse_keywords(keywords)
    if not kws:
        raise HTTPException(400, "Enter at least one keyword.")
    if not url and not file:
        raise HTTPException(400, "Upload a file or enter a URL.")

    if file:
        name = file.filename or "uploaded file"
        if os.path.splitext(name)[1].lower() not in SUPPORTED_EXTS:
            raise HTTPException(
                400,
                "Unsupported file type. Use PDF, Word (.docx), PowerPoint (.pptx), "
                "Excel (.xlsx), HTML, TXT, MD, CSV or JSON.",
            )
        data = file.file.read()
        if len(data) > MAX_BYTES:
            raise HTTPException(400, "File is larger than 25 MB.")
        nodes = crawl(file_bytes=data, file_name=name)
    else:
        if not is_safe_url(url):
            raise HTTPException(400, "Enter a public http(s) URL.")
        nodes = crawl(start_url=url.strip())

    if not any(n["text"] for n in nodes):
        msg = nodes[0]["error"] if nodes and nodes[0]["error"] else "No readable text found."
        raise HTTPException(422, msg)
    return analyze(nodes, kws)