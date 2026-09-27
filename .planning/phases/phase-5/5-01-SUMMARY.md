# Phase 5 Plan 01 執行總結：恢復三系統通用病歷儲存與顯示流程

## 執行摘要

本階段已成功依照 TDD（測試驅動開發）流程，解決原本身體系統合併時覆蓋通用邏輯所引發的嚴重病歷缺陷（FIX-01～03）：

1. **先寫失敗的端到端病歷流程測試（TDD 驗證）**：
   - 建立 [`doc/tests/records_flow_test.py`](file:///home/amd/anatomy/doc/tests/records_flow_test.py)，包含 5 項端到端測試：
     - `test_save_teeth_record`：牙齒系統點擊儲存，驗證 `localStorage['medicalRecords']` 與 DOM 清單。
     - `test_save_eye_record`：眼睛系統點擊儲存，驗證寫入與 DOM 清單。
     - `test_save_body_operation`：身體系統填寫操作表單點擊儲存，驗證寫入與 DOM 清單。
     - `test_records_isolated_per_system`：預先寫入三系統各一筆記錄，切換分頁驗證記錄隔離互不混雜。
     - `test_records_persist_after_reload`：頁面重載後驗證病歷仍持久保留並正確渲染。
   - 移除 [`doc/tests/smoke_test.py`](file:///home/amd/anatomy/doc/tests/smoke_test.py) 中 `test_records_render_from_storage` 的 `SKIP_REASON`。
   - 修復前執行全量測試，確認預期失敗：總共 6 項測試失敗，0 項跳過。

2. **恢復通用 `saveDiseaseAnnotation`（app-modal.js）**：
   - 從 git 歷史（commit `a723b00`）恢復三系統通用的 `saveDiseaseAnnotation` 流程，移除身體專用且靜默丟棄牙齒／眼睛病歷的判定。
   - 兩種標註物件補上 `system` 欄位（`'eye'` 與 `'teeth'`）。
   - 清除所有 `console.log`，僅保留 `console.error` 與 `console.warn`。

3. **恢復通用篩選與顯示流程（app-records.js, app-body.js）**：
   - `filterRecordsBySystem(records, systemId)`：改為優先讀取 `r.system`（支援 `primary_teeth` 映射為 `teeth`），若無則由欄位特徵精確推斷所屬系統，修正原本牙齒系統篩選 ID 為 `'tooth'` 與系統 ID `'teeth'` 對不上的問題。
   - `loadAndDisplayRecords()`：改為非同步通用版本，完成「讀取 `medicalRecords` → `fixLegacyRecords` → 依 `this.currentSystemId` 篩選 → `groupRecordsByStructure` → `renderGroupedRecords`」，並提供無記錄時的系統專屬提示文字。
   - `groupRecordsByStructure`：針對身體系統加入 `locationName || record.nameZh || getChineseBodyRegionName` 備援，相容舊格式記錄。
   - 清理廢棄方法：刪除 `app-body.js` 中已無呼叫端的 `groupRecordsByBodyPart` 與 `displayBodyRecords`。保留 `bodyDiseaseICD`、`getChineseBodyRegionName`、`getEnglishBodyRegionName`。

4. **系統切換時觸發病歷載入（app-core.js）**：
   - 在 `loadSystemImage` 中標註加載後，呼叫 `await this.loadAndDisplayRecords();`，確保使用者點選分頁切換系統時，病歷清單立刻依該系統過濾並重新呈現。

5. **更新原型方法快照基準**：
   - 執行 `python3 doc/tests/snapshot_prototype.py --check`，確認僅有計畫預期內的 5 個修改方法與 2 個刪除方法產生差異。
   - 執行 `--write` 更新原型方法快照基準。
   - 全量測試 `python3 doc/tests/run_all.py --with-snapshot`：**13 通過、0 失敗、0 跳過**。

---

## 關於兩套病歷儲存（刻意不整併說明）

在本次修復過程中確認，系統中目前並存兩套病歷儲存機制：
1. **`recordManager`**（記憶體 + 檔案備份還原）：用於上方畫布圖層標註繪製、JSON/PDF 備份匯出、重置清除與統計面板。
2. **`localStorage['medicalRecords']`**：用於右側「病歷記錄」清單的持久化儲存、分組與歷史時間軸呈現。

依照需求規範與計畫指示，本次 Phase 5 聚焦於「修復三系統病歷儲存遺失、篩選失效與清單顯示問題」，整併兩套儲存架構涉及資料結構重大遷移與向後相容性，刻意不於本階段處理，保持兩套各自正常運作並已完整驗證。未來若有需要，可獨立於後續重構階段進行架構整併。

---

## 檔案修改清單

- [`doc/tests/records_flow_test.py`](file:///home/amd/anatomy/doc/tests/records_flow_test.py)：
  - 新增 5 個病歷流程端到端測試（儲存、隔離、重載持久化）。
- [`doc/tests/smoke_test.py`](file:///home/amd/anatomy/doc/tests/smoke_test.py)：
  - 移除 `test_records_render_from_storage` 的 `SKIP_REASON`，恢復完整斷言驗證。
- [`doc/tests/run_all.py`](file:///home/amd/anatomy/doc/tests/run_all.py)：
  - 整合 `records_flow_test.TESTS` 至全量測試套件。
- [`assets/scripts/app/app-modal.js`](file:///home/amd/anatomy/assets/scripts/app/app-modal.js)：
  - 恢復三系統通用 `saveDiseaseAnnotation`，修復牙齒與眼睛病歷無法儲存的缺陷，標註物件加入 `system` 欄位，移除 `console.log`。
- [`assets/scripts/app/app-records.js`](file:///home/amd/anatomy/assets/scripts/app/app-records.js)：
  - 恢復三系統通用 `filterRecordsBySystem`，支援 `primary_teeth` 與特徵推斷。
  - 恢復非同步通用 `loadAndDisplayRecords`，依分頁正確過濾與分組渲染。
  - `groupRecordsByStructure` 補上身體部位備援命名邏輯。
- [`assets/scripts/app/app-body.js`](file:///home/amd/anatomy/assets/scripts/app/app-body.js)：
  - 移除無用的 `groupRecordsByBodyPart` 與 `displayBodyRecords` 方法。
  - 保留並維持 `getChineseBodyRegionName`、`getEnglishBodyRegionName`、`bodyDiseaseICD`。
- [`assets/scripts/app/app-core.js`](file:///home/amd/anatomy/assets/scripts/app/app-core.js)：
  - 在 `loadSystemImage` 載入標註後加入 `await this.loadAndDisplayRecords();`。
- [`doc/tests/baseline/prototype-methods.json`](file:///home/amd/anatomy/doc/tests/baseline/prototype-methods.json)：
  - 更新受影響之原型方法雜湊（總計 60 個方法）。

---

## 修復前測試輸出（TDD 失敗證明）

```
==================================================
 醫療病歷系統 — Phase 4 自動化測試
==================================================
啟動本機測試伺服器...
測試伺服器就緒: http://127.0.0.1:8765

--- 執行冒煙測試 ---
[PASS] test_page_loads_without_errors
[PASS] test_switch_systems
[FAIL] test_records_render_from_storage
       錯誤訊息: 病歷清單容器未包含預期的疾病名稱 '偏頭痛'，當前內容: 暫無身體系統病例記錄
[PASS] test_theme_toggle

--- 執行工具頁載入測試 ---
[PASS] test_tools_load_without_404_or_errors

--- 執行 XSS 安全性測試 ---
[PASS] test_stored_xss_records
[PASS] test_notification_xss

--- 執行病歷流程端到端測試 ---
[FAIL] test_save_teeth_record
       錯誤訊息: 預期 localStorage['medicalRecords'] 有 1 筆記錄，實際為 0
[FAIL] test_save_eye_record
       錯誤訊息: 預期 localStorage['medicalRecords'] 有 1 筆記錄，實際為 0
[FAIL] test_save_body_operation
       錯誤訊息: 身體病歷清單未顯示操作描述 '身體手術程序測試說明'，當前內容: 暫無身體系統病例記錄
[FAIL] test_records_isolated_per_system
       錯誤訊息: 眼睛分頁不應包含牙齒記錄 '牙周炎'，當前內容: 暫無身體系統病例記錄
[FAIL] test_records_persist_after_reload
       錯誤訊息: 預期重載前已有 1 筆記錄，實際為 0

停止本機測試伺服器...

==================================================
 測試結果: 通過 6, 失敗 6, 跳過 0
==================================================
```

---

## 原型方法快照比對差異（--check 輸出）

```
[FAIL] 原型方法快照與基準不符:
  缺少方法 (2):
    - displayBodyRecords
    - groupRecordsByBodyPart
  內容變更方法 (5):
    * filterRecordsBySystem (舊: a91e6183... 新: 7d4c8993...)
    * groupRecordsByStructure (舊: 25d92084... 新: c800c06d...)
    * loadAndDisplayRecords (舊: d8899372... 新: f7308f05...)
    * loadSystemImage (舊: 179737f1... 新: 67c75a71...)
    * saveDiseaseAnnotation (舊: 4fbe7e83... 新: 596f59e0...)
```

---

## 修復後全量驗證輸出

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

--- 執行原型方法快照比對 ---
[PASS] 原型方法快照比對完全一致（共 60 個方法）

停止本機測試伺服器...

==================================================
 測試結果: 通過 13, 失敗 0, 跳過 0
==================================================
```
