# Phase 9：眼睛與身體改用結構化 SVG — 執行交接說明（給 Antigravity）

> 入口檔。請**依序**執行 5 份計畫，每份都要完整讀過再動手。完成後由 Claude Code 審查。
> 專案慣例請先讀根目錄的 `AGENTS.md`。Phase 8 的牙齒整合（`assets/scripts/odontogram.js`、app-tooth.js）是這次的範本，請先看過。

## 為什麼要做
眼睛、身體目前仍用「點陣圖＋座標換算」辨識，有與 Phase 8 之前牙齒相同的問題（螢幕縮放換算錯誤、辨識不穩定）。使用者已確認原型：
- 眼睛：剖面圖＋正面淚器小圖，OD／OS 切換，保留 5 個新增結構（結膜、前房、黃斑部、視神經盤、眼瞼）
- 身體：**寫實輪廓版**，正面＋背面，男／女體型
原型：`doc/prototypes/`（`python3 -m http.server 8000` → http://localhost:8000/doc/prototypes/）

| # | 計畫 | 內容 | 需求 |
|---|------|------|------|
| 1 | [9-01-PLAN.md](9-01-PLAN.md) | 只寫測試（TDD 紅燈） | 全部 |
| 2 | [9-02-PLAN.md](9-02-PLAN.md) | 共用基礎：SVG 縮放平移、通用參考圖、**舊記錄 ID 對應**、身體名稱修正 | SVG-09、SVG-10 |
| 3 | [9-03-PLAN.md](9-03-PLAN.md) | 眼睛整合 | SVG-06、SVG-08 |
| 4 | [9-04-PLAN.md](9-04-PLAN.md) | 身體整合（含放大臉部） | SVG-07、SVG-08 |
| 5 | [9-05-PLAN.md](9-05-PLAN.md) | 5 個介面小問題＋死碼清理 | UI-03、SVG-10 |

## 共同規則（詳見 AGENTS.md）
1. TDD：9-01 的測試先在 master 上證明會失敗，輸出貼進 SUMMARY。
2. 每份計畫完成後寫 `9-0N-SUMMARY.md`，照指定訊息 commit。**不要 push。**
3. 同一個驗證失敗最多修 3 次，還是不行就停止並寫進 SUMMARY。
4. 禁止：放寬斷言、跳過測試、快照差異沒核對就 `--write`、修改 PLAN 檔、順手修範圍外的問題。
5. **修改既有測試只限 9-03、9-04 第 3 點明列的地方**。
6. 修改 assets/、data/、index.html 後執行 `python3 doc/tests/bump_cache.py`。
7. **舊記錄一律不改寫**：ID 對應是讀取時計算。
8. 9-02～9-04 期間，後續計畫才會通過的測試仍失敗是預期的，請在各 SUMMARY 列出；**9-05 結束時必須 0 失敗、0 跳過**。

## 開始前 / 完成後
```bash
git status && git checkout -b phase-9-svg-eye-body
# ...執行...
python3 doc/tests/run_all.py --with-snapshot
git log --oneline master..HEAD
```
把最後兩個輸出附在 `9-05-SUMMARY.md` 的最後面，列出 9-04 Task 4 的截圖路徑，然後通知使用者請 Claude Code 審查。
