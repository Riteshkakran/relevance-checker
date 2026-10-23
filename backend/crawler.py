"""3-level crawler.
Level 1 = the uploaded file or the URL the user gave
Level 2 = links found inside level 1
Level 3 = links found inside level 2   (we stop here)
"""
import ipaddress
import socket
from collections import deque
from urllib.parse import urlparse, urljoin

import requests

from extractor import extract, SUPPORTED_EXTS

MAX_DEPTH = 3
MAX_NODES = 20            # hard cap on documents fetched per request
MAX_LINKS_PER_NODE = 10   # don't explode on link-heavy pages
MAX_BYTES = 25 * 1024 * 1024
TIMEOUT = 15
HEADERS = {"User-Agent": "RelevanceChecker/1.0"}


def is_safe_url(url: str) -> bool:
    """Block localhost / private networks (SSRF protection)."""
    try:
        p = urlparse(url)
        if p.scheme not in ("http", "https") or not p.hostname:
            return False
        for info in socket.getaddrinfo(p.hostname, None):
            ip = ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        return True
    except Exception:
        return False


def looks_like_document_link(url: str) -> bool:
    """On web pages we only follow links that look like downloadable documents."""
    low = url.lower().split("#")[0].split("?")[0]
    return any(low.endswith(ext) for ext in SUPPORTED_EXTS if ext not in (".html", ".htm")) or "pdf" in low


def fetch(url: str):
    """Returns (bytes, content_type). Follows redirects manually so each hop is checked."""
    for _ in range(5):
        if not is_safe_url(url):
            raise ValueError("URL blocked (not public http/https)")
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True, allow_redirects=False)
        if r.is_redirect:
            url = urljoin(url, r.headers.get("Location", ""))
            continue
        r.raise_for_status()
        data = bytearray()
        for chunk in r.iter_content(65536):
            data += chunk
            if len(data) > MAX_BYTES:
                raise ValueError("File larger than 25 MB")
        return bytes(data), r.headers.get("Content-Type", "").lower()
    raise ValueError("Too many redirects")


def crawl(start_url: str | None = None, file_bytes: bytes | None = None, file_name: str = "uploaded file"):
    nodes = []                 # [{url, depth, type, parent, text, error}]
    visited = set()
    queue = deque()

    if file_bytes is not None:
        node = {"url": file_name, "depth": 1, "type": "unknown", "parent": None, "text": "", "error": None}
        try:
            node["type"], node["text"], links = extract(file_bytes, "", file_name)
            for l in links:
                if l.lower().startswith(("http://", "https://")):
                    queue.append((l, 2, file_name))
                    if len(queue) >= MAX_LINKS_PER_NODE:
                        break
        except Exception as e:
            node["error"] = str(e)[:200]
        nodes.append(node)
    else:
        queue.append((start_url, 1, None))

    while queue and len(nodes) < MAX_NODES:
        url, depth, parent = queue.popleft()
        url = url.split("#")[0]
        if url in visited or depth > MAX_DEPTH:
            continue
        visited.add(url)
        node = {"url": url, "depth": depth, "type": "unknown", "parent": parent, "text": "", "error": None}
        try:
            content, ctype = fetch(url)
            node["type"], node["text"], links = extract(content, ctype, url)
            if depth < MAX_DEPTH:
                # Files: follow every web link. Web pages: only links that look like documents.
                links = [l for l in links if l.lower().startswith(("http://", "https://"))]
                if node["type"] == "html":
                    links = [l for l in links if looks_like_document_link(l)]
                for l in links[:MAX_LINKS_PER_NODE]:
                    queue.append((l, depth + 1, url))
        except Exception as e:
            node["error"] = str(e)[:200]
        nodes.append(node)
    return nodes
