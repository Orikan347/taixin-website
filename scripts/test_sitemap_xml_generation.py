#!/usr/bin/env python3
"""Regression tests for the crawler-facing sitemap generator."""

from __future__ import annotations

import importlib.util
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


SCRIPT = Path(__file__).with_name("sync_vocus_catalog.py")
SPEC = importlib.util.spec_from_file_location("sync_vocus_catalog", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class SitemapXmlGenerationTests(unittest.TestCase):
    def test_sitemap_is_indented_utf8_xml_with_parseable_urls(self) -> None:
        output = MODULE.sitemap_xml([
            ("/blog/", "2026-07-14"),
            ("/blog/example-and-more/", "2026-07-13"),
        ])

        self.assertTrue(output.startswith('<?xml version="1.0" encoding="UTF-8"?>\n'))
        self.assertIn("\n  <url>\n", output)
        self.assertTrue(output.endswith("</urlset>\n"))

        root = ET.fromstring(output)
        namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
        locations = [node.text for node in root.findall(namespace + "url/" + namespace + "loc")]
        self.assertEqual(locations, [
            "https://orikan347.github.io/taixin-website/blog/",
            "https://orikan347.github.io/taixin-website/blog/example-and-more/",
        ])


if __name__ == "__main__":
    unittest.main()
