# Phase 4：程式碼品質改善 — 執行交接說明（給 Antigravity）

> 這份是入口檔。請**依序**執行下面 4 份計畫，每份都要完整讀過再開始動手。
> 執行完成後由 Claude Code 審查，所以請確實留下可以驗證的證據（測試輸出、SUMMARY）。

## 執行順序（嚴格依序，不可平行）

| # | 計畫 | 內容 | 需求 |
|---|------|------|------|
| 1 | [4-01-PLAN.md](4-01-PLAN.md) | 建立 `doc/tests/` 自動化測試與原型方法快照基準 | IMP-04 |
| 2 | [4-02-PLAN.md](4-02-PLAN.md) | 根目錄雜檔搬到 `doc/`，修正相對路徑 | IMP-02 |
| 3 | [4-03-PLAN.md](4-03-PLAN.md) | 將 main.js 拆成 `assets/scripts/app/*.js`（純搬移）＋ 移除 console.log | IMP-01 |
| 4 | [4-04-PLAN.md](4-04-PLAN.md) | 修復病歷渲染的儲存型 XSS | IMP-03 |

## 共同規則

1. **語言**：程式碼註解、提交訊息、SUMMARY 一律使用繁體中文。
2. **文檔與測試放在 `doc/`**（不是 `docs/`）。
3. **不新增任何相依套件**（不用 npm install、不用 pip install）。只能用 Python 標準庫 + 已安裝的 `playwright`，以及 Node 24 內建功能。
4. **每份計畫結束時**：
   - 執行計畫中的 `<verification>`，貼上實際的指令輸出
   - 寫 `.planning/phases/phase-4/4-0N-SUMMARY.md`，包含：做了什麼、修改的檔案、測試輸出、**發現的問題**（疑似 bug 但沒修）、偏離計畫之處與原因
   - 用計畫中指定的訊息 `git commit`（SUMMARY 一起提交）。**不要 push、不要開分支以外的遠端操作。**
5. **遇到驗證失敗時**：最多修正 3 次；還是失敗就停止，把卡住的狀況寫進 SUMMARY，不要繼續下一份計畫。
6. **禁止事項**：
   - 不要為了讓測試通過而放寬斷言或刪除測試
   - 不要在 4-03 用 `--write` 蓋掉快照來掩蓋差異
   - 不要順手修正計畫範圍外的 bug（記錄在 SUMMARY 就好）
   - 不要修改 `.planning/` 裡的 PLAN 檔

## 開始前

```bash
git status            # 必須是乾淨的
git checkout -b phase-4-improve
```

## 全部完成後

```bash
python3 doc/tests/run_all.py --with-snapshot
git log --oneline master..HEAD
```
把兩個輸出附在 `4-04-SUMMARY.md` 的最後面，然後通知使用者請 Claude Code 審查。
