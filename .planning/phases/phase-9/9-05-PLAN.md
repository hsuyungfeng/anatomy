---
phase: phase-9
plan: 05
type: execute
wave: 5
depends_on: [04]
files_modified:
  - assets/scripts/app/*.js
  - assets/styles/*.css
  - index.html
  - sw.js
  - doc/tools/README.md
autonomous: true
requirements: [UI-03, SVG-10]
must_haves:
  truths:
    - "Phase 8 留下的 5 個介面小問題全部修正（9-01 的 ui_polish_test 通過）"
    - "眼睛、身體的座標辨識程式碼與舊選擇介面已移除，index.html 不再載入 eye-image-mapper、eye-label-mapper、body-image-mapper"
    - "全部測試 0 失敗、0 跳過"
---

<objective>修正 5 個介面小問題，並移除眼睛、身體已不再使用的座標辨識程式碼（比照 Phase 8 的 8-03）。</objective>

<context>
## 1. 五個介面小問題（對應 9-01 的 ui_polish_test）
1. **縮放按鈕在 SVG 模式無作用**：9-02 已接上 `SvgViewport`，這裡只確認 `test_zoom_buttons_work_in_svg` 通過。
2. **儲存通知顯示「（高信心度）」**：`saveDiseaseAnnotation` 的成功通知，當 `source` 是 `odontogram`／`eye-diagram` 時一律顯示「✓ 疾病記錄已保存」；身體操作同理。另外通知本身會重複出現兩個 ✓（通知元件有圖示、訊息又帶 ✓）：把訊息中的 ✓ 拿掉。
3. **載入時「永久齒／乳齒」子分頁隱藏**：在 `init()` 載入預設系統（牙齒）時，套用與 `handleSystemTabClick` 相同的子分頁可見邏輯（抽成一個小方法共用，避免重複）。
4. **深色模式病歷卡片仍是淺色**：找出 `.record-group` 與其標題、內容區在 main.css／modal.css 中寫死的淺色背景與文字色，改用既有的主題變數（`--color-bg-*`、文字色變數），確保 `[data-theme="dark"]` 下是深色背景、淺色文字。
5. **眼睛清單標題「左眼 左眼」**：`renderGroupedRecords` 的群組標題，當 `structureName` 已包含側別文字（「左眼」「右眼」）時不再顯示側別徽章；另外 9-03 起新記錄的 locationName 是「右眼 角膜」格式，群組標題也不要重複顯示「右眼」徽章（檢查並處理）。

## 2. 死碼清理（先 grep 確認沒有呼叫端；有呼叫端就停下來說明）
- 眼睛：`detectEyeStructure`、`estimateEyeLocation`、`setupEyeLabelButtonListeners`、`toggleEyeLabelPanel`、`openDiseaseModalWithStructure`（若只被標籤按鈕使用）、`getChineseStructureName`／`getStructureType`／`getStructureSide`（若已無呼叫端）；index.html 的 `.eye-label-btn` 面板；`eyeMapper`、`eyeLabelMapper` 的建立。
- 身體：`detectBodyRegion`、`estimateBodyLocation`、`renderManualBodySelector`、`setupManualBodySelector`、`openDiseaseModalWithBodyRegion`（確認）、`displayBodyStructureInfo`（確認是否仍用於資訊顯示）；`bodyImageMapper` 的建立。
- `openDiseaseModal`：三個系統都只剩 preset 路徑；沒有 preset 時直接 return。`handleAnnotationClick` 在 SVG 系統一律不開模態（參考圖模式已在 9-02 處理）。
- index.html／sw.js 移除 `eye-image-mapper.js`、`eye-label-mapper.js`、`body-image-mapper.js`。**檔案本身保留**（doc/tools 的校準工具會用到）。
- `doc/tools/README.md`：把眼睛、身體相關工具（eye-calibration、eye-label-mapping-tool、eye-text-recognition、visualize-coordinates 等，逐一確認）標註「Phase 9 起 app 改用 SVG 結構圖，僅保留參考」。
- `data/*-coordinates.json`、`eye-label-mappings.json`、`eye-image-labels.json`：保留（工具頁使用）。
- 快照核對（差異只能是被刪除的方法與本計畫修改的方法）後 `--write`；`bump_cache.py`。
</context>

<tasks>
<task type="auto">
  <name>Task 1：五個介面小問題</name>
  <files>assets/scripts/app/*.js, assets/styles/*.css</files>
  <action>依 context 第 1 點。</action>
  <verify>ui_polish_test 全部通過</verify>
</task>
<task type="auto">
  <name>Task 2：死碼清理</name>
  <files>assets/scripts/app/*.js, index.html, sw.js, doc/tools/README.md</files>
  <action>依 context 第 2 點。</action>
  <verify>
- `grep -rn "detectEyeStructure\|detectBodyRegion\|renderManualBodySelector\|eye-label-btn" assets/ index.html` 沒有結果
- `python3 doc/tests/run_all.py --with-snapshot`：**0 失敗、0 跳過**
  </verify>
</task>
</tasks>

<commit>fix(ui): 修正 5 個介面小問題；refactor: 移除眼睛與身體座標辨識死碼</commit>
