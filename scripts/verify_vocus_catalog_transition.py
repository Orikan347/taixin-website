#!/usr/bin/env python3
"""Block unsafe replacement of a generated Vocus Blog catalogue.

This is deliberately local-only.  A fresh Vocus catalogue must first be
written to an isolated candidate site root, then compared with the currently
accepted site root before anyone copies it into a release worktree.  It does
not fetch Vocus, deploy, or write outside an optional local report file.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


SHA256 = re.compile(r"[a-f0-9]{64}")


def load_registry(root: Path) -> list[dict]:
    path = root / "data/blog/articles.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    articles = data.get("articles")
    if not isinstance(articles, list):
        raise ValueError(f"{path}: articles must be a list")
    reported = data.get("reported_public_article_count")
    if reported is not None and reported != len(articles):
        raise ValueError(f"{path}: reported public count does not match articles")
    return articles


def article_id(article: dict) -> str:
    value = str(article.get("vocus_article_id", ""))
    if not re.fullmatch(r"[a-f0-9]{24}", value):
        raise ValueError("article has missing or invalid vocus_article_id")
    return value


def index_articles(articles: list[dict]) -> dict[str, dict]:
    indexed = {article_id(article): article for article in articles}
    if len(indexed) != len(articles):
        raise ValueError("duplicate Vocus article IDs")
    return indexed


def image_map(article: dict) -> dict[str, str]:
    images = article.get("images", [])
    if not isinstance(images, list):
        raise ValueError("article images must be a list")
    result: dict[str, str] = {}
    for image in images:
        source = str(image.get("source_url", ""))
        digest = str(image.get("sha256", ""))
        if not source or not SHA256.fullmatch(digest):
            raise ValueError("article image lacks source URL or SHA-256")
        if source in result:
            raise ValueError("article repeats an original image URL")
        result[source] = digest
    return result


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_candidate_files(candidate_root: Path, candidate: dict[str, dict], errors: list[str]) -> None:
    for vocus_id, article in candidate.items():
        slug = str(article.get("slug", ""))
        page = candidate_root / "blog" / slug / "index.html"
        if not slug or not page.is_file():
            errors.append(f"{vocus_id}: missing candidate article page")
            continue
        page_html = page.read_text(encoding="utf-8")
        if str(article.get("vocus_url", "")) not in page_html:
            errors.append(f"{vocus_id}: candidate page lacks Vocus source URL")
        for image in article.get("images", []):
            image_path = candidate_root / "blog/media" / str(image.get("filename", ""))
            if not image_path.is_file() or sha256(image_path) != image.get("sha256"):
                errors.append(f"{vocus_id}: candidate original image hash mismatch")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a local Vocus Blog candidate before it can replace the accepted catalogue.")
    parser.add_argument("--baseline-site-root", type=Path, required=True)
    parser.add_argument("--candidate-site-root", type=Path, required=True)
    parser.add_argument("--report", type=Path, help="Optional local JSON report under the candidate root.")
    args = parser.parse_args()

    baseline_root = args.baseline_site_root.resolve()
    candidate_root = args.candidate_site_root.resolve()
    errors: list[str] = []
    try:
        baseline = index_articles(load_registry(baseline_root))
        candidate = index_articles(load_registry(candidate_root))
        missing = sorted(set(baseline) - set(candidate))
        if missing:
            errors.append("candidate removes accepted Vocus articles: " + ",".join(missing))
        for vocus_id in sorted(set(baseline) & set(candidate)):
            old, new = baseline[vocus_id], candidate[vocus_id]
            if old.get("vocus_url") != new.get("vocus_url"):
                errors.append(f"{vocus_id}: Vocus source URL changed")
            if old.get("source_sha256") != new.get("source_sha256"):
                errors.append(f"{vocus_id}: source hash changed; run published-evidence audit and create a new evidence version, never overwrite")
            old_images, new_images = image_map(old), image_map(new)
            for source, digest in old_images.items():
                if new_images.get(source) != digest:
                    errors.append(f"{vocus_id}: original image missing or changed: {source}")
        verify_candidate_files(candidate_root, candidate, errors)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        errors.append(str(error))
        baseline, candidate = {}, {}

    result = {
        "audit": "vocus-catalogue-transition",
        "overall": "PASS" if not errors else "BLOCK_SYNC_NO_OVERWRITE",
        "baseline_articles": len(baseline),
        "candidate_articles": len(candidate),
        "errors": errors,
        "external_write_attempted": False,
    }
    if args.report:
        report = args.report.resolve()
        if candidate_root not in report.parents:
            raise ValueError("report must stay inside candidate site root")
        report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    sys.exit(main())
