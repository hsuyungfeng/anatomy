---
phase: phase-9
plan: 04
type: execute
wave: 4
depends_on: [03]
files_modified:
  - assets/scripts/body-map.js
  - assets/styles/anatomy-diagrams.css
  - assets/scripts/app/app-body.js
  - assets/scripts/app/app-core.js
  - assets/scripts/app/app-modal.js
  - index.html
  - sw.js
  - doc/tests/records_flow_test.py
autonomous: true
requirements: [SVG-07, SVG-08]
must_haves:
  truths:
    - "身體系統以寫實輪廓 SVG 呈現（正面＋背面、男／女），每個子部位都能開啟正確的操作模態"
    - "儲存的 bodyRegionId 是 body-systems.json 的子部位 ID"
    - "舊記錄依 body-legacy-map.json 標示；只有大區域的舊記錄以 .has-region-record 標示整個大區域"
    - "9-01 的 body_map_test 與身體相關 legacy 測試通過"
---

<objective>把身體系統從 canvas＋座標辨識改為寫實輪廓 SVG。</objective>

<context>
## 1. 模組與樣式
- `assets/scripts/body-map.js`：從 `doc/prototypes/body/body-map.js`（寫實輪廓版）複製。修改：
  - 名稱改由 `render` 的 `names` 選項提供（app 從 `data/body-systems.json` 建立，9-02 已把成對部位改為「左X」）；原型的內建 `NAMES` 保留作為備援。
  - 新增 `setRegionRecords(subIds)`：對這些子部位加上 `.has-region-record`（大區域舊記錄用）。
  - clipPath 的 id 已經用亂數避免衝突：保留。
- 樣式：把 `doc/prototypes/index.html` 中身體相關 CSS（`.region`、`.feature-*`、`.anatomy-lines`、膚色變數）移植到 `assets/styles/anatomy-diagrams.css`，比照 9-03 用 app 的主題變數與 `[data-theme="dark"]`。
  - `.has-record` 用 `--color-body` 的淡色；`.has-region-record` 用同色但更淡，並加上斜線紋路（SVG `<pattern>` 或 CSS `stroke-dasharray` 外框，擇一並說明）以便與精確記錄區分。
- 臉部小部位：搭配 9-02 的 `SvgViewport`。在身體系統的工具列新增一個「放大臉部」按鈕（`#focus-face-btn`），按下呼叫 `this.svgViewport.focusOn(<正面的 head 元素>)`。

## 2. 畫面整合
- `#image-viewer` 內新增 `<div id="body-map-view" class="anatomy-view" hidden></div>`；工具列新增：
  ```html
  <div id="body-sex-toggle" class="seg" role="group" aria-label="體型" hidden>
    <button type="button" data-sex="female" aria-pressed="true">女性</button>
    <button type="button" data-sex="male" aria-pressed="false">男性</button>
  </div>
  ```
  選擇存在 `this.bodySex`，並用 localStorage key `bodyMapSex` 記住（讀寫包 try/catch）。這是介面偏好，不是病歷資料，所以**可以**直接用 localStorage（AGENTS.md 的限制只針對病歷資料）。
- `loadSystemImage('body')`：顯示 `#body-map-view`、`#body-sex-toggle`、`#focus-face-btn`，隱藏其他；canvas 仍載入 `bodysurface.png` 當參考圖；呼叫 `renderBodyMap()`。
- `renderBodyMap()`（app-body.js）：`onSelect: r => this.openBodyModal(r)`；attach `SvgViewport`；呼叫 `refreshBodyMapRecords()`。
- `refreshBodyMapRecords()`：`getAnnotationsBySystem('body')` 逐筆 `AnatomyMapping.resolveBody(record, legacyMap)`（legacyMap 從 `data/body-legacy-map.json` 載入並快取）：有 `subId` → `setRecords` 計數；只有 `regionId` → 找出 body-systems.json 中該大區域的所有子部位 → `setRegionRecords`。在儲存、還原、清除之後都要呼叫。
- `openBodyModal(r)`：組出 body-operation-form 需要的 region 物件（先讀 `body-operation-form.js` 的 `generateFormHTML(region)` 需要哪些欄位：至少 `id`、`name`、`name_en`、`side`；`side` 由 ID 推斷，規則要明確：`-r` 結尾 → `right`；`-l` 結尾 → `left`；**沒有後綴的成對部位只有這 5 個**：`head-eyebrow`、`head-eye`、`head-ear`、`head-cheek`、`chest-breast` → `left`；其他全部 → `mid`（例如 `head-nose`、`head-lips`、`chest`、`back`、`groin-*`）。把這個規則寫成 `AnatomyMapping.bodySide(subId)` 並在 legacy_map_unit_test 補上測試），設定 `this.currentBodyRegion`，呼叫 `this.openDiseaseModal(null, <preset>)`。有 preset 時不顯示信心度警告，也**不顯示舊的樹狀手動選擇器**。
- `saveBodyOperation`：`bodyRegionId` 存子部位 ID（例如 `knee-r`），`locationName` 用 body-systems.json 的 `nameZh`，寫入 `source: 'body-map'`；其他欄位不變。

## 3. 允許修改的既有測試
- `records_flow_test.py` 約 140–144 行（`test_save_body_operation` 用 canvas 座標開模態）：改成點擊 `#body-map-view .region[data-region="chest"][data-view="front"]`（用鍵盤選取亦可）。其餘斷言不變。
- 其他測試若失敗，停下來在 SUMMARY 說明。

## 4. 其他
新檔加入 index.html 與 sw.js；`bump_cache.py`；快照核對後 `--write`。
</context>

<tasks>
<task type="auto">
  <name>Task 1：模組與樣式</name>
  <files>assets/scripts/body-map.js, assets/styles/anatomy-diagrams.css</files>
  <action>依 context 第 1 點。</action>
  <verify>node --check</verify>
</task>
<task type="auto">
  <name>Task 2：整合、體型切換、放大臉部、病歷標示</name>
  <files>assets/scripts/app/*.js, index.html, sw.js</files>
  <action>依 context 第 2、4 點。</action>
  <verify>body_map_test、legacy_mapping_test、svg_viewport_test 全部通過</verify>
</task>
<task type="auto">
  <name>Task 3：遷移既有測試並跑全部</name>
  <files>doc/tests/records_flow_test.py</files>
  <action>依 context 第 3 點。</action>
  <verify>`python3 doc/tests/run_all.py --with-snapshot`：除 ui_polish_test 外全部通過</verify>
</task>
<task type="checkpoint:human-verify">
  <name>Task 4：截圖</name>
  <files>doc/prototypes/screenshots/phase-9/</files>
  <action>截圖存到 `doc/prototypes/screenshots/phase-9/`：眼睛 OD 淺色（有 2 個結構有病歷）、眼睛 OS 深色、身體女性淺色（有 1 個精確記錄與 1 個大區域舊記錄）、身體男性深色、身體放大臉部後。在 SUMMARY 列出路徑。</action>
  <verify>5 張 PNG 存在</verify>
</task>
</tasks>

<commit>feat(body): 身體系統改用寫實輪廓 SVG（正背面、男女體型），相容三套舊 ID 並支援放大臉部</commit>
