---
phase: phase-4
plan: 04
type: execute
wave: 4
depends_on: [03]
files_modified:
  - assets/scripts/utils.js
  - assets/scripts/app/app-records.js
  - assets/scripts/app/app-body.js
  - assets/scripts/app/app-eye.js
  - assets/scripts/app/app-tooth.js
  - assets/scripts/app/app-modal.js
  - assets/scripts/record-statistics.js
  - assets/scripts/record-manager.js
  - doc/tests/xss_test.py
  - doc/tests/run_all.py
autonomous: true
requirements:
  - IMP-03
must_haves:
  truths:
    - "病歷中的使用者輸入（備註、疾病名稱、患者 ID、描述、部位名稱）含有 `<img src=x onerror=...>` 時，只會以純文字顯示，不會執行"
    - "透過「備份還原」匯入惡意 JSON 後，渲染病歷時不會執行腳本"
    - "doc/tests/xss_test.py 以自動化方式驗證上述兩點"
---

<objective>
修復儲存型 XSS：目前病歷資料（來自 localStorage 或匯入的備份檔）被直接用模板字串插進 `innerHTML`。
**策略：在插值點跳脫，不改變 DOM 結構與樣式。**
</objective>

<context>
## 已確認的弱點（行號是拆分前 main.js 的位置，拆分後請到 app/*.js 用 grep 找）

- `renderGroupedRecords`（原 2537–2619）：`${group.structureName}`、`${operationName}`、`${record.description}`、`${diseaseText}`、`${notes}` → `itemDiv.innerHTML`
- `displayBodyRecords`（原 2993–3031）：`${group.location}`、`${d.name}`、`${d.icd10}`、`${record.treatmentNotes}`
- `updateRecordList`（原 2146–2212）
- `displayEyeStructureInfo`（原 660–690）、`displayBodyStructureInfo`（原 2732–2810）、`setupManualToothSelector`（原 1617）、`setupManualBodySelector`（原 1705）、原 617 / 1460 的 `locationDiv.innerHTML = locationText`
- `record-statistics.js:351–380`：`${record.patientId}`、`a.locationName`、`d.name`
- `utils.js:301` `showNotification`：`${message}`（呼叫端可能傳入使用者資料）
- `record-manager.js:457` 列印視窗 `printWindow.document.write(...)`
- `disease-form.js:118`：檢查 html 是否含有使用者資料

**來自靜態 JSON（data/*.json）或寫死的字串不需要跳脫**，但如果不確定來源，就一律跳脫（跳脫是冪等的，只要不跳脫兩次就好）。

## 做法

1. 在 `utils.js` 新增並匯出到全域（跟既有 utils 函式的做法一致）：
   ```js
   /**
    * 跳脫 HTML 特殊字元，用於將不可信資料插入 innerHTML 模板
    * @param {*} value
    * @returns {string}
    */
   function escapeHtml(value) {
     if (value === null || value === undefined) return '';
     return String(value)
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#39;');
   }
   ```
2. 每個插值點用 `${escapeHtml(x)}` 包起來。**注意不要重複跳脫**：如果變數本身已經是組好的 HTML 片段（例如 `sideBadge`、`diseaseList`），要在組片段的地方跳脫原始值，而不是跳脫整個片段。
3. `showNotification(message)`：先 grep 所有呼叫端，確認有沒有傳入 HTML 標記。如果都沒有，就改成跳脫 message；如果有呼叫端依賴 HTML，就在那些呼叫端先跳脫資料值，並在 SUMMARY 說明。
4. 屬性值（例如 `data-id="${x}"`、`title="${x}"`）也要跳脫。
</context>

<tasks>

<task type="auto">
  <name>Task 1：先寫失敗的 XSS 測試（TDD）</name>
  <files>doc/tests/xss_test.py, doc/tests/run_all.py</files>
  <action>
payload：`<img src=x onerror="window.__xss=(window.__xss||0)+1">`
測試：
1. `test_stored_xss_records`：用 add_init_script 在 localStorage 寫入 teeth / eye / body 三個系統各一筆病歷，payload 放在 treatmentNotes、notes、description、diseases[0].name、structureName、patientId 等欄位；載入後依序切換三個系統、打開統計分頁，最後斷言 `window.__xss` 是 undefined，而且頁面文字中**看得到** `<img src=x` 這段字面文字（確認是被跳脫顯示，而不是被刪掉）。
2. `test_notification_xss`：呼叫 `showNotification(payload)`，斷言 `window.__xss` 是 undefined。
加進 run_all.py。**先執行一次，確認測試會失敗**（證明測試有效），並把失敗輸出記錄到 SUMMARY。
  </action>
  <verify>python3 doc/tests/run_all.py → xss 測試 FAIL（修復前）</verify>
</task>

<task type="auto">
  <name>Task 2：新增 escapeHtml 並修復所有插值點</name>
  <files>assets/scripts/utils.js, assets/scripts/app/*.js, assets/scripts/record-statistics.js, assets/scripts/record-manager.js, assets/scripts/disease-form.js</files>
  <action>依 context 修復。完成後執行 `grep -n "innerHTML\s*[+]\?=\s*\`" assets/scripts -r`，逐一確認每個模板字串的 `${}` 不是已跳脫、就是可信來源，並在 SUMMARY 列出清單（檔案:行號 → 已跳脫 / 可信來源）。</action>
  <verify>python3 doc/tests/run_all.py 全部通過（包含 xss 測試）</verify>
</task>

<task type="auto">
  <name>Task 3：更新快照基準</name>
  <files>doc/tests/baseline/prototype-methods.json</files>
  <action>這次是刻意改變行為：先 `--check` 並確認差異只出現在你修改過的方法，然後 `--write`。</action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 結束碼 0</verify>
</task>

</tasks>

<commit>
fix(security): 跳脫病歷渲染中的使用者資料，修復儲存型 XSS
</commit>
