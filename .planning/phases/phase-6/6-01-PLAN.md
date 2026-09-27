---
phase: phase-6
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - doc/tests/storage_unify_test.py
  - doc/tests/run_all.py
autonomous: true
requirements:
  - STORE-01
  - STORE-02
  - STORE-03
  - STORE-04
must_haves:
  truths:
    - "doc/tests/storage_unify_test.py 描述了整併後的預期行為，而且在目前的 master 上大部分會失敗"
    - "這個計畫不修改任何產品程式碼"
---

<objective>
先寫出「整併成一套儲存後應該成立的行為」的端到端測試（TDD 紅燈階段）。6-02 才會修改產品程式碼。
</objective>

<context>
## 現況：兩套儲存並存

| | A. `localStorage['medicalRecords']` | B. RecordManager |
|---|---|---|
| 形狀 | 扁平陣列，每個元素是一筆標註（annotation），有 `system` 欄位 | `anatomy-record-ids` + 每筆病歷一個 key `anatomy-record-<uuid>`，巢狀結構：`{recordId, patientId, createdAt, updatedAt, anatomicalSystems:[{systemId, annotations:[...]}], notes}` |
| 誰在寫 | `saveMedicalRecord`（app-records.js） | `recordManager.addAnnotation`（app-modal.js、app-body.js） |
| 誰在讀 | 病歷清單（`loadAndDisplayRecords`） | 圖上標記（`loadAnnotations`）、疾病可視化、`updateRecordList`、備份／還原、匯出 JSON/Text/CSV/PDF、清除全部、統計（`record-statistics.js` 直接讀 `anatomy-record-*` key）、搜尋 |

目前儲存時兩邊**都寫**（app-modal.js `saveDiseaseAnnotation`、app-body.js `saveBodyOperation`）。

## 已知的實際症狀（測試要涵蓋）
1. `new RecordManager()` 沒有傳入 `currentRecordId`，所以**每次載入頁面都會建立一筆新的空病歷**：
   - 重新整理後，圖上的標記會消失（`loadAnnotations` 讀的是新的空病歷）
   - 每次載入頁面，localStorage 就多一個 `anatomy-record-<uuid>` key
2. 備份只包含 B：「還原」後清單（讀 A）不會顯示還原的資料
3. 「清除全部」只清 B：清單（讀 A）還是會顯示
4. 統計讀 B 的所有 key，清單讀 A，兩邊的數字可能不一致
5. UI 沒有任何地方可以設定 `patientId`，所以「病歷」這一層實際上只是「某次頁面載入」，沒有業務意義

## 整併後的目標行為（測試依據）
- 唯一的資料來源：`localStorage['medicalRecords']`（扁平的標註陣列）
- 舊的 `anatomy-record-*` 資料在首次載入時自動遷移進來，遷移後刪除舊 key，但保留一份完整的原始備份在 `anatomy-record-legacy-backup`
- 備份檔改成 v2 格式：`{version:'2.0', createdAt, appName, recordCount, records:[扁平標註...]}`；還原時 **v1（舊巢狀）與 v2 都要接受**
</context>

<tasks>

<task type="auto">
  <name>Task 1：撰寫整併行為的端到端測試</name>
  <files>doc/tests/storage_unify_test.py, doc/tests/run_all.py</files>
  <action>
沿用 records_flow_test.py 的做法（新 context、開啟模態的方式、點真正的 `#modal-save-btn`）。遇到 `confirm()` 用 `page.on("dialog", lambda d: d.accept())`；下載檔案用 `page.expect_download()`。

1. `test_no_storage_growth_on_reload`：乾淨的 context 載入頁面 3 次（reload），斷言 localStorage 的 key 數量沒有增加（記錄第 1 次載入後的 key 集合，之後每次都要相同）。
2. `test_markers_persist_after_reload`：牙齒系統存一筆 → reload → 斷言 `window.app.annotator` 上的標註數量 ≥ 1（先讀 image-annotator.js 確認正確的屬性名稱）。
3. `test_backup_contains_saved_record`：存一筆牙齒記錄 → 點備份按鈕 → 解析下載的 JSON → 斷言 `version === '2.0'`，且 `records` 中有一筆 annotationId 等於 localStorage 中那筆。
4. `test_restore_v2_shows_in_list`：用 `set_input_files` 上傳一個 v2 備份檔（含牙齒一筆、身體一筆）→ 牙齒分頁的清單顯示牙齒那筆，身體分頁顯示身體那筆。
5. `test_restore_v1_legacy_backup`：上傳 v1 格式（巢狀，`anatomicalSystems:[{systemId:'eye', annotations:[...]}]`）→ 眼睛分頁清單顯示該筆，而且 localStorage['medicalRecords'] 中那筆的 `system === 'eye'`。
6. `test_clear_all_clears_list`：存一筆 → 清除全部（接受 confirm）→ 清單顯示空狀態，`localStorage.medicalRecords` 是空陣列或不存在。
7. `test_statistics_match_list`：存牙齒 2 筆、眼睛 1 筆 → 統計（直接呼叫 `app.recordStatistics` 的統計方法，名稱先從原始碼確認）的總數 === 3。
8. `test_migrate_legacy_keys`：用 add_init_script 預先寫入：
   - `anatomy-record-ids = ["r1"]`、`anatomy-record-r1` = 巢狀病歷，包含 teeth 標註 a1、eye 標註 a2
   - `medicalRecords = [a1 的副本]`（模擬兩邊都寫過的重複資料）

   **注意 init script 每次導航都會執行**，所以要用 sessionStorage 旗標確保只寫入一次。
   載入後斷言：`medicalRecords` 恰好 2 筆（a1 不重複）、a2 的 `system === 'eye'`；`anatomy-record-ids`、`anatomy-record-r1` 已經不存在；`anatomy-record-legacy-backup` 存在。
9. `test_single_write_per_save`：存一筆後，斷言沒有任何 `anatomy-record-` 開頭的 key（`anatomy-record-legacy-backup` 除外）。
10. `test_export_csv_contains_saved`：存一筆 → 用 `app.exportRecord('csv')`（或 UI 按鈕）下載 → CSV 內容包含該疾病名稱。

加進 run_all.py。
  </action>
  <verify>
在目前的 master 上執行 `python3 doc/tests/run_all.py`：**新測試大部分應該 FAIL**（test_export_csv_contains_saved 之類的可能剛好通過，沒關係）。把每個測試的結果和失敗訊息貼進 SUMMARY。
原有的 14 項測試必須仍然通過。
  </verify>
</task>

</tasks>

<verification>
- `git diff --stat` 只有 doc/tests/ 底下的檔案
- 新測試在修改前確實失敗（貼輸出）
</verification>

<commit>
test: 新增 Phase 6 儲存整併的端到端測試（紅燈）
</commit>
