# Phase 4 Plan 02 執行總結：雜檔搬移至 doc/ 與路徑修正

## 執行摘要

本階段已成功將專案根目錄中的雜檔整理搬移至 `doc/` 目錄：
1. 13 個舊版 Python 測試腳本搬移至 `doc/tests/legacy/`，並加入使用說明文檔。
2. 既有 `tests/` 目錄（10 個 JS/HTML 測試）搬移至 `doc/tests/legacy-js/`。
3. 9 個影像標註與除錯工具頁搬移至 `doc/tools/`，修正相對資源引用路徑（包含腳本與圖片），並建立工具列表說明文檔。
4. 修正 `assets/scripts/eye-label-mapper.js` 與 `data/eye-coordinates.json` 中提及工具頁的文字與路徑。
5. 新增 `doc/tests/tools_load_test.py` 並納入 `run_all.py`，驗證所有工具頁開啟時均無同源 404 與無 JavaScript 執行期錯誤。

所有搬移均使用 `git mv` 進行，完整保留 Git 歷史紀錄。專案根目錄目前僅剩產品檔案與標準目錄。

---

## 搬移與修改的檔案清單

### 搬移檔案 (git mv)
- **測試腳本 (13 個)**：
  `test-*.py` → [`doc/tests/legacy/test-*.py`](file:///home/amd/anatomy/doc/tests/legacy/)
- **既有測試目錄 (10 個檔案)**：
  `tests/` → [`doc/tests/legacy-js/`](file:///home/amd/anatomy/doc/tests/legacy-js/)
- **工具頁 (9 個)**：
  `*.html` → [`doc/tools/*.html`](file:///home/amd/anatomy/doc/tools/)

### 新增檔案
- [`doc/tests/legacy/README.md`](file:///home/amd/anatomy/doc/tests/legacy/README.md)：舊版手動測試腳本說明。
- [`doc/tools/README.md`](file:///home/amd/anatomy/doc/tools/README.md)：輔助工具用途清單與開啟連結。
- [`doc/tests/tools_load_test.py`](file:///home/amd/anatomy/doc/tests/tools_load_test.py)：工具頁同源 404 與錯誤自動化檢查測試。

### 修改檔案
- [`doc/tools/debug-tooth-detection.html`](file:///home/amd/anatomy/doc/tools/debug-tooth-detection.html)：修正 `dental-image-mapper.js` 相對路徑為 `../../assets/...`。
- [`doc/tools/eye-label-mapping-tool.html`](file:///home/amd/anatomy/doc/tools/eye-label-mapping-tool.html)：修正 `3Deye.png` 相對路徑為 `../../assets/...`。
- [`doc/tools/eye-text-recognition.html`](file:///home/amd/anatomy/doc/tools/eye-text-recognition.html)：修正 `3Deye.png` 相對路徑（包含 `<img>` 與 `Tesseract.recognize` 呼叫）為 `../../assets/...`。
- [`assets/scripts/eye-label-mapper.js`](file:///home/amd/anatomy/assets/scripts/eye-label-mapper.js)：註解中的工具路徑更新為 `doc/tools/eye-label-mapping-tool.html`。
- [`data/eye-coordinates.json`](file:///home/amd/anatomy/data/eye-coordinates.json)：校正說明與指南中的路徑更新為 `doc/tools/eye-calibration.html`。
- [`doc/tests/run_all.py`](file:///home/amd/anatomy/doc/tests/run_all.py)：納入 `tools_load_test.TESTS` 測試集合。

---

## 驗證輸出

### 1. 根目錄檔案檢查
```bash
$ ls *.html
index.html

$ ls *.py
ls: cannot access '*.py': No such file or directory
```

### 2. 自動化測試與快照驗證輸出
```bash
$ python3 doc/tests/run_all.py --with-snapshot
==================================================
 醫療病歷系統 — Phase 4 自動化測試
==================================================
啟動本機測試伺服器...
測試伺服器就緒: http://127.0.0.1:8765

--- 執行冒煙測試 ---
[PASS] test_page_loads_without_errors
[PASS] test_switch_systems
[SKIP] test_records_render_from_storage
       原因: 既有 bug：切換至身體系統（handleSystemTabClick）時僅呼叫 updateRecordList，未呼叫 loadAndDisplayRecords()，導致 localStorage['medicalRecords'] 未被讀取並渲染至清單
[PASS] test_theme_toggle

--- 執行工具頁載入測試 ---
[PASS] test_tools_load_without_404_or_errors

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 62 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 5, 失敗 0, 跳過 1
==================================================
```
結束碼為 `0`。

---

## 發現的問題（疑似 Bug 但未修改）

1. `eye-text-recognition.html` 內除了 `<img>` 標籤的 `src` 外，JavaScript 中 `Tesseract.recognize('assets/images/eye/3Deye.png')` 亦使用了相對路徑，搬遷至 `doc/tools/` 後若未修正會導致 Tesseract 請求 404；已在搬移修正中一併更新為 `../../assets/images/eye/3Deye.png`。
2. `tests/` 下舊有之 `test-dental-mapper.html` 與 `test-disease-form.html` 原本即存在 `assets/scripts/...` 相對引用路徑（未帶 `../`），因其為歷史廢棄測試且未在任何自動化流程中被引用，依計畫保持原樣移至 `doc/tests/legacy-js/`。

---

## 偏離計畫之處與原因

無偏離計畫。完全遵循禁止修改範圍外邏輯、使用 `git mv` 保留歷史，以及驗證無 404 之規範。
