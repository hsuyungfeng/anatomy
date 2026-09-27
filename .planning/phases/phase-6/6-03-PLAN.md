---
phase: phase-6
plan: 03
type: execute
wave: 3
depends_on: [02]
gap_closure: true
files_modified:
  - doc/tests/storage_safety_test.py
  - doc/tests/run_all.py
  - assets/scripts/record-manager.js
autonomous: true
requirements:
  - STORE-02
  - STORE-03
must_haves:
  truths:
    - "還原一個結構正確、但沒有任何有效標註的備份檔時，現有資料完全不變，並顯示錯誤通知"
    - "遷移時寫入 medicalRecords 失敗，舊的 anatomy-record-* key 一個都不刪，下次載入會再試一次"
    - "沒有 system 欄位的記錄，在巢狀檢視（統計／匯出）的歸類與清單一致"
---

<objective>
修補 Claude Code 審查 6-02 時實測發現的 3 個資料安全與一致性問題（gap closure）。
**在 phase-6-unify-storage 分支上繼續做，不要開新分支。**
</objective>

<context>
## 審查時的實測結果（在 9752ae1 上重現）

**A. 還原無效內容會清空現有資料**
localStorage 先有 1 筆，還原 `{"version":"2.0","records":[1,"x",null]}` →
`restoreFromBackup` 回傳 `{success:true, count:0}`，而且 medicalRecords 變成 0 筆。
原因：record-manager.js `restoreFromBackup` 在 `.filter(Boolean)` 之後沒有檢查結果是否為空，就直接 `replaceAllAnnotations`。v1 分支也一樣。

**B. 遷移寫入失敗時仍刪除舊 key**
模擬 `localStorage.setItem('medicalRecords', ...)` 丟出 QuotaExceededError →
`anatomy-record-r1` 被刪除、medicalRecords 不存在，資料只剩在 `anatomy-record-legacy-backup`（UI 無法讀取）。
原因：`migrateLegacyData` 步驟 3 呼叫 `replaceAllAnnotations`，它會吞掉例外並回傳 `false`，但步驟 4 沒有檢查回傳值就刪除舊 key。

**C. 沒有 system 欄位的記錄在巢狀檢視中被歸成 teeth**
medicalRecords 有一筆 Phase 5 時期存的身體操作記錄（有 `bodyRegionId`、`operationType`，**沒有 `system`**）→
清單（`getAnnotationsBySystem('body')`）顯示 1 筆，但 `getCurrentRecord().anatomicalSystems` 的 systemId 是 `['teeth']`，統計、匯出都會把它算成牙齒。
原因：`getCurrentRecord` 用 `normalizeSystem(anno.system) || 'teeth'`，沒有使用 `matchesSystem` 的欄位推斷。
**真實使用者一定會遇到**：Phase 5 的 `saveBodyOperation` 沒有寫入 `system` 欄位。

## 修正方式

1. **A**：在 `restoreFromBackup` 裡，解析和轉換完成後，如果 `restoredAnnotations.length === 0` 而且原始 `backupData.records` 不是空陣列，就丟出 `Error('備份檔中沒有任何有效的病歷記錄')`（走既有的 catch → 錯誤通知 → `{success:false}`），**不寫入**。
   原始 records 本來就是空陣列（使用者備份了空資料）時，維持現在的取代行為。
   另外 `replaceAllAnnotations` 回傳 `false` 時，也要視為失敗（丟出錯誤），不要顯示「已成功還原」。
2. **B**：`migrateLegacyData` 步驟 3 的 `replaceAllAnnotations` 回傳 `false` 時，**直接 return，不執行步驟 4**。legacy-backup 已經寫入沒關係（它是合併寫入，重試也安全）。
   確認重試是冪等的：下次載入時，舊 key 還在 → 再遷移一次 → 依 annotationId 去重，不會產生重複。
