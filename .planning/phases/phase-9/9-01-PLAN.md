---
phase: phase-9
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - doc/tests/eye_diagram_test.py
  - doc/tests/body_map_test.py
  - doc/tests/legacy_mapping_test.py
  - doc/tests/svg_viewport_test.py
  - doc/tests/ui_polish_test.py
  - doc/tests/run_all.py
autonomous: true
requirements: [SVG-06, SVG-07, SVG-08, SVG-09, SVG-10, UI-03]
must_haves:
  truths:
    - "新測試描述眼睛、身體改用 SVG 後的行為、舊記錄對應、縮放平移與 5 個介面小問題；在目前的 master 上應該大部分失敗"
    - "這個計畫不修改任何產品程式碼"
---

<objective>
先寫出 Phase 9 的端到端測試（TDD 紅燈）。產品程式碼在 9-02 起才修改。
</objective>

<context>
## 背景
Phase 8 已經把牙齒系統改成 SVG 牙位圖（`assets/scripts/odontogram.js`）。Phase 9 用同樣方式處理眼睛與身體。使用者已確認原型：
- 眼睛：`doc/prototypes/eye/eye-diagram.js`（剖面圖＋正面淚器小圖，OD／OS 切換，22 個結構，其中 5 個是新增的：結膜、前房、黃斑部、視神經盤、眼瞼）
- 身體：`doc/prototypes/body/body-map.js`（**寫實輪廓版**，正面＋背面，男／女體型，ID 與 `data/body-systems.json` 的 58 個子部位一致）
- 三張圖的審閱頁：`doc/prototypes/index.html`
請先用 `python3 -m http.server 8000` 開 http://localhost:8000/doc/prototypes/ 實際操作一次。

## 9-02～9-05 將建立的 DOM 契約（測試依此撰寫）
- `#eye-diagram-view`、`#body-map-view`：與 `#odontogram-view` 同層，只在對應系統時可見；其他兩個與 `#image-canvas` 隱藏
- 眼睛：`#eye-diagram-view .structure[data-structure="cornea"]`（每個結構一個或多個 `.structure`；可點的那個有 `tabindex="0"` 與 `data-record-id`）
- 眼別切換：`#eye-side-toggle button[data-side="right"]`、`[data-side="left"]`，`aria-pressed` 表示目前眼別
- 身體：`#body-map-view .region[data-region="knee-r"][data-view="front"]`
- 性別切換：`#body-sex-toggle button[data-sex="female"]`、`[data-sex="male"]`
- 有病歷：眼睛 `.structure.has-record`、身體 `.region.has-record`；只有大區域（例如 `upper-limb-l`）的舊記錄：該大區域的所有子部位加上 `.has-region-record`
- `#reference-image-toggle`：三個系統都可見（乳牙除外，維持 disabled）；按下後顯示 `#image-canvas`，隱藏目前的 SVG 檢視
- 縮放：既有的 `#zoom-in-btn`、`#zoom-out-btn`、`#zoom-reset-btn`，以及 `#zoom-level` 百分比顯示，作用在**目前可見的 SVG**；SVG 根元素的 `viewBox` 會改變

## 舊記錄的 ID 對應（測試必須涵蓋每一類）
**眼睛 `structureId`：**
| 舊值 | 應標示的結構 | 眼別 |
|------|-------------|------|
| `right-eye-cornea`、`left-eye-iris` 等（cornea／iris／lens／retina） | 對應結構 | 取自 ID |
| `right-eye-lacrimal` / `left-eye-lacrimal` | `lacrimal-gland` | 取自 ID |
| `eye-cornea`、`eye-iris`、`eye-lens`、`eye-retina`（不分邊，來自 eye-label-mappings.json） | 對應結構 | 取自記錄的 `side`；沒有 side 就**兩眼都標示** |
| `eye-vitreous-hyaloid` | `hyaloid-canal` | 同上 |
| `eye-blood-vessels` | `vessels` | 同上 |
| 其他 `eye-xxx`（choroid、sclera、optic-nerve、vitreous、ciliary-body、ciliary-muscle、extraocular-muscles、pupil、dilator-pupillae、nasolacrimal-duct） | `xxx` | 同上 |
| `right-eye` / `left-eye`（整隻眼睛） | 不標在結構上；眼別切換按鈕顯示筆數徽章 `data-record-count` | 取自 ID |

**身體 `bodyRegionId`（或舊格式的 `bodyPart` + `side`）：** 見 9-02 的 `data/body-legacy-map.json` 對照表。測試至少涵蓋：`arm-left-elbow`→`elbow-l`、`leg-right-calf`→`leg-r`、`head-eye-left`→`head-eye`、`chest-breast-right`→`chest-breast-r`、`neck-posterior`→`neck-nape`、`abdomen-inguinal`→`groin`、`head-mouth`→`head-lips`、目前格式 `knee-r`→`knee-r`、大區域 `arm-left`→`upper-limb-l`（子部位加 `.has-region-record`）、舊格式 `{bodyPart:'arm', side:'left'}`→`upper-limb-l`。
</context>

<tasks>

