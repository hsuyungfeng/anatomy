---
phase: phase-6
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - assets/scripts/record-manager.js
  - assets/scripts/record-statistics.js
  - assets/scripts/app/app-core.js
  - assets/scripts/app/app-records.js
  - assets/scripts/app/app-modal.js
  - assets/scripts/app/app-body.js
  - doc/tests/baseline/prototype-methods.json
autonomous: true
requirements:
  - STORE-01
  - STORE-02
  - STORE-03
  - STORE-04
must_haves:
  truths:
    - "整個 assets/ 中只有 record-manager.js 會直接讀寫 localStorage 的病歷資料（theme 等設定除外）"
    - "`grep -rn \"'medicalRecords'\\|anatomy-record\" assets/scripts` 只出現在 record-manager.js（以及 disease-data-migration.js 既有的前綴參數）"
    - "6-01 的測試全部通過，原有 14 項測試也全部通過，0 跳過"
---

<objective>
以 `localStorage['medicalRecords']`（扁平標註陣列）作為唯一的資料來源，`RecordManager` 成為唯一讀寫它的地方；
並提供唯讀的「巢狀檢視」，讓依賴舊巢狀結構的匯出、統計、搜尋、PDF 程式碼（約 39 處）不用改寫。
</objective>

<context>
## 設計決策（已定案，請照做）

1. **為什麼選 medicalRecords 作為唯一來源**：清單、篩選（filterRecordsBySystem）、分組、fixLegacyRecords 都已經建立在扁平結構上，而且 Phase 5 剛用端到端測試驗證過。巢狀結構的「病歷」這一層沒有業務意義（UI 無法設定 patientId，每次載入頁面還會自動建立一筆新的）。
2. **巢狀檢視（相容層）**：`RecordManager` 提供唯讀方法，把扁平陣列組成**一筆**虛擬病歷：
   ```js
   {
     recordId: 'all',
     patientId: '',
     createdAt: <所有標註中最早的 createdAt，沒有就用現在時間>,
     updatedAt: <最晚的 updatedAt>,
     notes: '',
     anatomicalSystems: [ { systemId, systemName: systemId, imageId: '', annotations: [...] }, ... ]  // 依 annotation.system 分組
   }
   ```
   `getCurrentRecord()` 回傳它；`getAllRecords()` 回傳 `[它]`（沒有任何標註時回傳 `[]`）。
   這樣 exportAsJSON/Text/CSV/PDF、generatePDFContent、getStatistics、record-statistics.js 都能**不改邏輯**直接運作。
3. **system 正規化**：寫入時 `system` 一律正規化為 `teeth` / `eye` / `body`（`primary_teeth` → `teeth`）。巢狀檢視的 `systemId` 用正規化後的值。`getAnnotationsBySystem('primary_teeth')` 要回傳 teeth 的資料。
   篩選規則沿用 Phase 5 的 `filterRecordsBySystem`：**把那段邏輯搬進 RecordManager**（例如 `RecordManager.matchesSystem(record, systemId)` 靜態方法），app 的 `filterRecordsBySystem` 改成委派給它，避免兩份規則。
4. **遷移**（`RecordManager` 的 init 中，在既有 `DiseaseDataMigration` 之後執行，必須冪等）：
   - 讀取 `anatomy-record-ids` 與每個 `anatomy-record-<id>`
   - 如果有任何舊資料：先把**所有舊 key 的原始值**存成 `anatomy-record-legacy-backup`（JSON：`{migratedAt, entries:{key: 原始字串}}`）；如果這個備份 key 已經存在，就合併進去，不要覆蓋
   - 把每個巢狀標註補上 `system`（取自父層 systemId 並正規化），依 `annotationId` 去重後併入 medicalRecords（已存在的以 medicalRecords 為準）；沒有 annotationId 的標註用 `generateUUID()` 補上
   - 刪除 `anatomy-record-ids` 與所有 `anatomy-record-<id>`（**不要刪** `anatomy-record-legacy-backup`）
   - 空的病歷（沒有標註）直接丟棄
5. **備份 v2**：`backupAllData()` 回傳 `{version:'2.0', createdAt, appName:'Anatomy Medical System', recordCount, records:<扁平陣列>}`。
   **還原**：`version` 以 `'1.'` 開頭 → 把巢狀資料攤平（規則同遷移）；`'2.'` 開頭 → 直接使用。還原是「取代」（跟現在的行為一致：「還原將覆蓋現有數據」），寫入前對每一筆做基本驗證（必須是物件、有 annotationId 或可補上），並正規化 system。
   **資料安全**：還原的內容是不可信的外部輸入，渲染端 Phase 4 已經跳脫過；這裡只要確保不會因為格式錯誤而把現有資料清空（先完整解析、驗證成功後才寫入）。
6. **清除全部**：清空 medicalRecords（保留 `anatomy-record-legacy-backup`，那是使用者的救命備份）。

## RecordManager 對外 API（保留名稱，呼叫端不必改）

