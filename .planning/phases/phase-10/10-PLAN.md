# Phase 10：版面、時間戳與英文介面修正 — 執行交接說明（給 Antigravity）

> 入口檔。請**依序**執行 3 份計畫，每份都要完整讀過再動手。完成後由 Claude Code 審查。
> 專案慣例請先讀根目錄的 `AGENTS.md`。

## 為什麼要做
Phase 9 完成後，Claude 審查時實測發現：
1. **工具列在常見解析度被裁切**（1366×768 下三個系統都是）→ 可能無法切換到左眼、無法縮放。**最優先。**
2. 說明文字被裁切，且內容已過時。
3. 缺少時間的舊記錄顯示「無效的時間戳」。
4. 英文模式下仍有 68 處中文。

| # | 計畫 | 內容 | 需求 |
|---|------|------|------|
| 1 | [10-01-PLAN.md](10-01-PLAN.md) | 只寫測試（TDD 紅燈） | POL-01～04 |
| 2 | [10-02-PLAN.md](10-02-PLAN.md) | 版面修正、說明文字、時間戳 | POL-01～03 |
| 3 | [10-03-PLAN.md](10-03-PLAN.md) | 英文介面（翻譯字典、結構圖、表單、通知） | POL-04 |

## 共同規則（詳見 AGENTS.md）
1. TDD：10-01 的測試先在 master 上證明會失敗，輸出貼進 SUMMARY。
2. 每份計畫完成後寫 `10-0N-SUMMARY.md`，照指定訊息 commit。**不要 push。**
3. 同一個驗證失敗最多修 3 次，還是不行就停止並寫進 SUMMARY。
4. 禁止：放寬斷言、跳過測試、快照差異沒核對就 `--write`、修改 PLAN 檔、順手修範圍外的問題。**本階段不需要修改任何既有測試**；若既有測試失敗，停下來說明。
5. 修改 assets/、data/、index.html 後執行 `python3 doc/tests/bump_cache.py`。
6. **已存病歷的內容不翻譯、不改寫**（locationName 維持原文）。
7. 10-02 期間 i18n_test 仍失敗是預期的；**10-03 結束時必須 0 失敗、0 跳過**。

## 開始前 / 完成後
```bash
git status && git checkout -b phase-10-polish
# ...執行...
python3 doc/tests/run_all.py --with-snapshot
git log --oneline master..HEAD
```
把最後兩個輸出附在 `10-03-SUMMARY.md` 的最後面，列出所有截圖路徑，然後通知使用者請 Claude Code 審查。
