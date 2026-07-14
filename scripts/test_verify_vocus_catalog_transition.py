#!/usr/bin/env python3
"""De-identified end-to-end tests for the Vocus catalogue replacement gate."""

from __future__ import annotations

import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("verify_vocus_catalog_transition.py")
ARTICLE_ID = "a" * 24
SECOND_ID = "b" * 24


def write_site(root: Path, articles: list[dict]) -> None:
    (root / "data/blog").mkdir(parents=True)
    (root / "blog/media").mkdir(parents=True)
    for article in articles:
        slug = article["slug"]
        page = root / "blog" / slug / "index.html"
        page.parent.mkdir(parents=True)
        page.write_text(article["vocus_url"], encoding="utf-8")
        for image in article["images"]:
            raw = image.pop("_raw")
            (root / "blog/media" / image["filename"]).write_bytes(raw)
    (root / "data/blog/articles.json").write_text(json.dumps({"reported_public_article_count": len(articles), "articles": articles}), encoding="utf-8")


def article(article_id: str, slug: str, source_hash: str = "1" * 64, image_raw: bytes = b"deidentified-image") -> dict:
    return {"vocus_article_id": article_id, "slug": slug, "vocus_url": f"https://vocus.cc/article/{article_id}", "source_sha256": source_hash, "images": [{"source_url": f"https://images.vocus.cc/{article_id}.jpg", "filename": f"{article_id}.jpg", "sha256": hashlib.sha256(image_raw).hexdigest(), "_raw": image_raw}]}


class TransitionGateTests(unittest.TestCase):
    def run_gate(self, baseline: Path, candidate: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(["python3", str(SCRIPT), "--baseline-site-root", str(baseline), "--candidate-site-root", str(candidate)], text=True, capture_output=True, check=False)

    def test_accepts_additive_candidate_with_identical_existing_sources(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); baseline, candidate = root / "baseline", root / "candidate"
            write_site(baseline, [article(ARTICLE_ID, "existing")])
            write_site(candidate, [article(ARTICLE_ID, "existing"), article(SECOND_ID, "new")])
            result = self.run_gate(baseline, candidate)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(json.loads(result.stdout)["overall"], "PASS")

    def test_blocks_removing_an_accepted_article(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); baseline, candidate = root / "baseline", root / "candidate"
            write_site(baseline, [article(ARTICLE_ID, "existing")])
            write_site(candidate, [])
            result = self.run_gate(baseline, candidate)
            self.assertEqual(result.returncode, 2)
            self.assertIn("removes accepted", result.stdout)

    def test_blocks_changed_source_hash_or_original_image(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); baseline, candidate = root / "baseline", root / "candidate"
            write_site(baseline, [article(ARTICLE_ID, "existing")])
            write_site(candidate, [article(ARTICLE_ID, "existing", source_hash="2" * 64, image_raw=b"changed")])
            result = self.run_gate(baseline, candidate)
            self.assertEqual(result.returncode, 2)
            self.assertIn("source hash changed", result.stdout)
            self.assertIn("original image missing or changed", result.stdout)


if __name__ == "__main__":
    unittest.main()
