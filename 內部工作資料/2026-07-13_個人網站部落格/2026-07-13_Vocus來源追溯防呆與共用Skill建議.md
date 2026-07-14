# Vocus 已發布證據 → 官網同步：來源追溯防呆

日期：2026-07-13  
階段：`FUNCTIONAL_TEST_READY`（防呆已完成可重跑測試；未發布、未改 Vocus）

## 本次範圍

- 處理已發布 Vocus 文章同步到泰欣個人官網時的「證據 hash 不一致」防呆。
- 新增可重跑、唯讀 audit；讓既有的單篇同步器拒絕不安全覆寫。
- 未修改 Vocus、GitHub Pages、Cloudflare、付款、secrets、`l2_current_truth.json`，也未讀取客戶資料。

## 今日確認的事實

| 證據層 | 結果 | 可下的結論 |
|---|---|---|
| 已發布紀錄與 immutable archive | 一致 | 已發布證據本身可追溯。 |
| 官網 36 篇清冊同一 Vocus ID 的來源 hash | 不一致 | 來源追溯鏈不一致；單看 hash **不能推論內容已變更**。 |
| 2026-07-14 唯讀公開 Vocus snapshot | 已比對 | 公開文完整保留 archive，並在結尾新增發布後 CTA；官網清冊 hash 與公開版 Lexical 原文一致。 |
| canonical 決策台帳 | 尚待公開 HTML 讀回 | 不能自動決定 Vocus 或個人站誰是主版本。 |

本次 audit 的決策是 `BLOCK_SYNC_NO_OVERWRITE`。現有官網文章、清冊、RSS、sitemap 與台帳均被保留，沒有重寫。

## 新的可執行規則

1. 先確認 `published_status == 2`、公開 URL、發布紀錄 hash 與 immutable archive hash。
2. 再比對同一 Vocus article ID 在官網清冊的來源 hash 與文章 URL。
3. 任一來源 hash 不同、同 ID 不唯一、archive 不存在或不符時，停止同步：`BLOCK_SYNC_NO_OVERWRITE`。
4. 證據一致後，仍要由人讀回 Vocus 與個人站公開 HTML canonical，並在 canonical 台帳留下已讀回的同一個個人站 URL；否則為 `PENDING_MANUAL_CANONICAL_DECISION`。
5. 只有全部條件一致才是 `SYNC_ALLOWED_EVIDENCE_MATCHED`。若確有新版內容，新增新版 record、archive 與 hash；不修改舊證據。

## 可重跑 audit

工具：`scripts/audit_vocus_published_evidence.py`

- 僅讀取：發布紀錄、immutable archive、`data/blog/articles.json`、canonical 決策台帳。
- 唯一可選寫入是指定在官網專案內的 JSON audit 報告；不寫網站頁面、不連 Vocus、不部署。
- 本次真實結果已保存於 `2026-07-13_Vocus來源追溯稽核.json`。

## 待人工確認

1. 建立新的公開版 evidence record：保留現有 archive hash，另記錄已讀回的公開 Vocus Lexical hash 與「原稿為公開版前綴、其後追加 CTA」關係；不可改寫舊紀錄。
2. 決定官網是否要完整保留這段已發布 CTA；若要，需以公開版 evidence record 重新產生候選文章並讓使用者驗收。
3. 由網站擁有者讀回 Vocus 與個人站公開 HTML canonical，確認兩者的 canonical 決策後才更新台帳與開始候選同步。

## 今日學習與共用 Skill 建議（候選，未修改共用 Skill）

建議將以下規則加入 `TaixinMemoryHub/tools/vocus-publisher/SKILL.md` 與其安裝副本：

> Vocus 已發布文章要同步至任何自有官網前，先以 immutable archive、網站清冊、公開版 Lexical snapshot 與 canonical 決策做四層比對。hash 不同只先標示 `PROVENANCE_HASH_MISMATCH_NOT_CONTENT_DRIFT_PROVEN`；公開 snapshot 比對後才可說明是格式、追加 CTA 或內容版本差異。禁止自動覆寫、重算後覆蓋舊 hash、或直接改 Vocus。原稿 hash 與公開版 hash 必須並存。只有對應 evidence 版本已確認且兩站 canonical 已公開讀回，才可產生同步候選。

此建議屬跨專案共用規則，依範圍限制未直接寫入共用 Hub／Skill，交由主窗口確認後整合。

## 端到端測試證據

- `scripts/test_audit_vocus_published_evidence.py`：3 個去識別化案例 PASS：證據一致可通過、清冊 hash 不同會阻擋覆寫、canonical 未讀回要求人工決策。
- 真實已發布紀錄 audit：回傳 `MANUAL_REVIEW_REQUIRED`、`BLOCK_SYNC_NO_OVERWRITE`，且 `external_write_attempted: false`。
- 真實公開 Vocus snapshot 唯讀比對：archive 是公開版全文的前綴，公開版尾端另有發布後 CTA；官網清冊 hash 與公開版 Lexical 原文一致。
- 真實單篇同步器 dry-run：在發現同篇來源 hash 衝突後以失敗結束；文章頁、清冊、RSS、sitemap、同步台帳的 SHA-256 前後一致，無覆寫。
- `python3 -m py_compile` 與 `git diff --check`：PASS。

## 修改檔案

- `scripts/audit_vocus_published_evidence.py`：唯讀 evidence／canonical audit。
- `scripts/test_audit_vocus_published_evidence.py`：去識別化端到端測試。
- `scripts/sync_vocus_article.py`：既有文章 evidence hash 衝突時拒絕覆寫。
- `Vocus官網同步與發布SOP.md`、`README.md`：把 audit 納入固定同步 Gate。
- `2026-07-13_Vocus來源追溯稽核.json`：本次真實唯讀稽核結果。

## 回滾

若需撤回本次本機防呆，使用 Git 對本輪檔案建立反轉提交；不得以回滾為由覆寫 Vocus、刪除 immutable archive 或直接改寫歷史 evidence。正式發布前仍需在乾淨 worktree 重新跑 audit 與同步驗收。
