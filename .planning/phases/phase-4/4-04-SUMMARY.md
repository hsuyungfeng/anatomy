# Phase 4 Plan 04 執行總結：儲存型 XSS 漏洞修復與安全性驗證

## 執行摘要

本階段已成功依照 TDD（測試驅動開發）流程，修復醫療病歷系統中所有病歷資料與通知訊息插值點的儲存型 XSS 漏洞：

1. **先寫失敗的 XSS 測試（TDD 驗證）**：
   - 建立 `doc/tests/xss_test.py`，定義惡意載荷：`<img src=x onerror="window.__xss=(window.__xss||0)+1">`。
   - 涵蓋測試項目：
     - `test_stored_xss_records`：驗證 teeth / eye / body 三個系統之病歷資料（患者 ID、位置名稱、結構名稱、疾病名稱、療程備註、描述）及統計搜尋功能中，若含有 XSS 載荷，腳本不得執行且內容必須以純文字跳脫顯示。
     - `test_notification_xss`：驗證 `showNotification(payload)` 不會觸發腳本執行。
   - 修復前執行確認兩項測試皆確實失敗（`window.__xss = 3` 與 `window.__xss = 1`）。

2. **新增 `escapeHtml` 輔助函式並匯出**：
   - 於 [`assets/scripts/utils.js`](file:///home/amd/anatomy/assets/scripts/utils.js) 定義標準 HTML 跳脫函式 `escapeHtml`，跳脫 `&`、`<`、`>`、`"`、`'` 五大特殊字元。
   - 匯出至全域環境與 `Utils` 物件，供各領域模組調用。
   - 全域搜尋 `showNotification` 之所有呼叫端，確認皆傳入純文字訊息無 HTML 標記依賴，在 `showNotification` 內部以 `${escapeHtml(message)}` 安全渲染。

3. **修復所有不可信資料插值點**：
   - 逐一審查並修復 `assets/scripts/app/*.js`、`record-statistics.js`、`record-manager.js`、`body-operation-form.js` 與 `disease-form.js` 中的插值點。
   - 確保組裝 HTML 時「原始資料值跳脫、已跳脫之 HTML 片段不重複跳脫」。

4. **更新快照基準與全量驗證**：
   - 執行 `python3 doc/tests/snapshot_prototype.py --check`，確認僅有刻意修改的 12 個原型方法發生雜湊變化，無任何範圍外方法受影響。
   - 執行 `--write` 更新原型方法快照基準。
   - 執行全量測試 `python3 doc/tests/run_all.py --with-snapshot`，全部測試通過（通過 7, 失敗 0, 跳過 1）。

---

## 檔案修改清單

- [`assets/scripts/utils.js`](file:///home/amd/anatomy/assets/scripts/utils.js)：
  - 新增 `escapeHtml(value)` 函式並加入 `Utils` 物件導出。
  - 在 `showNotification` 模板中套用 `${escapeHtml(message)}`。
  - 修復 `formatDateTime` 中非標準的 `Object.forEach` 為 `Object.keys(replacements).forEach`，避免時間格式化時拋出例外。
- [`assets/scripts/app/app-records.js`](file:///home/amd/anatomy/assets/scripts/app/app-records.js)：
  - `updateRecordList`：跳脫 `locationName`、`fdiNumber`、`d.name`、`d.id`、`treatmentNotes`。
  - `renderGroupedRecords`：跳脫 `group.structureName`、`record.locationName`、`operationName`、`record.description`、`disease.name`、`disease.id`、`notes`。
- [`assets/scripts/app/app-body.js`](file:///home/amd/anatomy/assets/scripts/app/app-body.js)：
  - `renderManualBodySelector`：跳脫選單選項之 `sub.id`、`sub.nameZh`、`sub.nameEn`、`region.side`、`region.nameZh`。
  - `setupManualBodySelector`：跳脫 `bodyRegionInfo.name`。
  - `displayBodyStructureInfo`：跳脫 `regionInfo.nameZh`、`regionInfo.nameEn`。
  - `loadBodyRegionDiseases`：跳脫 `disease`。
  - `displayBodyRecords`：跳脫 `group.location`、`d.name`、`d.icd10`、`record.treatmentNotes`。
- [`assets/scripts/app/app-eye.js`](file:///home/amd/anatomy/assets/scripts/app/app-eye.js)：
  - `openDiseaseModalWithStructure`：跳脫 `structureInfo.name`、`englishName`、`structureInfo.type`、`detailedInfo.description`、`detailedInfo.function`、`detailedInfo.diseases`。
  - `displayEyeStructureInfo`：跳脫結構名稱、英文名稱、說明與英文說明。
- [`assets/scripts/app/app-tooth.js`](file:///home/amd/anatomy/assets/scripts/app/app-tooth.js)：
  - `renderManualToothSelector`：跳脫 `tooth.toothId`、`tooth.nameCh`、`tooth.fdi`。
  - `setupManualToothSelector`：跳脫 `toothInfo.nameCh`、`toothInfo.fdi`。
- [`assets/scripts/app/app-modal.js`](file:///home/amd/anatomy/assets/scripts/app/app-modal.js)：
  - `openDiseaseModal`：跳脫牙齒系統之 `structureInfo.name`、`structureInfo.fdi`；眼睛系統之 `structureInfo.name`、`structureInfo.type`；身體系統之 `structureInfo.name`。
- [`assets/scripts/record-statistics.js`](file:///home/amd/anatomy/assets/scripts/record-statistics.js)：
  - `displaySearchResults`：跳脫 `record.patientId`、`a.locationName`、`d.name`。
- [`assets/scripts/record-manager.js`](file:///home/amd/anatomy/assets/scripts/record-manager.js)：
  - `generatePDFContent`：跳脫 `record.recordId`、`record.patientId`、`anno.systemName`、`anno.locationName`、`d.id`、`d.name`、`anno.treatmentNotes`。
- [`assets/scripts/body-operation-form.js`](file:///home/amd/anatomy/assets/scripts/body-operation-form.js)：
  - `generateFormHTML`：跳脫 `regionName`。
- [`assets/scripts/disease-form.js`](file:///home/amd/anatomy/assets/scripts/disease-form.js)：
  - `renderDiseaseList` 與 `renderCategory`：防禦性跳脫 `disease.id`、`disease.name`、`disease.nameEn`、`disease.icd10`。
- [`doc/tests/xss_test.py`](file:///home/amd/anatomy/doc/tests/xss_test.py)：
  - 新增自動化 XSS 測試套件，包含儲存型病歷 XSS 與通知訊息 XSS 測試。
- [`doc/tests/run_all.py`](file:///home/amd/anatomy/doc/tests/run_all.py)：
  - 整合 `xss_test.TESTS` 至全量測試流程。
- [`doc/tests/baseline/prototype-methods.json`](file:///home/amd/anatomy/doc/tests/baseline/prototype-methods.json)：
  - 更新受修復影響之 12 個原型方法快照基準。

---

## innerHTML 模板字串安全審核清單

依計畫指示執行 `grep -n -E "innerHTML\s*(\+|\=)\s*\`" assets/scripts -r` 與相關 DOM 注入點審查：

| 檔案:行號 | 插入變數 / 內容 | 狀態 | 說明 |
|---|---|---|---|
| `utils.js:316` | `${icon}`, `${escapeHtml(message)}` | 已跳脫 | icon 為內部字面值對照，message 經 `escapeHtml` 處理 |
| `app-records.js:17` | 靜態無病歷 HTML | 可信來源 | 靜態字串，無變數插值 |
| `app-records.js:53` | `${locationDisplay}`, `${dateStr}`, `${diseaseList}`, `${anno.treatmentNotes}` | 已跳脫 | 欄位均經 `escapeHtml` 跳脫；dateStr 為 `toLocaleDateString` 輸出 |
| `app-records.js:310` | `${group.structureName}`, `${sideBadge}` | 已跳脫 | structureName 經 `escapeHtml` 跳脫；sideBadge 為內部中文標籤 |
| `app-records.js:328-392` | `${record.locationName}`, `${operationName}`, `${record.description}`, `${diseaseText}`, `${notes}` | 已跳脫 | 病歷資料欄位皆已逐一以 `escapeHtml` 跳脫，timestamp 為內部時間格式化 |
| `app-tooth.js:153-165` | `${tooth.toothId}`, `${tooth.nameCh}`, `${tooth.fdi}` | 已跳脫 | 牙齒選擇器選項屬性與文字皆已跳脫 |
| `app-tooth.js:195` | `${toothInfo.nameCh}`, `${toothInfo.fdi}` | 已跳脫 | 手動選擇牙齒後更新之標籤資訊已跳脫 |
| `app-eye.js:133-164` | `${structureInfo.name}`, `${englishName}`, `${structureInfo.type}`, `${detailedInfo.*}` | 已跳脫 | 眼睛結構名稱、類型、描述與疾病列表均已跳脫 |
| `app-eye.js:221-236` | `${structure.name}`, `${description.*}` | 已跳脫 | 眼睛資訊側面板標籤與說明皆已跳脫 |
| `app-body.js:119-142` | `${sub.id}`, `${sub.nameZh}`, `${sub.nameEn}`, `${region.*}` | 已跳脫 | 手動身體部位選單屬性與文字已跳脫 |
| `app-body.js:177` | `${bodyRegionInfo.name}`, `${sideBadge}` | 已跳脫 | 部位名稱經 `escapeHtml` 跳脫，sideBadge 為內部中文對照 |
| `app-body.js:351` | `${regionInfo.nameZh}`, `${regionInfo.nameEn}`, `${regionInfo.side}` | 已跳脫 | 中英文部位名稱已跳脫，側邊為內部三元運算符字面字串 |
| `app-body.js:410, 421` | `${disease}` | 已跳脫 | 部位常見疾病標籤名稱已跳脫 |
| `app-body.js:506-530` | `${group.location}`, `${d.name}`, `${d.icd10}`, `${record.treatmentNotes}` | 已跳脫 | 身體病歷清單中之部位、疾病、ICD與備註皆已跳脫 |
| `app-modal.js:105-150` | `${structureInfo.name}`, `${structureInfo.fdi}`, `${structureInfo.type}` | 已跳脫 | 彈窗頂部之結構位置資訊皆已跳脫 |
| `record-statistics.js:351` | 靜態無搜尋結果 HTML | 可信來源 | 靜態字串，無變數插值 |
| `record-statistics.js:370` | `${patientIdDisplay}`, `${formattedDate}`, `${diseaseText}` | 已跳脫 | 患者ID、位置名稱、疾病名稱均已跳脫；formattedDate 為時間函式 |
| `record-manager.js:573-639` | `${record.recordId}`, `${record.patientId}`, `${anno.systemName}`, `${anno.locationName}`, `${d.name}`, `${anno.treatmentNotes}` | 已跳脫 | PDF/列印報表內容之所有病歷動態欄位均已跳脫 |
| `body-operation-form.js:42` | `${regionName}`, `${sideDisplay}` | 已跳脫 | 部位名稱經 `escapeHtml` 跳脫，側邊為內部字典對照 |
| `disease-form.js:134, 180` | `${disease.id}`, `${disease.name}`, `${disease.nameEn}`, `${disease.icd10}` | 已跳脫 | 疾病表單核取方塊屬性與標籤文字均已跳脫 |

---

## TDD 驗證記錄

### 修復前測試失敗輸出（確認測試有效）

```text
==================================================
 醫療病歷系統 — Phase 4 自動化測試
==================================================
啟動本機測試伺服器...
測試伺服器就緒: http://127.0.0.1:8765

--- 執行冒煙測試 ---
[PASS] test_page_loads_without_errors
[PASS] test_switch_systems
[SKIP] test_records_render_from_storage
       原因: 既有 bug：切換至身體系統（handleSystemTabClick）時僅呼叫 updateRecordList，未呼叫 loadAndDisplayRecords()，導致 localStorage['medicalRecords'] 未被讀取並渲染至清單
[PASS] test_theme_toggle

--- 執行工具頁載入測試 ---
[PASS] test_tools_load_without_404_or_errors

--- 執行 XSS 安全性測試 ---
[FAIL] test_stored_xss_records
       錯誤訊息: 偵測到儲存型 XSS 腳本被執行！window.__xss = 3
[FAIL] test_notification_xss
       錯誤訊息: showNotification 觸發了 XSS 腳本執行！window.__xss = 1

停止本機測試伺服器...

==================================================
 測試結果: 通過 4, 失敗 2, 跳過 1
==================================================
```

### 修復後全量測試輸出（包含快照比對）

```text
==================================================
 醫療病歷系統 — Phase 4 自動化測試
==================================================
啟動本機測試伺服器...
測試伺服器就緒: http://127.0.0.1:8765

--- 執行冒煙測試 ---
[PASS] test_page_loads_without_errors
[PASS] test_switch_systems
[SKIP] test_records_render_from_storage
       原因: 既有 bug：切換至身體系統（handleSystemTabClick）時僅呼叫 updateRecordList，未呼叫 loadAndDisplayRecords()，導致 localStorage['medicalRecords'] 未被讀取並渲染至清單
[PASS] test_theme_toggle

--- 執行工具頁載入測試 ---
[PASS] test_tools_load_without_404_or_errors

--- 執行 XSS 安全性測試 ---
[PASS] test_stored_xss_records
[PASS] test_notification_xss

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 62 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 7, 失敗 0, 跳過 1
==================================================
```
結束碼為 `0`。

---

## 發現的問題（既有 Bug）

1. **`formatDateTime` 誤用 `Object.forEach`**：
   - 位於 `assets/scripts/utils.js:36`。JavaScript 原生 `Object` 無 `forEach` 方法，導致任何呼叫 `formatDateTime` 處（包含 `record-statistics.js` 的 `displaySearchResults` 與 `record-manager.js` 的報表生成）均拋出 `TypeError: Object.forEach is not a function`。
   - 因影響到本次修改的 `displaySearchResults` 正常執行與測試驗證，已在 `utils.js` 內修正為 `Object.keys(replacements).forEach`。
2. **`ocr-handler.js:101` 亦存在 `Object.forEach`**：
   - `assets/scripts/ocr-handler.js:101` 亦存在相同之語法誤用。因不在本計畫範圍且非目前核心路徑，保持原樣不額外改動，記錄於此供後續階段重構參考。
3. **身體系統切換時未調用 `loadAndDisplayRecords`**：
   - 既有 bug 依然存在，維持標記 `SKIP`，未順手修改。

---

## Git Commit 紀錄 (`git log --oneline master..HEAD`)

Phase 4 全部計畫執行完畢，目前分支累計提交如下：

```text
81775d3 fix(security): 跳脫病歷渲染中的使用者資料，修復儲存型 XSS
29f4634 chore: 移除 app 模組中的除錯 console.log
2a3045f refactor: 將 main.js 拆分為 app/ 下的領域模組（純搬移）
16d6492 chore: 將根目錄測試腳本與工具頁搬移至 doc/ 並修正相對路徑
96183c4 test: 建立 Phase 4 冒煙測試與原型方法快照基準
```

---

## 後續步驟

Phase 4 的四項計畫（4-01、4-02、4-03、4-04）已全部完成且本機測試全數通過。
本分支未進行任何 remote push。使用者可隨時切換至 Claude Code 或其他審查工具對 `phase-4-improve` 分支進行程式碼審查（Code Review）。
