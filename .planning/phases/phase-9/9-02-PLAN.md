---
phase: phase-9
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - assets/scripts/svg-viewport.js
  - assets/scripts/anatomy-mapping.js
  - data/body-legacy-map.json
  - data/body-systems.json
  - assets/scripts/app/app-core.js
  - assets/scripts/app/app-tooth.js
  - index.html
  - sw.js
autonomous: true
requirements: [SVG-09, SVG-10]
must_haves:
  truths:
    - "三個系統共用一套 SVG 縮放／平移（既有縮放按鈕有效），拖曳不會誤觸點擊"
    - "參考圖切換改為三個系統通用"
    - "舊記錄的眼睛、身體 ID 對應集中在一個模組，讀取時計算，不改寫資料"
    - "牙齒系統行為不變；Phase 8 的測試仍全部通過"
---

<objective>
建立眼睛、身體整合所需的共用基礎：SVG 縮放平移、通用參考圖切換、舊記錄 ID 對應。這一份只做基礎，**不整合眼睛、身體的圖**（9-03、9-04 才做）。
</objective>

<context>
## 1. `assets/scripts/svg-viewport.js`（新檔）
```js
// 用法：const vp = SvgViewport.attach(svgElement, { maxZoom: 4 })
// vp.zoomIn() / vp.zoomOut() / vp.reset() / vp.focusOn(element) / vp.getZoom() / vp.detach()
```
- 以修改 `viewBox` 實作（不要用 CSS transform，才能維持點擊命中正確與線條清晰）。每次縮放 ×1.25，範圍 1～maxZoom（預設 4）；縮放以目前可視中心為基準。
- `focusOn(element)`：把 viewBox 置中到該元素的 `getBBox()`，並放大到它至少佔可視寬度的 1/6（不超過 maxZoom）。
- 平移：zoom > 1 時，在 SVG 上按下拖曳移動 viewBox；**移動超過 4px 就視為拖曳，並在 capture 階段攔截接下來的那一次 click**（避免拖曳結束時誤開模態）。viewBox 不可移出原始範圍。
- 滑鼠滾輪：`ctrlKey` 或 zoom > 1 時縮放，否則不攔截（不影響頁面捲動）。
- 支援觸控（pointer events）。
- app 端：新增 `this.svgViewport`，指向目前可見 SVG 的 viewport。既有的 `#zoom-in-btn`、`#zoom-out-btn`、`#zoom-reset-btn` 在 SVG 系統時改呼叫 `this.svgViewport`，`#zoom-level` 顯示百分比；在參考圖（canvas）模式維持原本的 canvas 縮放。
- Phase 8 的牙位圖先接上（`renderOdontogram` 之後 attach）。

## 2. 通用參考圖切換（app-core.js）
把 Phase 8 只給牙齒用的參考圖邏輯改成通用：`#reference-image-toggle` 在牙齒、眼睛、身體都顯示；切換時隱藏／顯示「目前系統的 SVG 容器」。乳牙仍 disabled。參考圖模式下點 canvas 一律不開模態，顯示「參考圖僅供檢視，請切回結構圖點選」。

