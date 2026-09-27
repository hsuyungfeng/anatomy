# Phase 6：病歷儲存整併 — 執行交接說明（給 Antigravity）

> 入口檔。請**依序**執行下面 2 份計畫，每份都要完整讀過再動手。完成後由 Claude Code 審查。

## 背景（一句話）
目前病歷同時存在兩套 localStorage 儲存（扁平的 `medicalRecords` 和巢狀的 `anatomy-record-*`），清單、圖上標記、備份、統計讀的是不同來源，所以會互相不一致；而且每次載入頁面都會產生一筆空病歷。這個階段把它們整併成**一套**。

## 執行順序

| # | 計畫 | 內容 | 需求 |
|---|------|------|------|
| 1 | [6-01-PLAN.md](6-01-PLAN.md) | 只寫測試（TDD 紅燈），不改產品程式碼 | STORE-01～04 |
| 2 | [6-02-PLAN.md](6-02-PLAN.md) | RecordManager 成為唯一存取層，並自動遷移舊資料；app／統計改用它 | STORE-01～04 |

## 共同規則（同 Phase 4、5）

1. 註解、提交訊息、SUMMARY 一律使用繁體中文；文檔與測試放在 `doc/`。不新增相依套件。
2. **TDD**：6-01 的測試必須在 master 上先證明會失敗，並把輸出貼進 SUMMARY。
3. 每份計畫結束時：跑 `<verification>`、寫 `.planning/phases/phase-6/6-0N-SUMMARY.md`（做了什麼、修改的檔案、修改前後的測試輸出、發現的問題、偏離計畫之處），然後照指定訊息 commit。**不要 push。**
4. 同一個驗證失敗最多修 3 次，還是不行就停止並寫進 SUMMARY。
5. 禁止：放寬斷言、刪除或跳過測試、**在 6-02 修改 6-01 的測試**（認為測試有錯就停下來說明）、快照差異沒核對就 `--write`、修改 `.planning/` 的 PLAN 檔、順手修範圍外的問題。
6. 新程式碼不要有 console.log；使用者資料插入 innerHTML 一律 `escapeHtml`。
7. **資料安全第一**：遷移和還原都不可以在失敗時弄丟使用者的現有資料。遷移前的原始資料一律保留在 `anatomy-record-legacy-backup`。

## 開始前 / 完成後

```bash
git status && git checkout -b phase-6-unify-storage
# ...執行...
python3 doc/tests/run_all.py --with-snapshot
git log --oneline master..HEAD
```
把最後兩個輸出附在 `6-02-SUMMARY.md` 的最後面，然後通知使用者請 Claude Code 審查。