<task type="auto">
  <name>Task 1：撰寫測試</name>
  <files>doc/tests/*_test.py（上列 5 個新檔）, doc/tests/run_all.py</files>
  <action>
每個測試用新的 browser context；init script 一律用 sessionStorage 旗標。

**eye_diagram_test.py**
1. `test_eye_view_is_svg`：切到眼睛 → `#eye-diagram-view` 可見、`#image-canvas` 與 `#odontogram-view` 隱藏；可點的結構數 = 22。
2. `test_every_eye_structure_opens_modal`：OD、OS 各一次，對 22 個結構逐一用**鍵盤**選取（`focus` + Enter；細長結構如角膜用滑鼠點中心可能點到別的結構）→ 模態開啟、`#modal-location` 包含結構中文名稱 → 關閉。
3. `test_save_eye_record`：OS 選角膜 → 勾第一個疾病 → 儲存 → 記錄 `system==='eye'`、`structureId==='left-eye-cornea'`、`side==='left'`；`.structure[data-structure="cornea"]` 有 `has-record`；切到 OD 後**沒有** `has-record`。
4. `test_new_structure_saves`：選黃斑部（新結構）→ 儲存 → `structureId==='eye-macula'`、`side` 為目前眼別。

**body_map_test.py**
5. `test_body_view_is_svg`：切到身體 → `#body-map-view` 可見；女性正面＋背面的可點區域都存在，`data-region` 集合 ⊇ body-systems.json 的所有子部位（排除 groin-penis、groin-scrotum）；切男性後包含 groin-penis、groin-scrotum，不含 groin-vulva。
6. `test_every_body_region_opens_modal`：對每個 `.region`（正面與背面，女性）逐一用鍵盤選取 → 模態開啟、`#modal-location` 包含 body-systems.json 中該子部位的 `nameZh` → 關閉。
7. `test_save_body_operation`：點 `knee-r`（正面）→ 在操作表單選第一個操作類型、填描述 → 儲存 → 記錄 `system==='body'`、`bodyRegionId==='knee-r'`、`side==='right'`；正面與背面的 `knee-r` 都有 `has-record`。

**legacy_mapping_test.py**
8. `test_eye_legacy_ids`：預先放入 context 表格中每一類的眼睛舊記錄（各一筆，含一筆 `eye-cornea` 無 side、一筆 `right-eye` 整隻眼睛）→ 逐一斷言 OD／OS 視圖的標示結果符合表格（整隻眼睛：`#eye-side-toggle button[data-side="right"]` 的 `data-record-count` ≥ 1）。
9. `test_body_legacy_ids`：預先放入 context 列出的每一種身體舊記錄 → 斷言對應子部位有 `has-record`；大區域記錄讓該區所有子部位有 `has-region-record`。
10. `test_legacy_records_unchanged`：載入後 localStorage 中這些舊記錄的 `structureId`／`bodyRegionId`／`bodyPart` **原封不動**（對應是讀取時計算，不改寫資料）。

**svg_viewport_test.py**
11. `test_zoom_changes_viewbox`：在牙齒、眼睛、身體三個系統各按一次放大 → SVG 的 `viewBox` 寬度變小；按重設 → 恢復原值。
12. `test_face_target_size_after_zoom`：身體系統放大到最大 → `head-eye-r` 的 `getBoundingClientRect()` 寬、高都 ≥ 24px（先把 viewBox 平移到臉部：用拖曳或提供的 API，先讀 9-02 的實作說明；若 9-02 尚未實作，這個測試用 `page.evaluate` 呼叫 `window.app.svgViewport.focusOn('head-eye-r')`）。
13. `test_drag_pan_does_not_click`：放大後在 SVG 上拖曳 60px → 模態**沒有**開啟、viewBox 的 x 或 y 改變。

**ui_polish_test.py（5 個小問題）**
14. `test_teeth_subtabs_visible_on_load`：載入後不點任何分頁，`.teeth-tab[data-teeth-type="primary"]` 可見。
15. `test_save_notification_text`：用牙位圖存一筆 → 通知文字不含「信心度」。
16. `test_zoom_buttons_work_in_svg`：牙齒系統按放大 → `#odontogram-view svg` 的 viewBox 改變（與 11 重疊但獨立保留，對應小問題清單）。
17. `test_dark_mode_record_cards`：切深色模式、預先放一筆牙齒記錄 → 病歷卡片（`.record-group`）的計算背景色亮度 < 0.5（以 `getComputedStyle` 的 RGB 計算相對亮度）。
18. `test_eye_list_no_duplicate_side`：預先放一筆 `structureId:'left-eye', side:'left', locationName:'左眼'` → 眼睛清單文字中「左眼」只出現 1 次。

加進 run_all.py。
  </action>
  <verify>在 master 上執行：新測試大部分 FAIL（如實記錄哪些剛好通過）；原有 44 項仍通過。把輸出貼進 SUMMARY。</verify>
</task>

</tasks>

<verification>`git diff --stat` 只有 doc/tests/ 底下的檔案</verification>

<commit>test: 新增 Phase 9 眼睛／身體 SVG、舊記錄對應、縮放與介面修正測試（紅燈）</commit>
