# Vocus → 個人官網 Blog 同步與發布 SOP

目的：只同步已公開的 Vocus 文章到個人官網，保留原文、原圖與來源連結；發布前一定先在可操作的本機版本驗收。

## 固定階段

1. `FUNCTIONAL_TEST_READY`：已完成本機完整同步與自動驗證，可讓使用者操作。
2. `PENDING_USER_ACCEPTANCE`：使用者正在檢查文章列表、圖片、文章頁、手機版與 CTA；不可發布。
3. `PENDING_RELEASE_SECURITY`：使用者已同意發布，正在乾淨 worktree 驗證與公開讀回。
4. `RELEASE_READY`：公開網站、RSS、sitemap 已讀回；搜尋收錄提交或待平台處理狀態另行記錄。

## 來源追溯硬 Gate（先比對、後決定，絕不覆寫）

已發布紀錄的 immutable archive、已發布證據 hash、官網清冊 hash 是三個不同證據層。它們 hash 不同時，只能稱為「來源追溯鏈不一致」；**不可直接推論 Vocus 文章被修改，也不可自動覆寫官網文章或改寫已發布證據**。

每次要把有已發布紀錄的文章寫入既有官網前，先執行：

```sh
python3 scripts/audit_vocus_published_evidence.py \
  --record "內部工作資料/2026-07-13_個人網站部落格/vocus-published-records/<record>.json" \
  --archive-root "/Users/macminim4/Desktop/Claude cowork/26-06-20_Vocus部落格自動上架系統" \
  --site-root . \
  --canonical-ledger "/Users/macminim4/Desktop/Claude cowork/26-06-20_Vocus部落格自動上架系統/03_工作檔/vocus_personal_site_sync/canonical_decision_ledger.json"
```

- 只有 `SYNC_ALLOWED_EVIDENCE_MATCHED` 才能進行候選同步。
- `BLOCK_SYNC_NO_OVERWRITE`：停止；保留現有官網頁、原 published evidence 與 archive，不改 Vocus、不重算後覆蓋 hash。
- `PENDING_MANUAL_CANONICAL_DECISION`：先由人讀回 Vocus 與個人站公開 HTML canonical，確認主版本 URL，再更新決策台帳；未讀回不可同步。
- `scripts/sync_vocus_article.py` 也會在同一篇既有官網文章的 provenance hash 不同時直接拒絕執行，防止跳過 audit 後覆寫。

若可取得經核准的唯讀 Vocus API JSON snapshot，audit 可加上 `--public-snapshot <snapshot.json>`。它只輸出關係與字數，不保存公開文章正文；用來確認 archive 是不是公開版的前綴、或兩者確實不同。

人工確認後若公開版含有原稿以外的 CTA、編輯或其他文字，原稿 hash 與公開版 Lexical hash 必須並存為兩層證據，並新增一份新的 published evidence record／版本註記；不得修改舊 archive 或把任一 hash 覆蓋成另一個。

## 本機完整同步（唯讀 Vocus）

在乾淨 worktree 或暫存測試資料夾執行：

```sh
python3 scripts/sync_vocus_catalog.py \
  --creator-id 694518cffd89780001ebc82b \
  --baseline-site-root . \
  --candidate-site-root /private/tmp/taixin-vocus-blog-stage \
  --write

python3 scripts/verify_vocus_catalog.py \
  --site-root /private/tmp/taixin-vocus-blog-stage \
  --expected-public-count <本次公開 API 實際篇數>
```

這些命令只讀取 Vocus 公開文章與公開圖片；不登入、不修改 Vocus、不讀取客戶資料或 secrets，也不會部署網站。

## 必須通過的驗收門檻

- 公開清冊數量與本次唯讀 API 讀回的 `--expected-public-count` 一致；不可沿用前一天的篇數。
- 每篇都有唯一語意網址、meta description、主題、canonical、`BlogPosting` 與 Vocus 原始發布頁連結。
- 每張 Vocus 圖片下載後的 SHA-256 與清冊一致。
- RSS、sitemap、robots、llms.txt 含所有文章。
- 每篇 Vocus ID 舊網址都有導向頁。
- 實際瀏覽器測試：文章列表、任一歷史文章、手機寬度、CTA、RSS／sitemap 皆可讀。

## 發布前後

只有使用者明確確認「可以發布」後，才可在乾淨 worktree 寫入正式網站、提交 Git 變更並發布。發布後必須從公開網址讀回：文章數、指定歷史文章的圖片／canonical／schema、robots、RSS、sitemap。

Google Search Console 與 Bing Webmaster Tools 的 sitemap 提交或收錄檢查，需由網站擁有者登入既有帳號完成；收錄有平台處理時間，不能以本機 PASS 宣稱已收錄。

## 回滾

發布異常時，對該次同步 commit 執行 `git revert <commit>` 後重新公開讀回。不可直接刪除已公開文章目錄或覆寫歷史記錄。
