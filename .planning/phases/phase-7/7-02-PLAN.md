---
phase: phase-7
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - assets/scripts/app/app-records.js
  - doc/tests/record_labels_test.py
  - doc/tests/run_all.py
  - doc/tests/baseline/prototype-methods.json
  - doc/tests/baseline/assets-hash.json
  - sw.js
  - .planning/todos/
autonomous: true
requirements:
  - UI-01
  - UI-02
must_haves:
  truths:
    - "病歷清單中，位置名稱在每個群組只出現一次（在群組標題）"
    - "側別標籤依系統顯示：眼睛 → 左眼／右眼／雙眼；身體 → 左側／右側／中線；牙齒 → 不顯示"
---

<objective>
修正病歷清單標題的兩個顯示問題，並關閉已經解決的舊待辦。
</objective>

<context>
## 問題（app-records.js `renderGroupedRecords`，Claude 審查時確認）

1. **側別標籤永遠是「眼」**：群組標題的 if/else 鏈中，`'left'` / `'right'` 先對應到「左眼／右眼」，後面的「左側／右側」分支條件完全相同，**永遠執行不到**。所以身體記錄顯示成「右眼」。每筆記錄的 `record-item__title` 裡也有類似的側別邏輯（約 269 行起），請一併檢查。
2. **位置名稱重複**：群組標題顯示 `group.structureName`，而每筆記錄的 `record-item__title` 又顯示一次 `record.locationName`，所以同一個名稱出現兩次以上。

## 修正方式
- 在 `groupRecordsByStructure` 產生的群組物件上加入 `system`（用 `RecordManager.normalizeSystem(record.system)`，沒有的話用 RecordManager 的推斷邏輯；如果 Phase 6 有 `resolveSystem` 可以用，就用它，必要時改成 static 或公開方法，並在 SUMMARY 說明）。
- 新增一個小函式 `getSideLabel(system, side)`：
  - eye：left → 左眼、right → 右眼、bilateral → 雙眼
  - body：left → 左側、right → 右側、mid / center / midline → 中線
  - teeth 或其他：回傳空字串
  群組標題和每筆記錄都改用它。
- 每筆記錄的標題：**不要再顯示位置名稱**（群組標題已經有了），改成只顯示時間與側別（如果跟群組的側別不同才顯示）。注意 Phase 4 的 `escapeHtml` 規範。
- 把 `.planning/todos/pending/2026-02-26-shen-ti-tu-xiang-wei-zhi-dian-ji-zuo-biao-bu-zheng-que.md` 用 `git mv` 移到 `.planning/todos/done/`，並在檔尾加一段「## 結案（2026-09-27）」：已改用手動選擇器；根本解法規劃在「結構化 SVG 解剖圖」階段。
</context>

<tasks>

<task type="auto">
  <name>Task 1：先寫失敗測試</name>
  <files>doc/tests/record_labels_test.py, doc/tests/run_all.py</files>
  <action>
用 add_init_script 預先放入：一筆身體操作（`system:'body', bodyRegionId:'arm', side:'right', locationName:'右手臂', operationType:'抽血'`）、一筆眼睛（`system:'eye', structureId:'cornea', side:'left', locationName:'角膜'`）、兩筆同一顆牙（`system:'teeth', fdiNumber:16, locationName:'右上第一大臼齒'`）。
1. `test_body_side_label`：身體分頁清單包含「右側」，不包含「右眼」。
2. `test_eye_side_label`：眼睛分頁清單包含「左眼」。
3. `test_location_name_not_repeated`：牙齒分頁清單文字中「右上第一大臼齒」**只出現 1 次**（兩筆記錄在同一個群組）。
先確認 1、3 失敗。
  </action>
  <verify>修正前 1、3 FAIL</verify>
</task>

<task type="auto">
  <name>Task 2：修正並關閉待辦</name>
  <files>assets/scripts/app/app-records.js, .planning/todos/</files>
  <action>依 context 修正。完成後：`--check` 核對快照差異只出現在 renderGroupedRecords、groupRecordsByStructure（以及新增的 getSideLabel）→ `--write`；因為改了 assets，**執行 `python3 doc/tests/bump_cache.py`**。</action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 0 失敗 0 跳過</verify>
</task>

</tasks>

<commit>
fix(ui): 病歷清單側別標籤依系統顯示、位置名稱不再重複；關閉身體座標舊待辦
</commit>
