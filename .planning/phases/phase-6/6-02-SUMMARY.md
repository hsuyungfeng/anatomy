# Phase 6-02 計畫執行總結：儲存整併與存取層重構

## 1. 執行概述

本計畫已成功將病歷資料整併為以 `localStorage['medicalRecords']` 為單一資料來源，並將 `RecordManager` 重構為全系統唯一的病歷存取層，徹底解決了原本雙重儲存、重新整理自動增長、標記與清單不同步等問題。

---

## 2. 設計決策與改動細節

### (1) RecordManager 重構為唯一存取層 (`assets/scripts/record-manager.js`)
- **單一來源**：只讀寫 `localStorage['medicalRecords']`（扁平標註陣列）。建構子完全不再產生任何 `anatomy-record-*` key，消除了每次重新整理或初始化就自動建立新病歷的 bug。
- **唯讀巢狀檢視相容層**：
  - `getCurrentRecord()`：將扁平標註按 `system` 分組，生成單一虛擬病歷（包含 `recordId: 'all'`, `createdAt`, `updatedAt`, `anatomicalSystems: [...]`）。
  - `getAllRecords()`：無標註時返回 `[]`，有標註時返回 `[getCurrentRecord()]`。
  - 匯出功能（JSON / Text / CSV / PDF）、列印、統計等舊有約 39 處依賴巢狀結構的方法直接相容運作，無需改寫呈現邏輯。
- **system 正規化與通用比對**：
  - `RecordManager.normalizeSystem(sys)`：統一將 `primary_teeth` 與 `tooth` 正規化為 `teeth`。
  - `RecordManager.matchesSystem(record, sys)`：集中管理跨系統標註識別邏輯（包含牙齒 FDI/通用編號、眼睛 structureId、身體部位與手術類型），確保篩選標準唯一。
- **舊資料冪等自動遷移 (`migrateLegacyData`)**：
  - 於 `init()` 期間自動執行。
  - 檢查 `anatomy-record-ids` 與所有 `anatomy-record-<id>`。
  - 先將所有舊 key 的原始字串完整備份至 `anatomy-record-legacy-backup`（若已存在則合併，絕不覆蓋或遺失使用者資料）。
  - 將巢狀標註攤平補齊 `system`、`annotationId`、`createdAt`、`updatedAt`，以 `annotationId` 去重後併入 `medicalRecords`。
  - 清理舊 key，保留 `anatomy-record-legacy-backup`。
- **備份與還原升級**：
  - `backupAllData()`：輸出 v2.0 扁平格式（`version: '2.0'`, `records: [...]`）。
  - `restoreFromBackup(file)`：支援 v1.0 舊巢狀格式（自動攤平與補齊）與 v2.0 扁平格式；寫入前做結構驗證與物件檢核，確保外部無效輸入不致清空現有資料。
  - `clearAll()`：彈出確認對話框，清空 `medicalRecords`，保留救命備份 `anatomy-record-legacy-backup`。
- **舊方法相容性**：
  - `createRecord`、`saveRecord`、`updateRecordIds`、`deleteRecord`、`loadRecords` 經 grep 調查，全專案（包括 `pages/medical-record.html`）均無外部呼叫端。為防止潛在相容問題，保留為安全空實作（no-op），不再寫入任何 `anatomy-record-*` key。

### (2) 統計模組改寫 (`assets/scripts/record-statistics.js`)
- 建構子改為接收 `recordManager`（`constructor(recordManager = null)`）。
- `getAllRecords()` 改為委派 `this.recordManager ? this.recordManager.getAllRecords() : []`，徹底移除直接存取 `anatomy-record-*` 的舊邏輯。

### (3) App 模組改用單一儲存 (`assets/scripts/app/`)
- **`app-core.js`**：
  - 初始化模組時傳入 `this.recordManager` 至 `new RecordStatistics(this.recordManager)`。
  - 備份還原事件監聽器中，還原後調用 `await this.loadAndDisplayRecords()`、`this.loadAnnotations(this.currentSystemId)` 並更新統計，確保清單與圖上標記即時同步。
  - `loadSystemImage` 中移除 Phase 5 暫時加入的 `await this.loadAndDisplayRecords()`，改為 `await this.updateRecordList(systemId)`。
