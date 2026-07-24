#!/usr/bin/env python3
"""Refresh only the course-choice CTA on already generated blog articles.

No Vocus request is made. Article body, Vocus image references, source link and
metadata stay byte-for-byte outside the CTA block.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from sync_vocus_catalog import article_cta


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    articles = json.loads((root / "data/blog/articles.json").read_text(encoding="utf-8"))["articles"]
    changed = 0
    for article in articles:
        path = root / "blog" / article["slug"] / "index.html"
        text = path.read_text(encoding="utf-8")
        updated, count = re.subn(r'<aside class="cta">.*?</aside>', article_cta(article), text, count=1, flags=re.DOTALL)
        if count != 1:
            raise ValueError(f"{path}: expected exactly one article CTA")
        if "#start-here" not in updated or article["vocus_url"] not in updated:
            raise ValueError(f"{path}: CTA or source proof missing after refresh")
        path.write_text(updated, encoding="utf-8")
        changed += 1
    print(f"PASS refreshed {changed} article CTAs without Vocus access")


if __name__ == "__main__":
    main()
