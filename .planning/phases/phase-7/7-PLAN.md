# Phase 7：PWA 更新修正、清單顯示修正、CI — 執行交接說明（給 Antigravity）

> 入口檔。請**依序**執行 3 份計畫，每份都要完整讀過再動手。完成後由 Claude Code 審查。
> 專案慣例請先讀根目錄的 `AGENTS.md`（語言、目錄、架構禁令、測試規則）。

| # | 計畫 | 內容 | 需求 |
|---|------|------|------|
| 1 | [7-01-PLAN.md](7-01-PLAN.md) | **重要**：Service Worker 改成程式碼 network-first，讓更新真的送到使用者手上；完整預先快取（含 CDN）讓離線可用；加上快取版本守門測試 | PWA-01～03 |
| 2 | [7-02-PLAN.md](7-02-PLAN.md) | 病歷清單側別標籤（身體不再顯示「右眼」）、位置名稱不重複；關閉舊待辦 | UI-01～02 |
| 3 | [7-03-PLAN.md](7-03-PLAN.md) | GitHub Actions CI | CI-01 |

## 共同規則（同 Phase 4～6，詳見 AGENTS.md）
1. TDD：先寫測試並證明它在修改前會失敗，把輸出貼進 SUMMARY。
2. 每份計畫完成後寫 `7-0N-SUMMARY.md`，照指定訊息 commit。**不要 push。**
3. 同一個驗證失敗最多修 3 次，還是不行就停止並寫進 SUMMARY。
4. 禁止：放寬斷言、跳過測試、快照差異沒核對就 `--write`、修改 PLAN 檔、順手修範圍外的問題。
5. **從 7-01 起，只要修改 assets/、data/、index.html、manifest.json，就要執行 `python3 doc/tests/bump_cache.py`。**

## 不在本階段範圍
- 點擊辨識牙齒位置失敗（座標換算錯誤、乳牙圖檔不存在）：**不要修**。這個問題會在後續「結構化 SVG 解剖圖」階段一併從根本解決。

## 開始前 / 完成後
```bash
git status && git checkout -b phase-7-pwa-ui-ci
# ...執行...
python3 doc/tests/run_all.py --with-snapshot
git log --oneline master..HEAD
```
把最後兩個輸出附在 `7-03-SUMMARY.md` 的最後面，然後通知使用者請 Claude Code 審查。
