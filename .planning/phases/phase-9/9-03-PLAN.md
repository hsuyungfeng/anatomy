---
phase: phase-9
plan: 03
type: execute
wave: 3
depends_on: [02]
files_modified:
  - assets/scripts/eye-diagram.js
  - assets/styles/anatomy-diagrams.css
  - assets/scripts/app/app-eye.js
  - assets/scripts/app/app-core.js
  - assets/scripts/app/app-modal.js
  - assets/scripts/eye-descriptions.js
  - index.html
  - sw.js
  - doc/tests/records_flow_test.py
  - doc/tests/storage_unify_test.py
  - doc/tests/odontogram_test.py
autonomous: true
requirements: [SVG-06, SVG-08]
must_haves:
  truths:
    - "眼睛系統以 SVG 結構圖呈現（剖面＋正面淚器），可切換 OD／OS，22 個結構都能開啟正確的模態"
    - "儲存的 structureId 與既有格式相容；新結構使用 eye-<key>"
    - "舊記錄依 9-02 的對應規則標示在圖上"
    - "9-01 的 eye_diagram_test 與眼睛相關的 legacy 測試通過"
---

<objective>把眼睛系統從 canvas＋座標辨識改為 SVG 結構圖。身體系統本計畫不動。</objective>

<context>
## 1. 模組與樣式
- `assets/scripts/eye-diagram.js`：從 `doc/prototypes/eye/eye-diagram.js` 複製（prototype 目錄不改）。新增：
  - `render` 的 `names` 選項（可覆寫中英文名稱）
  - `setRecords(countByKey)` 已存在：保留
  - `setWholeEyeCount(n)` 不需要（整隻眼睛的筆數由 app 顯示在眼別按鈕上）
- `assets/styles/anatomy-diagrams.css`（新檔）：從 `doc/prototypes/index.html` 移植眼睛相關的 CSS（`.structure`、`.fill-*`、`.vessel*`、`.inset-frame` 等），色彩改用 app 的主題機制：在 `:root` 定義 `--eye-*` 變數，並在 `[data-theme="dark"]` 重新定義（app 用 data-theme 切換深色模式）。9-04 的身體樣式也會放進這個檔案。
  - 原型中 `.fill-dilator`、`.fill-ciliary`、`.fill-ciliary-muscle`、`.fill-disc`、`.fill-macula` 是直接寫死的色碼，**改成變數**。
  - `.has-record` 用 `--color-eye`（眼睛系統代表色）的淡色，與牙位圖的做法一致。

## 2. 畫面整合
- 在 `#image-viewer` 內新增 `<div id="eye-diagram-view" class="anatomy-view" hidden></div>`，工具列新增眼別切換：
  ```html
  <div id="eye-side-toggle" class="seg" role="group" aria-label="眼別" hidden>
    <button type="button" data-side="right" aria-pressed="true">右眼 OD</button>
    <button type="button" data-side="left" aria-pressed="false">左眼 OS</button>
  </div>
  ```
- `loadSystemImage('eye')`：顯示 `#eye-diagram-view` 與 `#eye-side-toggle`，隱藏 canvas 與其他 SVG 容器；呼叫新方法 `renderEyeDiagram()`。canvas 仍載入 `3Deye.png` 當參考圖。**不要再呼叫 `eyeLabelMapper.drawLabels`。**
- `renderEyeDiagram()`（app-eye.js）：依 `this.selectedEye`（`'right'`/`'left'`，已存在）渲染；`onSelect: s => this.openEyeModal(s)`；渲染後 attach `SvgViewport` 並呼叫 `refreshEyeDiagramRecords()`。
- 切換眼別：更新 `this.selectedEye` 與 `aria-pressed`，重新渲染。
- `refreshEyeDiagramRecords()`：用 `this.recordManager.getAnnotationsBySystem('eye')` 逐筆 `AnatomyMapping.resolveEye()`：
  - 有 key：眼別等於目前眼別，或眼別為 null（兩眼都標示）→ 計入
  - 整隻眼睛：計入對應眼別按鈕的 `data-record-count`，並在按鈕文字後顯示小徽章（CSS `::after` 用 `attr(data-record-count)`，筆數為 0 時不顯示）
  - 在儲存、還原、清除全部之後都要呼叫（比照 Phase 8 的 `refreshOdontogramRecords`）
