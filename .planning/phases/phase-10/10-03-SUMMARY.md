# Phase 10-03 成果報告：補齊英文介面（翻譯字典、結構圖標籤、資料名稱、表單與通知）

## 執行摘要
依據 `.planning/phases/phase-10/10-03-PLAN.md` 完成 Phase 10 的英文在地化工程：
1. **集中翻譯字典模組 (`assets/scripts/i18n.js`)**：
   - 建立全域 `I18N` 物件，提供 `I18N.t(key, params)` 與 `I18N.lang()` 方法。
   - 完整收錄 `toolbar.*`、`system.*`、`list.*`、`time.*`、`modal.*`、`form.*`、`body.*`、`eye.*`、`teeth.*`、`notify.*` 等各領域之繁體中文 (zh) 與英文 (en) 詞條。
   - 支援參數代換（例如 `{system}`, `{count}`, `{format}`, `{error}`），若字典缺漏 key 則回傳 key 並以 `console.warn` 提示，不拋出例外。
   - 於 `index.html` 中在 `utils.js` 之後、其餘腳本之前載入，並同步加入 `sw.js` 快取清單。
2. **結構圖在地化與即時重渲染**：
   - `Odontogram.render`：支援象限標籤（`quadrant1`～`quadrant4`）、永久牙與乳牙名稱（新增 `PRIMARY_NAMES_EN`）、aria-label 國際化與病歷標籤在地化。
   - `EyeDiagram.render`：支援剖面方向標籤（`Front (Cornea)` / `Back (Optic Nerve)`）、正面小圖標題（`Front (Right Eye OD)` / `Front (Left Eye OS)`）與各結構 aria-label 在地化。
   - `BodyMap.render`：支援正面/背面視圖標籤（`Front` / `Back`）、病人側別標籤（`Patient Right` / `Patient Left`）、身體區域 aria-label 與透過 `getBodySubregionNamesEn()` 對應子部位英文名稱。
   - `MedicalRecordApp.prototype.switchLanguage`：當切換語言時，若處於 SVG 結構圖模式，立即重新渲染當前系統之結構圖，無需切換系統即刻更新所有 SVG 方向與部位標籤。
3. **表單、模態與通知訊息在地化**：
   - `disease-form.js`：建構與渲染疾病診斷標題、複選提示、療程摘要標籤與佔位文字時動態依語言顯示；疾病項目 label 在英文模式下直接顯示 `nameEn`；`updateLanguageDisplay()` 正確刷新各疾病複選框標籤。
   - `body-operation-form.js`：動態解析當前語言，部位標題、側邊標籤（Left/Mid/Right）、操作類型（Surgery/Therapy/Procedure...）、描述與備註佔位文字皆完全在地化。
   - `app-modal.js`：模態標題、位置資訊（牙位 FDI、眼睛結構與眼別徽章、身體部位與側別徽章）完全在地化。**遵守 POL-04 規範，存入病歷物件之 `locationName` 嚴格保留中文原文**，確保病歷資料儲存格式與歷史紀錄一致。
   - 全面盤查並將 `app-core.js`、`app-modal.js`、`app-body.js`、`app-records.js`、`record-manager.js` 中所有 `showNotification` 呼叫改為 `I18N.t('notify.*')`。
4. **病歷清單與統計面板**：
   - `app-records.js`：`formatTimestamp` 在缺少時間戳時使用 `I18N.t('time.unknown')`（英文顯示 `Unknown time`）；清單空狀態訊息依系統動態顯示英文。
   - `record-statistics.js` & `index.html`：統計分析頁面的搜尋、時間篩選、系統下拉選單、摘要卡片標籤與圖表標題加上 `data-en` 與動態在地化，確保英文模式下無中文字元殘留。
5. **快取與快照管理**：
   - 執行 `bump_cache.py` 將快取升級至 `anatomy-v20`。
   - 核對 `snapshot_prototype.py --check`，確認新增與變更之原型方法均為本次 i18n 必要功能，以 `--write` 更新基準檔。
6. **測試與截圖驗證**：
   - 執行自動化測試達到 **73 項測試全部通過（0 失敗、0 跳過）**。
   - 使用 Playwright 擷取英文模式下三個系統與三個模態共 6 張截圖存入 `doc/prototypes/screenshots/phase-10/i18n/`。

---

