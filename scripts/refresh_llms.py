#!/usr/bin/env python3
"""Refresh llms.txt from committed public catalogues without making Vocus requests."""

import json
from pathlib import Path

from sync_vocus_catalog import llms_text


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    articles = json.loads((ROOT / "data/blog/articles.json").read_text(encoding="utf-8"))["articles"]
    (ROOT / "llms.txt").write_text(llms_text(articles), encoding="utf-8")
    print(f"PASS refreshed llms.txt with {len(articles)} local articles and five local courses; no Vocus request")


if __name__ == "__main__":
    main()