## 3. 舊記錄對應：`assets/scripts/anatomy-mapping.js`（新檔）＋ `data/body-legacy-map.json`
```js
// AnatomyMapping.resolveEye(record) → { key: 'cornea' | null, side: 'left'|'right'|null, wholeEye: bool }
// AnatomyMapping.resolveBody(record, legacyMap) → { subId: 'elbow-l' | null, regionId: 'upper-limb-l' | null }
```
- **眼睛**：規則見 9-01 的表格。解析 `structureId`：`/^(left|right)-eye$/` → 整隻眼睛；`/^(left|right)-eye-(.+)$/` → 眼別取自 ID，`lacrimal` 對應 `lacrimal-gland`；`/^eye-(.+)$/` → `vitreous-hyaloid`→`hyaloid-canal`、`blood-vessels`→`vessels`，其餘去掉 `eye-` 前綴，眼別取自 `record.side`（`left`/`right`，其他值視為 null）。無法辨識回傳 `{ key: null }`。
- **身體**：`data/body-legacy-map.json` 格式 `{ "version": 1, "subRegion": { "<舊ID>": "<新子部位ID>" }, "region": { "<舊ID>": "<大區域ID>" } }`。至少包含（歷史上三套命名都要涵蓋）：
  - 子部位：`head-scalp/head-skull/head-face`→`head`（`head` 視為大區域）、`head-mouth`→`head-lips`、`head-eye-left`→`head-eye`、`head-eye-right`→`head-eye-r`、`head-ear-left`→`head-ear`、`head-ear-right`→`head-ear-r`、`neck-anterior/neck-throat/neck-lateral/neck-lateral-left/neck-lateral-right`→`neck`、`neck-posterior`→`neck-nape`、`chest-upper/chest-sternum/chest-ribs/chest-ribs-left/chest-ribs-right/chest-lateral`→`chest`、`chest-breast-left`→`chest-breast`、`chest-breast-right`→`chest-breast-r`、`abdomen-lower/abdomen-flank/abdomen-flank-left/abdomen-flank-right`→`abdomen`、`abdomen-inguinal`→`groin`、`arm-{left,right}-{shoulder,upper,elbow,forearm,wrist,hand}`→`{shoulder,arm,elbow,forearm,wrist,hand}-{l,r}`、`leg-{left,right}-{thigh,knee,calf,ankle,foot}`→`{thigh,knee,leg,ankle,foot}-{l,r}`
  - 大區域：`arm-left`→`upper-limb-l`、`arm-right`→`upper-limb-r`、`leg-left`→`lower-limb-l`、`leg-right`→`lower-limb-r`、`torso`→`torso`、`head`→`head`，以及 body-systems.json 的所有大區域 ID 對應自己
  - 目前的 58 個子部位 ID 對應自己（程式直接判斷，不必寫進 JSON）
  - **注意歧義**：`head-eyebrow`、`head-eye`、`head-ear`、`head-cheek`、`chest-breast` 這 5 個 ID 在目前格式代表「病人左側」，但最舊版本的資料不分左右、另用 `side` 欄位區分。規則：若 ID 是這 5 個之一**且** `record.side === 'right'` → 對應到 `-r` 版本；否則對應到自己。
  - `arm`、`leg`（最舊版本，不分左右）：用 `record.side` 決定 → `upper-limb-{l,r}`、`lower-limb-{l,r}`；沒有 side 就回傳 `{ subId: null, regionId: null }`（不標示，但清單照常顯示）
- 優先順序：`bodyRegionId` → `bodyPart`。
- **不改寫任何已存資料**。
- 在 anatomy-mapping.js 檔頭註解說明這張表為什麼存在（身體座標檔歷史上改過三套命名）。

## 4. `data/body-systems.json` 名稱修正
沒有 `-r` 後綴的成對部位目前名稱不分左右（「眉毛」「眼睛」「耳朵」「臉頰」「乳房」），實際代表病人左側。把 `nameZh` 改為「左眉毛」「左眼」「左耳朵」「左臉頰」「左乳房」，`nameEn` 加上 `Left`。ID 不變。

## 5. 其他
新檔案加進 index.html（在 app/*.js 之前）與 sw.js；完成後執行 `python3 doc/tests/bump_cache.py`。快照差異核對後 `--write`。
</context>

<tasks>
<task type="auto">
  <name>Task 1：svg-viewport.js 並接上牙位圖與縮放按鈕</name>
  <files>assets/scripts/svg-viewport.js, assets/scripts/app/app-core.js, assets/scripts/app/app-tooth.js</files>
  <action>依 context 第 1 點。</action>
  <verify>9-01 的 test_zoom_changes_viewbox（牙齒部分）、test_zoom_buttons_work_in_svg 通過</verify>
</task>
<task type="auto">
  <name>Task 2：通用參考圖切換</name>
  <files>assets/scripts/app/app-core.js</files>
  <action>依 context 第 2 點。</action>
  <verify>Phase 8 的 test_reference_image_toggle 仍通過</verify>
</task>
<task type="auto">
  <name>Task 3：舊記錄對應模組、對照表與名稱修正</name>
  <files>assets/scripts/anatomy-mapping.js, data/body-legacy-map.json, data/body-systems.json</files>
  <action>依 context 第 3、4 點。另外寫一個不需瀏覽器的檢查：`doc/tests/legacy_map_unit_test.py` 用 `node -e` 載入 anatomy-mapping.js（它應該在 `window` 不存在時也能運作，例如 `(typeof window !== 'undefined' ? window : globalThis).AnatomyMapping = ...`），把 9-01 表格與 context 列出的每一個舊 ID 逐一斷言。加進 run_all.py。</action>
  <verify>legacy_map_unit_test 通過</verify>
</task>
</tasks>

<verification>`python3 doc/tests/run_all.py --with-snapshot`：原有 44 項＋本計畫相關的新測試通過；9-03、9-04 才會通過的測試仍失敗是預期的，請在 SUMMARY 列出</verification>

<commit>feat: SVG 縮放平移、通用參考圖切換、舊記錄 ID 對應模組</commit>
