# 驗證摘要

狀態：`LOCAL_REAL_SOURCE_REPLAY_PASS_LIVE_DEPLOY_PENDING`

## 真實來源與同步

- Vocus 發布紀錄：`ORI-SYNC-20260713-VOCUS-6A5439EC`。
- 標題：〈德性能力結果金字塔〉；Vocus 公開網址：`https://vocus.cc/article/6a5439ecfd8978000133a2d3`。
- Vocus 驗證器的只讀回放：PASS，公開狀態 `2`、封存原文 SHA-256 `dea64db34efb530e40db3ade391e1958d8331c41f6ceed84b367f1623c2494fe`、發布紀錄與 canonical 台帳均一致。
- 官網產生器先以 `--write` 前 dry-run 驗證，再實際寫入 8 個本機輸出；沒有呼叫 Vocus、部署或外部寫入。

## 自動化與靜態驗收

- `python3 -m py_compile scripts/sync_vocus_article.py scripts/verify_vocus_blog_sync.py`：PASS（Python cache 指向 `/private/tmp`）。
- `scripts/sync_vocus_article.py ... --write`：PASS，產生實際文章 `/blog/virtue-capability-results-pyramid/`、列表、RSS、sitemap、文章索引、台帳、驗證報告與 artifact passport。
- `scripts/verify_vocus_blog_sync.py ...`：PASS（8 個檢查）。它驗證來源 SHA-256、唯一發布紀錄、文章 title／canonical／H1／Vocus 連結／CTA、BlogPosting／BreadcrumbList、RSS、sitemap、robots 與 artifact hashes。
- `git diff --check`：PASS。
- 隱私檢查：產生器阻擋 token、API key、bearer header、私鑰與本機絕對路徑寫進公開輸出；本輪未讀取客戶資料或 secrets。

## 瀏覽器端到端驗收

- 本機 HTTP 預覽：`http://127.0.0.1:4173/blog/virtue-capability-results-pyramid/` 實際讀回 H1、Vocus 原始發布連結、文章封面、`../../#contact` CTA、BlogPosting 與 BreadcrumbList。
- 390×844 手機寬度：H1 與 CTA 可見、無水平溢位；文章列表卡片可見且可到實際文章。
- Vocus CDN 圖片在本機瀏覽器無法讀取時，封面與列表會自動退回官網既有 `img/og-cover.jpg`，避免破圖；Vocus 圖片原始網址仍保留在來源紀錄與 Schema。
- 官網首頁已新增「Latest Insights／不只教你成交，也陪你把自己走穩」區塊，直接顯示〈德性能力結果金字塔〉、摘要、金句、閱讀按鈕與全部文章入口。桌面與 390px 手機檢查均確認新卡片不超出自身容器；首頁原有其他區塊的全域水平寬度行為未改動。

## 尚未完成與風險

- 尚未部署，因此尚未驗證 GitHub Pages live DOM、Search Console／Bing 索引、爬蟲讀回與 live RSS/sitemap。
- Vocus 帳號 canonical 設定與公開 HTML canonical 讀回仍為 `PENDING_LIVE_AUTHOR_SETTING_READBACK`。官網已輸出自己的 canonical，但不可宣稱兩站已完成 canonical 合併。
- 這篇文章的 Vocus 圖片 alt 仍屬 `PENDING_VISUAL_REVIEW`；已確保有非空 alt 與顯示備援。
- 每日完全自動同步尚待獲授權後，於 Vocus `status == 2` 成功流程後接入本 repo 的產生器；這一輪未修改 Vocus 排程或腳本。
- 尚未部署到 GitHub Pages，因此公開官網尚未有首頁文章區塊，也尚未有 `/blog/` 路徑；公開站驗收必須在部署後重跑。

## 回滾

1. 用 `apply_patch` 刪除 `blog/virtue-capability-results-pyramid/index.html`、`data/blog/articles.json` 和本輪的 `scripts/` 同步工具。
2. 以本次變更前版本回復 `blog/index.html`、`rss.xml`、`sitemap.xml`、`blog/styles.css`、內部台帳與首頁兩處「文章」導覽連結。
3. 不需要回復外部服務，因為本輪沒有部署、push、Vocus 寫入或任何外部設定變更。
