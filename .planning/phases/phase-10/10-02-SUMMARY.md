# Phase 10-02 成果報告：版面裁切修正、說明文案更新與時間戳處理

## 執行摘要
依據 `.planning/phases/phase-10/10-02-PLAN.md` 完成 Phase 10 的版面結構重整、說明文字文案更新與無效時間戳顯示調整：
1. **版面彈性佈局重構**：將 `.image-section`、`.image-viewer-wrapper`、`.image-viewer-panel`、`.image-container`、`.image-viewer` 改為縱向 flexbox / min-height 吸收結構，移除既有 CSS 中寫死 `min-height: 480px`（`odontogram.css`、`anatomy-diagrams.css`）與 `min-width: 560px`（`eye-diagram`）導致的固定溢出限制，確保工具列與說明文字固定高度（`flex: none`）且永遠完整可見不被裁切。
2. **說明文字文案更新**：`index.html` 的 `.image-help__text` 更新為「點選圖上的結構以新增病歷；可用縮放按鈕或滾輪放大，拖曳平移」，並同步設定 `data-en` 為「Click a structure on the diagram to add a record. Zoom with the buttons or wheel, drag to pan.」。
3. **缺少時間戳處理**：`app-records.js` 中的 `formatTimestamp` 於輸入為空、undefined 或無效時回傳「時間不明」，並加上 `// TODO(10-03): 改用 t('time.unknown')` 註解。
4. **截圖驗證**：在 4 種螢幕解析度（1366×768、1280×720、1200×800、390×844）下分別針對牙齒、眼睛、身體三個系統截圖（共 12 張），全部經過確認控制項與說明文字均完整顯示且結構圖縮放比例正常。
5. **快取與快照升版**：執行 `bump_cache.py` 將 Service Worker 快取版本升級至 `anatomy-v16` 並更新 `assets-hash.json`；核對 `snapshot_prototype.py --check` 確認僅 `formatTimestamp` 一個方法改變後，以 `--write` 更新 `prototype-methods.json`。

---

## 建立與修改的檔案
1. `assets/styles/main.css`：
   - `.image-section`：增加 `min-height: 0`，內部 flex 縱向排版。
   - `.teeth-sub-tabs`：增加 `flex: none`。
   - `.image-viewer-wrapper`：改用 `flex: 1 1 auto; min-height: 0; margin-top: 0; height: 100%;`，grid-auto-rows 設為 100%。
   - `.image-viewer-panel`、`.image-container`、`.image-viewer`：增加 `flex: 1 1 auto; min-height: 0; height: 100%;`。
   - `.image-toolbar`、`.image-help`：設定 `flex: none`。
2. `assets/styles/odontogram.css`：
   - 移除 `.odontogram-view` 與 `.image-viewer` 的 `min-height: 480px`，改為 `min-height: 0; flex: 1 1 auto; box-sizing: border-box;`。
   - `.odontogram` 設為 `height: 100%; max-height: 100%;`。
3. `assets/styles/anatomy-diagrams.css`：
   - 移除 `.anatomy-view`、`.eye-diagram-view`、`.body-map-view` 的 `min-height: 480px`，改為 `min-height: 0; flex: 1 1 auto; box-sizing: border-box;`。
   - 移除 `.eye-diagram` 的 `min-width: 560px`，設定 `height: 100%; max-height: 100%;`。
   - `.body-map` 設定 `height: 100%; max-height: 100%;`。
4. `index.html`：
   - 更新 `.image-help__text` 最新繁中與英文 `data-en` 文案。
5. `assets/scripts/app/app-records.js`：
   - `formatTimestamp` 於缺漏或無效時間時回傳「時間不明」。
6. `sw.js` & `doc/tests/baseline/assets-hash.json`：
   - 快取版本升至 `anatomy-v16`。
7. `doc/tests/baseline/prototype-methods.json`：
   - 依計畫更新 `formatTimestamp` 的原型方法雜湊基準。
8. `doc/prototypes/screenshots/phase-10/layout/`（12 張截圖）：
   - `teeth_1366x768.png`
   - `eye_1366x768.png`
   - `body_1366x768.png`
   - `teeth_1280x720.png`
   - `eye_1280x720.png`
   - `body_1280x720.png`
   - `teeth_1200x800.png`
   - `eye_1200x800.png`
   - `body_1200x800.png`
   - `teeth_390x844.png`
   - `eye_390x844.png`
   - `body_390x844.png`

---

## 測試結果比對

### 測試執行指令
```bash
LD_LIBRARY_PATH="/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH" python3 doc/tests/run_all.py --with-snapshot
```

### 修改前（10-01 成果）
- 測試總數：74 項
- 通過：67 項，失敗：6 項，跳過：0 項
- 失敗項目：
  - `test_toolbar_fully_visible`
  - `test_help_text_visible_and_updated`
  - `test_diagram_not_clipped`
  - `test_missing_timestamp_text`
  - `test_no_chinese_in_english_mode`
  - `test_diagrams_rerender_on_language_change`

### 修改後（10-02 成果）
- 測試總數：74 項
- 通過：70 項，失敗：3 項，跳過：0 項
- `layout_test` 的 3 項測試**全數通過**：
  - `[PASS] test_toolbar_fully_visible`
  - `[PASS] test_help_text_visible_and_updated`
  - `[PASS] test_diagram_not_clipped`
- 原有 66 項既有測試：**全數通過**
- 原型方法快照比對（65 個方法）：**全數一致通過**
- 剩餘 3 項失敗符合 10-02 規劃預期（屬於 10-03 集中字典與 SVG 即時翻譯範疇）：
  - `test_missing_timestamp_text`（中文模式「時間不明」通過，英文模式「Unknown time」待 10-03 `t('time.unknown')` 實作）
  - `test_no_chinese_in_english_mode`（待 10-03 補齊英文翻譯字典）
  - `test_diagrams_rerender_on_language_change`（待 10-03 實作眼睛 SVG 方向標籤即時切換）

---

## 偏離或發現的問題
無偏離計畫。版面裁切之根本原因確實為多處 CSS 中寫死之 `min-height: 480px` 與 `min-width: 560px` 造成高度/寬度預算超載，移除並改用彈性吸收後版面在筆電與手機視窗下均維持良好比例。
