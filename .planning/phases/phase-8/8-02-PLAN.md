---
phase: phase-8
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - assets/scripts/odontogram.js
  - assets/styles/odontogram.css
  - assets/scripts/app/app-core.js
  - assets/scripts/app/app-modal.js
  - assets/scripts/app/app-tooth.js
  - index.html
  - sw.js
  - doc/tests/records_flow_test.py
  - doc/tests/storage_unify_test.py
  - doc/tests/baseline/prototype-methods.json
  - doc/tests/baseline/assets-hash.json
autonomous: true
requirements:
  - SVG-01
  - SVG-02
  - SVG-03
  - SVG-04
must_haves:
  truths:
    - "牙齒系統（永久牙、乳牙）以 SVG 牙位圖呈現，點擊任一顆牙都能開啟正確的疾病模態，與螢幕縮放比例無關"
    - "病歷存 FDI；有病歷的牙齒在圖上標示，重新整理後仍在；舊記錄依 fdiNumber 標示"
    - "點陣圖保留為參考圖，只能看、不能點"
    - "眼睛、身體系統行為不變"
    - "8-01 的測試與原有測試全部通過，0 跳過"
---

<objective>
把牙齒系統從「點陣圖 + 座標換算」改成「結構化 SVG 牙位圖」。只改牙齒系統；眼睛、身體系統維持 canvas，不動。
</objective>

<context>
## 1. 牙位圖模組：`assets/scripts/odontogram.js`
從 `doc/prototypes/odontogram/odontogram.js` 複製為正式模組，**prototype 目錄不要改**。修改：
- `render(container, options)` 新增選項 `names`：`{ [fdi]: { nameZh, nameEn } }`，有提供就用它，沒有才用內建名稱。
- 回傳物件新增 `setRecords(countByFdi)`：對每顆牙設定／移除 `has-record` class 與 `data-record-count`，並把 aria-label 補上「，N 筆病歷」。
- 原型的 `setCondition` 保留（之後的牙面功能會用到）。
- 沿用原型的透明點擊區（`.hit`），它解決了大臼齒牙根之間點不到的問題。
- 不要加 console.log。

## 2. 樣式：`assets/styles/odontogram.css`
從原型的 CSS 移植 `.odontogram` 與 `.tooth` 相關規則，**改用 app 既有的 CSS 變數**（`assets/styles/main.css` 的 `:root` 與 `[data-theme="dark"]`）。牙冠、牙根的顏色如果 main.css 沒有合適的變數，就在 odontogram.css 定義 `--tooth-crown` 等新變數，並在 `[data-theme="dark"]` 下重新定義（app 的深色模式是用 `data-theme` 屬性切換，請先讀 main.css 確認）。
`.tooth.has-record .crown` 用 `--color-teeth`（牙齒系統的代表色）的淡色填滿，並在牙齒標籤旁顯示筆數（用 CSS 或 SVG `<text>` 都可以，選一種並說明）。
在 index.html 的 `<head>` 載入。

