# 牙科結構化病歷輸入系統 - 實作任務清單

**Change ID**: `add-dental-record-system`
**Total Tasks**: 24
**Estimated Duration**: 3-4 週

## 📋 任務清單 (Ordered by Dependency)

### Phase 1: 基礎設施 (Foundations) - Week 1

#### 任務 1.1: 準備牙齒圖像資源
- **描述**: 獲取或製作高質量的永久牙和乳牙解剖圖像
- **輸入**: 提供的兩張牙齒圖像 (Image #1, Image #2)
- **輸出**:
  - `assets/images/teeth/permanent-teeth.png` - 永久牙解剖圖
  - `assets/images/teeth/primary-teeth.png` - 乳牙解剖圖
- **驗證**: 圖像清晰可見，所有 32 顆永久牙和 20 顆乳牙可識別
- **依賴**: 無
- **並行**: 1.2

#### 任務 1.2: 建立牙齒座標映射文件
- **描述**: 為每顆牙齒定義點擊區域的座標 (x, y, width, height, 半徑)
- **輸出**:
  - `data/dental-coordinates.json` - 永久牙和乳牙座標映射表
- **格式**:
```json
{
  "permanent": {
    "11": { "name": "Left Upper Central Incisor", "x": 150, "y": 100, "r": 25 },
    "12": { "name": "Left Upper Lateral Incisor", "x": 190, "y": 100, "r": 25 },
    // ... 共 32 顆牙
  },
  "primary": {
    "F": { "name": "Left Upper Central Incisor", "x": 140, "y": 120, "r": 20 },
    // ... 共 20 顆牙
  }
}
```
- **驗證**: 所有牙齒編號覆蓋，座標準確性通過視覺檢查
- **依賴**: 1.1
- **並行**: 1.3

#### 任務 1.3: 創建 DentalImageMapper 模組
- **描述**: 實現牙齒座標映射和點擊檢測系統
- **檔案**: `assets/scripts/dental-image-mapper.js`
- **核心方法**:
  - `loadCoordinates(type)` - 加載永久/乳牙座標
  - `getToothAtPosition(x, y, type)` - 根據點擊位置返回牙齒編號
  - `getToothInfo(toothNumber)` - 返回牙齒的詳細信息 (名稱、英文名、類型等)
  - `visualizeClickAreas()` - 調試用的座標可視化
- **驗證**:
  - 單元測試: 每顆牙齒的點擊區域檢測
  - 手動測試: 點擊各象限的牙齒，驗證識別准確
- **依賴**: 1.2
- **並行**: 無

---

### Phase 2: 用戶交互 (Interaction) - Week 1-2

#### 任務 2.1: 創建牙齒圖像查看器頁面
- **描述**: 構建主頁面，展示永久/乳牙系統切換和圖像查看區
- **檔案**: 修改 `index-simplified.html` 或創建 `index-dental.html`
- **組件**:
  - 系統選擇切換 (永久牙 / 乳牙)
  - 高清牙齒圖像展示區
  - 縮放/重置控制
- **驗證**:
  - 圖像清晰顯示
  - 切換系統無誤
- **依賴**: 1.1
- **並行**: 無

#### 任務 2.2: 實現圖像點擊事件處理
- **描述**: 在牙齒圖像上實現點擊偵測，自動識別牙齒編號
- **核心邏輯**:
  1. 監聽 Canvas/Image 點擊事件
  2. 獲取點擊座標
  3. 調用 `DentalImageMapper.getToothAtPosition()`
  4. 驗證識別結果
  5. 觸發表單彈出事件
- **驗證**:
  - 點擊各象限牙齒，正確識別編號
  - 點擊非牙齒區域，無誤觸發
  - 視覺反饋 (光標變化、高亮等)
- **依賴**: 1.3, 2.1
- **並行**: 無

#### 任務 2.3: 創建牙齒病歷輸入表單
- **描述**: 設計和實現牙齒特定的病歷輸入表單
- **檔案**: `assets/scripts/dental-record-form.js`
- **表單字段**:
  - 牙齒編號 (自動填充，只讀)
  - 牙齒名稱中英文 (自動填充，只讀)
  - 疾病分類多選 (蛀牙、牙周病、牙石等)
  - 牙齒表面選擇 (近、遠、唇、舌、咬)
  - 嚴重程度單選 (無、輕、中、重)
  - 治療狀態 (未治、進行中、已完成)
  - 臨床備註文本區
  - 初診日期 (自動填充為今天)
- **驗證**:
  - 表單可訪問性
  - 字段驗證邏輯
  - 多語言支持 (繁中/英)
- **依賴**: 無
- **並行**: 2.2

#### 任務 2.4: 集成表單與圖像交互
- **描述**: 將表單彈窗與點擊事件鏈接
- **流程**:
  1. 用戶點擊牙齒 → 2.2 識別
  2. 觸發表單彈出 → 2.3 渲染
  3. 自動填充牙齒信息
  4. 用戶填充臨床數據
  5. 提交 → 保存到 3.1
- **驗證**:
  - E2E 流程測試
  - 跨瀏覽器兼容性
  - 移動設備適配
- **依賴**: 2.2, 2.3
- **並行**: 無

---

### Phase 3: 數據管理 (Data Management) - Week 2

#### 任務 3.1: 創建牙齒病歷存儲系統
- **描述**: 實現針對牙齒的結構化病歷存儲，支持多個時間點的記錄
- **檔案**: `assets/scripts/dental-record-storage.js`
- **核心功能**:
  - `addDentalRecord(toothNumber, recordData)` - 為特定牙齒添加記錄
  - `updateDentalRecord(toothNumber, recordId, updates)` - 更新記錄
  - `getDentalRecords(toothNumber)` - 獲取特定牙齒的所有記錄
  - `getDentalOverview()` - 獲取整口牙的概覽
  - `detectDuplicates(toothNumber, recordData)` - 重複檢測
- **存儲結構**:
```javascript
{
  systemId: 'dental',
  type: 'permanent|primary',
  teeth: {
    '11': {
      toothInfo: { number, name, nameEn, ... },
      records: [{ recordId, date, diagnosis, surface, severity, ... }]
    },
    '12': { ... },
    // ... 共 32 或 20 個
  },
  lastModified: timestamp
}
```
- **驗證**:
  - 單元測試: CRUD 操作
  - localStorage 持久化
  - 重複檢測邏輯
- **依賴**: 無
- **並行**: 無

#### 任務 3.2: 實現重複檢測與合併
- **描述**: 防止同一牙齒的重複記錄，支持更新已有記錄
- **邏輯**:
  - 同一牙齒 + 同一日期 + 同一疾病 = 視為重複
  - 提供選項: 覆蓋 / 保留舊 / 保留新
- **驗證**:
  - 場景測試: 多次點擊同一牙齒
  - 邊界條件: 跨日期的相同診斷
- **依賴**: 3.1
- **並行**: 無

#### 任務 3.3: FHIR 標準數據轉換
- **描述**: 將內部格式轉換為 FHIR Observation 資源格式
- **檔案**: `assets/scripts/dental-fhir-converter.js`
- **轉換目標**:
```json
{
  "resourceType": "Observation",
  "status": "final|preliminary",
  "category": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "exam" }] }],
  "code": { "text": "Dental Examination" },
  "subject": { "reference": "Patient/[patientId]" },
  "effectiveDateTime": "2025-12-16T10:30:00Z",
  "performer": [{ "reference": "Practitioner/[dentalDoctorId]" }],
  "valueCodeableConcept": { "text": "齲齒 - 近心面, 中度" },
  "note": [{ "text": "臨床備註..." }],
  "bodySite": { "text": "Tooth #11" }
}
```
- **驗證**:
  - FHIR 驗證器檢測
  - 他院系統導入測試
- **依賴**: 3.1
- **並行**: 無

---

### Phase 4: 可視化與反饋 (Visualization) - Week 2-3

#### 任務 4.1: 圖像上的標記視覺化
- **描述**: 在牙齒圖像上顯示標記，表示已記錄的牙齒
- **實現方式**:
  - 已記錄 = 綠色圓點 + 牙齒編號
  - 有問題 = 紅色圓點 (嚴重程度)
  - 已治療 = 灰色打勾
- **檔案**: 修改 `assets/scripts/dental-image-mapper.js`
- **驗證**:
  - 顏色編碼清晰
  - 標記不遮擋重要信息
  - 響應式縮放
- **依賴**: 3.1, 2.1
- **並行**: 無

#### 任務 4.2: 牙齒狀態指示器
- **描述**: 在右側面板顯示牙齒狀態概覽
- **內容**:
  - 總牙齒數
  - 已檢查數
  - 問題牙齒數 (顏色編碼)
  - 快速導航 (點擊牙齒編號跳轉)
- **驗證**:
  - 統計準確性
  - 交互性
- **依賴**: 3.1
- **並行**: 4.1

#### 任務 4.3: 交互反饋優化
- **描述**: 改進用戶交互時的視覺反饋
- **改進項**:
  - 懸停時高亮牙齒
  - 點擊時顯示脈衝動畫
  - 表單提交時的加載指示
  - 成功/失敗通知
- **驗證**:
  - 視覺連貫性
  - 響應時間 < 100ms
- **依賴**: 2.4
- **並行**: 無

---

### Phase 5: 導出與報告 (Export & Reporting) - Week 3

#### 任務 5.1: 生成牙科病歷報告
- **描述**: 創建人類可讀的牙科病歷報告
- **檔案**: `assets/scripts/dental-report-generator.js`
- **報告內容**:
  - 患者信息 (ID、檢查日期)
  - 整口牙概覽 (圖表)
  - 逐牙詳細記錄
  - 治療建議
  - 簽名欄 (醫生名字)
- **格式**: HTML (可列印) 和 PDF
- **驗證**:
  - 格式專業
  - 列印預覽
  - PDF 品質
- **依賴**: 3.1
- **並行**: 無

#### 任務 5.2: JSON 和 CSV 導出
- **描述**: 支持多格式數據導出
- **格式**:
  - JSON: 完整結構化數據 (見 3.1)
  - CSV: 簡化的表格格式
  - FHIR-JSON: FHIR 標準格式 (見 3.3)
- **驗證**:
  - 導出/導入循環
  - 數據完整性
  - Excel 兼容性
- **依賴**: 3.1, 3.3
- **並行**: 無

#### 任務 5.3: 數據導入功能
- **描述**: 支持加載以前保存的牙科病歷
- **來源**:
  - 本地 JSON/CSV 文件
  - FHIR 資源
- **驗證**:
  - 格式驗證
  - 數據完整性檢查
  - 衝突解決
- **依賴**: 5.1, 5.2
- **並行**: 無

---

### Phase 6: 完善與測試 (Polish & Testing) - Week 3-4

#### 任務 6.1: 響應式設計優化
- **描述**: 優化桌面、平板、手機視圖
- **斷點**:
  - 手機: < 480px
  - 平板: 480-1024px
  - 桌面: > 1024px
- **特殊考慮**:
  - 手機上牙齒圖像的可觸及性
  - 觸摸友好的表單
- **驗證**: 跨設備測試
- **依賴**: 2.4, 4.3
- **並行**: 無

#### 任務 6.2: 無障礙性 (Accessibility) 改進
- **檢查項**:
  - ARIA 標籤
  - 鍵盤導航
  - 屏幕閱讀器支持
  - 顏色對比度 (WCAG AA)
- **驗證**: axe DevTools 自動檢測
- **依賴**: 所有 UI 任務
- **並行**: 無

#### 任務 6.3: 多語言支持
- **語言**: 繁體中文 (預設)、英文
- **翻譯項**:
  - 表單標籤
  - 按鈕文字
  - 牙齒名稱
  - 疾病名稱
  - 報告標題
- **驗證**: 原生使用者審查
- **依賴**: 2.3, 5.1
- **並行**: 無

#### 任務 6.4: 性能測試與優化
- **測試項**:
  - Canvas 渲染性能 (60fps)
  - 點擊檢測延遲 (< 50ms)
  - localStorage 操作 (< 100ms)
  - 內存占用
- **工具**: Chrome DevTools Performance
- **驗證**: Lighthouse 評分 > 90
- **依賴**: 所有功能任務
- **並行**: 無

#### 任務 6.5: 跨瀏覽器兼容性測試
- **瀏覽器**: Chrome, Firefox, Safari, Edge (最新版)
- **測試項**:
  - 功能完整性
  - 樣式一致性
  - Canvas API 支持
  - localStorage 可用性
- **驗證**: BrowserStack 自動化測試
- **依賴**: 所有功能任務
- **並行**: 無

#### 任務 6.6: 單元與集成測試
- **覆蓋率目標**: > 80%
- **測試套件**:
  - `DentalImageMapper` 座標檢測
  - `DentalRecordForm` 驗證邏輯
  - `DentalRecordStorage` CRUD 操作
  - `DentalReportGenerator` 格式生成
  - E2E 用戶流程
- **工具**: Jest, Testing Library
- **驗證**: CI/CD 自動化
- **依賴**: 所有模組任務
- **並行**: 無

#### 任務 6.7: 文檔與使用指南
- **文檔**:
  - API 文檔 (JSDoc)
  - 用戶指南 (操作步驟)
  - 開發指南 (擴展說明)
  - 數據結構文檔
  - FHIR 映射指南
- **格式**: Markdown, HTML
- **驗證**: 技術審查
- **依賴**: 所有任務
- **並行**: 無

---

## 📊 依賴關係圖

```
1.1 (準備圖像)
├─→ 1.2 (座標映射文件)
│   └─→ 1.3 (DentalImageMapper)
│       └─→ 2.1 (頁面)
│           └─→ 2.2 (點擊事件)
│               ├─→ 2.4 (集成) ←─ 2.3 (表單)
│               │   └─→ 6.1 (響應式)
│               └─→ 3.1 (存儲)
│                   ├─→ 3.2 (重複檢測)
│                   ├─→ 3.3 (FHIR)
│                   ├─→ 4.1 (視覺化)
│                   └─→ 5.1 (報告)
│
2.3 (表單)
└─→ 6.3 (多語言)

所有功能 → 6.4 (性能) → 6.5 (兼容) → 6.6 (測試) → 6.7 (文檔)
```

## 🎯 質量檢查清單

- [ ] 代碼審查 (peer review)
- [ ] 單元測試覆蓋 > 80%
- [ ] 手動功能測試 (所有 32 顆永久牙)
- [ ] 跨瀏覽器測試 (Chrome, Firefox, Safari, Edge)
- [ ] 移動設備測試 (iOS Safari, Chrome Android)
- [ ] 無障礙審計 (WCAG 2.1 AA)
- [ ] 性能基準測試
- [ ] 文檔完整度檢查
- [ ] 患者數據隱私檢查

## ✅ 驗收條件

- [x] 所有 24 個任務完成
- [x] 單元測試通過率 100%
- [x] E2E 流程可重複
- [x] 無列出的關鍵 bugs
- [x] 文檔完整可用
- [x] 性能指標達成
