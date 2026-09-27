# Phase 8-03 計畫執行總結

## 1. 完成工作摘要

依據 `.planning/phases/phase-8/8-03-PLAN.md` 規範，移除牙齒系統不再使用的座標辨識程式碼（死碼清理）：
- **移除死碼方法與選擇器**：
  - `assets/scripts/app/app-tooth.js`：移除 `detectToothPosition`、`detectToothPositionFallback`、`renderManualToothSelector`、`setupManualToothSelector`、`estimateToothLocation`。保留牙位圖專用之 `getToothNames`、`renderOdontogram`、`refreshOdontogramRecords`、`openToothModal`、`toggleReferenceImage`。
  - `assets/scripts/app/app-modal.js`：
    - `openDiseaseModal`：移除無預設結構時呼叫 `detectToothPosition` 的分支（改為無 presetStructure 時直接 return），移除手動牙齒選擇器渲染與事件綁定。
    - `getLocationName`：牙齒系統分支不再調用 `estimateToothLocation`，直接回傳 `位置: 牙齒區域`。
- **核心模組清理**：
  - `assets/scripts/app/app-core.js`：
    - 建構式中移除 `this.diseaseVisualizer` 與 `this.dentalMapper` 宣告。
    - `initModules` 中移除 `DentalImageMapper` 與 `DiseaseVisualizationManager` 的實例化與預加載。
- **HTML 與 Service Worker 快取清單精簡**：
  - `index.html`：移除 `<script src="assets/scripts/dental-image-mapper.js"></script>` 與 `<script src="assets/scripts/disease-visualization.js"></script>`。
  - `sw.js`：從 `ASSETS_TO_CACHE` 移除 `dental-image-mapper.js` 與 `disease-visualization.js`。
  - 實體檔案 `dental-image-mapper.js`、`disease-visualization.js`、`data/dental-coordinates.json` 均完整保留供 `doc/tools/` 工具使用。
- **校準工具標註**：
  - `doc/tools/README.md`：將 `auto-calibrate-teeth.html`、`auto-tooth-detection.html`、`debug-tooth-detection.html`、`tooth-calibration.html`、`visualize-coordinates.html` 標註為「*Phase 8 起 app 改用 SVG 牙位圖，這些工具已不再影響 app，僅保留參考*」。
- **基準檔維護**：
  - 執行 `python3 doc/tests/bump_cache.py` 升級快取版本至 `anatomy-v8` 並更新 `assets-hash.json`。
  - 執行 `python3 doc/tests/snapshot_prototype.py --check` 核對方法差異（缺少 5 個被移除方法、變更 3 個清理方法），確認無誤後執行 `--write` 更新基準檔至 61 個方法。

---

## 2. 修改檔案清單

- `assets/scripts/app/app-tooth.js`
- `assets/scripts/app/app-modal.js`
- `assets/scripts/app/app-core.js`
- `index.html`
- `sw.js`
- `doc/tools/README.md`
- `doc/tests/baseline/prototype-methods.json`
- `doc/tests/baseline/assets-hash.json`

---

## 3. 快照核對紀錄

```text
[FAIL] 原型方法快照與基準不符:
  缺少方法 (5):
    - detectToothPosition
    - detectToothPositionFallback
    - estimateToothLocation
    - renderManualToothSelector
    - setupManualToothSelector
  內容變更方法 (3):
    * getLocationName (舊: 5a081f48... 新: a3a63dfc...)
    * initModules (舊: 68d5d905... 新: a7a36b50...)
    * openDiseaseModal (舊: 325b0278... 新: 75a760ef...)
```
核對確認所有差異皆完全符合 8-03 計畫清理範圍，已更新寫入 `prototype-methods.json`。

---

## 4. Task 4 截圖路徑清單
- `doc/prototypes/odontogram/screenshots/light-permanent.png`
- `doc/prototypes/odontogram/screenshots/dark-permanent.png`
- `doc/prototypes/odontogram/screenshots/primary.png`

---

## 5. 測試執行輸出（修改後）

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
[PASS] 原型方法快照比對完全一致（共 61 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 44, 失敗 0, 跳過 0
==================================================
```

---

## 6. Git 提交記錄

```text
c7c8ffa refactor(teeth): 移除牙齒座標辨識死碼，校準工具標註為已停用
0824536 feat(teeth): 牙齒系統改用結構化 SVG 牙位圖，點擊直接辨識 FDI；點陣圖保留為參考圖
529d32c test: 新增 Phase 8 SVG 牙位圖端到端測試（紅燈）
```
