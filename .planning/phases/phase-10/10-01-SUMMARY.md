# Phase 10-01 成果報告：版面、時間戳與英文介面測試（TDD 紅燈）

## 執行摘要
依據 `.planning/phases/phase-10/10-01-PLAN.md` 完成 Phase 10 驗收測試的建立與登記，不變更任何產品程式碼。
新加入的 7 項測試針對常見筆電/手機解析度下工具列裁切、說明文字過時與裁切、無效時間戳顯示、英文介面殘留中文與 SVG 方向標籤重繪進行檢驗。
在未修改產品程式碼的 master 基準上執行測試，成功建立預期的 TDD 紅燈狀態（原有 66 項既有測試與原型快照完全通過，新測試 6 項失敗、1 項通過）。

---

## 建立與修改的檔案
1. `doc/tests/layout_test.py`（新增）：
   - `test_toolbar_fully_visible`：檢驗在 1366×768、1280×720、1200×800、390×844 四種視窗大小與三個系統下，工具列按鈕中心點可被 `elementFromPoint` 命中且不依賴 `.image-section` 內部捲動。
   - `test_help_text_visible_and_updated`：檢驗 1366×768 下 `.image-help__text` 可見度與中英文最新文案。
   - `test_diagram_not_clipped`：檢驗四種視窗大小下三個系統的 SVG 結構圖完全落在 `.image-section` 內。
2. `doc/tests/i18n_test.py`（新增）：
   - `test_missing_timestamp_text`：檢驗缺少/無效時間戳時顯示「時間不明」（中文）與「Unknown time」（英文），不出現「無效的時間戳」。
   - `test_no_chinese_in_english_mode`：使用 DOM `TreeWalker` 在英文模式下完整走過牙齒、眼睛、身體、各模態、參考圖與統計分頁，掃描所有可見文字節點（排除例外）。
   - `test_switch_back_to_chinese`：檢驗切回中文模式後各介面控制項恢復繁體中文。
   - `test_diagrams_rerender_on_language_change`：檢驗停留在眼睛系統時切換語言，結構圖方向標籤立即重繪更新為英文，無須切換系統。
3. `doc/tests/run_all.py`（修改）：
   - 引入 `layout_test` 與 `i18n_test` 並加入執行測試清單。

---

## 測試執行結果（紅燈確認）

執行指令：
```bash
LD_LIBRARY_PATH="/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH" python3 doc/tests/run_all.py --with-snapshot
```

### 結果統計
- 總測試數：74 項（含原型快照比對）
- 通過：67 項（包含原有 66 項測試 + 原型快照比對 + 新測試 `test_switch_back_to_chinese`）
- 失敗：6 項（新測試 6 項確實驗證出當前系統缺陷）
- 跳過：0 項

### 新測試失敗詳情（TDD 紅燈）
1. `test_toolbar_fully_visible` (FAIL)：
   - 原因：視窗 1366x768 系統 teeth 工具列按鈕檢測失敗: 按鈕 zoom-in-btn 依賴了 `.image-section` 內部捲動 (`scrollTop=44`)，證明工具列在筆電常見解析度下被切掉。
2. `test_help_text_visible_and_updated` (FAIL)：
   - 原因：說明文字 `.image-help__text` 被遮擋或裁切，且內容仍為舊版中文「💡 點擊圖像標註位置，填入疾病資訊」。
3. `test_diagram_not_clipped` (FAIL)：
   - 原因：視窗 390x844 系統 eye 結構圖超出 `.image-section` 邊界 (`SVG [245.2, 576.8, 16.0, 608.0] vs Section [155.0, 609.0, 16.0, 374.0]`)。
4. `test_missing_timestamp_text` (FAIL)：
   - 原因：缺少時間戳時顯示「⏰ 無效的時間戳」，尚未修正為「時間不明 / Unknown time」。
5. `test_no_chinese_in_english_mode` (FAIL)：
   - 原因：TreeWalker 在英文模式下於 12 個操作步驟中掃描出多處中文（包含 SVG 象限與方向標籤、按鈕、疾病名稱、身體部位名稱、模態標題與操作表單等）。
6. `test_diagrams_rerender_on_language_change` (FAIL)：
   - 原因：切換為英文後眼睛 SVG 方向標籤未重繪，仍保留中文「前（角膜側）後（視神經側）正面（右眼 OD）」。

---

## 後續計畫
- 依 `10-02-PLAN.md` 進行版面修正、說明文字文案更新與時間戳文字調整。
- 依 `10-03-PLAN.md` 進行集中化翻譯字典與英文介面補齊、SVG 標籤即時切換與模態語言狀態修正。