| 方法 | 新行為 |
|------|--------|
| `addAnnotation(systemId, annotation)` | 補上 `system`（若缺）、`annotationId`（若缺）、`createdAt/updatedAt`（若缺）→ 寫入 medicalRecords → `dispatchEvent('annotation:added', ...)` |
| `updateAnnotation(systemId, annotationId, updates)` / `deleteAnnotation(systemId, annotationId)` | 依 annotationId 操作 medicalRecords；保留事件 |
| `getAnnotationsBySystem(systemId)` | 從 medicalRecords 篩選 |
| `getAllAnnotations()` **新增** | 回傳扁平陣列（複本） |
| `replaceAllAnnotations(list)` **新增** | 整批寫入（供 fixLegacyRecords 回存、還原使用） |
| `getCurrentRecord()` / `getAllRecords()` | 巢狀檢視（唯讀） |
| `createRecord()` / `saveRecord()` / `updateRecordIds()` / `deleteRecord()` / `loadRecords()` | 移除，或改為不寫入任何 `anatomy-record-*` key 的相容空實作。先 grep 確認呼叫端（包含 pages/medical-record.html），在 SUMMARY 說明處理方式 |
| `clearAll()` | 保留 confirm，清空 medicalRecords |
| `backupAllData()` / `downloadBackup()` / `restoreFromBackup(file)` | 依上面第 5 點 |
| export 系列 | 不改，透過巢狀檢視運作 |

## app 端要改的地方
- `app-records.js`：`saveMedicalRecord` / `loadMedicalRecords` 改成委派給 `this.recordManager`（保留方法名稱，因為其他地方還在呼叫）。`loadAndDisplayRecords` 中 `localStorage.setItem('medicalRecords', ...)` 改成 `this.recordManager.replaceAllAnnotations(...)`。`filterRecordsBySystem` 委派給 RecordManager。
- `updateRecordList(systemId)`：改成 `return this.loadAndDisplayRecords();`，讓清單只有一條渲染路徑。app-core.js `loadSystemImage` 裡 Phase 5 加的 `await this.loadAndDisplayRecords();` 就變成重複呼叫，刪掉，並且讓原本的 `this.updateRecordList(systemId)` 改成 `await`。
- `app-modal.js` `saveDiseaseAnnotation`、`app-body.js` `saveBodyOperation`：現在各寫兩次（`recordManager.addAnnotation` + `this.saveMedicalRecord`），**改成只呼叫一次 `this.recordManager.addAnnotation(...)`**。
- 還原、清除全部後：呼叫 `await this.loadAndDisplayRecords()` 和 `this.loadAnnotations(this.currentSystemId)`，讓清單和圖上標記都更新。
- `record-statistics.js`：建構子改成接受 `recordManager` 參數（`constructor(recordManager = null)`），`getAllRecords()` 改成回傳 `this.recordManager ? this.recordManager.getAllRecords() : []` 再套用原本的篩選邏輯；不再直接讀 `anatomy-record-*`。app-core.js:271 改成 `new RecordStatistics(this.recordManager)`（recordManager 在第 262 行已經先建立好）。
- `RecordManager` 的建構子**不可以**再產生任何 `anatomy-record-*` key。

## 不要做的事
- 不要改 export / PDF / 統計的呈現邏輯（它們透過巢狀檢視運作）
- 不要改 `disease-data-migration.js`
- 不要刪 `anatomy-record-legacy-backup`
</context>

<tasks>

<task type="auto">
  <name>Task 1：改寫 RecordManager</name>
  <files>assets/scripts/record-manager.js</files>
  <action>依 context 的「設計決策」與「對外 API」改寫。新增或修改的方法都要有中文 JSDoc。不要加 console.log。</action>
  <verify>node --check assets/scripts/record-manager.js</verify>
</task>

<task type="auto">
  <name>Task 2：app 與統計模組改用單一儲存</name>
  <files>assets/scripts/app/*.js, assets/scripts/record-statistics.js</files>
  <action>依 context 的「app 端要改的地方」修改。</action>
  <verify>
- `grep -rn "localStorage" assets/scripts/app/ assets/scripts/record-statistics.js` 只剩 theme 等非病歷用途
- `grep -rn "'medicalRecords'\|anatomy-record" assets/scripts` 只出現在 record-manager.js 與 disease-data-migration.js
- 所有檔案 `node --check` 通過
  </verify>
</task>

<task type="auto">
  <name>Task 3：全部測試轉綠</name>
  <files>（視需要）</files>
  <action>
執行 `python3 doc/tests/run_all.py`。6-01 的新測試和原有 14 項必須全部通過。
測試失敗時修改產品程式碼，**不修改測試**。如果你認為某個測試本身寫錯了，停下來在 SUMMARY 說明理由，不要自行修改。
另外用 pages/medical-record.html 開一次頁面，確認沒有 pageerror（它會載入 record-manager.js），把結果記在 SUMMARY。
  </action>
  <verify>python3 doc/tests/run_all.py 0 失敗 0 跳過</verify>
</task>

<task type="auto">
  <name>Task 4：更新快照基準</name>
  <files>doc/tests/baseline/prototype-methods.json</files>
  <action>`--check` 並確認差異只出現在你修改過的 app 方法（預期：saveMedicalRecord、loadMedicalRecords、loadAndDisplayRecords、filterRecordsBySystem、updateRecordList、loadSystemImage、saveDiseaseAnnotation、saveBodyOperation，以及還原／清除相關的 setupEventListeners 或 clearRecords）。把輸出貼進 SUMMARY 後 `--write`。</action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 0 失敗 0 跳過</verify>
</task>

</tasks>

<verification>
- `python3 doc/tests/run_all.py --with-snapshot`：0 失敗、0 跳過
- 手動：用一個「有舊資料」的瀏覽器設定檔（或先在 DevTools 手動寫入舊格式 key）開啟頁面 → 確認遷移後清單、圖上標記、統計、備份檔內容一致
</verification>

<commit>
refactor: 整併病歷儲存為單一來源 medicalRecords，RecordManager 為唯一存取層並自動遷移舊資料
</commit>
