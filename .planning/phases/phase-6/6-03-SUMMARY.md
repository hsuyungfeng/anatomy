# Phase 6-03 計畫執行總結：儲存安全與資料一致性修補

## 1. 執行概述

針對 Claude Code 審查 6-02 實測發現的 3 個資料安全與一致性缺陷，本計畫嚴格遵循 TDD 流程：先撰寫 4 項自動化安全測試（`doc/tests/storage_safety_test.py`）並於 `run_all.py` 驗證其失敗（紅燈），再針對 `assets/scripts/record-manager.js` 進行最小幅度且精準的修補，最終全部 28 項測試與原型快照完全綠燈通過。

---

## 2. 問題成因與修復措施

### 問題 1：還原結構正確但內容無效的備份檔時會清空現有資料
- **原因**：`restoreFromBackup` 在 `.filter(Boolean)` 後未檢核有效標註數量，直接以空陣列 `replaceAllAnnotations`，導致現有病歷被徹底抹除。
- **修復**：解析後檢查若 `restoredAnnotations.length === 0` 且原始 `backupData.records.length > 0`，則拋出例外 `Error('備份檔中沒有任何有效的病歷記錄')`；同時檢核 `replaceAllAnnotations` 的回傳值，失敗時亦拋出例外，確保任何無效備份或寫入失敗均不會清空現有資料，並提供使用者清楚的失敗提示。刻意的空備份（`records: []`）則保持取代清空行為。

### 問題 2：遷移寫入失敗時仍刪除舊 key
- **原因**：`migrateLegacyData` 步驟 3 呼叫 `replaceAllAnnotations` 若因 QuotaExceededError 失敗會回傳 `false`，但步驟 4 未檢查回傳值即逕行刪除 `legacyKeys` 與 `ids`，導致資料在 UI 遺失（僅留存在備份 key 中）。
- **修復**：在步驟 3 後增加檢查，若 `replaceAllAnnotations` 回傳 `false` 則直接 `return`，絕不刪除舊 key；下次載入時將自動重試遷移，且因已實作 `annotationId` 去重，重試具完全冪等性。

### 問題 3：缺少 system 欄位的記錄在巢狀檢視中被誤歸為 teeth
- **原因**：Phase 5 的 `saveBodyOperation` 未寫入 `system` 欄位；`getCurrentRecord()` 過去使用 `normalizeSystem(anno.system) || 'teeth'`，缺少欄位推斷邏輯，導致身體記錄在統計與匯出時全被算作牙齒。
- **修復**：
  1. 新增 `resolveSystem(anno)`：有 `system` 則正規化返回；無 `system` 則優先以 `matchesSystem(anno, 'body')`、`'eye'`、`'teeth'` 推斷（body 優先判斷以避免 side 欄位被 eye 誤判）；皆不符合返回 `'unknown'`。
  2. `getCurrentRecord()` 改用 `resolveSystem`（`'unknown'` 顯示為「未分類」）。
  3. 實作 `backfillMissingSystems()`：在 `RecordManager.init()` 於遷移完成後自動執行，檢查 `medicalRecords` 並為缺少 `system` 的記錄回填正確系統 ID（非 unknown 者），確保清單、統計與匯出標準永久一致。

---

## 3. TDD 測試結果

### (1) 修復前紅燈測試輸出 (`python3 doc/tests/run_all.py`)

```text
--- 執行 Phase 6-03 儲存安全與資料一致性測試 ---
[FAIL] test_restore_invalid_content_keeps_data
       錯誤訊息: v2 全無效還原應回傳 success === false，但收到: {'success': True, 'count': 0}
[PASS] test_restore_empty_backup_replaces
[FAIL] test_migration_write_failure_keeps_legacy_keys
       錯誤訊息: 遷移寫入失敗時 anatomy-record-r1 被錯誤刪除！
[FAIL] test_view_classifies_records_without_system
       錯誤訊息: getCurrentRecord 系統分類錯誤: ['teeth'] (期望為 {'body', 'eye'})

==================================================
 測試結果: 通過 24, 失敗 3, 跳過 0
==================================================
```
精準重現審查提出的 3 個問題（測試 1、3、4 失敗，空備份測試 2 通過）。

### (2) 修復後全綠燈測試輸出 (`python3 doc/tests/run_all.py --with-snapshot`)

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

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 60 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 28, 失敗 0, 跳過 0
==================================================
```

### (3) 工具頁生命週期驗證 (`pages/medical-record.html`)
透過 Playwright 開啟頁面驗證：
```text
Page errors: []
Console errors: []
```
無任何錯誤或例外發生。

---

## 4. Git 提交資訊

分支：`phase-6-unify-storage`（延續分支，未開新分支）
`git log --oneline master..HEAD`：
- `3b7487d docs: Phase 6 審查追加 6-03 資料安全修補計畫`
- `9752ae1 refactor: 整併病歷儲存為單一來源 medicalRecords，RecordManager 為唯一存取層並自動遷移舊資料`
- `2118f48 test: 新增 Phase 6 儲存整併的端到端測試（紅燈）`
- 本次即將提交：`fix: 儲存整併的資料安全修補（還原無效檔不清空、遷移失敗不刪舊資料、無 system 記錄的歸類一致）`
