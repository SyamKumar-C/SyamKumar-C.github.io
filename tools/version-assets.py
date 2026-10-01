#!/usr/bin/env python3
"""Stamp asset URLs in index.html with a short content hash (?v=...).

GitHub Pages lets browsers cache CSS/JS for a few minutes. Without a version
in the URL, a fresh index.html can be paired with a stale styles.css or
main.js. Run this after editing any asset:

    python3 tools/version-assets.py
"""
import hashlib, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
html_path = root / "index.html"
html = html_path.read_text()

for asset in ["assets/css/styles.css", "assets/js/main.js", "assets/img/icons.svg"]:
    digest = hashlib.sha256((root / asset).read_bytes()).hexdigest()[:10]
    # matches the bare path or one that already carries ?v=..., keeping any #fragment
    html, n = re.subn(re.escape(asset) + r"(\?v=[0-9a-f]+)?(?=[\"#])", f"{asset}?v={digest}", html)
    print(f"{asset}: v={digest} ({n} references)")

html_path.write_text(html)
