# Phase 7-02 執行總結：病歷清單標籤依系統顯示、位置名稱去重與關閉身體座標待辦

## 執行成果
- 修正病歷清單側別標籤：
  - 眼睛系統：依側別顯示「左眼 / 右眼 / 雙眼」
  - 身體系統：依側別顯示「左側 / 右側 / 中線」，不再錯誤顯示為「右眼」
  - 牙齒系統：不顯示側別標籤
- 消除位置名稱重複問題：
  - 群組標題已顯示結構/部位名稱，每筆記錄項目的標題改為只顯示時間（`⏰ YYYY-MM-DD HH:MM:SS`）
  - 若個別記錄的側別與群組標題側別不同，才額外在項目標題附上側別標籤（例如眼睛同部位不同眼側），避免冗餘
- 將 `RecordManager.resolveSystem` 提升為 `static` 方法（並保留實例委派），方便 `app-records.js` 等外部模組在群組化時安全推斷記錄所屬系統。
- 關閉舊待辦：將 `.planning/todos/pending/2026-02-26-shen-ti-tu-xiang-wei-zhi-dian-ji-zuo-biao-bu-zheng-que.md` 透過 `git mv` 移至 `.planning/todos/done/` 並註記結案。
- 更新原型方法快照基準（新增 `getSideLabel`，變更 `groupRecordsByStructure` 與 `renderGroupedRecords`）。
- 執行 `bump_cache.py` 將快取升級至 `anatomy-v4` 並更新靜態資源雜湊基準。

---

## 修改的檔案
- `assets/scripts/app/app-records.js`：
  - 新增 `getSideLabel(system, side)` 原型方法
  - `groupRecordsByStructure`：群組物件新增 `system` 屬性（透過 `RecordManager.resolveSystem` 解析）
  - `renderGroupedRecords`：群組標題與個別項目改用 `getSideLabel`；個別項目標題不再重複輸出 `locationName`
- `assets/scripts/record-manager.js`：
  - 將 `resolveSystem(anno)` 提升為靜態方法 `static resolveSystem(anno)`，並保留 `resolveSystem(anno)` 實例方法委派
- `.planning/todos/done/2026-02-26-shen-ti-tu-xiang-wei-zhi-dian-ji-zuo-biao-bu-zheng-que.md`：
  - 從 `pending/` 移入 `done/`，並加入結案說明段落
- `doc/tests/record_labels_test.py`：新增 3 項端到端標籤與去重測試
- `doc/tests/run_all.py`：整合 Phase 7-02 測試項目
- `doc/tests/baseline/prototype-methods.json`：更新原型快照基準（共 61 個方法）
- `sw.js`：快取名稱升至 `anatomy-v4`
- `doc/tests/baseline/assets-hash.json`：更新靜態資源雜湊基準

---

## 測試輸出

### 修改前（紅燈：2 項失敗，符合計畫預期）
```
--- 執行 Phase 7-02 病歷清單標籤與重複名稱測試 ---
[FAIL] test_body_side_label
       錯誤訊息: 身體病歷清單應包含「右側」，當前文字為:
右手臂
右眼
右手臂 (右眼)
⏰ 2026-03-01 18:00:00
🏥 抽血
📋 例行抽血檢驗
[PASS] test_eye_side_label
[FAIL] test_location_name_not_repeated
       錯誤訊息: 牙齒病歷清單中「右上第一大臼齒」應只出現 1 次，實際出現 3 次。內容:
右上第一大臼齒
右上第一大臼齒
⏰ 2026-03-01 21:00:00
🏥 牙髓炎
右上第一大臼齒
⏰ 2026-03-01 20:00:00
🏥 齲齒

==================================================
 測試結果: 通過 32, 失敗 2, 跳過 0
==================================================
```

### 快照比對確認（僅預期的 3 個方法）
```
[FAIL] 原型方法快照與基準不符:
  新增方法 (1):
    + getSideLabel
  內容變更方法 (2):
    * groupRecordsByStructure (舊: c800c06d... 新: 086baaa1...)
    * renderGroupedRecords (舊: bddce05a... 新: 957dfc3c...)
```

### 修改後（綠燈：全部通過）
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

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 61 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 35, 失敗 0, 跳過 0
==================================================
```

---

## 發現的問題與架構說明
1. **`RecordManager.resolveSystem` 提升為 static**：
   在 `groupRecordsByStructure` 進行分組時，記錄物件可能缺少 `system` 欄位（例如由舊版資料庫產生或尚未回填）。將 `resolveSystem` 定義為靜態方法後，不論物件實例是否就緒，都能安全且一致地推斷出 `body`、`eye` 或 `teeth`。
2. **項目標題去重**：
   原先每個 `record-item` 的標題結構為 `<div class="record-item__title">${record.locationName}</div>` 與 `<div class="record-item__timestamp">⏰ ${timestamp}</div>`。去重後，項目標題直接整合為時間戳與相異側別標籤，移除了位置名稱的重複輸出，介面資訊更加精簡清晰。

---

## 偏離計畫之處
無偏離計畫。