- **`app-records.js`**：
  - `updateRecordList(systemId)` 簡化為直接 `return this.loadAndDisplayRecords();`，確保清單只有單一渲染途徑。
  - `saveMedicalRecord` 委派給 `this.recordManager.addAnnotation`。
  - `loadMedicalRecords` 委派給 `this.recordManager.getAllAnnotations`。
  - `loadAndDisplayRecords` 中的存檔改為 `this.recordManager.replaceAllAnnotations(allRecords)`。
  - `filterRecordsBySystem` 委派給 `RecordManager.matchesSystem`。
  - `clearRecords` 委派給 `this.recordManager.clearAll()`，並清理畫布標記與刷新清單。
- **`app-modal.js` & `app-body.js`**：
  - 修正雙重寫入問題：在 `saveDiseaseAnnotation` 與 `saveBodyOperation` 中移除多餘的 `this.saveMedicalRecord(...)` 呼叫，僅保留 `this.recordManager.addAnnotation(...)`。

---

## 3. 靜態規則驗證

1. **localStorage 讀寫範圍**：
   - 執行 `grep -rn "localStorage" assets/scripts/app/ assets/scripts/record-statistics.js`：
     ```text
     assets/scripts/app/app-core.js:85:    const savedTheme = localStorage.getItem('theme') || 'light';
     assets/scripts/app/app-core.js:97:   * @param {boolean} save - 是否保存到 localStorage
     assets/scripts/app/app-core.js:115:      localStorage.setItem('theme', theme);
     ```
     僅剩 `theme` 偏好設定使用，無任何病歷讀寫。
2. **病歷儲存 key 隔離**：
   - 執行 `grep -rn "'medicalRecords'\|anatomy-record" assets/scripts`：
     僅出現在 `assets/scripts/record-manager.js` 中（以及 `disease-data-migration.js` 既有的預設前綴）。
3. **無 console.log 殘留**：
   - 檢查 git diff 顯示新寫入之程式碼完全沒有任何 `console.log`。

---

## 4. 頁面無錯誤驗證 (`pages/medical-record.html`)

透過 Playwright 載入 `pages/medical-record.html` 並監控頁面生命週期中的 pageerror 與 console：
```text
Page errors: []
Console errors: []
Total logs: 0
```
確認無任何未捕捉例外或語法錯誤。

---

## 5. 原型快照驗證 (`doc/tests/snapshot_prototype.py`)

執行 `python3 doc/tests/snapshot_prototype.py --check` 之比對結果：
```text
[FAIL] 原型方法快照與基準不符:
  內容變更方法 (11):
    * clearRecords (舊: a4618717... 新: 944f7179...)
    * filterRecordsBySystem (舊: 7d4c8993... 新: e4f4401c...)
    * initModules (舊: a8f2ba9b... 新: 68d5d905...)
    * loadAndDisplayRecords (舊: f7308f05... 新: a0573628...)
    * loadMedicalRecords (舊: c05edfbe... 新: 29ef0600...)
    * loadSystemImage (舊: 67c75a71... 新: f246c366...)
    * saveBodyOperation (舊: 107bb016... 新: ebc2fae6...)
    * saveDiseaseAnnotation (舊: 596f59e0... 新: 52c8d322...)
    * saveMedicalRecord (舊: 01f92e01... 新: 6d7694e5...)
    * setupEventListeners (舊: ad457fb3... 新: ea41fe92...)
    * updateRecordList (舊: 543e5390... 新: ababa207...)
```
變更的方法完全落在預期列表（包括呼叫端與儲存介面更新），確認無超出範圍之非預期變動後，已執行 `--write` 更新基準檔。

---

## 6. 自動化測試完整報告 (`python3 doc/tests/run_all.py --with-snapshot`)

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

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 60 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 24, 失敗 0, 跳過 0
==================================================
```

---

## 7. Git 提交資訊

分支：`phase-6-unify-storage`
`git log --oneline master..HEAD`：
- `2118f48 test: 新增 Phase 6 儲存整併的端到端測試（紅燈）`
- 本次即將提交：`refactor: 整併病歷儲存為單一來源 medicalRecords，RecordManager 為唯一存取層並自動遷移舊資料`
