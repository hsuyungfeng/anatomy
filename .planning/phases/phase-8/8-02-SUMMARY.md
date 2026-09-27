# Phase 8-02 計畫執行總結

## 1. 完成工作摘要

依據 `.planning/phases/phase-8/8-02-PLAN.md` 規範，將牙齒系統（永久牙 32 顆、乳牙 20 顆）升級改用結構化 SVG 牙位圖：
- **牙位圖模組與樣式**：
  - 新增 `assets/scripts/odontogram.js`：移植自原型並加入 `names` 客製名稱對照、`setRecords(countByFdi)` 病歷標示與 badge 筆數呈現、保留透明點擊區（`.hit`）。
  - 新增 `assets/styles/odontogram.css`：定義 SVG 牙冠、牙根、引導線、選取與病歷標記色彩變數（支援深淺色主題切換），設定 `#odontogram-view` 與 `#image-viewer` 之佈局。
- **畫面與邏輯整合**：
  - `index.html`：載入 `odontogram.css` 與 `odontogram.js`，於 `#image-viewer` 內新增 `#odontogram-view`，工具列新增 `#reference-image-toggle` 按鈕。
  - `app-tooth.js`：
    - `getToothNames()`：載入 `data/tooth-numbering.json` 快取於 `this.toothNames`。
    - `renderOdontogram()`：依當前齒列（permanent 或 primary）渲染 SVG 牙位圖。
    - `refreshOdontogramRecords()`：以 `RecordManager.getAnnotationsBySystem('teeth')` 統計每顆牙的病歷筆數並標註於牙位圖。
    - `openToothModal(tooth)`：點選牙齒時封裝 `currentToothInfo` 並調用 `openDiseaseModal`。
    - `toggleReferenceImage()`：切換參考圖與牙位圖（乳牙無底圖故按鈕停用）。
  - `app-core.js`：
    - 建構式與 `init()` 整合 `odontogram`、`isReferenceImageMode`、`toothNames`。
    - `loadSystemImage()`：牙齒系統顯示牙位圖、隱藏 canvas、顯示參考圖切換按鈕；其他系統維持原 canvas 圖像顯示。
    - `loadAnnotations()`：牙齒系統跳過 canvas 繪製，改由 `refreshOdontogramRecords()` 於牙位圖標記，並同步維護 `annotator.annotations` 相容性。
    - `handleAnnotationClick()`：在牙齒系統參考圖模式下點擊提示僅供檢視。
  - `app-modal.js`：
    - `openDiseaseModal(position, presetStructure)`：支援 `presetStructure` 直接跳過坐標估算，牙齒系統直接帶入牙位資訊。
    - `saveDiseaseAnnotation()`：儲存牙齒病歷時記錄 `source: 'odontogram'` 與 FDI 編號，關閉後即時刷新牙位圖。
- **快取與測試遷移**：
  - `sw.js`：將新檔案加入快取清單，執行 `bump_cache.py` 升級快取版本至 `anatomy-v7`。
  - 既有測試三處開啟方式遷移：`records_flow_test.py`（2 處）與 `storage_unify_test.py`（1 處）改用點擊 `.tooth[data-fdi="16"] .crown` 開啟模態。
  - 更新快照基準檔 `doc/tests/baseline/prototype-methods.json`（66 個方法比對完全一致）。
- **截圖確認**：
  - 使用 Playwright 產出三張畫面截圖並儲存至 `doc/prototypes/odontogram/screenshots/`。

---

## 2. 修改檔案清單

### 新增檔案
- `assets/scripts/odontogram.js`
- `assets/styles/odontogram.css`
- `doc/prototypes/odontogram/screenshots/light-permanent.png`
- `doc/prototypes/odontogram/screenshots/dark-permanent.png`
- `doc/prototypes/odontogram/screenshots/primary.png`

### 修改檔案
- `index.html`
- `sw.js`
- `assets/scripts/app/app-core.js`
- `assets/scripts/app/app-modal.js`
- `assets/scripts/app/app-tooth.js`
- `doc/tests/odontogram_test.py`
- `doc/tests/records_flow_test.py`
- `doc/tests/storage_unify_test.py`
- `doc/tests/baseline/assets-hash.json`
- `doc/tests/baseline/prototype-methods.json`

---

## 3. 測試執行結果

### 修改前（8-01 結束時紅燈）
```text
==================================================
 測試結果: 通過 36, 失敗 8, 跳過 0
==================================================
```

### 修正過程中遇到的問題與修復
1. **`storage_unify_test.py -> test_markers_persist_after_reload`**：
   - 原因：牙齒系統改用牙位圖後，未將病歷物件放進 `annotator.annotations`，導致該測試斷言 `annotator.annotations.length >= 1` 失敗。
   - 修復：在 `loadAnnotations` 與 `saveDiseaseAnnotation` 中，牙齒系統除了更新牙位圖之外，亦將 annotation 物件存入 `this.annotator.annotations` 維護相容性。
