#!/usr/bin/env python3
"""Verify that a Blog release commit is clean, scoped, and evidence-approved.

This is a local Git gate. It never contacts GitHub, Vocus, or a deployment
provider, and it never changes the worktree. It is intended to run in the
clean release worktree immediately before a Blog-only commit is pushed.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


DEFAULT_ALLOWED = (
    "blog/",
    "data/blog/articles.json",
    "rss.xml",
    "sitemap.xml",
    "robots.txt",
    "llms.txt",
    "404.html",
    "scripts/sync_vocus_catalog.py",
    "scripts/verify_vocus_catalog.py",
    "scripts/sync_vocus_article.py",
    "scripts/verify_vocus_blog_sync.py",
    "scripts/audit_vocus_published_evidence.py",
    "scripts/verify_blog_release_scope.py",
    "scripts/test_audit_vocus_published_evidence.py",
    "scripts/test_verify_blog_release_scope.py",
    "內部工作資料/2026-07-13_個人網站部落格/",
)


def git(root: Path, *args: str) -> str:
    result = subprocess.run(["git", "-c", "core.quotepath=false", *args], cwd=root, text=True, capture_output=True, check=False)
    if result.returncode:
        raise ValueError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def allowed(path: str, patterns: tuple[str, ...]) -> bool:
    return any(path.startswith(pattern) if pattern.endswith("/") else path == pattern for pattern in patterns)


def audit_is_approved(path: Path, *, allow_pending_vocus_canonical: bool) -> tuple[bool, str]:
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return False, f"cannot read evidence audit: {path} ({exc})"
    results = report.get("results", [])
    decisions = {"SYNC_ALLOWED_EVIDENCE_MATCHED"}
    expected_overall = "PASS"
    if allow_pending_vocus_canonical:
        decisions.add("PERSONAL_SITE_DEPLOY_ALLOWED_PENDING_VOCUS_CANONICAL")
        expected_overall = "PASS_FOR_PERSONAL_SITE_DEPLOY_PENDING_VOCUS_CANONICAL"
    approved = (
        report.get("overall") in {"PASS", expected_overall}
        and isinstance(results, list)
        and bool(results)
        and all(item.get("decision") in decisions for item in results if isinstance(item, dict))
        and all(isinstance(item, dict) for item in results)
    )
    return approved, "" if approved else "evidence audit is not approved for this release mode"


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a clean, Blog-only release commit before push.")
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--base-ref", default="origin/main", help="Approved clean-release base ref.")
    parser.add_argument("--candidate-ref", default="HEAD", help="Single Blog release commit or branch tip to inspect.")
    parser.add_argument("--evidence-audit", type=Path, action="append", required=True, help="PASS evidence audit JSON; repeat for independent audit sets.")
    parser.add_argument("--allow-pending-vocus-canonical", action="store_true", help="Accept an owner-approved personal-site-only audit; does not authorize Vocus changes.")
    parser.add_argument("--allow", action="append", default=[], help="Additional exact path or directory prefix ending in /. ")
    args = parser.parse_args()

    root = args.repo_root.resolve()
    errors: list[str] = []
    try:
        dirty = git(root, "status", "--porcelain")
        if dirty.strip():
            errors.append("worktree is not clean")
        names = [name for name in git(root, "diff", "--name-only", f"{args.base_ref}..{args.candidate_ref}").splitlines() if name]
    except ValueError as exc:
        errors.append(str(exc))
        names = []

    allowed_paths = tuple(DEFAULT_ALLOWED) + tuple(args.allow)
    if not names:
        errors.append("release candidate has no changes relative to base")
    disallowed = [name for name in names if not allowed(name, allowed_paths)]
    if disallowed:
        errors.append("disallowed release paths: " + ", ".join(disallowed))

    audit_results: list[dict[str, str | bool]] = []
    for audit_path in args.evidence_audit:
        approved, reason = audit_is_approved(audit_path.resolve(), allow_pending_vocus_canonical=args.allow_pending_vocus_canonical)
        audit_results.append({"path": str(audit_path), "approved": approved, "reason": reason})
        if not approved:
            errors.append(f"evidence audit rejected: {audit_path}")

    report = {
        "overall": "PASS" if not errors else "FAIL",
        "base_ref": args.base_ref,
        "candidate_ref": args.candidate_ref,
        "changed_paths": names,
        "disallowed_paths": disallowed,
        "evidence_audits": audit_results,
        "allow_pending_vocus_canonical": args.allow_pending_vocus_canonical,
        "errors": errors,
        "external_write_attempted": False,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as error:
        print(json.dumps({"overall": "FAIL", "errors": [str(error)], "external_write_attempted": False}, ensure_ascii=False))
        raise SystemExit(2)
