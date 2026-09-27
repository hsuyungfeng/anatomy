---
phase: phase-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - doc/tests/records_flow_test.py
  - doc/tests/smoke_test.py
  - doc/tests/run_all.py
  - assets/scripts/app/app-modal.js
  - assets/scripts/app/app-records.js
  - assets/scripts/app/app-core.js
  - assets/scripts/app/app-body.js
  - doc/tests/baseline/prototype-methods.json
autonomous: true
requirements:
  - FIX-01
  - FIX-02
  - FIX-03
must_haves:
  truths:
    - "在牙齒系統選牙齒、勾選疾病、按儲存後，localStorage['medicalRecords'] 多一筆記錄，且病歷清單立刻顯示"
    - "眼睛系統同上"
    - "身體系統用操作表單儲存後，清單立刻顯示該操作"
    - "切換系統分頁時，清單只顯示該系統的記錄（牙齒 / 眼睛 / 身體互不混雜），重新整理後依然存在"
    - "doc/tests/smoke_test.py 的 test_records_render_from_storage 不再 SKIP，而且通過"
---

<objective>
修復病歷「存不進去、顯示不出來」的問題。根本原因只有一個：新增身體系統時，用「只處理身體」的版本覆蓋了三個系統共用的通用方法。
**策略：恢復原本的通用流程，並把身體系統正式納入，而不是個別打補丁。**
</objective>

<context>
## 根本原因（Claude 審查 Phase 4 時確認）

原始 main.js 同名方法重複定義，後面的覆蓋前面的。Phase 4 拆分時依規定保留「後面的（有效）」版本，所以問題原封不動保留下來：

| 方法 | 目前生效的版本（壞的） | 後果 |
|------|----------------------|------|
| `saveDiseaseAnnotation`（app-modal.js:318） | 開頭 `if (this.currentSystemId !== 'body') return;` | **牙齒／眼睛按儲存時被默默丟棄 → 資料遺失**。而身體系統的儲存按鈕走的是 `saveBodyOperation`，所以這個方法實際上對任何系統都沒用 |
| `filterRecordsBySystem`（app-records.js:452） | `case 'tooth'`，但系統 id 是 `'teeth'` / `'primary_teeth'`；`body` 要求 `r.system==='body' && r.bodyPart` | 牙齒永遠篩出 0 筆；`saveBodyOperation` 存的記錄只有 `bodyRegionId`、`operationType`，沒有 `system`/`bodyPart`，所以**身體記錄也被篩掉** |
| `loadAndDisplayRecords`（app-records.js:433） | 開頭 `if (this.currentSystemId !== 'body') return;` | 牙齒／眼睛永遠不會渲染 |
| 系統切換（`loadSystemImage` → `updateRecordList`） | 只讀 `recordManager`，沒呼叫 `loadAndDisplayRecords` | 切換分頁後清單不會反映 `localStorage['medicalRecords']` |

## 被覆蓋的「通用版本」可以從 git 歷史取得

```bash
git show a723b00:assets/scripts/main.js | sed -n 1907,2056p   # 通用 saveDiseaseAnnotation（牙齒 + 眼睛）
git show a723b00:assets/scripts/main.js | sed -n 2328,2356p   # 通用 filterRecordsBySystem(records, systemId)
git show a723b00:assets/scripts/main.js | sed -n 2630,2690p   # 通用 loadAndDisplayRecords（分組 + renderGroupedRecords）
```
（範圍請自行核對開頭的 JSDoc 與結尾的 `  }`。）
`groupRecordsByStructure`、`renderGroupedRecords`、`fixLegacyRecords` 目前仍在 app-records.js，**本來就支援身體操作記錄**（renderGroupedRecords 有 operationType 分支），所以不需要另外寫身體專用的渲染。

## 系統 id
`teeth`、`primary_teeth`、`eye`、`body`（見 data/anatomical-systems.json 與 app-tooth.js:13）。`primary_teeth` 一律視同 `teeth`。

## 現存資料的欄位形狀（篩選條件必須全部相容）
- 牙齒：`fdiNumber` / `universalNumber`
- 眼睛：`structureId`、`side`
- 身體操作（saveBodyOperation）：`bodyRegionId`、`operationType`、`side`
- 身體舊格式（4-01 測試 fixture 用的）：`system:'body'`、`bodyPart`、`side`、`diseases`
- 新存的記錄一律加上 `system` 欄位（值為 `teeth` / `eye` / `body`，primary_teeth 存成 `teeth`）
</context>

<tasks>

<task type="auto">
  <name>Task 1：先寫會失敗的端到端測試（TDD）</name>
  <files>doc/tests/records_flow_test.py, doc/tests/run_all.py</files>
  <action>
每個測試使用新的 browser context（localStorage 乾淨）。
1. `test_save_teeth_record`：切到牙齒系統 → 開啟疾病模態（優先真的點擊解剖圖上的牙齒位置；如果點擊座標不穩定，可以用 `page.evaluate` 呼叫 `app.openDiseaseModal(...)` 開啟模態，參數格式從 app-modal.js 原始碼確認）→ **透過 DOM 勾選一個疾病 checkbox、點擊真正的儲存按鈕**（不可以直接呼叫 saveDiseaseAnnotation）→ 斷言 `JSON.parse(localStorage.medicalRecords).length === 1`，而且 `#record-list-container` 文字包含該疾病名稱。
2. `test_save_eye_record`：同上，在眼睛系統。
3. `test_save_body_operation`：身體系統透過操作表單儲存 → 同樣兩個斷言。
4. `test_records_isolated_per_system`：用 add_init_script 預先放入牙齒、眼睛、身體操作各一筆（欄位形狀照 context），依序切換三個分頁，斷言每個分頁的清單**只有**自己系統那一筆的文字。
5. `test_records_persist_after_reload`：執行 1 之後 reload，切回牙齒系統，記錄仍然顯示。

