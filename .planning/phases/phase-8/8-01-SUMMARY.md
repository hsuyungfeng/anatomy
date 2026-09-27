# Phase 8-01 執行總結：結構化 SVG 牙位圖端到端測試（TDD 紅燈）

## 執行成果
- 依據 `8-01-PLAN.md` 規範完成 9 項端到端測試，定義牙齒系統改用結構化 SVG 牙位圖後的 DOM 契約與互動行為：
  1. `test_teeth_view_is_svg`：`#odontogram-view` 可見、內有 32 個 `.tooth`，`#image-canvas` 預設隱藏。
  2. `test_primary_view`：點擊乳齒分頁切換為 20 個 `.tooth`，FDI 集合符合 51–55、61–65、71–75、81–85。
  3. `test_every_tooth_opens_correct_modal`：在 `device_scale_factor` 為 1、1.25、2 下逐一點擊永久牙 32 顆的牙冠（`.crown`），驗證正確開啟對應 FDI 的疾病模態；並測試乳牙 20 顆。
  4. `test_save_via_odontogram`：透過點擊 FDI 16 牙冠並勾選疾病儲存，驗證 `medicalRecords` 內容（`fdiNumber`、`universalNumber`、`locationName`）、`.tooth.has-record` class 與清單顯示。
  5. `test_marker_persists_after_reload`：儲存後重新整理頁面，驗證 `.tooth[data-fdi="16"].has-record` 依然存在。
  6. `test_legacy_record_marker`：預先置入無 `system` 欄位但有 `fdiNumber: 36` 的舊版病歷，載入後能標記並具有 `data-record-count="1"`。
  7. `test_keyboard_opens_modal`：支援鍵盤無障礙，Focus 至 `.tooth[data-fdi="21"]` 按 Enter 能開啟對應模態。
  8. `test_reference_image_toggle`：點擊「參考圖」按鈕切換 canvas/svg，且參考圖模式下點擊 canvas 不會觸發模態。
  9. `test_other_systems_use_canvas`：切換至眼睛系統時，牙位圖與參考圖按鈕隱藏，canvas 正常顯示。
- 未修改任何產品程式碼（`assets/`、`data/`、`index.html` 均維持不變）。
- 成功在目前的 `master` 分支基礎上取得 TDD 紅燈（36 通過、8 失敗、0 跳過）。

---

## 修改的檔案
- `doc/tests/odontogram_test.py`：新增 9 項 SVG 牙位圖端到端測試
- `doc/tests/run_all.py`：整合 `odontogram_test` 測試項目

---

## 測試輸出

### 紅燈執行結果（8 項失敗，原有 35 項與快照全數通過）
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
[FAIL] test_teeth_view_is_svg
       錯誤訊息: 牙齒系統下 #odontogram-view 應可見
[FAIL] test_primary_view
       錯誤訊息: #odontogram-view 應可見
[FAIL] test_every_tooth_opens_correct_modal
       錯誤訊息: Locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator("#odontogram-view .tooth[data-fdi=\"18\"] .crown")

[FAIL] test_save_via_odontogram
       錯誤訊息: Page.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator("#odontogram-view .tooth[data-fdi=\"16\"] .crown")

[FAIL] test_marker_persists_after_reload
       錯誤訊息: Page.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator("#odontogram-view .tooth[data-fdi=\"16\"] .crown")

[FAIL] test_legacy_record_marker
       錯誤訊息: Locator.get_attribute: Timeout 30000ms exceeded.
Call log:
  - waiting for locator("#odontogram-view .tooth[data-fdi=\"36\"]")

[FAIL] test_keyboard_opens_modal
       錯誤訊息: Page.focus: Timeout 30000ms exceeded.
Call log:
  - waiting for locator("#odontogram-view .tooth[data-fdi=\"21\"]")

[FAIL] test_reference_image_toggle
       錯誤訊息: 牙齒系統下 #reference-image-toggle 應可見
[PASS] test_other_systems_use_canvas

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 61 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 36, 失敗 8, 跳過 0
==================================================
```

---

## 發現的問題與說明
- 如 `8-01-PLAN.md` 說明所預期，`test_other_systems_use_canvas` 驗證眼睛系統下 `#image-canvas` 可見，而 `#odontogram-view` 與 `#reference-image-toggle` 均為不可見（目前 DOM 尚未存在這兩個元素，故 `is_visible()` 為 `False`），因此在 master 上直接通過；其餘 8 項新測試均如期因缺乏牙位圖 DOM 與切換按鈕而失敗。
- 程式碼變更範圍完全限定於 `doc/tests/`。

---

## 偏離計畫之處
無偏離計畫。
