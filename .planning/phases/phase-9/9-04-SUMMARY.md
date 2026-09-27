# Phase 9-04 執行總結：身體系統寫實輪廓 SVG（正背面、男女體型、舊 ID 相容、放大臉部）

## 執行成果
- 依據 `9-04-PLAN.md` 完成身體系統從 bitmap 座標偵測改為寫實輪廓 SVG 的完整改版：
  1. **SVG 身體部位圖模組與樣式 (`assets/scripts/body-map.js`, `assets/styles/anatomy-diagrams.css`)**：
     - 從 prototype 移植寫實輪廓人體正背面圖，包含 58 個子部位切分與 Catmull-Rom 平滑人體邊界裁切（`clipPath` 採用隨機 ID 避免衝突）。
     - 支援 `render` 之 `names` 選項，由 `data/body-systems.json` 提供標準中英文對照，原創 `NAMES` 作為後備。
     - 支援女性與男性體型切換，男性呈現肩寬、骨盆收窄、平胸、陰莖/陰囊；女性呈現纖腰、寬骨盆、女性乳房、外陰。偏好設定保存至 `localStorage['bodyMapSex']`。
     - 新增 `setRecords(countById)` 精確子部位標示（使用身體主題色 `--body-has-record`），以及 `setRegionRecords(subIds)` 大區域舊記錄標示（使用 `--body-has-region-record` 配合 CSS `stroke-dasharray` 琥珀色虛線外框區分）。
     - 為小尺寸眼部等五官特徵加入透明 `hitRect`，確保縮放聚焦後滿足可點擊尺寸規範（寬高均 ≥ 24px）。
  2. **畫面整合與事件串接 (`assets/scripts/app/app-body.js`, `assets/scripts/app/app-core.js`, `assets/scripts/app/app-modal.js`, `index.html`)**：
     - 在 `#image-viewer` 加入 `#body-map-view`，工具列加入 `#body-sex-toggle`（女性/男性切換）與 `#focus-face-btn`（放大臉部按鈕）。
     - 切到身體系統時顯示 `#body-map-view`、`#body-sex-toggle` 與 `#focus-face-btn`，隱藏 canvas 與其他系統檢視；canvas 仍載入 `bodysurface.png` 作為通用參考圖。
     - 按下「放大臉部」按鈕時，透過 `SvgViewport.focusOn` 將正面的 head 區域置中並放大 3.5 倍，使臉部五官操作直覺精確。
     - 點選任何子部位呼叫 `openBodyModal(r)`，自動依 `AnatomyMapping.bodySide` 判定側別（左側、右側、中線），組出操作表單所需之 `region` 物件；設定 presetStructure 時抑制信心度警告與舊的樹狀手動選擇器。
     - 儲存操作病歷時寫入 `bodyRegionId`（子部位 ID）、`locationName`（中文名稱）、`side` 與 `source: 'body-map'`。
     - 在新增、還原、清除病歷後，自動呼叫 `refreshBodyMapRecords()`，依 `AnatomyMapping.resolveBody` 計算精確記錄與大區域涵蓋部位，正確點亮標記。
  3. **既有測試遷移與自動化測試驗證**：
     - `records_flow_test.py` 點選身體部位的方式平順遷移為點選 `#body-map-view .region[data-region="chest"][data-view="front"]`。
     - `body_map_test.py` 3 項測試全數 PASS。
     - `legacy_mapping_test.py` 3 項測試全數 PASS（包含 `test_body_legacy_ids`）。
     - `svg_viewport_test.py` 3 項測試全數 PASS（包含 `test_face_target_size_after_zoom`）。
     - 快取版本升至 `anatomy-v12`，原型方法快照比對通過（共 77 個方法）。
  4. **Task 4 畫面截圖**：
     - 依規格完成 5 張測試截圖並儲存於 `doc/prototypes/screenshots/phase-9/`。

---

