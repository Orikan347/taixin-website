#!/usr/bin/env python3
"""Audit the Blog operating loop without hiding external-platform gaps.

This local-only gate combines durable evidence created by the independent
sync, public-readback and owner-account steps.  A crawler-facing PASS never
becomes a false claim that Google, Bing or cross-domain canonical settings are
complete.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


INTERNAL = Path("內部工作資料/2026-07-13_個人網站部落格")
CANONICAL_READY = "READBACK_MATCHED_PERSONAL_SITE_FOR_ALL_PUBLIC_ARTICLES"


def load_json(root: Path, path: Path) -> dict:
    resolved = path.resolve() if path.is_absolute() else (root / path).resolve()
    try:
        resolved.relative_to(root.resolve())
    except ValueError as exc:
        raise ValueError(f"evidence must stay under --site-root: {path}") from exc
    return json.loads(resolved.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit the end-to-end Blog operating closure.")
    parser.add_argument("--site-root", type=Path, default=Path("."))
    parser.add_argument("--expected-public-count", type=int, required=True)
    parser.add_argument("--public-readback", type=Path, default=INTERNAL / "public-discovery-readback.json")
    parser.add_argument("--transition-readback", type=Path, default=INTERNAL / "vocus-catalog-transition-readback.json")
    parser.add_argument("--canonical-readback", type=Path, default=INTERNAL / "vocus-canonical-readback.json")
    parser.add_argument("--search-owner-readback", type=Path, default=INTERNAL / "search-owner-readback.json")
    parser.add_argument("--metrics-report", type=Path, default=INTERNAL / "search-performance.report.json")
    parser.add_argument("--report", type=Path, default=INTERNAL / "operational-closure-status.json")
    args = parser.parse_args()

    root = args.site_root.resolve()
    failures: list[str] = []
    pending: list[str] = []

    try:
        public = load_json(root, args.public_readback)
        public_ok = (
            public.get("overall") == "PASS"
            and public.get("article_count") == args.expected_public_count
            and public.get("googlebot_sitemap_http") == 200
            and isinstance(public.get("googlebot_sitemap_url_count"), int)
            and public.get("googlebot_sitemap_url_count") >= args.expected_public_count
        )
        if not public_ok:
            failures.append("public crawler-facing readback is incomplete or stale")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        public = {}
        failures.append(f"cannot read public readback: {exc}")

    try:
        transition = load_json(root, args.transition_readback)
        if transition.get("overall") != "PASS" or transition.get("baseline_articles") != args.expected_public_count or transition.get("candidate_articles") != args.expected_public_count:
            failures.append("Vocus candidate transition is not approved")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        transition = {}
        failures.append(f"cannot read Vocus transition readback: {exc}")

    try:
        canonical = load_json(root, args.canonical_readback)
        if canonical.get("decision") != CANONICAL_READY:
            pending.append("Vocus-to-personal-site cross-domain canonical is not owner-readback matched")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        canonical = {}
        failures.append(f"cannot read canonical readback: {exc}")

    try:
        owner = load_json(root, args.search_owner_readback)
        google = owner.get("google_search_console", {})
        bing = owner.get("bing_webmaster", {})
        if google.get("property_ownership") != "VERIFIED" or google.get("sitemap_status") != "SUCCESS":
            pending.append("Google Search Console sitemap is not owner-readback successful")
        if bing.get("status") != "SUCCESS":
            pending.append("Bing Webmaster property and sitemap are not owner-readback successful")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        owner = {}
        failures.append(f"cannot read search-owner readback: {exc}")

    try:
        metrics = load_json(root, args.metrics_report)
        if metrics.get("overall") != "PASS":
            pending.append("first de-identified search-performance aggregate is not verified")
    except FileNotFoundError:
        metrics = {}
        pending.append("first de-identified search-performance aggregate is not available")
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        metrics = {}
        failures.append(f"cannot read search-performance report: {exc}")

    phase = "FUNCTIONAL_TEST_READY" if failures else ("PENDING_RELEASE_SECURITY" if pending else "RELEASE_READY")
    report = {
        "audit": "blog-operational-closure",
        "phase": phase,
        "overall": "PASS" if phase == "RELEASE_READY" else "PENDING" if not failures else "FAIL",
        "expected_public_articles": args.expected_public_count,
        "checks": {
            "public_readback": public.get("overall"),
            "transition_readback": transition.get("overall"),
            "vocus_canonical": canonical.get("decision"),
            "google_sitemap": owner.get("google_search_console", {}).get("sitemap_status"),
            "bing": owner.get("bing_webmaster", {}).get("status"),
            "metrics": metrics.get("overall"),
        },
        "failures": failures,
        "pending": pending,
        "external_write_attempted": False,
    }
    report_path = args.report.resolve() if args.report.is_absolute() else (root / args.report).resolve()
    try:
        report_path.relative_to(root)
    except ValueError as exc:
        raise ValueError("--report must stay under --site-root") from exc
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["overall"] == "PASS" else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(json.dumps({"overall": "FAIL", "errors": [str(error)], "external_write_attempted": False}, ensure_ascii=False))
        raise SystemExit(2)
