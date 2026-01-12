# 眼睛系統規範（Eye System Specification）

## ADDED Requirements

### Requirement: 眼睛座標映射數據格式

系統 SHALL 提供 JSON 格式的眼睛座標映射數據，定義每個眼睛結構在圖像上的點擊檢測區域。

#### Scenario: 數據加載與結構
- **WHEN** 應用程式啟動時
- **THEN** 從 `/data/eye-coordinates.json` 成功加載座標數據
- **AND** 數據結構包含 `version`, `description`, `imageReferenceSize`, `structures` 四個主要字段
- **AND** `structures` 物件包含 10 個眼睛結構（右眼5個 + 左眼5個）

#### Scenario: 結構資料欄位完整性
- **WHEN** 取得任何眼睛結構的座標數據
- **THEN** 該結構包含以下必要欄位：
  - `id`: 結構唯一標識符
  - `name`: 英文名稱
  - `nameCh`: 中文繁體名稱
  - `type`: 結構類型（eye, cornea, iris, lens, retina）
  - `side`: 左眼或右眼（left/right）
  - `x`: X 座標（像素）
  - `y`: Y 座標（像素）
  - `radius`: 檢測半徑（像素）
  - `confidence`: 信心度標記（high/medium/low）

---

### Requirement: 圓形區域點擊檢測

系統 SHALL 實現基於圓形區域的點擊檢測演算法，識別使用者點擊位置對應的眼睛結構。

#### Scenario: 點擊角膜成功識別
- **WHEN** 使用者點擊右眼角膜圖像區域
- **THEN** 系統識別出對應結構：`right-eye-cornea`
- **AND** 返回結構資訊包含 `structureId`, `nameCh`, `x`, `y`, `radius`, `distance`, `confidence`

#### Scenario: 點擊眼睛結構邊界
- **WHEN** 使用者點擊位置距離眼睛結構圓心距離等於該結構半徑
- **THEN** 系統應將該點擊視為在檢測區域內
- **AND** 返回該結構資訊，信心度為 0

#### Scenario: 點擊圖像外區域
- **WHEN** 使用者點擊圖像上不在任何眼睛結構檢測區域內的位置
- **THEN** 系統返回 null
- **AND** 觸發 `clickOutside` 事件

---

### Requirement: 細部結構優先匹配

系統 SHALL 在多個眼睛結構重疊的檢測區域內，優先匹配半徑較小的細部結構。

#### Scenario: 整體眼睛與細部結構重疊
- **WHEN** 點擊座標同時在「右眼」(radius: 100) 和「右眼角膜」(radius: 50) 的檢測區域內
- **THEN** 系統返回「右眼角膜」結構（半徑較小）
- **AND** 不返回「右眼」結構

#### Scenario: 多個細部結構重疊
- **WHEN** 點擊座標同時在「右眼角膜」(radius: 50) 和「右眼虹膜」(radius: 35) 的檢測區域內
- **THEN** 系統返回「右眼虹膜」結構（半徑較小）

#### Scenario: 同心結構的匹配順序
- **WHEN** 檢查所有眼睛結構的匹配優先級
- **THEN** 按以下順序優先匹配：視網膜（可選）> 晶狀體 > 虹膜 > 角膜 > 整體眼睛
- **AND** 實際優先級由結構的 `radius` 大小決定（半徑小優先）

---

### Requirement: 事件驅動架構

系統 SHALL 提供基於事件的通訊機制，允許外部模組監聽眼睛結構識別事件。

#### Scenario: 結構選中事件觸發
- **WHEN** 使用者點擊並成功識別眼睛結構
- **THEN** 系統觸發 `structureSelected` 事件
- **AND** 事件負載包含完整的結構資訊

#### Scenario: 點擊外區域事件觸發
- **WHEN** 使用者點擊圖像外（未在任何結構檢測區域內）
- **THEN** 系統觸發 `clickOutside` 事件
- **AND** 事件負載包含點擊座標 (x, y)

#### Scenario: 加載完成事件
- **WHEN** EyeImageMapper 非同步加載座標數據完成
- **THEN** 系統觸發 `loadComplete` 事件
- **AND** 事件負載包含已加載的結構數量

#### Scenario: 加載失敗事件
- **WHEN** EyeImageMapper 加載座標數據失敗（如檔案不存在、網路錯誤）
- **THEN** 系統觸發 `loadError` 事件
- **AND** 事件負載包含錯誤訊息

#### Scenario: 事件監聽與移除
- **WHEN** 呼叫 `on(event, callback)` 和 `off(event, callback)` 方法
- **THEN** 系統正確註冊和移除事件監聽器
- **AND** 移除後的監聽器不再被觸發

---

### Requirement: 調試可視化支持

系統 SHALL 提供 Canvas 繪製方法，用於視覺化調試眼睛結構的檢測區域。

