---
phase: phase-8
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - doc/tests/odontogram_test.py
  - doc/tests/run_all.py
autonomous: true
requirements:
  - SVG-01
  - SVG-02
  - SVG-03
  - SVG-04
must_haves:
  truths:
    - "doc/tests/odontogram_test.py 描述了牙齒系統改用 SVG 牙位圖後的行為，在目前的 master 上應該全部失敗"
    - "這個計畫不修改任何產品程式碼"
---

<objective>
先寫出「牙齒系統改用結構化 SVG 牙位圖」的端到端測試（TDD 紅燈）。產品程式碼在 8-02 才修改。
</objective>

<context>
## 背景
目前牙齒系統是在點陣圖（`assets/images/teeth/permanteeth.png`）上點擊，再用座標換算辨識牙齒。這種做法有兩個已確認的 bug：
1. `app-tooth.js` 的 `detectToothPosition` 把 `canvas.offsetWidth`（已經是 CSS 像素）又除以 `devicePixelRatio` → 螢幕縮放 ≠ 100% 時辨識錯誤
2. `data/anatomical-systems.json` 引用 `primaryteeth`，但 `assets/images/teeth/` 沒有這個檔案 → 乳牙模式一定失敗

**使用者已確認的方向**：牙齒系統改用結構化 SVG 牙位圖（每顆牙是獨立元素，點擊直接取得 FDI，不需要座標換算）；原本的點陣圖保留為「參考圖」，只能看、不能點。

原型：`doc/prototypes/odontogram/`（`odontogram.js` 產生器 + `index.html` 展示頁）。請先打開來看，了解它的 API：`Odontogram.render(container, {dentition, onSelect})` 回傳 `{svg, teeth, select, setCondition}`；每顆牙是 `<g class="tooth" data-fdi="16" data-universal="3" role="button" tabindex="0">`。

## 8-02 將建立的 DOM 契約（測試依此撰寫）
- `#odontogram-view`：牙位圖容器，在 `#image-viewer` 內。牙齒系統時可見，其他系統時 `hidden`
- `#odontogram-view .tooth[data-fdi="NN"]`：每顆牙
- 已有病歷的牙齒：`.tooth.has-record`，並有 `data-record-count="N"`
- `#reference-image-toggle`：「參考圖」切換按鈕（牙齒系統時可見）。按下後 `#image-canvas` 顯示點陣圖、`#odontogram-view` 隱藏；再按一次切回
- 牙齒系統時，`#image-canvas` 預設隱藏
</context>

<tasks>

<task type="auto">
  <name>Task 1：撰寫牙位圖端到端測試</name>
  <files>doc/tests/odontogram_test.py, doc/tests/run_all.py</files>
  <action>
每個測試使用新的 browser context。牙齒系統是預設系統（`currentSystemId === 'teeth'`），但請明確點擊 `.system-tab[data-system="teeth"]` 確保狀態。

1. `test_teeth_view_is_svg`：`#odontogram-view` 可見、內有 32 個 `.tooth`，`#image-canvas` 不可見。
2. `test_primary_view`：點乳齒分頁（`.teeth-tab[data-teeth-type="primary"]`，先讀 index.html 確認選擇器）→ 20 個 `.tooth`，FDI 集合為 51–55、61–65、71–75、81–85。
3. `test_every_tooth_opens_correct_modal`：**這是最重要的測試**。用 `device_scale_factor` 分別為 **1、1.25、2** 的 context 各跑一次（對應 devicePixelRatio 的 bug）。對永久牙 32 顆逐一：點擊 `.tooth[data-fdi="NN"] .crown` → 等 `#disease-modal[aria-hidden="false"]` → 斷言 `#modal-location` 文字包含 `NN` → 關閉模態（`#modal-cancel-btn`）。對乳牙 20 顆也做一次（scale 1 即可）。
4. `test_save_via_odontogram`：點 16 → 勾選第一個疾病 checkbox → 按 `#modal-save-btn` → 斷言 localStorage `medicalRecords` 有一筆 `fdiNumber === 16`、`system === 'teeth'`、`universalNumber` 為 3（字串或數字都接受）、`locationName` 等於 `data/tooth-numbering.json` 中 FDI 16 的 `nameZh`；`.tooth[data-fdi="16"]` 有 `has-record` class；病歷清單顯示該疾病。
5. `test_marker_persists_after_reload`：接續 4 的做法存一筆後 reload → `.tooth[data-fdi="16"].has-record` 存在。
6. `test_legacy_record_marker`：用 add_init_script（sessionStorage 旗標）預先放一筆**沒有 system 欄位**、`fdiNumber: 36`、有 `position: {x: 120, y: 300}` 的舊記錄 → 載入後 `.tooth[data-fdi="36"]` 有 `has-record`，`data-record-count="1"`。
7. `test_keyboard_opens_modal`：`page.focus('.tooth[data-fdi="21"]')` → `page.keyboard.press('Enter')` → 模態開啟且包含 21。
8. `test_reference_image_toggle`：按 `#reference-image-toggle` → `#image-canvas` 可見、`#odontogram-view` 隱藏 → 點擊 canvas 中央 → 斷言模態**沒有**開啟 → 再按一次切回 → `#odontogram-view` 可見。
9. `test_other_systems_use_canvas`：切到眼睛系統 → `#odontogram-view` 隱藏、`#image-canvas` 可見、`#reference-image-toggle` 隱藏。

加進 run_all.py。
  </action>
  <verify>
在目前的 master 上執行：9 項新測試都應該 FAIL（`test_other_systems_use_canvas` 可能因為找不到 `#reference-image-toggle` 而失敗或通過，都可以，請如實記錄）。原有 35 項必須仍然通過。把輸出貼進 SUMMARY。
  </verify>
</task>

</tasks>

<verification>
- `git diff --stat` 只有 doc/tests/ 底下的檔案
</verification>

<commit>
test: 新增 Phase 8 SVG 牙位圖端到端測試（紅燈）
</commit>