## 截圖清單
1. `doc/prototypes/screenshots/phase-9/01-eye-od-light.png`：眼睛 OD 淺色（角膜與虹膜 2 個結構有病歷標示）
2. `doc/prototypes/screenshots/phase-9/02-eye-os-dark.png`：眼睛 OS 深色（角膜與視網膜病歷標示）
3. `doc/prototypes/screenshots/phase-9/03-body-female-light.png`：身體女性淺色（包含 1 個精確記錄 knee-r 與 1 個大區域舊記錄 arm-left 虛線外框）
4. `doc/prototypes/screenshots/phase-9/04-body-male-dark.png`：身體男性深色（男性體型特徵與病歷標示）
5. `doc/prototypes/screenshots/phase-9/05-body-zoom-face.png`：身體放大臉部後（臉部五官置中放大）

---

## 修改與新增的檔案
- `assets/scripts/body-map.js`：新增身體 SVG 寫實輪廓部位圖模組
- `assets/styles/anatomy-diagrams.css`：新增身體 SVG 樣式與 has-record / has-region-record 規則
- `assets/scripts/svg-viewport.js`：`focusOn` 增強支援巢狀座標矩陣換算與自訂縮放倍率
- `assets/scripts/app/app-body.js`：實作 `renderBodyMap`、`switchBodySex`、`focusFace`、`openBodyModal`、`refreshBodyMapRecords` 與更新 `saveBodyOperation`
- `assets/scripts/app/app-core.js`：整合體型切換監聽、放大臉部按鈕監聽、身體載入與 SVG 標註更新
- `assets/scripts/app/app-modal.js`：身體預設部位不顯示信心度警告與手動選擇器，顯示部位代碼
- `index.html`：引入 `body-map.js`，加入 `#body-map-view`、`#body-sex-toggle` 與 `#focus-face-btn`
- `sw.js`：更新 `ASSETS_TO_CACHE` 快取清單加入 `body-map.js`
- `doc/tests/records_flow_test.py`：遷移身體操作病歷測試以點選 SVG 部位
- `doc/tests/baseline/assets-hash.json`：更新快取版本與資產雜湊
- `doc/tests/baseline/prototype-methods.json`：更新方法快照基準（77 個方法）
- `doc/prototypes/screenshots/phase-9/*.png`：新增 5 張截圖

---

## 測試輸出

### 修改前（Phase 9-03 執行後）
```
測試結果: 通過 53, 失敗 10, 跳過 0
```

### 修改後（Phase 9-04 執行結果）
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
[PASS] test_other_systems_hide_odontogram

--- 執行 Phase 9-01 眼睛 SVG 結構圖端到端測試 ---
[PASS] test_eye_view_is_svg
[PASS] test_every_eye_structure_opens_modal
[PASS] test_save_eye_record
[PASS] test_new_structure_saves

--- 執行 Phase 9-01 身體寫實輪廓 SVG 端到端測試 ---
[PASS] test_body_view_is_svg
[PASS] test_every_body_region_opens_modal
[PASS] test_save_body_operation

--- 執行 Phase 9-01 舊記錄 ID 對應端到端測試 ---
[PASS] test_eye_legacy_ids
[PASS] test_body_legacy_ids
[PASS] test_legacy_records_unchanged

--- 執行 Phase 9-02 舊記錄 ID 對應單元測試 ---
[PASS] test_anatomy_mapping_unit

--- 執行 Phase 9-01 SVG 視口縮放與平移測試 ---
[PASS] test_zoom_changes_viewbox
[PASS] test_face_target_size_after_zoom
[PASS] test_drag_pan_does_not_click

--- 執行 Phase 9-01 介面細節與體驗優化測試 ---
[FAIL] test_teeth_subtabs_visible_on_load (9-05 修正)
[FAIL] test_save_notification_text (9-05 修正)
[PASS] test_zoom_buttons_work_in_svg
[FAIL] test_dark_mode_record_cards (9-05 修正)
[FAIL] test_eye_list_no_duplicate_side (9-05 修正)

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 77 個方法）

==================================================
 測試結果: 通過 59, 失敗 4, 跳過 0
==================================================
```

---

## 發現的問題與偏離計畫之處
- 無偏離計畫。所有身體系統測試（`body_map_test`、`legacy_mapping_test`、`svg_viewport_test`、`records_flow_test`）均已通過。剩餘 4 個失敗測試均屬 Phase 9-05 之 UI polish 範疇。
