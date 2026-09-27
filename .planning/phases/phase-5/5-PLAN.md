# Phase 5：病歷流程 Bug 修復 — 執行交接說明（給 Antigravity）

> 入口檔。請**依序**執行下面 2 份計畫，每份都要完整讀過再動手。完成後由 Claude Code 審查。

## 執行順序

| # | 計畫 | 內容 | 需求 |
|---|------|------|------|
| 1 | [5-01-PLAN.md](5-01-PLAN.md) | 恢復三系統共用的病歷儲存／篩選／顯示流程（修復牙齒、眼睛記錄遺失，身體記錄不顯示，'tooth'/'teeth' 不一致） | FIX-01～03 |
| 2 | [5-02-PLAN.md](5-02-PLAN.md) | 修正 ocr-handler.js 的 `Object.forEach` | FIX-04 |

## 共同規則（跟 Phase 4 相同）

1. 註解、提交訊息、SUMMARY 一律使用繁體中文；文檔與測試放在 `doc/`。
2. 不新增任何相依套件。
3. **TDD**：每份計畫都要先寫測試、確認測試失敗、把失敗輸出貼進 SUMMARY，然後才修。
4. 每份計畫結束時：跑 `<verification>`、寫 `.planning/phases/phase-5/5-0N-SUMMARY.md`（做了什麼、修改的檔案、修復前的失敗輸出、修復後的測試輸出、發現的問題、偏離計畫之處），然後照指定訊息 commit。**不要 push。**
5. 同一個驗證失敗最多修 3 次，還是不行就停止並寫進 SUMMARY。
6. 禁止：放寬斷言、刪除或跳過測試、快照差異沒核對就 `--write`、修改 `.planning/` 的 PLAN 檔、順手修範圍外的問題（記錄就好）。
7. 維持 Phase 4 的慣例：新加或恢復的程式碼**不要有 console.log**；使用者資料插入 innerHTML 一律 `escapeHtml`。

## 開始前 / 完成後

```bash
git status && git checkout -b phase-5-fix-records
# ...執行...
python3 doc/tests/run_all.py --with-snapshot
git log --oneline master..HEAD
```
把最後兩個輸出附在 `5-02-SUMMARY.md` 的最後面，然後通知使用者請 Claude Code 審查。
