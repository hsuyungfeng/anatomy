# Phase 9-01 執行總結：眼睛／身體 SVG、舊記錄對應、縮放與介面修正測試（TDD 紅燈）

## 執行成果
- 依據 `9-01-PLAN.md` 規範完成 18 項端到端測試，定義眼睛、身體改用 SVG 後的 DOM 契約、舊記錄對應規則、縮放平移行為與 5 個介面細節問題：
  1. **眼睛 SVG 結構圖端到端測試 (`doc/tests/eye_diagram_test.py`)**：
     - `test_eye_view_is_svg`：切換至眼睛系統時，`#eye-diagram-view` 可見，可點選結構數為 22。
     - `test_every_eye_structure_opens_modal`：OD、OS 各 22 個結構逐一以鍵盤（focus + Enter）選取，驗證正確開啟疾病模態。
     - `test_save_eye_record`：OS 角膜儲存疾病記錄，驗證 `medicalRecords` 內容、`.has-record` class，並確認切到 OD 不帶有標記。
     - `test_new_structure_saves`：選取新增結構黃斑部儲存，驗證 `structureId === 'eye-macula'`。
  2. **身體寫實輪廓 SVG 端到端測試 (`doc/tests/body_map_test.py`)**：
     - `test_body_view_is_svg`：`#body-map-view` 可見，女性正背面涵蓋 `body-systems.json` 所有子部位；切換男性具備生殖器部位差分。
     - `test_every_body_region_opens_modal`：女性正背面所有部位逐一用鍵盤選取，開啟模態並顯示正確 `nameZh`。
     - `test_save_body_operation`：點擊右膝 `knee-r` 正面儲存操作記錄，驗證正背面 `knee-r` 皆帶有 `.has-record`。
  3. **舊記錄 ID 對應端到端測試 (`doc/tests/legacy_mapping_test.py`)**：
     - `test_eye_legacy_ids`：各類眼睛舊記錄（帶邊、不帶邊、整隻眼睛）在 OD/OS SVG 上正確標示（整隻眼睛於按鈕徽章顯示筆數）。
     - `test_body_legacy_ids`：各類身體舊 ID（新舊格式、子部位、大區域）正確對應至子部位，大區域記錄標記 `.has-region-record`。
     - `test_legacy_records_unchanged`：驗證讀取對應時，`localStorage` 中的舊病歷結構原封不動。
  4. **SVG 視口縮放與平移測試 (`doc/tests/svg_viewport_test.py`)**：
     - `test_zoom_changes_viewbox`：三系統按放大縮小 viewBox 改變，重設恢復。
     - `test_face_target_size_after_zoom`：身體系統放大聚焦後，臉部目標結構尺寸 ≥ 24px。
     - `test_drag_pan_does_not_click`：放大後拖曳 60px 不會觸發點擊模態，viewBox 平移改變。
  5. **介面細節與體驗優化測試 (`doc/tests/ui_polish_test.py`)**：
     - `test_teeth_subtabs_visible_on_load`：初次載入未切換分頁時，乳齒子分頁按鈕可見。
     - `test_save_notification_text`：存檔成功通知不含「信心度」且不重複打勾符號。
     - `test_zoom_buttons_work_in_svg`：牙齒系統點擊放大按鈕改變 SVG viewBox。
     - `test_dark_mode_record_cards`：深色模式下病歷卡片背景亮度 < 0.5。
     - `test_eye_list_no_duplicate_side`：眼睛清單群組標題「左眼」不重複出現。
- 嚴格維持無產品程式碼修改（`assets/`、`data/`、`index.html` 皆未更動）。
- 成功取得預期 TDD 紅燈（45 通過、17 失敗、0 跳過，快照比對 61 個方法全數一致）。

---

## 修改的檔案
- `doc/tests/eye_diagram_test.py`：新增眼睛 SVG 測試（4 項）
- `doc/tests/body_map_test.py`：新增身體 SVG 測試（3 項）
- `doc/tests/legacy_mapping_test.py`：新增舊記錄對應測試（3 項）
- `doc/tests/svg_viewport_test.py`：新增 SVG 視口縮放平移測試（3 項）
- `doc/tests/ui_polish_test.py`：新增介面問題修正測試（5 項）
- `doc/tests/run_all.py`：整合 Phase 9 五組新測試套件

---

## 測試輸出

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
[FAIL] test_eye_view_is_svg
[FAIL] test_every_eye_structure_opens_modal
[FAIL] test_save_eye_record
[FAIL] test_new_structure_saves

--- 執行 Phase 9-01 身體寫實輪廓 SVG 端到端測試 ---
[FAIL] test_body_view_is_svg
[FAIL] test_every_body_region_opens_modal
[FAIL] test_save_body_operation

--- 執行 Phase 9-01 舊記錄 ID 對應端到端測試 ---
[FAIL] test_eye_legacy_ids
[FAIL] test_body_legacy_ids
[PASS] test_legacy_records_unchanged

--- 執行 Phase 9-01 SVG 視口縮放與平移測試 ---
[FAIL] test_zoom_changes_viewbox
[FAIL] test_face_target_size_after_zoom
[FAIL] test_drag_pan_does_not_click

--- 執行 Phase 9-01 介面細節與體驗優化測試 ---
[FAIL] test_teeth_subtabs_visible_on_load
[FAIL] test_save_notification_text
[FAIL] test_zoom_buttons_work_in_svg
[FAIL] test_dark_mode_record_cards
[FAIL] test_eye_list_no_duplicate_side

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 61 個方法）

==================================================
 測試結果: 通過 45, 失敗 17, 跳過 0
==================================================
```

---

## 發現的問題與偏離計畫之處
- 無偏離計畫。
- `test_legacy_records_unchanged` 在尚未實作 9-02 前即通過，因為現有機制本來就不會改寫 `localStorage` 中的未知欄位，符合安全預期。
- `showNotification` 的訊息節點並未直接加上 `.notification` class，選擇器已使用 `#notification-container > div, .notification` 支援。
