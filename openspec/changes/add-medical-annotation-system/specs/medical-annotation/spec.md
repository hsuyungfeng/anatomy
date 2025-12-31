# 規範增量：醫療結構化病歷標註系統

## ADDED Requirements

### Requirement: 圖像選擇和加載

系統必須（SHALL）允許用戶選擇不同的解剖系統，並正確加載對應的解剖圖像。

#### Scenario: 用戶選擇解剖系統
- **WHEN** 用戶進入應用首頁
- **THEN** 頁面顯示解剖系統選擇選項（牙齒、眼睛、身體等）
- **AND** 用戶可以點擊系統標籤切換

#### Scenario: 圖像加載和顯示
- **WHEN** 用戶選擇「牙齒系統」
- **THEN** 應用載入牙齒圖像（如 allteeth.png）
- **AND** 圖像在左側顯示區域顯示
- **AND** 圖像應該縮放以適應容器，不失真

#### Scenario: 圖像縮放和平移
- **WHEN** 用戶使用滑鼠滾輪在圖像上
- **THEN** 圖像縮放（上滾放大，下滾縮小）
- **AND** 縮放範圍限制在 0.5x - 4x 之間
- **WHEN** 圖像已放大且用戶拖曳圖像
- **THEN** 圖像平移，顯示隱藏部分

### Requirement: 圖像點擊標註和模態視窗

系統必須（SHALL）在用戶點擊圖像時記錄座標，並彈出疾病記錄表單。

#### Scenario: 點擊圖像彈出表單
- **WHEN** 用戶在圖像上點擊滑鼠
- **THEN** 記錄點擊座標（x, y）
- **AND** 彈出模態視窗，標題顯示所指位置（如「左上中門牙」）
- **AND** 模態視窗包含疾病選擇表單

#### Scenario: 視覺標記顯示
- **WHEN** 用戶成功記錄一個標註
- **THEN** 圖像上該位置顯示視覺標記（如紅色圓點或圖釘）
- **AND** 標記的顏色取決於疾病系統（牙齒=黃色、眼睛=藍色、身體=紅色）

#### Scenario: 關閉表單
- **WHEN** 用戶點擊模態視窗的關閉按鈕或點擊外部區域
- **THEN** 模態視窗關閉
- **AND** 之前輸入的資料若未儲存，會被放棄

### Requirement: 結構化疾病表單

系統必須（SHALL）提供結構化多選框表單，讓用戶選擇疾病類別和細項。

#### Scenario: 疾病分類顯示
- **WHEN** 模態視窗打開
- **THEN** 顯示疾病分類列表（如齲齒、牙周病、牙齒斷裂等）
- **AND** 分類以多選框形式呈現
- **AND** 分類按邏輯分組（疾病類別按列排列）

#### Scenario: 階層展開
- **WHEN** 用戶點擊一個疾病分類（如「齲齒」）
- **THEN** 該分類展開顯示子項目（如「琺瑯質齲齒」、「象牙質齲齒」）
- **AND** 用戶可以選擇多個子項目
- **WHEN** 用戶再次點擊該分類
- **THEN** 該分類收起

#### Scenario: 搜尋功能
- **WHEN** 模態視窗頂部有搜尋輸入框
- **AND** 用戶輸入關鍵字（如「齲」或「caries」）
- **THEN** 表單即時篩選顯示匹配的疾病
- **AND** 搜尋支持中英文

#### Scenario: 嚴重程度選擇
- **WHEN** 用戶選擇疾病後
- **THEN** 表單顯示嚴重程度選項（輕度、中度、重度）
- **AND** 用戶可以選擇一個選項

#### Scenario: 備註輸入
- **WHEN** 表單底部有備註欄位
- **THEN** 用戶可以輸入任意文字描述（如「近端面齲齒」）

### Requirement: 多解剖系統支持

系統必須（SHALL）支持牙齒、眼睛、身體等多個解剖系統，每個系統有獨立的疾病分類。

#### Scenario: 系統切換
- **WHEN** 用戶點擊不同解剖系統標籤
- **THEN** 圖像切換為該系統
- **AND** 疾病分類更新為該系統的疾病清單
- **AND** 已標註的資料不會丟失（自動保存）

#### Scenario: 牙齒編號系統
- **WHEN** 用戶在牙齒系統點擊
- **THEN** 系統識別被點擊的牙齒位置
- **AND** 顯示牙齒編號（如「#11」= 左上中門牙）
- **AND** 支持多種編號系統（Universal 1-32, FDI 11-48）

#### Scenario: 眼睛部位識別
- **WHEN** 用戶在眼睛系統點擊
- **THEN** 系統識別眼睛部位（如「右眼角膜」）
- **AND** 疾病表單聚焦於眼科疾病

### Requirement: 病歷儲存和管理

系統必須（SHALL）將標註和疾病資訊儲存至 localStorage，支持離線使用。

#### Scenario: 自動儲存
- **WHEN** 用戶點擊「儲存」按鈕
- **THEN** 標註資料儲存至 localStorage
- **AND** 顯示「已儲存」的確認訊息
- **AND** 用戶可以繼續添加更多標註

