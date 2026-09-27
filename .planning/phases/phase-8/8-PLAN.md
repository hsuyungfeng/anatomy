# Phase 8：牙齒系統改用結構化 SVG 牙位圖 — 執行交接說明（給 Antigravity）

> 入口檔。請**依序**執行 3 份計畫，每份都要完整讀過再動手。完成後由 Claude Code 審查。
> 專案慣例請先讀根目錄的 `AGENTS.md`。

## 為什麼要做
在點陣圖上點擊、再換算座標辨識牙齒，有兩個已確認的 bug：螢幕縮放 ≠ 100% 時換算錯誤；乳牙圖檔根本不存在。
使用者已確認改用**結構化 SVG 牙位圖**：每顆牙是獨立元素，點擊直接取得 FDI，完全不需要座標換算。原本的點陣圖保留為**只能看的參考圖**。
原型在 `doc/prototypes/odontogram/`（請先開來看：`python3 -m http.server 8000` → http://localhost:8000/doc/prototypes/odontogram/）。

| # | 計畫 | 內容 | 需求 |
|---|------|------|------|
| 1 | [8-01-PLAN.md](8-01-PLAN.md) | 只寫測試（TDD 紅燈）：每顆牙在螢幕縮放 1、1.25、2 下都能開啟正確的模態 | SVG-01～04 |
| 2 | [8-02-PLAN.md](8-02-PLAN.md) | 牙位圖模組、整合進 app、病歷標示、參考圖切換 | SVG-01～04 |
| 3 | [8-03-PLAN.md](8-03-PLAN.md) | 移除牙齒座標辨識死碼 | SVG-05 |

## 共同規則（同前幾個階段，詳見 AGENTS.md）
1. TDD：8-01 的測試必須先在 master 上證明會失敗，把輸出貼進 SUMMARY。
2. 每份計畫完成後寫 `8-0N-SUMMARY.md`，照指定訊息 commit。**不要 push。**
3. 同一個驗證失敗最多修 3 次，還是不行就停止並寫進 SUMMARY。
4. 禁止：放寬斷言、跳過測試、快照差異沒核對就 `--write`、修改 PLAN 檔、順手修範圍外的問題。
5. **修改既有測試只限 8-02 第 5 點列出的三處**，而且只能改開啟模態的方式，不能改斷言。
6. 修改 assets/、data/、index.html 後執行 `python3 doc/tests/bump_cache.py`。
7. **只動牙齒系統**。眼睛、身體系統維持 canvas 與座標辨識，不要修改（之後的階段會用同樣方式處理）。

## 開始前 / 完成後
```bash
git status && git checkout -b phase-8-svg-teeth
# ...執行...
python3 doc/tests/run_all.py --with-snapshot
git log --oneline master..HEAD
```
把最後兩個輸出附在 `8-03-SUMMARY.md` 的最後面，並列出 8-02 Task 4 的截圖路徑，然後通知使用者請 Claude Code 審查。
