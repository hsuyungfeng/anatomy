---
phase: phase-4
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - doc/tools/*.html
  - doc/tests/legacy/*
  - assets/scripts/eye-label-mapper.js
  - data/eye-coordinates.json
autonomous: true
requirements:
  - IMP-02
must_haves:
  truths:
    - "專案根目錄只剩產品檔案：index.html、manifest.json、sw.js、AGENTS.md、CLAUDE.md、DailyProgress.md、M2.5Plan.md，以及 assets/ data/ pages/ docs/ doc/ openspec/ .planning/ 目錄"
    - "搬到 doc/tools/ 的工具頁，透過 http://127.0.0.1:PORT/doc/tools/<頁面>.html 開啟後能正常載入圖片、腳本與 JSON"
    - "所有搬移都使用 git mv，保留檔案歷史"
---

<objective>
依使用者規則「文檔與測試程式都放在 doc/ 下」，把根目錄的測試腳本、除錯/校準工具頁搬進 doc/，並修正搬移後會失效的相對路徑。
</objective>

<context>
根目錄目前的雜檔：

**測試腳本（13 個）** → `doc/tests/legacy/`
test-all-parts.py, test-app.py, test-body2.py, test-body.py, test-browser.py, test-check.py, test-chest.py, test-click.py, test-debug2.py, test-debug.py, test-headless.py, test-port9000.py, test-size.py
（這些是舊的手動 Playwright 腳本，寫死 localhost:9000/8080 或 `/home/hsu/...` 路徑。**只搬移，不修改內容**。）

**既有 `tests/` 目錄**（10 個 JS/HTML 測試）→ `doc/tests/legacy-js/`（用 `git mv tests doc/tests/legacy-js`）。
搬移前先 `grep -rn "tests/" --include=*.{js,html,json,md,py} .` 找出引用，一併修正路徑（`.planning/`、`openspec/` 和 `docs/history/` 裡的歷史文件除外，那些只是紀錄）。

**工具頁（9 個）** → `doc/tools/`
auto-calibrate-teeth.html, auto-tooth-detection.html, debug-tooth-detection.html, eye-calibration.html, eye-label-mapping-tool.html, eye-text-recognition.html, tooth-calibration.html, visualize-coordinates.html, index-simplified.html

搬移後需要修正的相對路徑（已知的部分，**請再用 grep 全面檢查每個檔案的 `src=`、`href=`、`url(`、`fetch(`、`new Image`、`.src =`**）：
- `debug-tooth-detection.html:40` `src="assets/scripts/dental-image-mapper.js"` → `../../assets/...`
- `eye-label-mapping-tool.html:372`、`eye-text-recognition.html:334` `src="assets/images/eye/3Deye.png"` → `../../assets/...`
- `fetch('/data/...')` 是絕對路徑，**不用改**。
- `index-simplified.html` 引用的 CSS/JS 也要一併修正。
- CDN（https://）不用改。

會提到工具檔名的文字（只改路徑文字，不改邏輯）：
- `assets/scripts/eye-label-mapper.js:436` 註解 `eye-label-mapping-tool.html` → `doc/tools/eye-label-mapping-tool.html`
- `data/eye-coordinates.json` 裡的 `eye-calibration.html`（notes 和 instructions 欄位）→ `doc/tools/eye-calibration.html`
  （修改 JSON 後用 `python3 -m json.tool data/eye-coordinates.json > /dev/null` 確認格式正確。）

**不要動**：`docs/`（既有文檔目錄，不在這次範圍內）、`index.html`、`pages/`、`sw.js`、`manifest.json`。
</context>

<tasks>

<task type="auto">
  <name>Task 1：搬移測試腳本</name>
  <files>doc/tests/legacy/, doc/tests/legacy-js/</files>
  <action>用 git mv 搬移 13 個 test-*.py 和 tests/ 目錄；新增 `doc/tests/legacy/README.md`，說明這些是舊的手動腳本、不在 run_all.py 內、執行前要自行啟動伺服器（port 9000）。</action>
  <verify>ls test-*.py 2>/dev/null | wc -l 輸出 0；ls tests 失敗</verify>
</task>

<task type="auto">
  <name>Task 2：搬移工具頁並修正路徑</name>
  <files>doc/tools/*.html</files>
  <action>用 git mv 搬移 9 個 HTML，修正所有相對資源路徑；新增 `doc/tools/README.md` 列出每個工具的用途（從各頁 `<title>` 和內容歸納）與開啟網址 `http://localhost:8000/doc/tools/xxx.html`。</action>
  <verify>
新增 `doc/tests/tools_load_test.py`（並加進 run_all.py）：對 doc/tools/ 的每一頁，用 playwright 開啟並監聽 `response` 事件，斷言所有**同源**請求都沒有 404，而且沒有 pageerror。
  </verify>
</task>

<task type="auto">
  <name>Task 3：更新文字引用</name>
  <files>assets/scripts/eye-label-mapper.js, data/eye-coordinates.json</files>
  <action>依 context 修改路徑文字。</action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 全部通過（註解改變會影響 toString，但 eye-label-mapper.js 不在 MedicalRecordApp 原型內，所以快照應該不變）</verify>
</task>

</tasks>

<verification>
- `ls *.html` 只剩 `index.html`
- `ls *.py` 沒有輸出
- `python3 doc/tests/run_all.py --with-snapshot` 全部通過
</verification>

<commit>
chore: 將根目錄測試腳本與工具頁搬移至 doc/ 並修正相對路徑
</commit>
