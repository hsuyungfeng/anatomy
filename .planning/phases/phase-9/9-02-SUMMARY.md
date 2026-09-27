# Phase 9-02 執行總結：SVG 縮放平移、通用參考圖切換、舊記錄 ID 對應模組

## 執行成果
- 依據 `9-02-PLAN.md` 完成三項主要共用基礎設施：
  1. **SVG 視口縮放與平移模組 (`assets/scripts/svg-viewport.js`)**：
     - 以直接操作 SVG 根節點的 `viewBox` 為核心實現，避免 CSS transform 造成的點擊命中失真與模糊。
     - 每次縮放比例 1.25，縮放錨定在可視中心，限制在 `minZoom` (1) 與 `maxZoom` 之間。
     - 實作平移機制，拖曳超過 4px 即視為平移，並在 capture 階段攔截隨後的 `click` 事件以防誤開疾病/操作表單模態視窗（驗證通過：`test_drag_pan_does_not_click`）。
     - 提供 `focusOn(elementOrId)` API，自動將指定部位置中並放大至佔可視寬度至少 1/6。
     - 與既有 `#zoom-in-btn`、`#zoom-out-btn`、`#zoom-reset-btn` 按鈕串接，當 SVG 視口啟用時使用 capture 階段攔截事件並呼叫 `SvgViewport`，同時更新 `#zoom-level` 百分比顯示（驗證通過：`test_zoom_buttons_work_in_svg`）。
     - 在牙位圖渲染時自動附加 (`SvgViewport.attach`)。
  2. **通用參考圖切換與點擊保護 (`assets/scripts/app/app-core.js`)**：
     - 將 Phase 8 專屬於牙齒系統的參考圖切換邏輯重構為三系統通用結構：`getCurrentSvgContainer()`、`isSvgActive()`、`toggleReferenceImage()`。
     - 參考圖（canvas）模式下點擊一律不開模態視窗，並統一提示：「參考圖僅供檢視，請切回結構圖點選」。
     - 保持既有 Phase 8 行為完全相容（`test_reference_image_toggle` 與 `test_other_systems_use_canvas` 持續通過）。
  3. **舊記錄 ID 對應模組與歷史對照表 (`assets/scripts/anatomy-mapping.js`, `data/body-legacy-map.json`, `data/body-systems.json`)**：
     - 建立 `AnatomyMapping`，包含 `resolveEye(record)`、`resolveBody(record, legacyMap)` 與 `bodySide(subId)`。
     - 眼睛規則支援整眼、帶眼別前綴、通用 `eye-` 前綴與特殊部位名稱（如 `lacrimal` 對應 `lacrimal-gland`、`vitreous-hyaloid` 對應 `hyaloid-canal` 等）。
     - 身體規則支援歷史三套命名相容、成對部位與大區域對應，並妥善處理 `head-eyebrow`、`head-eye`、`head-ear`、`head-cheek`、`chest-breast` 的 `side === 'right'` 歧義判斷。
     - 修正 `data/body-systems.json` 中 5 個成對左側部位的顯示名稱（加上「左」與 "Left"）。
     - 撰寫純 Node.js 單元測試 `doc/tests/legacy_map_unit_test.py`，完整驗證所有規則與邊界條件，並整合至 `run_all.py`（驗證通過：`test_anatomy_mapping_unit`）。
- 升版 Service Worker 快取名稱至 `anatomy-v9`，更新 assets-hash 與 prototype-methods 基準快照（共 64 個方法）。

---

## 修改與新增的檔案
- `assets/scripts/svg-viewport.js`：新增 SVG 視口縮放平移與聚焦模組
- `assets/scripts/anatomy-mapping.js`：新增解剖舊記錄動態映射模組
- `data/body-legacy-map.json`：新增身體舊 ID 對照表
- `data/body-systems.json`：修正 5 個成對部位中英文名稱（左眉毛、左眼、左耳朵、左臉頰、左乳房）
- `assets/scripts/app/app-core.js`：整合 SVG 縮放按鈕監聽、通用參考圖與通用 SVG 視口切換方法
- `assets/scripts/app/app-tooth.js`：`renderOdontogram` 接上 `SvgViewport`，移除移至 core 的 `toggleReferenceImage`
- `index.html`：引入 `svg-viewport.js` 與 `anatomy-mapping.js`
- `sw.js`：更新 `ASSETS_TO_CACHE` 快取清單
- `doc/tests/legacy_map_unit_test.py`：新增舊記錄對應 Node 單元測試
- `doc/tests/run_all.py`：整合執行 `legacy_map_unit_test`
- `doc/tests/baseline/assets-hash.json`：更新資源快取雜湊基準
- `doc/tests/baseline/prototype-methods.json`：更新原型方法快照基準（64 個方法）

---

## 測試輸出

### 修改前（Phase 9-01 紅燈）
```
測試結果: 通過 45, 失敗 17, 跳過 0
```

### 修改後（Phase 9-02 執行結果）
```
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

--- 執行 Phase 9-01 眼睛 SVG 結構圖端到端測試 ---
[FAIL] test_eye_view_is_svg (9-03 實作)
[FAIL] test_every_eye_structure_opens_modal (9-03 實作)
[FAIL] test_save_eye_record (9-03 實作)
[FAIL] test_new_structure_saves (9-03 實作)

--- 執行 Phase 9-01 身體寫實輪廓 SVG 端到端測試 ---
[FAIL] test_body_view_is_svg (9-04 實作)
[FAIL] test_every_body_region_opens_modal (9-04 實作)
[FAIL] test_save_body_operation (9-04 實作)

--- 執行 Phase 9-01 舊記錄 ID 對應端到端測試 ---
[FAIL] test_eye_legacy_ids (9-03 眼睛 SVG 整合)
[FAIL] test_body_legacy_ids (9-04 身體 SVG 整合)
[PASS] test_legacy_records_unchanged

--- 執行 Phase 9-02 舊記錄 ID 對應單元測試 ---
[PASS] test_anatomy_mapping_unit

--- 執行 Phase 9-01 SVG 視口縮放與平移測試 ---
[FAIL] test_zoom_changes_viewbox (需等 9-03/9-04 補齊眼睛與身體 SVG)
[FAIL] test_face_target_size_after_zoom (需等 9-04 身體 SVG)
[PASS] test_drag_pan_does_not_click

--- 執行 Phase 9-01 介面細節與體驗優化測試 ---
[FAIL] test_teeth_subtabs_visible_on_load (9-05 修正)
[FAIL] test_save_notification_text (9-05 修正)
[PASS] test_zoom_buttons_work_in_svg
[FAIL] test_dark_mode_record_cards (9-05 修正)
[FAIL] test_eye_list_no_duplicate_side (9-05 修正)

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 64 個方法）

==================================================
 測試結果: 通過 48, 失敗 15, 跳過 0
==================================================
```

---

## 發現的問題與偏離計畫之處
- 本機環境系統 PATH 中未安裝全域 `node`，因此 `legacy_map_unit_test.py` 動態尋找 playwright driver 自帶的 Node.js 執行檔（v24.21.0），確保測試可在任何具有 playwright 的環境中執行。
- 其餘無偏離計畫。