2. **`odontogram_test.py -> test_every_tooth_opens_correct_modal`**：
   - 原因：Playwright 的 `wait_for_selector` 預設等待元素 visible，但在模態關閉時其 CSS 為 `display: none`，導致等待 `#disease-modal[aria-hidden='true']` 逾時。
   - 修復：將 wait_for_selector 加上 `state="attached"`。
3. **`odontogram_test.py -> test_other_systems_use_canvas`**：
   - 原因一：初始載入為牙齒系統，canvas 處於 `display: none` 時 loadImage 執行 `_performRender()` 將 canvas 的 `width` 與 `height` 設為 0，切換到眼睛系統時 flex/grid 容器因 canvas 高度為 0 而折疊。
   - 修復一：在 `odontogram.css` 中設定 `.image-viewer { min-height: 480px; }`，並在 `loadSystemImage` 切換回非牙齒系統時若 canvas 寬高為 0 則補回基準尺寸。
   - 原因二：`.btn` 在 `main.css` 定義了 `display: inline-flex`，覆蓋了瀏覽器預設的 `[hidden] { display: none; }`，導致 `#reference-image-toggle` 仍佔據寬度。
   - 修復二：在 `odontogram.css` 補上 `#reference-image-toggle[hidden] { display: none !important; }`。

### 修改後（8-02 全數通過）
```text
==================================================
 醫療病歷系統 — Phase 4 自動化測試
==================================================
啟動本機測試伺服器...
測試伺服器就緒: http://127.0.0.1:8765

--- 執行冒煙測試 ---
[PASS] test_page_loads_without_errors
[PASS] test_switch_systems
[PASS] test_records_render_from_storage
[PASS] test_theme_toggle

--- 執行工具頁載入測試 ---
[PASS] test_tools_load_without_404_or_errors

--- 執行 XSS 安全性測試 ---
[PASS] test_stored_xss_records
[PASS] test_notification_xss

--- 執行病歷流程端到端測試 ---
[PASS] test_save_teeth_record
[PASS] test_save_eye_record
[PASS] test_save_body_operation
[PASS] test_records_isolated_per_system
[PASS] test_records_persist_after_reload

--- 執行 OCR 疾病比對測試 ---
[PASS] test_ocr_match_diseases

--- 執行 Phase 6 儲存整併測試 ---
[PASS] test_no_storage_growth_on_reload
[PASS] test_markers_persist_after_reload
[PASS] test_backup_contains_saved_record
[PASS] test_restore_v2_shows_in_list
[PASS] test_restore_v1_legacy_backup
[PASS] test_clear_all_clears_list
[PASS] test_statistics_match_list
[PASS] test_migrate_legacy_keys
[PASS] test_single_write_per_save
[PASS] test_export_csv_contains_saved

--- 執行 Phase 6-03 儲存安全與資料一致性測試 ---
[PASS] test_restore_invalid_content_keeps_data
[PASS] test_restore_empty_backup_replaces
[PASS] test_migration_write_failure_keeps_legacy_keys
[PASS] test_view_classifies_records_without_system

--- 執行 Phase 7-01 Service Worker 離線與更新測試 ---
[PASS] test_precache_covers_index_assets
[PASS] test_offline_reload_works
[PASS] test_code_update_reaches_client

--- 執行 Phase 7-01 快取版本守門測試 ---
[PASS] test_cache_name_bumped_when_assets_change

--- 執行 Phase 7-02 病歷清單標籤與重複名稱測試 ---
[PASS] test_body_side_label
[PASS] test_eye_side_label
[PASS] test_location_name_not_repeated

--- 執行 Phase 8-01 結構化 SVG 牙位圖端到端測試 ---
[PASS] test_teeth_view_is_svg
[PASS] test_primary_view
[PASS] test_every_tooth_opens_correct_modal
[PASS] test_save_via_odontogram
[PASS] test_marker_persists_after_reload
[PASS] test_legacy_record_marker
[PASS] test_keyboard_opens_modal
[PASS] test_reference_image_toggle
[PASS] test_other_systems_use_canvas

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 66 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 44, 失敗 0, 跳過 0
==================================================
```

---

## 4. 截圖路徑清單 (Task 4)
- `doc/prototypes/odontogram/screenshots/light-permanent.png`（淺色模式，永久牙，FDI 16 與 21 帶有病歷與標籤徽章）
- `doc/prototypes/odontogram/screenshots/dark-permanent.png`（深色模式，永久牙）
- `doc/prototypes/odontogram/screenshots/primary.png`（乳牙齒列，20 顆牙）
