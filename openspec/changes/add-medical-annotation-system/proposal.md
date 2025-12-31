# 變更：醫療結構化病歷標註系統

## 為什麼（Why）

目前沒有有效的工具讓醫療專業人員能夠同時：
1. 在解剖學圖像上進行直觀的視覺標註
2. 記錄結構化、標準化的疾病資訊
3. 使用 OCR 快速輸入疾病名稱
4. 生成可交換的醫療記錄格式（FHIR）

本變更透過結合**圖像標註 + 結構化表單 + OCR**，創建一個完整的醫療病歷輸入系統，顯著提高臨床記錄效率，並確保資料的標準化和可互通性。

## 變更內容（What Changes）

### 新增的核心功能
- **圖像標註模組**：點擊圖像彈出疾病表單視窗
- **多解剖系統**：支持牙齒、眼睛、身體等多個系統
- **結構化疾病表單**：參考臨床標準的多選框和階層展開
- **OCR 整合**：Tesseract.js 自動識別中英文疾病名稱
- **病歷管理**：JSON 格式儲存、匯出、LocalStorage 離線支持
- **雙語界面**：完整的繁體中文和英文支持

### 受影響的檔案和目錄
- **新增目錄**：
  - `assets/scripts/` - JavaScript 模組
  - `assets/styles/` - CSS 樣式檔案
  - `data/` - JSON 資料檔案
  - `pages/` - 子頁面
  - `lib/` - 外部函式庫

- **新增 HTML 頁面**：
  - `index.html` - 主頁面
  - `pages/medical-record.html` - 病歷輸入頁面

- **新增 JavaScript 模組**：
  - `assets/scripts/image-annotator.js` - 圖像標註
  - `assets/scripts/disease-form.js` - 疾病表單
  - `assets/scripts/ocr-handler.js` - OCR 處理
  - `assets/scripts/record-manager.js` - 病歷管理
  - `assets/scripts/main.js` - 主控制邏輯

- **新增 CSS 檔案**：
  - `assets/styles/main.css` - 主樣式
  - `assets/styles/modal.css` - 模態視窗
  - `assets/styles/annotator.css` - 標註樣式

- **新增資料檔案**：
  - `data/disease-categories.json` - 疾病分類
  - `data/anatomical-systems.json` - 解剖系統
  - `data/tooth-numbering.json` - 牙齒編號系統

## 影響範圍（Impact）

### 新增規範（Specs）
- `specs/medical-annotation/spec.md` - 醫療標註系統完整需求規範

### 技術影響
- **外部依賴新增**：Tesseract.js 6.0.0（OCR 引擎）
- **儲存機制**：引入 localStorage 用於離線儲存
- **瀏覽器相容性**：需要支持 ES6+ 和 WebAssembly

### 架構變化
- 引入**模組化設計**：每個功能獨立為一個類別模組
- **事件驅動**：模組間使用 CustomEvent 通訊
- **資料驅動**：所有配置數據從 JSON 檔案加載

## 優先級和排期

- **優先級**：高（核心功能）
- **估算規模**：6 週（含 OCR 整合、完整測試和文檔）
- **風險評估**：低（使用現成函式庫，技術棧簡單）

## 成功指標

- [ ] 所有圖像標註功能正常運作
- [ ] OCR 識別準確率 > 90%（中英文）
- [ ] 病歷 JSON 匯出格式符合規範
- [ ] 支持所有主流瀏覽器
- [ ] 響應式設計在各設備上可用
- [ ] 完整的中文使用者文檔

## 相關文檔

- openspec/project.md - 專案規範和架構模式
- openspec/changes/add-medical-annotation-system/specs/medical-annotation/spec.md - 完整需求規範
- openspec/changes/add-medical-annotation-system/tasks.md - 實作清單