#### Scenario: 病歷讀取
- **WHEN** 用戶再次進入應用
- **THEN** 應用自動讀取之前儲存的病歷
- **AND** 所有標註和疾病資訊恢復顯示

#### Scenario: 病歷列表
- **WHEN** 用戶打開右側面板的「病歷列表」
- **THEN** 顯示已標註的所有位置和疾病
- **AND** 清單格式：「位置 - 疾病」（如「左上中門牙 - 齲齒」）
- **AND** 用戶可以點擊列表項編輯或刪除

### Requirement: OCR 圖像識別

系統必須（SHALL）整合 Tesseract.js，支持從病歷圖片自動識別疾病名稱。

#### Scenario: 上傳病歷圖片
- **WHEN** 用戶點擊「OCR 上傳」按鈕
- **THEN** 彈出檔案上傳對話框
- **AND** 用戶可以選擇本地圖片或拍照

#### Scenario: 識別和自動填入
- **WHEN** 用戶選擇圖片後
- **THEN** 應用開始 OCR 識別（顯示進度）
- **AND** 識別疾病名稱（中英文）
- **WHEN** 識別完成
- **THEN** 疾病表單自動勾選相符的項目
- **AND** 用戶可以調整或確認

#### Scenario: 識別語言支持
- **WHEN** 病歷圖片包含繁體中文或英文
- **THEN** OCR 應該正確識別
- **AND** 混合語言也應支持

### Requirement: 病歷匯出

系統必須（SHALL）生成可匯出的標準化病歷格式，支持多種格式。

#### Scenario: JSON 匯出
- **WHEN** 用戶點擊「匯出病歷」並選擇「JSON」
- **THEN** 生成結構化 JSON 檔案
- **AND** JSON 包含所有標註和疾病資訊
- **AND** 檔案可以下載

#### Scenario: 人類可讀匯出
- **WHEN** 用戶選擇「文字」格式匯出
- **THEN** 生成格式化的病歷文件
- **AND** 包含患者ID、日期、各系統標註
- **AND** 支持列印

#### Scenario: 匯出格式結構
```
患者 ID：patient-123
日期：2025-12-16

牙齒系統：
- 左上中門牙（#11）：齲齒 - 象牙質齲齒 - 中度 - 近端面齲齒

眼睛系統：
- 右眼角膜：炎症 - 病毒性結膜炎 - 輕度
```

### Requirement: 雙語界面

系統必須（SHALL）完全支持繁體中文和英文，用戶可以切換語言。

#### Scenario: 語言切換
- **WHEN** 用戶點擊語言選擇（中 / EN）
- **THEN** 整個界面切換為選擇的語言
- **AND** 語言偏好儲存至 localStorage
- **AND** 下次進入應用自動使用上次選擇的語言

#### Scenario: 醫學術語翻譯
- **WHEN** 疾病分類顯示
- **THEN** 顯示中文名稱和英文名稱（如「齲齒 - Dental Caries」）

### Requirement: 無障礙設計

系統必須（SHALL）遵循 WCAG 2.1 AA 標準，確保無障礙使用。

#### Scenario: 鍵盤導航
- **WHEN** 用戶使用 Tab 鍵
- **THEN** 焦點依序移動到所有可互動元素
- **AND** 可以使用 Enter 鍵觸發動作

#### Scenario: 螢幕閱讀器支持
- **WHEN** 螢幕閱讀器用戶進入應用
- **THEN** 所有元素都有適當的 ARIA 標籤
- **AND** 圖像有替代文字描述

#### Scenario: 色盲友善
- **WHEN** 設計使用顏色區分系統
- **THEN** 也使用文字標籤輔助
- **AND** 顏色對比度 ≥ 4.5:1（WCAG AA）

### Requirement: 病歷資料結構

系統必須（SHALL）使用標準化的 JSON 結構儲存和交換病歷資料。

#### Scenario: 病歷 JSON 格式
```json
{
  "recordId": "uuid",
  "patientId": "patient-123",
  "timestamp": "2025-12-16T10:30:00Z",
  "anatomicalSystems": [
    {
      "systemId": "teeth",
      "systemName": "牙齒系統",
      "annotations": [
        {
          "annotationId": "anno-001",
          "position": {"x": 150, "y": 200},
          "toothNumber": 11,
          "toothName": "左上中門牙",
          "diseases": [
            {
              "diseaseId": "caries",
              "diseaseName": "齲齒",
              "severity": "moderate",
              "notes": "近端面齲齒"
            }
          ]
        }
      ]
    }
  ]
}
```

### Requirement: 效能與相容性

系統必須（SHALL）在各主流瀏覽器上運行，並達到性能目標。

#### Scenario: 瀏覽器相容性
- **WHEN** 在 Chrome、Firefox、Safari、Edge 上使用
- **THEN** 所有功能正常運作
- **AND** 樣式正確顯示
- **AND** 不存在功能差異

#### Scenario: 效能目標
- **WHEN** 用戶首次進入應用
- **THEN** 頁面載入時間 < 3 秒
- **WHEN** 用戶點擊圖像或表單
- **THEN** 響應時間 < 100ms
- **WHEN** 用戶進行 OCR 識別
- **THEN** 處理時間 < 30 秒
