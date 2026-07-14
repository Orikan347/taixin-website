# 泰欣個人網站＋部落格｜Vocus 已發布文章同步

目標是讓每天早上 Vocus 已經成功公開的文章，以同一份已驗證發布紀錄，同步產生到泰欣個人官網的 Blog。這裡保存同步台帳、發布紀錄副本、驗證結果與可追溯雜湊；不保存帳密、token、客戶資料或外部帳號資料。

## 每日同步規則

只在下列條件都成立時，才可同步官網：

1. Vocus 發布讀回 `status == 2`，且有公開網址。
2. 已發布封存原文存在，並與發布紀錄的 SHA-256 一致。
3. 發布紀錄指定 `PERSONAL_SITE_INTENDED_PRIMARY`。
4. 官網產生器的 dry-run 通過，再加上 `--write` 寫入本機網站檔案。

若同一篇文章已有官網清冊項目，還必須先跑 `scripts/audit_vocus_published_evidence.py`。已發布證據、immutable archive、官網清冊三者任一 hash 不同，狀態就是 `BLOCK_SYNC_NO_OVERWRITE`：不覆寫、不改 Vocus，先人工確認來源格式與 canonical，再決定是否建立新版本。

執行範例（只寫本機官網，不會部署或呼叫 Vocus）：

```bash
python3 scripts/sync_vocus_article.py \
  --record "內部工作資料/2026-07-13_個人網站部落格/vocus-published-records/<record>.json" \
  --archive-root "/Users/macminim4/Desktop/Claude cowork/26-06-20_Vocus部落格自動上架系統" \
  --site-root . \
  --write
```

它會更新：

- `blog/<slug>/index.html`：SEO、BlogPosting、BreadcrumbList、Vocus 來源連結與站內 CTA。
- `blog/index.html`：最新文章卡片。
- `data/blog/articles.json`：可累積的官網文章索引。
- `rss.xml`、`sitemap.xml`：搜尋與訂閱入口。
- 本資料夾的同步台帳、驗證報告與 artifact passport。

## 自動化接線邊界

本 repo 已完成可重跑的「已發布 Vocus → 官網檔案」產生器。每天的 Vocus 發布流程尚未被改動；下一步若要完全自動化，只能在它取得 `status == 2`、公開網址與封存原文後，呼叫上述命令。這需要另行授權修改 Vocus 發布專案／排程，不能在沒有驗證成功時提前執行。

## 已完成回放

- 發布紀錄：`ORI-SYNC-20260713-VOCUS-6A5439EC`
- 文章：〈德性能力結果金字塔〉
- Vocus 原始發布頁：`https://vocus.cc/article/6a5439ecfd8978000133a2d3`
- 官網目標網址：`https://orikan347.github.io/taixin-website/blog/virtue-capability-results-pyramid/`
- 原文 SHA-256：`dea64db34efb530e40db3ade391e1958d8331c41f6ceed84b367f1623c2494fe`

實際驗收證據見 `verification-summary.md`；本機寫入結果見 `sync-run-report.json`。
