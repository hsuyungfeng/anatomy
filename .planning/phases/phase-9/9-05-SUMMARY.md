# Phase 9-05 執行總結：5 個介面小問題修正與眼睛身體座標辨識死碼清理

## 執行成果
- 依據 `9-05-PLAN.md` 完成 5 個介面體驗細節修正，以及全面清理眼睛、身體舊座標辨識與標籤按鈕死碼：
  1. **Task 1：五個介面小問題修正**
     - **縮放按鈕在 SVG 模式無作用**：Phase 9-02 已整合 `SvgViewport`，本階段驗證 `test_zoom_buttons_work_in_svg` 順利通過。
     - **儲存通知文字去除重複打勾與信心度**：
       - `assets/scripts/app/app-modal.js` 之 `saveDiseaseAnnotation` 移除「（高信心度）」後綴，並移除訊息文字中自帶的「✓」（因 `showNotification` 成功提示圖示已自帶打勾符號），通知改為「眼睛病例已成功保存」與「疾病記錄已保存」。
       - `assets/scripts/app/app-body.js` 之 `saveBodyOperation` 通知文字由「✓ 身體系統操作記錄已成功保存」改為「身體系統操作記錄已成功保存」。
     - **首次載入時牙齒子分頁可見性**：
       - 在 `assets/scripts/app/app-core.js` 抽出共用方法 `updateTeethSubTabs(systemId, resetToPermanent)`。
       - 在 `init()` 載入初始圖像後呼叫 `this.updateTeethSubTabs(this.currentSystemId)`，確保首次載入預設牙齒系統時，乳齒／永久齒子分頁立即呈現，`test_teeth_subtabs_visible_on_load` 通過。
     - **深色模式下病歷卡片改用主題變數**：
       - 修改 `assets/styles/main.css` 與 `assets/styles/modal.css`：`.record-group`、`.record-group__header`、`.record-group__items`、`.record-item`、`.record-item:hover`、`.record-group-title`、`.record-group-content` 等固定淺色背景（`white`、`#e8f4f8`、`#f9f9f9`）與固定文字色，全面改用 CSS 主題變數（`--color-bg-primary`、`--color-bg-secondary`、`--color-text-primary`、`--color-border` 等）。
       - 深色模式下病歷卡片計算背景亮度降至 < 0.5，`test_dark_mode_record_cards` 通過。
     - **眼睛病歷清單群組標題側別重複**：
       - 修改 `assets/scripts/app/app-records.js` 之 `renderGroupedRecords`：當 `structureName` 已包含側別文字（例如「左眼」或新記錄「右眼 角膜」）時，不重複顯示側別徽章。
       - `test_eye_list_no_duplicate_side` 驗證群組標題「左眼」僅出現 1 次，測試通過。

  2. **Task 2：死碼清理與架構精簡**
     - **眼睛系統死碼移除 (`assets/scripts/app/app-eye.js`)**：
       - 移除座標偵測與文字標籤按鈕相關方法：`detectEyeStructure`、`estimateEyeLocation`、`setupEyeLabelButtonListeners`、`toggleEyeLabelPanel`、`openDiseaseModalWithStructure`、`getChineseStructureName`、`getStructureType`。
       - 依計畫規則檢查呼叫端：發現 `app-records.js` 之 `fixLegacyRecords` 仍呼叫 `this.getStructureSide(record.structureId)` 補齊舊記錄側別，因此將 `getStructureSide` 移植並實作於 `app-records.js`（整合 `AnatomyMapping.resolveEye`），使 `app-eye.js` 不再殘留舊邏輯，同時舊資料修復維持相容。
     - **身體系統死碼移除 (`assets/scripts/app/app-body.js`)**：
       - 移除座標偵測、手動選單與舊模態輔助方法：`detectBodyRegion`、`estimateBodyLocation`、`renderManualBodySelector`、`setupManualBodySelector`、`openDiseaseModalWithBodyRegion`、`displayBodyStructureInfo`。
     - **核心控制器與模態視窗簡化 (`assets/scripts/app/app-core.js`, `assets/scripts/app/app-modal.js`)**：
       - `app-core.js`：移除 `this.eyeMapper`、`this.eyeLabelMapper`、`this.bodyImageMapper` 初始化與屬性；`setupEventListeners` 移除 `setupEyeLabelButtonListeners` 呼叫；`loadSystemImage` 移除 `toggleEyeLabelPanel` 呼叫；`handleAnnotationClick` 簡化為參考圖模式防呆提示。
       - `app-modal.js`：`openDiseaseModal` 僅保留 SVG `presetStructure` 路徑（無 preset 直接 return），移除所有座標辨識分支與手動選擇器呼叫；簡化 `getLocationName` 移除對 `estimateEyeLocation` / `estimateBodyLocation` 的依賴。
     - **HTML 與快取資產更新 (`index.html`, `sw.js`, `assets/styles/modal.css`)**：
       - `index.html`：移除 `#eye-label-panel-container` HTML 標籤面板；移除 `<script>` 載入 `eye-image-mapper.js`、`eye-label-mapper.js`、`body-image-mapper.js`（檔案本身保留供 `doc/tools/` 使用）。
       - `sw.js`：`ASSETS_TO_CACHE` 移除上述 3 支 mapper 檔案。
       - `assets/styles/modal.css`：移除 `.eye-label-panel-container` 與 `.eye-label-btn` 相關 CSS 規則。
       - `grep -rn "detectEyeStructure\|detectBodyRegion\|renderManualBodySelector\|eye-label-btn" assets/ index.html` 驗證結果為 0。
     - **輔助工具文件標註 (`doc/tools/README.md`)**：
       - 針對 `eye-calibration.html`、`eye-label-mapping-tool.html`、`eye-text-recognition.html`、`visualize-coordinates.html` 增補「Phase 9 起 app 改用 SVG 結構圖，僅保留參考」說明。
     - **版本與快照更新**：
       - 執行 `bump_cache.py` 將 Service Worker 快取版本升級至 `anatomy-v13`，更新 `assets-hash.json`。
       - 原型方法快照比對確認差異僅包含計畫指定刪除的 13 個方法、新增的 `updateTeethSubTabs` 與相應調整的 12 個方法，執行 `--write` 更新至基準檔（共 65 個有效方法）。

