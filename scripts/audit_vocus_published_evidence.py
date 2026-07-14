#!/usr/bin/env python3
"""Block unsafe Vocus-to-site syncs when published evidence cannot be traced.

This audit is deliberately offline. It reads a published-evidence record, its
immutable archive, the website article registry, and an optional canonical
decision ledger. It never calls Vocus, changes website pages, deploys, or
reads credentials. A hash mismatch is reported as a *provenance mismatch*, not
as proof that the published article changed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import urlparse


SHA256 = re.compile(r"^[a-f0-9]{64}$")
ARTICLE_ID = re.compile(r"^[a-f0-9]{24}$")
SITE_BASE = "https://orikan347.github.io/taixin-website"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read JSON: {path}") from exc


def record_issue(issues: list[str], code: str) -> None:
    if code not in issues:
        issues.append(code)


def article_id_from_url(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "vocus.cc":
        return None
    match = re.fullmatch(r"/article/([a-f0-9]{24})", parsed.path)
    return match.group(1) if match else None


def text_of(node: dict) -> str:
    if node.get("type") == "linebreak":
        return "\n"
    if "text" in node:
        return str(node["text"])
    return "".join(text_of(child) for child in node.get("children", []) if isinstance(child, dict))


def normalized_archive_text(path: Path, title: str) -> str:
    source = path.read_text(encoding="utf-8")
    if source.startswith("---\n"):
        closing = source.find("\n---\n", 4)
        if closing != -1:
            source = source[closing + 5 :]
    source = re.sub(rf"^\s*#\s+{re.escape(title)}\s*\n", "", source)
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", source))


def public_snapshot_relationship(path: Path, *, archive_path: Path, title: str, registry_hash: str | None) -> dict:
    """Compare a local, read-only Vocus API response without retaining its text.

    This differentiates an archive-vs-public version difference from a mere
    registry serialization question. It does not fetch the API or alter either
    source; callers must provide a separately acquired public snapshot.
    """
    payload = load_json(path)
    article = payload.get("article", {})
    lexical_raw = article.get("lexicalObj")
    if article.get("status") != 2 or not isinstance(lexical_raw, str):
        raise ValueError("public snapshot is not a readable Vocus published article")
    lexical = json.loads(lexical_raw)
    children = lexical.get("root", {}).get("children", [])
    if not isinstance(children, list):
        raise ValueError("public snapshot lexical content is invalid")
    archive_text = normalized_archive_text(archive_path, title)
    public_text = re.sub(r"\s+", "", unicodedata.normalize("NFKC", "\n".join(text_of(node) for node in children if isinstance(node, dict))))
    public_hash = hashlib.sha256(lexical_raw.encode()).hexdigest()
    if archive_text == public_text:
        relationship = "ARCHIVE_TEXT_EXACTLY_MATCHES_LIVE_PUBLIC_TEXT"
    elif public_text.startswith(archive_text):
        relationship = "ARCHIVE_TEXT_IS_PREFIX_OF_LIVE_PUBLIC_TEXT"
    else:
        relationship = "ARCHIVE_TEXT_DIFFERS_FROM_LIVE_PUBLIC_TEXT"
    return {
        "status": article.get("status"),
        "live_lexical_hash_matches_registry": public_hash == registry_hash if registry_hash else False,
        "archive_to_public_relationship": relationship,
        "archive_normalized_characters": len(archive_text),
        "public_normalized_characters": len(public_text),
        "public_additional_characters_after_archive": max(0, len(public_text) - len(archive_text)) if public_text.startswith(archive_text) else None,
    }


def audit_record(record: dict, archive_root: Path, registry: dict, canonical_ledger: dict | None, public_snapshot: Path | None, *, allow_pending_vocus_canonical: bool) -> dict:
    """Return a no-write decision for one record.

    `SYNC_ALLOWED` is intentionally strict: all evidence must agree and a
    previously read-back canonical decision must exist. Anything uncertain is
    either a hard no-overwrite block or a manual canonical decision.
    """
    issues: list[str] = []
    manual_checks: list[str] = []
    record_id = str(record.get("record_id", ""))
    vocus = record.get("vocus", {})
    snapshot = record.get("source_snapshot", {})
    artifact = record.get("artifact", {})
    site = record.get("personal_site", {})
    expected_hash = str(snapshot.get("sha256", ""))
    article_id = str(vocus.get("article_id", ""))
    public_url = str(vocus.get("public_url", ""))
    slug = str(site.get("slug", ""))
    expected_site_url = f"{SITE_BASE}/blog/{slug}/" if re.fullmatch(r"[a-z0-9-]+", slug) else None

    if not record_id:
        record_issue(issues, "MISSING_RECORD_ID")
    if vocus.get("published_status") != 2:
        record_issue(issues, "NOT_PUBLISHED_STATUS_2")
    if not ARTICLE_ID.fullmatch(article_id) or article_id_from_url(public_url) != article_id:
        record_issue(issues, "INVALID_VOCUS_PUBLIC_EVIDENCE")
    if not SHA256.fullmatch(expected_hash) or artifact.get("content_sha256") != expected_hash:
        record_issue(issues, "INVALID_PUBLISHED_EVIDENCE_HASH")

    archive_actual_hash: str | None = None
    archive_relative = Path(str(snapshot.get("archive_relative_path", "")))
    archive_path = (archive_root / archive_relative).resolve()
    try:
        archive_path.relative_to(archive_root.resolve())
    except ValueError:
        record_issue(issues, "ARCHIVE_PATH_ESCAPES_ROOT")
    else:
        if not archive_path.is_file():
            record_issue(issues, "PUBLISHED_ARCHIVE_MISSING")
        else:
            archive_actual_hash = sha256(archive_path)
            if archive_actual_hash != expected_hash:
                record_issue(issues, "PUBLISHED_ARCHIVE_HASH_MISMATCH")

    matches = [
        article for article in registry.get("articles", [])
        if isinstance(article, dict) and article.get("vocus_article_id") == article_id
    ]
    registry_hash: str | None = None
    registry_url: str | None = None
    if len(matches) != 1:
        record_issue(issues, "REGISTRY_ARTICLE_NOT_UNIQUE")
    else:
        registry_hash = str(matches[0].get("source_sha256", ""))
        registry_url = str(matches[0].get("site_url", ""))
        if not SHA256.fullmatch(registry_hash):
            record_issue(issues, "REGISTRY_SOURCE_HASH_INVALID")
        elif registry_hash != expected_hash:
            record_issue(issues, "PUBLISHED_EVIDENCE_REGISTRY_HASH_MISMATCH")
            manual_checks.append("確認官網清冊 hash 的來源格式是否與已發布封存稿完全相同；未確認前不可覆寫文章。")
        if expected_site_url is None or registry_url != expected_site_url:
            record_issue(issues, "REGISTRY_SITE_URL_MISMATCH")

    canonical_status = "PENDING_MANUAL_CANONICAL_DECISION"
    if canonical_ledger is None:
        manual_checks.append("提供並核對 canonical 決策台帳；不能以預設值決定哪一站是主版本。")
    else:
        entries = canonical_ledger.get("entries", [])
        entries = entries if isinstance(entries, list) else []
        ledger_matches = [entry for entry in entries if isinstance(entry, dict) and entry.get("record_id") == record_id]
        if len(ledger_matches) != 1:
            record_issue(issues, "CANONICAL_LEDGER_RECORD_NOT_UNIQUE")
        else:
            entry = ledger_matches[0]
            verified = (
                entry.get("vocus_article_id") == article_id
                and entry.get("vocus_public_url") == public_url
                and entry.get("intended_primary_copy") == "PERSONAL_SITE"
                and entry.get("personal_site_article_url") == expected_site_url
                and entry.get("vocus_canonical_target") == expected_site_url
                and entry.get("vocus_setting_status") == "READBACK_MATCHED_PERSONAL_SITE"
                and entry.get("personal_site_self_canonical_status") == "READBACK_MATCHED_PERSONAL_SITE"
            )
            if verified:
                canonical_status = "READBACK_MATCHED_PERSONAL_SITE"
            else:
                manual_checks.append("在不改 Vocus 的前提下，人工讀回 Vocus 與個人站公開 HTML canonical；確認兩者皆指向同一篇個人站 URL 後，才把台帳狀態更新為已讀回。")

    public_comparison: dict | None = None
    if public_snapshot and archive_actual_hash == expected_hash:
        try:
            public_comparison = public_snapshot_relationship(public_snapshot, archive_path=archive_path, title=str(artifact.get("title", "")), registry_hash=registry_hash)
            if public_comparison["archive_to_public_relationship"] == "ARCHIVE_TEXT_IS_PREFIX_OF_LIVE_PUBLIC_TEXT":
                manual_checks.append("已確認公開 Vocus 版本含封存稿全文再加發布後文字；請建立新的公開版本 evidence record，不可改寫舊 archive hash。")
        except ValueError as exc:
            record_issue(issues, "PUBLIC_SNAPSHOT_INVALID")
            manual_checks.append(str(exc))

    public_snapshot_resolves_registry_lineage = bool(
        public_comparison
        and public_comparison["live_lexical_hash_matches_registry"]
        and public_comparison["archive_to_public_relationship"] in {
            "ARCHIVE_TEXT_EXACTLY_MATCHES_LIVE_PUBLIC_TEXT",
            "ARCHIVE_TEXT_IS_PREFIX_OF_LIVE_PUBLIC_TEXT",
        }
    )
    hard_block_codes = {
        "MISSING_RECORD_ID", "NOT_PUBLISHED_STATUS_2", "INVALID_VOCUS_PUBLIC_EVIDENCE",
        "INVALID_PUBLISHED_EVIDENCE_HASH", "ARCHIVE_PATH_ESCAPES_ROOT", "PUBLISHED_ARCHIVE_MISSING",
        "PUBLISHED_ARCHIVE_HASH_MISMATCH", "REGISTRY_ARTICLE_NOT_UNIQUE",
        "REGISTRY_SOURCE_HASH_INVALID",
        "REGISTRY_SITE_URL_MISMATCH", "PUBLIC_SNAPSHOT_INVALID",
    }
    if not public_snapshot_resolves_registry_lineage:
        hard_block_codes.add("PUBLISHED_EVIDENCE_REGISTRY_HASH_MISMATCH")
    if any(issue in hard_block_codes for issue in issues):
        decision = "BLOCK_SYNC_NO_OVERWRITE"
    elif canonical_status != "READBACK_MATCHED_PERSONAL_SITE":
        if allow_pending_vocus_canonical and public_snapshot_resolves_registry_lineage:
            decision = "PERSONAL_SITE_DEPLOY_ALLOWED_PENDING_VOCUS_CANONICAL"
            manual_checks.append("此決策只允許個人網站發布；Vocus canonical 未讀回前，不得修改 Vocus 或宣稱跨站 canonical 已完成。")
        else:
            decision = "PENDING_MANUAL_CANONICAL_DECISION"
    else:
        decision = "SYNC_ALLOWED_EVIDENCE_MATCHED"

    return {
        "record_id": record_id,
        "vocus_article_id": article_id,
        "decision": decision,
        "finding": "PROVENANCE_HASH_MISMATCH_NOT_CONTENT_DRIFT_PROVEN" if "PUBLISHED_EVIDENCE_REGISTRY_HASH_MISMATCH" in issues else "NO_PROVENANCE_HASH_MISMATCH_DETECTED",
        "published_evidence": {"status": vocus.get("published_status"), "archive_hash_matches_record": archive_actual_hash == expected_hash if archive_actual_hash else False},
        "registry": {"article_count_for_vocus_id": len(matches), "hash_matches_published_evidence": registry_hash == expected_hash if registry_hash else False, "site_url_matches_record": registry_url == expected_site_url if registry_url else False},
        "public_snapshot_comparison": public_comparison,
        "public_snapshot_resolves_registry_lineage": public_snapshot_resolves_registry_lineage,
        "canonical": {"status": canonical_status, "required_before_sync": ["Vocus public HTML canonical readback", "personal-site public HTML canonical readback", "owner-approved canonical ledger entry"]},
        "issues": issues,
        "manual_checks": manual_checks,
        "external_write_attempted": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit immutable published Vocus evidence before any website sync.")
    parser.add_argument("--record", type=Path, action="append", required=True, help="Published evidence record JSON; repeat for multiple articles.")
    parser.add_argument("--archive-root", type=Path, required=True, help="Root that contains immutable published archives.")
    parser.add_argument("--site-root", type=Path, default=Path("."), help="Website root containing data/blog/articles.json.")
    parser.add_argument("--canonical-ledger", type=Path, help="Optional, read-only canonical decision ledger JSON.")
    parser.add_argument("--public-snapshot", type=Path, help="Optional read-only Vocus API JSON already acquired by an approved public GET.")
    parser.add_argument("--allow-pending-vocus-canonical", action="store_true", help="Owner-approved personal-site deployment only; never authorizes a Vocus write or canonical claim.")
    parser.add_argument("--report", type=Path, help="Optional JSON report path under --site-root; this is the only write this audit permits.")
    args = parser.parse_args()

    root = args.site_root.resolve()
    registry_path = root / "data/blog/articles.json"
    registry = load_json(registry_path)
    canonical_ledger = load_json(args.canonical_ledger.resolve()) if args.canonical_ledger else None
    public_snapshot = args.public_snapshot.resolve() if args.public_snapshot else None
    results = [audit_record(load_json(record.resolve()), args.archive_root.resolve(), registry, canonical_ledger, public_snapshot, allow_pending_vocus_canonical=args.allow_pending_vocus_canonical) for record in args.record]
    decisions = {result["decision"] for result in results}
    if decisions == {"SYNC_ALLOWED_EVIDENCE_MATCHED"}:
        overall = "PASS"
    elif decisions == {"PERSONAL_SITE_DEPLOY_ALLOWED_PENDING_VOCUS_CANONICAL"}:
        overall = "PASS_FOR_PERSONAL_SITE_DEPLOY_PENDING_VOCUS_CANONICAL"
    else:
        overall = "MANUAL_REVIEW_REQUIRED"
    report = {
        "audit": "vocus-published-evidence",
        "overall": overall,
        "policy": "never overwrite a website article when published evidence, immutable archive, registry hash, or canonical decision is unresolved",
        "allow_pending_vocus_canonical": args.allow_pending_vocus_canonical,
        "results": results,
        "external_write_attempted": False,
    }
    if args.report:
        report_path = args.report.resolve()
        try:
            report_path.relative_to(root)
        except ValueError as exc:
            raise ValueError("--report must be under --site-root") from exc
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if overall in {"PASS", "PASS_FOR_PERSONAL_SITE_DEPLOY_PENDING_VOCUS_CANONICAL"} else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValueError as error:
        print(f"FAIL: {error}", file=sys.stderr)
        raise SystemExit(2)
