#!/usr/bin/env python3
"""Validate a de-identified Search Console/Bing aggregate snapshot.

The CSV contains page-level aggregates only.  This tool never reads browser
profiles, analytics credentials, query strings, visitor identifiers, or raw
customer data.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import date
from pathlib import Path


REQUIRED_COLUMNS = ("source", "period_start", "period_end", "page_url", "impressions", "clicks", "average_position", "conversions")
ALLOWED_SOURCES = {"google_search_console", "bing_webmaster"}


def fail(message: str) -> ValueError:
    return ValueError(message)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate de-identified search-performance aggregates for the Blog.")
    parser.add_argument("--site-root", type=Path, default=Path("."))
    parser.add_argument("--snapshot", type=Path, required=True, help="CSV exported or manually transcribed from an owner-approved aggregate report.")
    parser.add_argument("--report", type=Path, help="Optional JSON report under --site-root.")
    args = parser.parse_args()

    root = args.site_root.resolve()
    registry = json.loads((root / "data/blog/articles.json").read_text(encoding="utf-8"))
    canonical_urls = {str(article.get("site_url", "")) for article in registry.get("articles", [])}
    errors: list[str] = []
    totals = {"rows": 0, "impressions": 0, "clicks": 0, "conversions": 0}
    source_totals: dict[str, dict[str, int]] = {}
    try:
        with args.snapshot.open(encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames is None or tuple(reader.fieldnames) != REQUIRED_COLUMNS:
                raise fail("CSV columns must be exactly: " + ",".join(REQUIRED_COLUMNS))
            for number, row in enumerate(reader, start=2):
                source = row["source"].strip()
                page_url = row["page_url"].strip()
                if source not in ALLOWED_SOURCES:
                    errors.append(f"row {number}: invalid source")
                try:
                    start = date.fromisoformat(row["period_start"])
                    end = date.fromisoformat(row["period_end"])
                    if end < start:
                        errors.append(f"row {number}: period_end precedes period_start")
                except ValueError:
                    errors.append(f"row {number}: invalid ISO date")
                if page_url not in canonical_urls:
                    errors.append(f"row {number}: page_url is not a Blog canonical URL")
                try:
                    impressions = int(row["impressions"])
                    clicks = int(row["clicks"])
                    conversions = int(row["conversions"])
                    position = float(row["average_position"])
                    if min(impressions, clicks, conversions) < 0 or position < 0 or clicks > impressions:
                        errors.append(f"row {number}: impossible metric values")
                except ValueError:
                    errors.append(f"row {number}: invalid numeric metric")
                    continue
                totals["rows"] += 1
                totals["impressions"] += impressions
                totals["clicks"] += clicks
                totals["conversions"] += conversions
                bucket = source_totals.setdefault(source, {"impressions": 0, "clicks": 0, "conversions": 0})
                bucket["impressions"] += impressions
                bucket["clicks"] += clicks
                bucket["conversions"] += conversions
    except OSError as exc:
        raise fail(f"cannot read snapshot: {exc}") from exc

    report = {
        "audit": "blog-search-metrics-snapshot",
        "overall": "PASS" if not errors else "FAIL",
        "totals": totals,
        "weighted_ctr": (totals["clicks"] / totals["impressions"]) if totals["impressions"] else None,
        "by_source": source_totals,
        "errors": errors,
        "privacy": "aggregate-only; no queries, visitor IDs, credentials, or customer data accepted",
        "external_write_attempted": False,
    }
    if args.report:
        report_path = args.report.resolve() if args.report.is_absolute() else (root / args.report).resolve()
        try:
            report_path.relative_to(root)
        except ValueError as exc:
            raise fail("--report must be under --site-root") from exc
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(json.dumps({"overall": "FAIL", "errors": [str(error)], "external_write_attempted": False}, ensure_ascii=False))
        raise SystemExit(2)