#### Scenario: 可視化所有結構區域
- **WHEN** 呼叫 `visualizeClickAreas(canvas, options)` 方法
- **THEN** 在 Canvas 上繪製所有 10 個眼睛結構的圓形檢測區域
- **AND** 每個圓形內顯示結構的中文名稱
- **AND** 繪製樣式可由 options 參數自訂

#### Scenario: 自訂視覺化選項
- **WHEN** 傳入 `options` 物件包含 `fillColor`, `strokeColor`, `lineWidth`, `fontSize` 等參數
- **THEN** 系統使用自訂選項繪製結構區域
- **AND** 保留合理的預設值作為後備

---

### Requirement: 座標校正工具

系統 SHALL 提供互動式 HTML 工具（eye-calibration.html），允許使用者手動校正眼睛結構座標。

#### Scenario: 工具頁面加載
- **WHEN** 在瀏覽器開啟 `eye-calibration.html`
- **THEN** 頁面成功載入並顯示 3Deye.png 圖像
- **AND** 提供 10 個眼睛結構的選擇下拉選單
- **AND** Canvas 尺寸與 3Deye.png 尺寸一致（1313×664）

#### Scenario: 座標點擊記錄
- **WHEN** 使用者選擇一個眼睛結構並點擊 Canvas
- **THEN** 系統記錄點擊座標為該結構的新位置
- **AND** 在點擊位置繪製視覺標記
- **AND** 在介面上顯示已記錄的座標（x, y）

#### Scenario: 座標資料匯出
- **WHEN** 使用者點擊「匯出座標」按鈕
- **THEN** 系統生成所有 10 個結構的座標 JSON 資料
- **AND** 使用者可複製或下載該 JSON 資料
- **AND** 匯出的 JSON 格式相容於 `eye-coordinates.json`

---

### Requirement: 主系統整合

系統 SHALL 將 EyeImageMapper 整合至 MedicalRecordApp 主應用程式，使眼睛系統與牙齒系統並行工作。

#### Scenario: 眼睛映射器初始化
- **WHEN** MedicalRecordApp 呼叫 `initModules()` 方法
- **THEN** 系統建立 EyeImageMapper 實例
- **AND** 非同步加載 `/data/eye-coordinates.json` 座標數據
- **AND** 加載完成後 `isLoaded` 屬性設為 true

#### Scenario: 眼睛系統點擊事件處理
- **WHEN** 使用者在眼睛圖像上點擊
- **THEN** `handleAnnotationClick()` 方法判定 `systemId === 'eye'`
- **AND** 呼叫 `eyeMapper.getStructureAtPosition(x, y)` 識別結構
- **AND** 成功識別時打開疾病表單模態窗口
- **AND** 失敗時顯示「請點擊眼睛結構區域」提示訊息

#### Scenario: 牙齒系統相容性
- **WHEN** 使用者在牙齒圖像上點擊
- **THEN** 牙齒系統邏輯完全保持不變
- **AND** 不受眼睛系統新增程式碼影響
- **AND** 兩個系統可無縫切換

#### Scenario: 標籤頁切換
- **WHEN** 使用者點擊眼睛系統標籤頁
- **THEN** 應用程式切換至眼睛圖像
- **AND** 載入正確的圖像（3Deye.png）
- **AND** 眼睛映射器已就緒且可用

---

### Requirement: 中文繁體支持

系統 SHALL 所有新增代碼包含完整的中文繁體程式碼註解和文檔。

#### Scenario: 程式碼註解語言
- **WHEN** 查看 `eye-image-mapper.js` 源代碼
- **THEN** 所有函數、類別、複雜邏輯的註解使用中文繁體
- **AND** 變數名稱保持英文（遵循編程慣例）

#### Scenario: 介面文本
- **WHEN** 開啟 `eye-calibration.html`
- **THEN** 所有介面文本使用中文繁體
- **AND** 提供英文翻譯作為 data-en 屬性或副標題

#### Scenario: 文檔與規範
- **WHEN** 查看 OpenSpec 文檔
- **THEN** proposal.md, tasks.md, spec.md 全文使用中文繁體
- **AND** 技術術語保持標準英文名稱

---

## ADDED Capability: eye-system

**Capability ID**: `eye-system`

**Description**: 眼睛系統座標映射與點擊檢測功能，允許使用者在眼睛解剖圖像上進行互動標註和疾病記錄。

**Core Components**:
- EyeImageMapper 類別（JavaScript）
- eye-coordinates.json 資料檔案
- eye-calibration.html 校正工具
- MedicalRecordApp 主應用程式整合

**Dependencies**:
- 現有的 DiseaseForm 疾病表單模組
- 現有的 DiseaseVisualizationManager 可視化模組
- 現有的 RecordManager 病歷管理模組

**Backwards Compatibility**: ✅ 完全向後相容，不影響現有牙齒系統功能