3. **C**：新增一個私有輔助方法 `resolveSystem(anno)`：有 `system` 就回傳正規化後的值；沒有就依序用 `matchesSystem(anno, 'body')`、`'eye'`、`'teeth'` 推斷（**body 要最先判斷**，因為身體記錄可能有 side 但沒有 fdiNumber，會被 eye 的規則誤判）；都不符合就回傳 `'unknown'`。
   - `getCurrentRecord` 改用 `resolveSystem`（`systemName` 對 `'unknown'` 顯示「未分類」）
   - **資料回填**：在 `init()` 裡遷移完成之後，把 medicalRecords 中缺少 `system` 的記錄用 `resolveSystem` 補上（結果是 `'unknown'` 的不補），有變更才寫回。這樣清單、統計、匯出的歸類就永遠一致。
</context>

<tasks>

<task type="auto">
  <name>Task 1：先寫失敗測試</name>
  <files>doc/tests/storage_safety_test.py, doc/tests/run_all.py</files>
  <action>
init script 一律用 sessionStorage 旗標避免重複執行。
1. `test_restore_invalid_content_keeps_data`：預先放 1 筆 → 用 `page.evaluate` 建立 `File`，內容為 `{"version":"2.0","records":[1,"x",null]}`，呼叫 `app.recordManager.restoreFromBackup(file)` → 斷言回傳 `success === false`，而且 medicalRecords 仍然是原本那 1 筆（annotationId 相同）。對 v1 做同樣的測試（`{"version":"1.0","records":[{"recordId":"r","anatomicalSystems":[{"systemId":"teeth","annotations":[null, 5]}]}]}`）。
2. `test_restore_empty_backup_replaces`：預先放 1 筆 → 還原 `{"version":"2.0","records":[]}` → 斷言 `success === true` 且筆數為 0（確認刻意的空備份仍然可以用）。
3. `test_migration_write_failure_keeps_legacy_keys`：init script 先寫入舊格式（`anatomy-record-ids=["r1"]`、`anatomy-record-r1` 內含一筆 teeth 標註 L1），再把 `Storage.prototype.setItem` 包起來，**只在第一次頁面載入時**讓 `key==='medicalRecords'` 丟出 `DOMException('quota','QuotaExceededError')`（用 sessionStorage 旗標控制）→ 斷言 `anatomy-record-r1` 和 `anatomy-record-ids` 都還在。
   接著 reload（這次不注入失敗）→ 斷言 medicalRecords 恰好 1 筆 L1、舊 key 已刪除。
4. `test_view_classifies_records_without_system`：預先放一筆沒有 `system` 的身體操作記錄（`bodyRegionId:'head', operationType:'抽血', side:'left', locationName:'頭部'`）和一筆沒有 `system` 的眼睛記錄（`structureId:'cornea', side:'right'`）→ 斷言 `app.recordManager.getCurrentRecord().anatomicalSystems` 的 systemId 集合是 `{'body','eye'}`，而且 localStorage 裡兩筆都已經回填 `system`。

先在目前的 HEAD（9752ae1）上執行，確認 1、3、4 失敗（2 可能通過），把輸出貼進 SUMMARY。
  </action>
  <verify>修正前：1、3、4 FAIL</verify>
</task>

<task type="auto">
  <name>Task 2：修正 record-manager.js</name>
  <files>assets/scripts/record-manager.js</files>
  <action>依 context「修正方式」修改。只改 record-manager.js。不要加 console.log。</action>
  <verify>node --check；python3 doc/tests/run_all.py --with-snapshot 0 失敗 0 跳過（record-manager 不在 app 原型上，快照不應該變動；如果有變動，停下來說明）</verify>
</task>

</tasks>

<verification>
- `python3 doc/tests/run_all.py --with-snapshot`：0 失敗、0 跳過
- 寫 `.planning/phases/phase-6/6-03-SUMMARY.md`（修正前的失敗輸出、修正後的完整輸出、`git log --oneline master..HEAD`）
</verification>

<commit>
fix: 儲存整併的資料安全修補（還原無效檔不清空、遷移失敗不刪舊資料、無 system 記錄的歸類一致）
</commit>