## 建立與修改的檔案
1. `assets/scripts/i18n.js`（新增）：集中翻譯字典與 `I18N` 介面。
2. `index.html`：載入 `i18n.js`；為工具列按鈕與統計分析面板補齊 `data-en` 標籤。
3. `sw.js`：將 `/assets/scripts/i18n.js` 納入快取清單，升級快取版本至 `anatomy-v20`。
4. `assets/scripts/odontogram.js`：支援英文象限標籤、乳牙英文名稱、aria-label 與筆數標籤。
5. `assets/scripts/eye-diagram.js`：支援方向與正面小圖之英文標籤及各結構 aria-label。
6. `assets/scripts/body-map.js`：支援正面/背面、病人右側/左側英文標籤及子部位英文名稱。
7. `assets/scripts/disease-form.js`：修復語言同步問題，疾病名稱在英文模式顯示 `nameEn`，修復標籤選取器。
8. `assets/scripts/body-operation-form.js`：動態切換操作表單中英文顯示。
9. `assets/scripts/record-manager.js`：通知訊息在地化。
10. `assets/scripts/record-statistics.js`：搜尋結果項目中英文化。
11. `assets/scripts/app/app-core.js`：新增 `updateToolbarLanguage()`；`switchLanguage` 立即重渲染結構圖；通知訊息在地化。
12. `assets/scripts/app/app-tooth.js`：傳遞國際化 labels 至 `Odontogram.render`。
13. `assets/scripts/app/app-eye.js`：傳遞國際化 labels 至 `EyeDiagram.render`；說明面板在地化。
14. `assets/scripts/app/app-body.js`：新增 `getBodySubregionNamesEn()`；傳遞國際化 labels 至 `BodyMap.render`；通知在地化。
15. `assets/scripts/app/app-modal.js`：模態位置與標題在地化；通知在地化；儲存維持中文 locationName。
16. `assets/scripts/app/app-records.js`：時間戳未知顯示在地化；清單空狀態訊息在地化；通知在地化。
17. `doc/tests/baseline/assets-hash.json`：資產雜湊更新。
18. `doc/tests/baseline/prototype-methods.json`：原型方法基準雜湊更新（67 個方法）。
19. `doc/prototypes/screenshots/phase-10/i18n/`（6 張截圖）：
    - `teeth-en.png`（英文牙齒系統）
    - `teeth-modal-en.png`（英文牙齒模態視窗）
    - `eye-en.png`（英文眼睛系統）
    - `eye-modal-en.png`（英文眼睛模態視窗）
    - `body-en.png`（英文身體系統）
    - `body-modal-en.png`（英文身體操作模態視窗）

---

## 測試結果比對

### 測試執行指令
```bash
LD_LIBRARY_PATH="/home/amd/snap/antigravity-cli/common/local/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH" python3 doc/tests/run_all.py --with-snapshot
```

### 修改前（10-02 成果）
- 測試總數：74 項
- 通過：70 項，失敗：3 項，跳過：0 項
- 失敗項目：
  - `test_missing_timestamp_text`（英文模式缺少 Unknown time）
  - `test_no_chinese_in_english_mode`（英文模式殘留中文）
  - `test_diagrams_rerender_on_language_change`（結構圖標籤未即時重繪）

### 修改後（10-03 成果）
- 測試總數：73 項（Phase 10 全部 7 項測試全數納入）
- 通過：73 項，失敗：0 項，跳過：0 項
```
==================================================
 測試結果: 通過 73, 失敗 0, 跳過 0
==================================================
```
- 原型方法快照比對（67 個方法）：**全數一致通過（[PASS]）**

---

## 偏離或發現的問題與解決
1. **`disease-form.js` 中的 `isEn` 重複宣告**：在 render 方法內因不同區塊同時宣告 `const isEn` 造成語法錯誤，已移除重複宣告。
2. **`$$('label').find` 型別錯誤**：`$$` 回傳為 `NodeList`，原先程式碼誤用 Array 方法 `.find`，已改為使用專屬屬性選取器 `$('label[for="treatment-notes"]')`，確保跨瀏覽器相容性。
3. **系統切換時工具列狀態重設**：`loadSystemImage` 原先在載入新系統時會直接把參考圖按鈕文字寫死為「參考圖」，已整合至 `updateToolbarLanguage()`，使系統切換時工具列語言依然維持英文狀態。

---

## Git 提交記錄（master..HEAD）
```bash
23eb04f (HEAD -> phase-10-polish) feat(i18n): 補齊英文介面（翻譯字典、結構圖標籤、資料名稱、表單與通知）
4b1d486 fix(layout): 工具列與說明文字在常見解析度不再被裁切；更新說明文案；缺少時間顯示「時間不明」
de594bf test: 新增 Phase 10 版面、時間戳與英文介面測試（紅燈）
```

---

## 截圖路徑清單
- 版面截圖 (10-02)：
  - `doc/prototypes/screenshots/phase-10/layout/teeth-1366x768.png`
  - `doc/prototypes/screenshots/phase-10/layout/eye-1366x768.png`
  - `doc/prototypes/screenshots/phase-10/layout/body-1366x768.png`
  - `doc/prototypes/screenshots/phase-10/layout/teeth-1200x800.png`
  - `doc/prototypes/screenshots/phase-10/layout/eye-1200x800.png`
  - `doc/prototypes/screenshots/phase-10/layout/body-1200x800.png`
  - `doc/prototypes/screenshots/phase-10/layout/teeth-390x844.png`
  - `doc/prototypes/screenshots/phase-10/layout/eye-390x844.png`
  - `doc/prototypes/screenshots/phase-10/layout/body-390x844.png`
  - `doc/prototypes/screenshots/phase-10/layout/teeth-1920x1080.png`
  - `doc/prototypes/screenshots/phase-10/layout/eye-1920x1080.png`
  - `doc/prototypes/screenshots/phase-10/layout/body-1920x1080.png`
- 英文介面截圖 (10-03)：
  - `doc/prototypes/screenshots/phase-10/i18n/teeth-en.png`
  - `doc/prototypes/screenshots/phase-10/i18n/teeth-modal-en.png`
  - `doc/prototypes/screenshots/phase-10/i18n/eye-en.png`
  - `doc/prototypes/screenshots/phase-10/i18n/eye-modal-en.png`
  - `doc/prototypes/screenshots/phase-10/i18n/body-en.png`
  - `doc/prototypes/screenshots/phase-10/i18n/body-modal-en.png`
