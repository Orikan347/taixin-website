#!/usr/bin/env python3
"""End-to-end tests for the public Blog discovery readback verifier."""

from __future__ import annotations

import functools
import json
import subprocess
import sys
import tempfile
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


SCRIPT = Path(__file__).with_name("verify_public_blog_discovery.py")


class DiscoveryReadbackTests(unittest.TestCase):
    def fixture(self, root: Path) -> tuple[ThreadingHTTPServer, threading.Thread, str]:
        (root / "data/blog").mkdir(parents=True)
        (root / "blog/article-a").mkdir(parents=True)
        (root / "blog/article-b").mkdir(parents=True)
        handler = functools.partial(SimpleHTTPRequestHandler, directory=str(root))
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"
        articles = [
            {"slug": "article-a", "site_url": base + "/blog/article-a/", "vocus_url": "https://vocus.cc/article/" + "a" * 24},
            {"slug": "article-b", "site_url": base + "/blog/article-b/", "vocus_url": "https://vocus.cc/article/" + "b" * 24},
        ]
        (root / "data/blog/articles.json").write_text(json.dumps({"articles": articles}), encoding="utf-8")
        (root / "robots.txt").write_text("User-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nSitemap: " + base + "/sitemap.xml\n", encoding="utf-8")
        sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url>\n    <loc>{a['site_url']}</loc>\n  </url>\n" for a in articles) + "</urlset>\n"
        (root / "sitemap.xml").write_text(sitemap, encoding="utf-8")
        rss = "<?xml version=\"1.0\"?><rss><channel>" + "".join(f"<item><link>{a['site_url']}</link></item>" for a in articles) + "</channel></rss>"
        (root / "rss.xml").write_text(rss, encoding="utf-8")
        (root / "blog/index.html").write_text(f'<link rel="canonical" href="{base}/blog/"><aside class="author-card">我是李泰欣</aside>', encoding="utf-8")
        for article in articles:
            body = f'<meta name="robots" content="index,follow"><link rel="canonical" href="{article["site_url"]}"><script>{{"@type":"BlogPosting"}}</script><p>本文作者：</p><a href="{article["vocus_url"]}">Vocus</a>'
            (root / "blog" / article["slug"] / "index.html").write_text(body, encoding="utf-8")
        return server, thread, base

    def run_check(self, root: Path, base: str, *extra: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run([sys.executable, str(SCRIPT), "--site-root", str(root), "--base-url", base, *extra], text=True, capture_output=True, check=False)

    def test_readback_passes_a_complete_public_catalogue(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            server, _thread, base = self.fixture(root)
            try:
                result = self.run_check(root, base, "--cache-bust", "fake-data", "--report", "report.json")
                report = json.loads(result.stdout)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(report["overall"], "PASS")
                self.assertTrue((root / "report.json").is_file())
            finally:
                server.shutdown()
                server.server_close()

    def test_readback_rejects_a_public_article_with_noindex(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            server, _thread, base = self.fixture(root)
            try:
                page = root / "blog/article-b/index.html"
                page.write_text(page.read_text(encoding="utf-8") + '<meta name="robots" content="noindex">', encoding="utf-8")
                result = self.run_check(root, base)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn("unexpected noindex", result.stdout)
            finally:
                server.shutdown()
                server.server_close()

    def test_readback_uses_public_catalogue_when_local_worktree_is_stale(self) -> None:
        with tempfile.TemporaryDirectory() as public_temporary, tempfile.TemporaryDirectory() as local_temporary:
            public_root = Path(public_temporary)
            local_root = Path(local_temporary)
            server, _thread, base = self.fixture(public_root)
            try:
                (local_root / "data/blog").mkdir(parents=True)
                (local_root / "data/blog/articles.json").write_text(
                    json.dumps({"articles": [{"slug": "old-only"}]}), encoding="utf-8"
                )
                result = self.run_check(local_root, base, "--expected-public-count", "2")
                report = json.loads(result.stdout)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(report["catalogue_source"], "public")
                self.assertEqual(report["article_count"], 2)
                self.assertEqual(report["local_catalogue_count"], 1)
                self.assertFalse(report["local_catalogue_matches_public"])
            finally:
                server.shutdown()
                server.server_close()


if __name__ == "__main__":
    unittest.main()