## 3. 畫面整合（index.html、app-core.js）
- 在 `#image-viewer` 內、`#image-canvas` 旁邊新增 `<div id="odontogram-view" class="odontogram-view" hidden></div>`。
- 在圖像工具列新增 `<button id="reference-image-toggle" class="btn" type="button" aria-pressed="false">參考圖</button>`（預設 `hidden`，只在牙齒系統顯示）。
- 載入順序：`odontogram.js` 放在 app/*.js 之前。
- `loadSystemImage(systemId)`：
  - 牙齒系統（`teeth` / `primary_teeth`）：顯示 `#odontogram-view`、隱藏 `#image-canvas`、顯示 `#reference-image-toggle`；呼叫新方法 `renderOdontogram()`。**點陣圖仍然照原本方式載入到 canvas**（參考圖要用）。
  - 其他系統：隱藏 `#odontogram-view` 與 `#reference-image-toggle`，顯示 `#image-canvas`，並把參考圖狀態重設為「關」。
- 新方法 `renderOdontogram()`（放在 app-tooth.js）：
  - dentition：`this.currentSystemId === 'primary_teeth' ? 'primary' : 'permanent'`
  - names：永久牙從 `data/tooth-numbering.json`（universal 系統的 teeth，用 `fdi` 當 key）取 `nameZh` / `name`；**名稱必須跟這份資料一致**，因為清單分組和既有病歷的 locationName 都用它。載入一次後快取在 `this.toothNames`。乳牙沿用模組內建名稱。
  - `onSelect: tooth => this.openToothModal(tooth)`
  - 渲染後呼叫 `refreshOdontogramRecords()`
- 新方法 `refreshOdontogramRecords()`：用 `this.recordManager.getAnnotationsBySystem('teeth')` 依 `fdiNumber` 計數後呼叫 `setRecords`。**在儲存、還原、清除全部之後都要呼叫**（找出這些流程目前呼叫 `loadAnnotations` 或 `loadAndDisplayRecords` 的地方，一併補上）。
- `loadAnnotations(systemId)`：牙齒系統時**不要**把標註畫到 canvas（改由牙位圖標示），也不要呼叫 `diseaseVisualizer.render`；其他系統維持原樣。
- 參考圖切換：按下後切換 `#odontogram-view` 與 `#image-canvas` 的可見性，並更新 `aria-pressed` 與按鈕文字（「參考圖」／「牙位圖」）。**乳牙沒有參考圖**（檔案不存在）：乳牙模式時按鈕 `disabled`，`title="乳牙沒有參考圖"`。
- 參考圖模式下點擊 canvas：`handleAnnotationClick` 在牙齒系統時**直接 return**，不開模態；改顯示 `showNotification('參考圖僅供檢視，請切回牙位圖點選牙齒', 'info')`。

## 4. 開啟模態（app-modal.js、app-tooth.js）
- 新方法 `openToothModal(tooth)`（app-tooth.js）：把牙位圖回傳的資料轉成 `this.currentToothInfo`，欄位要跟 `saveDiseaseAnnotation` 讀取的一致：
  ```js
  { name: <nameZh>, nameEn, fdi, number: <universal>, type, quadrant, confidence: 1, manualSelection: false, source: 'odontogram' }
  ```
  然後呼叫 `this.openDiseaseModal(null, this.currentToothInfo)`。
- `openDiseaseModal(position, presetStructure = null)`：新增第二個參數。有 `presetStructure` 時**跳過偵測**，直接用它當 `structureInfo`；牙齒系統且有 preset 時，不顯示手動牙齒選擇器、不顯示信心度警告。沒有 preset 時行為完全不變（眼睛、身體仍走原本流程）。
- `saveDiseaseAnnotation` 的牙齒分支：`position` 改成 `this.currentClickPosition || null`，並寫入 `source`（有的話）。其他欄位不變。

## 5. 允許修改的既有測試（僅限以下三處，斷言一律不准改）
以下測試用 `app.openDiseaseModal({x: 200, y: 150})` 以座標開啟牙齒模態。改用 SVG 後，這三處改成**點擊牙位圖上的一顆牙**（例如 `.tooth[data-fdi="16"] .crown`），其餘程式碼與所有斷言保持不變：
- `doc/tests/records_flow_test.py` 第 38 行附近（test_save_teeth_record）
- `doc/tests/records_flow_test.py` 第 281 行附近（test_records_persist_after_reload）
- `doc/tests/storage_unify_test.py` 第 30 行附近（共用的儲存輔助函式）

如果還有其他測試因為牙齒改用 SVG 而失敗，**停下來在 SUMMARY 說明，不要自行修改**。

## 6. 其他
- 新檔案加進 `sw.js` 的預先快取清單，完成後執行 `python3 doc/tests/bump_cache.py`。
- 快照：`--check` 確認差異只出現在 loadSystemImage、loadAnnotations、handleAnnotationClick、openDiseaseModal、saveDiseaseAnnotation，以及新增的 renderOdontogram、refreshOdontogramRecords、openToothModal、參考圖切換相關方法，還有你為了在儲存／還原／清除後刷新而修改的方法。把輸出貼進 SUMMARY 後 `--write`。
- 本計畫**不刪除**任何舊的座標辨識程式碼（8-03 才處理）。
</context>

<tasks>

<task type="auto">
  <name>Task 1：牙位圖模組與樣式</name>
  <files>assets/scripts/odontogram.js, assets/styles/odontogram.css</files>
  <action>依 context 第 1、2 點。</action>
  <verify>node --check assets/scripts/odontogram.js</verify>
</task>

<task type="auto">
  <name>Task 2：整合進 app</name>
  <files>index.html, assets/scripts/app/app-core.js, assets/scripts/app/app-tooth.js, assets/scripts/app/app-modal.js, sw.js</files>
  <action>依 context 第 3、4、6 點。</action>
  <verify>所有修改的 JS `node --check` 通過</verify>
</task>

<task type="auto">
  <name>Task 3：遷移三處測試並讓全部轉綠</name>
  <files>doc/tests/records_flow_test.py, doc/tests/storage_unify_test.py, doc/tests/baseline/*</files>
  <action>依 context 第 5 點修改三處開啟方式。執行 `python3 doc/tests/run_all.py --with-snapshot`，全部通過後更新快照與快取基準。</action>
  <verify>python3 doc/tests/run_all.py --with-snapshot 0 失敗 0 跳過</verify>
</task>

<task type="checkpoint:human-verify">
  <name>Task 4：截圖供使用者確認</name>
  <files>doc/prototypes/odontogram/screenshots/</files>
  <action>用 Playwright 截三張圖存到 `doc/prototypes/odontogram/screenshots/`：淺色模式的永久牙（有 2 顆牙有病歷）、深色模式的永久牙、乳牙。在 SUMMARY 列出檔案路徑。</action>
  <verify>三張 PNG 存在</verify>
</task>

</tasks>

<commit>
feat(teeth): 牙齒系統改用結構化 SVG 牙位圖，點擊直接辨識 FDI；點陣圖保留為參考圖
</commit>
