# OpenSpec Proposal: 牙科結構化病歷輸入系統

**Change ID**: `add-dental-record-system`
**Status**: APPROVED
**Priority**: P0 - MVP 核心功能
**Date Created**: 2025-12-16
**Date Approved**: 2025-12-17

## 概述 (Executive Summary)

將永久牙和乳牙的解剖圖像與結構化病歷輸入整合，用戶可直接在牙齒圖像上點擊特定牙齒位置，彈出病歷輸入表單，記錄疾病和臨床觀察。

**核心特性**:
- 📸 **圖像標註**: 在永久牙/乳牙圖像上點擊牙齒位置
- 📋 **結構化輸入**: 自動檢測牙齒編號，彈出病歷表單
- 🦷 **雙系統支持**: Universal Numbering System (1-32/A-T)
- 💾 **智能存儲**: 按牙齒編號組織病歷，自動去重
- 📊 **標準化輸出**: FHIR 符合牙科病歷結構

## 用戶故事 (User Stories)

### 牙科醫生工作流
```
醫生打開系統
    ↓
選擇「永久牙」或「乳牙」系統
    ↓
點擊患者牙齒圖像上的特定牙齒
    ↓
系統自動識別牙齒編號 (如: #11 左上中門牙)
    ↓
彈出病歷表單 (疾病、嚴重程度、備註)
    ↓
醫生輸入臨床信息
    ↓
保存記錄
    ↓
標記在圖像上顯示
    ↓
右側列表顯示該牙齒的所有病歷
```

### 典型場景
- **初診檢查**: 記錄 8 顆牙齒的蛀牙信息
- **追蹤治療**: 更新已治療牙齒的狀態
- **對比分析**: 查看同一牙齒的多個時間點的記錄
- **批量導出**: 生成完整的牙科病歷報告

## 技術需求 (Technical Requirements)

### 1. 牙齒圖像素材
- **永久牙圖像** (Permanent Teeth):
  - 上排 16 顆 (#1-#16)
  - 下排 16 顆 (#17-#32)
  - SVG 或 PNG 格式，帶牙齒區域映射

- **乳牙圖像** (Primary Teeth):
  - 上排 10 顆 (A-E)
  - 下排 10 顆 (F-J)
  - 同樣格式支持

### 2. 牙齒編號系統
- **Universal System** (美國標準)
  - 永久牙: 1-32 (右上 1-8, 左上 9-16, 左下 17-24, 右下 25-32)
  - 乳牙: A-T (右上 A-E, 左上 F-J, 左下 K-O, 右下 P-T)

- **FDI System** (國際標準)
  - 永久牙: 11-48 (第一位表示象限, 第二位表示牙齒位置)
  - 乳牙: 51-85

### 3. 交互流程
1. **系統選擇**: 永久牙 vs 乳牙
2. **點擊識別**: 點擊牙齒區域 → 自動映射牙齒編號
3. **表單彈出**: 模態窗口顯示該牙齒編號和可輸入的字段
4. **數據保存**: 結構化存儲
5. **視覺反饋**: 標記在圖像上

## 功能設計 (Feature Design)

### 組件架構

```
DentalRecordSystem
  ├── DentalImageMapper
  │   ├── 永久牙座標映射
  │   ├── 乳牙座標映射
  │   └── 點擊检测與編號識別
  │
  ├── DentalRecordForm
  │   ├── 疾病選擇 (蛀牙、牙周病、牙石等)
  │   ├── 牙齒表面選擇 (唇、頰、咬、舌、近、遠)
  │   ├── 嚴重程度
  │   └── 臨床備註
  │
  ├── DentalRecordStorage
  │   ├── 按牙齒編號組織記錄
  │   ├── 重複檢測與合併
  │   └── FHIR 標準轉換
  │
  └── DentalVisualization
      ├── 圖像上標記 (顏色編碼)
      ├── 牙齒狀態指示器
      └── 交互反饋
```

### 數據結構

```json
{
  "recordId": "uuid",
  "systemId": "teeth",
  "type": "permanent|primary",
  "teeth": [
    {
      "toothNumber": 11,
      "toothNumberUni": "11",
      "toothNumberFDI": "11",
      "toothName": "左上中門牙",
      "toothNameEn": "Upper Left Central Incisor",
      "records": [
        {
          "recordId": "uuid",
          "date": "2025-12-16",
          "diagnosis": "caries",
          "diagnosisName": "齲齒",
          "surface": "mesial",
          "severity": "moderate",
          "treatment": "pending|completed|no-treatment",
          "notes": "近端面初期齲齒，建議補綴",
          "timestamp": "2025-12-16T10:30:00Z"
        }
      ]
    }
  ]
}
```

### 牙齒分類系統

**共同疾病**:
- `caries`: 齲齒
- `periodontal`: 牙周病
- `tartar`: 牙石
- `fracture`: 牙折
- `attrition`: 磨損
- `erosion`: 侵蝕
- `abscess`: 膿腫

**牙齒表面** (FDI 命名法):
- `mesial`: 近心面 (靠近中線)
- `distal`: 遠心面 (遠離中線)
- `buccal`: 頰面 (面向臉頰)
- `lingual`: 舌面 (面向舌頭)
- `occlusal`: 咬合面 (咀嚼面)

## 實現方案 (Implementation Approach)

### 階段 1: 基礎設施 (Foundations)
- [ ] 建立牙齒圖像資源庫 (永久/乳牙)
- [ ] 實現牙齒座標映射系統
- [ ] 建立 DentalImageMapper 模組

### 階段 2: 用戶交互 (Interaction)
- [ ] 實現圖像點擊檢測
- [ ] 自動牙齒編號識別
- [ ] 牙齒表單彈出

### 階段 3: 數據管理 (Data Management)
- [ ] 實現 DentalRecordStorage
- [ ] 按牙齒編號組織存儲
- [ ] 重複檢測與合併邏輯

### 階段 4: 可視化與導出 (Visualization & Export)
- [ ] 圖像標記與顏色編碼
- [ ] FHIR 導出格式
- [ ] 牙科病歷報告生成

## 依賴與約束 (Dependencies & Constraints)

### 外部依賴
- Tesseract.js (可選，用於紙質病歷掃描識別)
- SVG 或 Canvas 用於點擊映射

### 內部依賴
- 基礎的 ImageAnnotator 模組
- RecordManager 存儲系統
- 通知系統 (showNotification)

### 約束
- 牙齒座標映射必須精確，誤差 < 5px
- 支持桌面優先，平板適配
- 離線優先設計

## 成功指標 (Success Criteria)

✅ **功能完成度**:
- [ ] 可識別永久牙 32 顆 (含第三磨牙)
- [ ] 可識別乳牙 20 顆
- [ ] 點擊準確率 > 95%

✅ **用戶體驗**:
- [ ] 從點擊到表單彈出 < 200ms
- [ ] 一鍵記錄完整病歷
- [ ] 重複操作流暢無阻

✅ **數據標準**:
- [ ] 支持 Universal 和 FDI 編號
- [ ] FHIR 導出可被他院系統讀取
- [ ] 無數據丟失

## 後續考慮 (Future Enhancements)

- 🤖 AI 輔助診斷（蛀牙自動檢測）
- 🎨 深色模式支持
- 📱 完整的移動應用
- ☁️ 雲端同步和多用戶協作
- 📸 患者牙齒拍照對比功能

## 相關文檔

- 📄 `tasks.md`: 具體工作項列表
- 📄 `design.md`: 詳細設計文檔
- 📄 `spec.md`: 功能規範詳情