- `openEyeModal(s)`：設定
  ```js
  this.currentEyeStructure = { name: s.nameZh, nameEn: s.nameEn, structureId: s.recordId, type: s.key, side: s.side, confidence: 1, fromLabel: false, source: 'eye-diagram' };
  ```
  呼叫 `this.displayEyeStructureInfo(this.currentEyeStructure)`（右側資訊面板），再 `this.openDiseaseModal(null, this.currentEyeStructure)`。`openDiseaseModal` 在眼睛系統且有 preset 時，**不顯示信心度警告**。
- `saveDiseaseAnnotation` 的眼睛分支：`locationName` 改成「右眼 角膜」這種格式（`${side === 'right' ? '右眼' : '左眼'} ${name}`），寫入 `source`；其他欄位不變。
- 眼睛資訊面板（`displayEyeStructureInfo`）使用 `getEyeStructureDescription(structureId)`。新的 5 個結構（`eye-conjunctiva`、`eye-anterior-chamber`、`eye-macula`、`eye-optic-disc`、`eye-eyelid`）在 `assets/scripts/eye-descriptions.js` 補上中英文名稱與一段描述（依既有條目的格式與語氣；內容要是正確的基本解剖學描述）。不分邊的 ID 若查不到，改用去掉 `left-`／`right-` 的 ID 再查一次（先讀 eye-descriptions.js 確認它的 key 格式）。
- 舊的眼睛標籤按鈕面板（`.eye-label-btn`、`toggleEyeLabelPanel`）：本計畫**先隱藏不刪除**（9-05 再清理）。

## 3. 允許修改的既有測試（只改開啟方式或本條明列的斷言）
- `records_flow_test.py` 約 87–88 行、`storage_unify_test.py` 約 46–47 行：`.eye-label-btn` → 改為鍵盤選取 `#eye-diagram-view .structure[data-structure="cornea"][tabindex]`。其餘斷言不變。
- `odontogram_test.py` 的 `test_other_systems_use_canvas`：眼睛不再用 canvas。**只允許**改成斷言「切到眼睛後 `#odontogram-view` 隱藏、`#eye-diagram-view` 可見」，並把 `#reference-image-toggle` 的斷言改為「可見」（9-02 已改成三系統通用）。測試名稱改為 `test_other_systems_hide_odontogram`。
- 其他測試若失敗，停下來在 SUMMARY 說明，不要自行修改。

## 4. 其他
新檔加入 index.html 與 sw.js；`bump_cache.py`；快照核對後 `--write`。
</context>

<tasks>
<task type="auto">
  <name>Task 1：模組與樣式</name>
  <files>assets/scripts/eye-diagram.js, assets/styles/anatomy-diagrams.css, index.html</files>
  <action>依 context 第 1 點。</action>
  <verify>node --check</verify>
</task>
<task type="auto">
  <name>Task 2：整合、眼別、病歷標示、資訊面板</name>
  <files>assets/scripts/app/*.js, assets/scripts/eye-descriptions.js, index.html, sw.js</files>
  <action>依 context 第 2、4 點。</action>
  <verify>eye_diagram_test 全部通過；legacy_mapping_test 的 test_eye_legacy_ids 通過</verify>
</task>
<task type="auto">
  <name>Task 3：遷移既有測試並跑全部</name>
  <files>doc/tests/records_flow_test.py, doc/tests/storage_unify_test.py, doc/tests/odontogram_test.py</files>
  <action>依 context 第 3 點。</action>
  <verify>`python3 doc/tests/run_all.py --with-snapshot`：除了 body_map_test、身體相關 legacy 測試與 9-05 的介面測試外全部通過（列在 SUMMARY）</verify>
</task>
</tasks>

<commit>feat(eye): 眼睛系統改用結構化 SVG 剖面圖（OD／OS），相容既有 structureId 並新增 5 個結構</commit>