同時把 smoke_test.py 裡 `test_records_render_from_storage` 的 `SKIP_REASON` 移除。
執行一次，**確認這些測試都會失敗**，並把失敗輸出貼到 SUMMARY。
  </action>
  <verify>python3 doc/tests/run_all.py → 新測試 FAIL（修復前）</verify>
</task>

<task type="auto">
  <name>Task 2：恢復通用 saveDiseaseAnnotation（app-modal.js）</name>
  <files>assets/scripts/app/app-modal.js</files>
  <action>
- 用 git 歷史中的通用版本**取代**目前 app-modal.js 裡的身體專用 `saveDiseaseAnnotation`。
- 維持 Phase 4 的慣例：**不要帶回 console.log**（保留 console.error / console.warn）。
- 在兩種 annotation 物件都加上 `system` 欄位（眼睛 `'eye'`，牙齒 `'teeth'`）。
- 因為通用版本是 `async`，而且 app-modal.js:33 的呼叫端沒有 await，維持原樣即可（原本就是這樣）。
- 身體專用版本裡用到的 `this.generateUUID`（不存在的方法）隨著這次取代一起消失，不需要另外處理。
  </action>
  <verify>node --check assets/scripts/app/app-modal.js；grep -n "非身體系統，操作被略過" assets/scripts -r 沒有結果</verify>
</task>

<task type="auto">
  <name>Task 3：恢復通用篩選與顯示（app-records.js、app-body.js）</name>
  <files>assets/scripts/app/app-records.js, assets/scripts/app/app-body.js</files>
  <action>
1. `filterRecordsBySystem(records, systemId)` 改成通用版本，並依下列規則擴充（先看 `system` 欄位，沒有才用欄位形狀推斷）：
   ```js
   const sys = (systemId === 'primary_teeth') ? 'teeth' : systemId;
   records.filter(r => {
     if (r.system) return (r.system === 'primary_teeth' ? 'teeth' : r.system) === sys;
     if (sys === 'teeth') return !!(r.fdiNumber || r.universalNumber);
     if (sys === 'eye')   return !!(r.structureId || (r.side && !r.fdiNumber)) && !r.bodyRegionId && !r.bodyPart && !r.operationType;
     if (sys === 'body')  return !!(r.bodyRegionId || r.operationType || r.bodyPart);
     return false;
   });
   ```
   （只保留 `if (!records ...) return []` 的防呆，不要帶回 console.log。）
2. `loadAndDisplayRecords` 改成通用的 async 版本：讀取 → `fixLegacyRecords` → 依 `this.currentSystemId` 篩選 → `groupRecordsByStructure` → `renderGroupedRecords`；沒有記錄時顯示「暫無X系統的病例記錄」。不要帶回 console.log。
3. 確認 `groupRecordsByStructure` 對身體操作記錄與身體舊格式（有 `bodyPart`、沒有 `locationName`）都能產生合理的群組名稱；如果舊格式的群組名稱會變成 undefined，就在 `groupRecordsByStructure` 補上備援：`record.locationName || record.nameZh || this.getChineseBodyRegionName(record.bodyPart, record.side)`。
4. 修改後 `groupRecordsByBodyPart`、`displayBodyRecords` 應該已經沒有呼叫端。用 grep 確認後刪除（連同 JSDoc）。**`bodyDiseaseICD`、`getChineseBodyRegionName`、`getEnglishBodyRegionName` 保留**（其他地方還在用）。
  </action>
  <verify>node --check；grep -rn "groupRecordsByBodyPart\|displayBodyRecords" assets/ 沒有結果</verify>
</task>

<task type="auto">
  <name>Task 4：系統切換時顯示 localStorage 病歷（app-core.js）</name>
  <files>assets/scripts/app/app-core.js</files>
  <action>
在 `loadSystemImage` 裡既有的 `this.updateRecordList(systemId);` **之後**加上 `await this.loadAndDisplayRecords();`（loadSystemImage 已經是 async）。
`updateRecordList` 本身和備份還原、清除、統計的呼叫端不動（recordManager 與 medicalRecords 是兩套儲存，整併不在這次範圍，記錄在 SUMMARY 即可）。
  </action>
  <verify>python3 doc/tests/run_all.py 全部通過（包含 Task 1 的測試與解除 SKIP 的測試）</verify>
</task>

<task type="auto">
  <name>Task 5：更新快照基準</name>
  <files>doc/tests/baseline/prototype-methods.json</files>
  <action>
先 `python3 doc/tests/snapshot_prototype.py --check`，確認差異**只**出現在：saveDiseaseAnnotation、filterRecordsBySystem、loadAndDisplayRecords、loadSystemImage、groupRecordsByStructure（若有修改）、以及被刪除的 groupRecordsByBodyPart、displayBodyRecords。
把 --check 的輸出貼到 SUMMARY，然後 `--write`。
  </action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 結束碼 0，且沒有 SKIP</verify>
</task>

</tasks>

<verification>
- `python3 doc/tests/run_all.py --with-snapshot`：0 失敗、0 跳過
- 手動：開啟 http://localhost:8000 ，在三個系統各新增一筆記錄 → 切換分頁 → 重新整理，記錄都還在，而且沒有混雜
</verification>

<commit>
fix: 恢復三系統通用的病歷儲存與顯示流程，修復牙齒／眼睛記錄遺失與身體記錄不顯示
</commit>