---

## 修改的檔案
- `assets/scripts/app/app-core.js`：新增 `updateTeethSubTabs`，移除 mapper 模組初始化、標籤按鈕監聽與簡化 `handleAnnotationClick`
- `assets/scripts/app/app-modal.js`：簡化 `openDiseaseModal`（僅保留 presetStructure），更新通知文字（去打勾、去信心度），簡化 `getLocationName`
- `assets/scripts/app/app-body.js`：更新 `saveBodyOperation` 通知文字，移除 `detectBodyRegion`、`estimateBodyLocation`、`renderManualBodySelector`、`setupManualBodySelector`、`openDiseaseModalWithBodyRegion`、`displayBodyStructureInfo`
- `assets/scripts/app/app-eye.js`：移除標籤按鈕監聽、結構名稱映射、`detectEyeStructure`、`estimateEyeLocation`、`toggleEyeLabelPanel`
- `assets/scripts/app/app-records.js`：`renderGroupedRecords` 避免重複側別徽章，新增 `getStructureSide` 支援舊記錄修復
- `assets/styles/main.css`：病例分組卡片改用 CSS 主題變數支援深色模式
- `assets/styles/modal.css`：病例分組改用 CSS 主題變數，移除已廢棄之眼睛標籤選擇面板樣式
- `index.html`：移除 `#eye-label-panel-container`，移除 3 支 mapper script 標籤
- `sw.js`：快取清單移除 3 支 mapper 檔案
- `doc/tools/README.md`：標註眼睛與身體校正工具僅供參考
- `doc/tests/baseline/assets-hash.json`：快取版本升級至 `anatomy-v13`
- `doc/tests/baseline/prototype-methods.json`：更新原型方法快照基準（65 個方法）

---

## 測試輸出

### 修改前（Phase 9-04 執行後，Task 1 未修改前）
```
--- 執行 Phase 9-01 介面細節與體驗優化測試 ---
[FAIL] test_teeth_subtabs_visible_on_load
       錯誤訊息: 首次載入預設為牙齒系統，乳齒分頁 .teeth-tab[data-teeth-type='primary'] 應直接可見
[FAIL] test_save_notification_text
       錯誤訊息: 通知訊息不應包含 '信心度'，實際為: '✓\n✓ 疾病記錄已保存（高信心度）'
[PASS] test_zoom_buttons_work_in_svg
[FAIL] test_dark_mode_record_cards
       錯誤訊息: 深色模式下 .record-group 背景亮度應 < 0.5，實際為 1.000 (rgb: 255,255,255)
[FAIL] test_eye_list_no_duplicate_side
       錯誤訊息: 群組標題中 '左眼' 應只出現 1 次，實際出現 2 次: '左眼\n左眼'

==================================================
 測試結果: 通過 58, 失敗 4, 跳過 0
==================================================
```

### 修改後（Phase 9-05 完成後）
```
$ LD_LIBRARY_PATH="/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH" python3 doc/tests/run_all.py --with-snapshot
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
[PASS] test_teeth_subtabs_visible_on_load
[PASS] test_save_notification_text
[PASS] test_zoom_buttons_work_in_svg
[PASS] test_dark_mode_record_cards
[PASS] test_eye_list_no_duplicate_side

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 65 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 63, 失敗 0, 跳過 0
==================================================
```

---

## 偏離計畫之處
- 無。所有任務皆嚴格遵照 `9-05-PLAN.md` 規範完成。

---

## Phase 9-04 Task 4 截圖清單
1. `doc/prototypes/screenshots/phase-9/01-eye-od-light.png`
2. `doc/prototypes/screenshots/phase-9/02-eye-os-dark.png`
3. `doc/prototypes/screenshots/phase-9/03-body-female-light.png`
4. `doc/prototypes/screenshots/phase-9/04-body-male-dark.png`
5. `doc/prototypes/screenshots/phase-9/05-body-zoom-face.png`

---

## 分支提交記錄 (`git log --oneline master..HEAD`)
```
9ebaf91 fix(ui): 修正 5 個介面小問題；refactor: 移除眼睛與身體座標辨識死碼
997b010 feat(body): 身體系統改用寫實輪廓 SVG（正背面、男女體型），相容三套舊 ID 並支援放大臉部
9c1960b feat(eye): 眼睛系統改用結構化 SVG 剖面圖（OD／OS），相容既有 structureId 並新增 5 個結構
483bb08 feat: SVG 縮放平移、通用參考圖切換、舊記錄 ID 對應模組
8480f6e test: 新增 Phase 9 眼睛／身體 SVG、舊記錄對應、縮放與介面修正測試（紅燈）
```

