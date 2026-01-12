# 變更：眼睛系統座標映射與點擊檢測

## 為什麼（Why）

眼睛系統雖已具有基礎設施（UI標籤頁、疾病分類、圖像資源），但缺少核心的座標映射系統，導致無法進行互動標註。使用者無法在眼睛圖像上點擊並記錄眼科疾病位置，限制了系統的臨床應用價值。本變更透過實現與牙齒系統相同級別的座標映射功能，解決此阻塞問題。

## 變更內容（What Changes）

- **新增** `data/eye-coordinates.json`：眼睛結構座標映射數據（10個結構）
- **新增** `assets/scripts/eye-image-mapper.js`：EyeImageMapper 類別，實現圓形區域點擊檢測
- **新增** `eye-calibration.html`：互動式座標校正工具
- **修改** `assets/scripts/main.js`：整合 EyeImageMapper 至主應用程式流程
- **修改** `index.html`：添加 eye-image-mapper.js 腳本載入
- **新增** OpenSpec 規範文檔：`specs/eye-system/spec.md`

## 影響範圍（Impact）

### 受影響的功能規範
- **新增規範**：`openspec/specs/eye-system/spec.md`（7個需求）
- **無破壞性變更**：所有修改向後相容，不影響現有牙齒系統

### 受影響的程式碼位置
- 核心：`assets/scripts/main.js` 中的 `constructor()`, `initModules()`, `handleAnnotationClick()`
- 視圖：`index.html` 的腳本載入部分

### 受影響的資料檔案
- 新增：`data/eye-coordinates.json`（約2KB）
- 無現有檔案刪除或破壞性修改

## 成功指標

- ✅ OpenSpec 規範通過 `openspec validate --strict`
- ✅ `eye-coordinates.json` 包含全部10個眼睛結構的精確座標
- ✅ EyeImageMapper 類別實現圓形檢測且通過功能測試
- ✅ 主應用點擊眼睛圖像時正確識別結構並彈出疾病表單
- ✅ eye-calibration.html 工具可正確記錄點擊座標
- ✅ 所有新增程式碼包含完整中文繁體註解
- ✅ Git提交遵循專案提交訊息規範

## 設計亮點

1. **架構一致性**：完全複製牙齒系統的成熟模式，確保代碼和行為的一致性
2. **圓形檢測**：使用圓形區域檢測（而非複雜的多邊形），實現簡單且高效
3. **細部優先**：細部結構（角膜、虹膜等）的半徑小於整體眼睛，自動優先匹配
4. **外部化資料**：座標資料獨立於程式碼，便於後續校正和維護
5. **可複製模板**：為未來的其他解剖系統（耳朵、鼻子、皮膚等）提供可複製的架構
